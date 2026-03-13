import PyPDF2
import docx
import re
from typing import Dict, List, Any, Optional
from rake_nltk import Rake
import nltk

# Download NLTK data (unchanged)
try:
    nltk.download('punkt_tab', quiet=True)
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)
except:
    pass

# ----------------------------------------------------------------------
# Internal parser class (final version with blank line preservation)
# ----------------------------------------------------------------------
class ResumeParser:
    """
    Robust rule‑based resume parser that extracts:
      - Sections (header, summary, education, experience, projects, skills, ...)
      - Skills (cleaned, de‑duplicated)
      - Projects (title + full description, grouped by blank lines)
      - Experience (job title, company, dates, description)
      - Education (degree, institution, graduation year)
      - Contact info (email, phone, LinkedIn)
      - ATS quality score (based on structure and content)
    """

    SECTION_PATTERNS = {
        'summary': r'(?i)^(summary|professional summary|profile|objective)\s*:?',
        'education': r'(?i)^(education|academic background|qualifications|educational background)\s*:?',
        'experience': r'(?i)^(experience|work experience|employment|professional experience|work history|employment history)\s*:?',
        'projects': r'(?i)^(projects|personal projects|academic projects|key projects|professional projects|side projects)\s*:?',
        'skills': r'(?i)^(skills|technical skills|core competencies|expertise|technologies|technical expertise|competencies)\s*:?',
        'certifications': r'(?i)^(certifications|courses|training|professional certifications)\s*:?',
        'publications': r'(?i)^(publications|papers|research|research publications)\s*:?',
        'languages': r'(?i)^(languages|language skills)\s*:?',
        'awards': r'(?i)^(awards|honors|achievements|honors and awards)\s*:?',
    }

    DEGREE_KEYWORDS = [
        'bachelor', 'master', 'phd', 'doctorate', 'associate', 'b.s.', 'b.a.', 'm.s.', 'm.a.',
        'b.tech', 'm.tech', 'b.e.', 'm.e.', 'b.com', 'm.com', 'b.sc', 'm.sc', 'b.b.a.', 'm.b.a.',
        'high school', 'diploma', 'certificate', 'g.e.d.', '10th', '12th', 'hsc', 'ssc'
    ]

    # Common cities (for fixing missing spaces in institution lines)
    COMMON_CITIES = [
        'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata',
        'Pune', 'Jaipur', 'Lucknow', 'Nagpur', 'Indore', 'Bhopal', 'Visakhapatnam',
        'Patna', 'Vadodara', 'Surat', 'Coimbatore', 'Mysore', 'Thiruvananthapuram',
        'New York', 'London', 'San Francisco', 'Chicago', 'Boston', 'Seattle', 'Austin',
        'Toronto', 'Sydney', 'Berlin', 'Paris', 'Tokyo', 'Singapore'
    ]

    def __init__(self):
        self.text = ""
        self.sections = {}
        self.parsed_data = {
            'skills': [],
            'projects': [],
            'experience': [],
            'education': [],
            'contact': {}
        }

    def parse(self, file_stream, file_type: str) -> Dict[str, Any]:
        """Main entry point: extract text and parse all fields."""
        if file_type == 'pdf':
            self.text = self._extract_text_from_pdf(file_stream)
        elif file_type == 'docx':
            self.text = self._extract_text_from_docx(file_stream)
        elif file_type == 'txt':
            self.text = self._extract_text_from_txt(file_stream)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")

        self.text = self._clean_text(self.text)
        self.sections = self._extract_sections(self.text)

        self._parse_contact()
        self._parse_skills()
        self._parse_projects()
        self._parse_experience()
        self._parse_education()

        self._validate_data()
        return self.parsed_data

    # ------------------------------------------------------------------
    # Text extraction & cleaning
    # ------------------------------------------------------------------
    def _extract_text_from_pdf(self, file_stream) -> str:
        reader = PyPDF2.PdfReader(file_stream)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text

    def _extract_text_from_docx(self, file_stream) -> str:
        doc = docx.Document(file_stream)
        return "\n".join([para.text for para in doc.paragraphs])

    def _extract_text_from_txt(self, file_stream) -> str:
        return file_stream.read().decode('utf-8')

    def _clean_text(self, text: str) -> str:
        # Replace tabs and multiple spaces with single space
        text = re.sub(r'[ \t]+', ' ', text)
        # Normalise line breaks (preserve paragraph breaks)
        text = re.sub(r'\n\s*\n', '\n\n', text)
        # Trim each line (but keep empty lines as empty strings)
        lines = [line.strip() for line in text.split('\n')]
        # We keep empty lines to preserve paragraph structure
        return '\n'.join(lines)

    # ------------------------------------------------------------------
    # Section splitting (now preserves empty lines)
    # ------------------------------------------------------------------
    def _extract_sections(self, text: str) -> Dict[str, List[str]]:
        lines = text.split('\n')
        sections = {}
        current_section = 'header'
        sections[current_section] = []

        for line in lines:
            line_stripped = line.strip()
            # Check if this line matches a section header (only non-empty lines)
            if line_stripped:
                matched = False
                for section_name, pattern in self.SECTION_PATTERNS.items():
                    if re.match(pattern, line_stripped):
                        current_section = section_name
                        if current_section not in sections:
                            sections[current_section] = []
                        matched = True
                        break
                if not matched:
                    sections[current_section].append(line)
            else:
                # Empty line: add to current section to preserve paragraphs
                sections[current_section].append('')

        # Clean sections but preserve empty lines within them
        cleaned_sections = {}
        for k, v in sections.items():
            if any(ln.strip() for ln in v):  # section has at least one non-empty line
                cleaned_sections[k] = v
        return cleaned_sections

    # ------------------------------------------------------------------
    # Contact info
    # ------------------------------------------------------------------
    def _parse_contact(self):
        header_text = ' '.join(self.sections.get('header', []))
        emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', header_text)
        phones = re.findall(r'[\+\(]?[1-9][0-9 .\-\(\)]{8,}[0-9]', header_text)
        linkedin = re.findall(r'(linkedin\.com/in/[a-zA-Z0-9\-_]+)', header_text, re.IGNORECASE)

        self.parsed_data['contact'] = {
            'email': emails[0] if emails else None,
            'phone': phones[0] if phones else None,
            'linkedin': linkedin[0] if linkedin else None
        }

    # ------------------------------------------------------------------
    # Skills extraction
    # ------------------------------------------------------------------
    def _parse_skills(self):
        skills_set = set()
        skill_sections = ['skills', 'languages']

        for section in skill_sections:
            if section in self.sections:
                for line in self.sections[section]:
                    # Remove category prefixes like "Languages:" or "Frameworks & Tools:"
                    line_cleaned = re.sub(r'^[A-Za-z/&\s]+:?\s*', '', line).strip()
                    # Replace bullet characters and slashes with commas
                    line_cleaned = re.sub(r'[•\-\*]\s*', ',', line_cleaned)
                    line_cleaned = re.sub(r'\s+/\s+', ',', line_cleaned)
                    # Split by commas
                    candidates = [s.strip() for s in line_cleaned.split(',') if s.strip()]
                    for cand in candidates:
                        # Handle slashes without spaces (e.g., "C++/Python")
                        if '/' in cand and not re.search(r'\s/\s', cand):
                            cand = cand.replace('/', ',')
                            cand = [s.strip() for s in cand.split(',') if s.strip()]
                            skills_set.update(cand)
                        else:
                            if self._is_valid_skill(cand):
                                skills_set.add(cand)

        self.parsed_data['skills'] = sorted(list(skills_set))

    def _is_valid_skill(self, skill: str) -> bool:
        if len(skill) > 50 or len(skill) < 2:
            return False
        if not re.search(r'[a-zA-Z]', skill):
            return False
        if ' ' in skill and len(skill.split()) > 4:
            return False
        if skill.lower() in ['and', 'the', 'for', 'with', 'using', 'etc']:
            return False
        return True

    # ------------------------------------------------------------------
    # Projects extraction (grouped by blank lines)
    # ------------------------------------------------------------------
    def _parse_projects(self):
        if 'projects' not in self.sections:
            return

        # Join the section lines preserving empty lines for paragraph separation
        projects_text = '\n'.join(self.sections['projects'])
        
        # Split by double newlines (blank lines) to get project blocks
        paragraphs = re.split(r'\n\s*\n', projects_text.strip())
        projects = []

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
                
            lines = para.split('\n')
            if not lines:
                continue
                
            # First non-empty line is the title
            title_line = lines[0].strip()
            description_lines = [line.strip() for line in lines[1:] if line.strip()]

            # Extract title and initial description from separators
            title = title_line
            initial_desc = ''
            
            # Check for common separators in title line
            for sep in ['|', '–', '-', ':', '—']:
                if sep in title_line and title_line.count(sep) == 1:
                    parts = title_line.split(sep, 1)
                    if len(parts) == 2:
                        title = parts[0].strip()
                        initial_desc = parts[1].strip()
                        break

            # Build full description
            full_description = initial_desc
            for line in description_lines:
                # Remove bullet points
                line = re.sub(r'^[•\-\*]\s*', '', line)
                if full_description:
                    full_description += ' ' + line
                else:
                    full_description = line

            if title:  # Only add if we have a title
                projects.append({
                    'title': title,
                    'description': full_description
                })

        self.parsed_data['projects'] = projects

    # ------------------------------------------------------------------
    # Experience extraction
    # ------------------------------------------------------------------
    def _parse_experience(self):
        if 'experience' not in self.sections:
            return

        lines = self.sections['experience']
        experiences = []
        current_job = None
        description_lines = []

        date_pattern = re.compile(
            r'((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december|spring|summer|fall|winter)?\s*\d{4})\s*(?:-|–|to|–|—)\s*((?:present|current|now|(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december|spring|summer|fall|winter)?\s*\d{4})))',
            re.IGNORECASE
        )

        i = 0
        while i < len(lines):
            line = lines[i].strip()
            if not line:
                i += 1
                continue

            date_match = date_pattern.search(line)
            if date_match:
                if current_job:
                    current_job['description'] = ' '.join(description_lines)
                    experiences.append(current_job)

                line_without_date = date_pattern.sub('', line).strip()
                line_without_date = re.sub(r'[,\-|]\s*$', '', line_without_date)

                title = ''
                company = ''
                for sep in [' at ', ' @ ', ', ', ' | ', ' - ', ' – ']:
                    if sep in line_without_date:
                        parts = line_without_date.split(sep, 1)
                        title = parts[0].strip()
                        company = parts[1].strip()
                        break
                if not title:
                    title = line_without_date

                current_job = {
                    'title': title,
                    'company': company,
                    'start_date': date_match.group(1).strip(),
                    'end_date': date_match.group(2).strip(),
                    'description': ''
                }
                description_lines = []
            else:
                if (current_job is None and
                    any(kw in line.lower() for kw in ['engineer', 'developer', 'analyst', 'manager', 'intern', 'lead', 'director'])):
                    current_job = {
                        'title': line,
                        'company': '',
                        'start_date': '',
                        'end_date': '',
                        'description': ''
                    }
                    description_lines = []
                else:
                    description_lines.append(line)
            i += 1

        if current_job:
            current_job['description'] = ' '.join(description_lines)
            experiences.append(current_job)

        self.parsed_data['experience'] = experiences

    # ------------------------------------------------------------------
    # Education extraction (improved with city‑space fix)
    # ------------------------------------------------------------------
    def _parse_education(self):
        if 'education' not in self.sections:
            return

        edu_text = '\n'.join(self.sections['education'])
        paragraphs = re.split(r'\n\s*\n', edu_text.strip())
        education_entries = []

        year_pattern = re.compile(r'\b(19|20)\d{2}\b')
        date_range_pattern = re.compile(
            r'((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december|spring|summer|fall|winter)?\s*\d{4})\s*(?:-|–|to)\s*((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december|spring|summer|fall|winter)?\s*\d{4})',
            re.IGNORECASE
        )

        for para in paragraphs:
            if not para.strip():
                continue
            lines = para.strip().split('\n')
            entry = {
                'degree': '',
                'institution': '',
                'graduation_year': '',
                'description': para  # raw for reference
            }

            # Try to find a date range first
            date_range_match = date_range_pattern.search(para)
            if date_range_match:
                end_year_candidate = date_range_match.group(2).strip()
                year_match = year_pattern.search(end_year_candidate)
                if year_match:
                    entry['graduation_year'] = year_match.group(0)

            if not entry['graduation_year']:
                year_match = year_pattern.search(para)
                if year_match:
                    entry['graduation_year'] = year_match.group(0)

            # Identify degree line (contains degree keywords)
            degree_line = None
            institution_line = None
            for line in lines:
                line_lower = line.lower()
                if any(kw in line_lower for kw in self.DEGREE_KEYWORDS):
                    degree_line = line
                elif 'university' in line_lower or 'college' in line_lower or 'institute' in line_lower:
                    institution_line = line

            if degree_line:
                # Remove date range from degree line
                cleaned_degree = date_range_pattern.sub('', degree_line).strip()
                cleaned_degree = re.sub(r'[,\-]\s*$', '', cleaned_degree)
                entry['degree'] = cleaned_degree

                # If degree line contains a comma, split into degree and institution
                if ',' in degree_line and not institution_line:
                    parts = degree_line.split(',', 1)
                    entry['degree'] = parts[0].strip()
                    entry['institution'] = parts[1].strip()

            if institution_line and not entry['institution']:
                entry['institution'] = institution_line

            # If still no institution, use the first line that is not the degree line
            if not entry['institution'] and lines and lines[0] != degree_line:
                entry['institution'] = lines[0]

            # Fix missing spaces before city names in institution
            if entry['institution']:
                entry['institution'] = self._fix_missing_space_before_city(entry['institution'])

            education_entries.append(entry)

        self.parsed_data['education'] = education_entries

    def _fix_missing_space_before_city(self, text: str) -> str:
        """Insert a space before a known city name if it's directly attached to the previous word."""
        for city in self.COMMON_CITIES:
            # Look for pattern where city is directly attached (e.g., "SciencePune")
            pattern = rf'(?<=[a-z])({re.escape(city)})'
            if re.search(pattern, text, re.IGNORECASE):
                text = re.sub(pattern, r' \1', text, flags=re.IGNORECASE)
                break
        return text

    # ------------------------------------------------------------------
    # Validation and cleanup
    # ------------------------------------------------------------------
    def _validate_data(self):
        self.parsed_data['skills'] = list(dict.fromkeys(self.parsed_data['skills']))

        for proj in self.parsed_data['projects']:
            proj['title'] = proj['title'].strip() if proj['title'] else ''
            proj['description'] = proj['description'].strip() if proj['description'] else ''

        valid_exp = []
        for exp in self.parsed_data['experience']:
            if exp.get('title') and len(exp['title']) > 2:
                exp['start_date'] = exp.get('start_date', '').strip()
                exp['end_date'] = exp.get('end_date', '').strip()
                exp['description'] = exp.get('description', '').strip()
                valid_exp.append(exp)
        self.parsed_data['experience'] = valid_exp

        valid_edu = []
        for edu in self.parsed_data['education']:
            if edu.get('degree') and len(edu['degree']) > 3:
                edu['degree'] = edu['degree'].strip()
                edu['institution'] = edu.get('institution', '').strip()
                edu['graduation_year'] = edu.get('graduation_year', '').strip()
                valid_edu.append(edu)
        self.parsed_data['education'] = valid_edu

    # ------------------------------------------------------------------
    # ATS quality assessment
    # ------------------------------------------------------------------
    def assess_ats_quality(self) -> Dict[str, Any]:
        """
        Compute a simple ATS (Applicant Tracking System) quality score based on
        the presence of key sections, number of skills, project descriptions, etc.
        Returns a dict with score (0-100), rating, and suggestions.
        """
        score = 0
        max_score = 100
        suggestions = []

        # 1. Presence of essential sections (30 points)
        essential_sections = ['summary', 'skills', 'experience', 'education', 'projects']
        for sec in essential_sections:
            if sec in self.sections and len(self.sections[sec]) > 0:
                score += 6  # 5 sections * 6 = 30
            else:
                suggestions.append(f"Add a '{sec}' section to improve ATS readability.")

        # 2. Skills section quality (20 points)
        if 'skills' in self.sections or 'languages' in self.sections:
            skill_count = len(self.parsed_data['skills'])
            if skill_count >= 15:
                score += 20
            elif skill_count >= 10:
                score += 15
            elif skill_count >= 5:
                score += 10
            else:
                score += 5
                suggestions.append("List more technical skills (aim for 10+).")
        else:
            suggestions.append("Include a dedicated 'Skills' section.")

        # 3. Project descriptions (20 points)
        if self.parsed_data['projects']:
            # Check if descriptions are detailed (average length > 50 chars)
            avg_desc_len = sum(len(p['description']) for p in self.parsed_data['projects']) / len(self.parsed_data['projects'])
            if avg_desc_len > 100:
                score += 20
            elif avg_desc_len > 50:
                score += 15
            else:
                score += 10
                suggestions.append("Add more detail to your project descriptions.")
        else:
            suggestions.append("Include a 'Projects' section with descriptions.")

        # 4. Experience section (15 points)
        if self.parsed_data['experience']:
            score += 15
        else:
            suggestions.append("Add work experience or internships (if applicable).")

        # 5. Contact info (5 points)
        if self.parsed_data['contact'].get('email') or self.parsed_data['contact'].get('phone'):
            score += 5
        else:
            suggestions.append("Include contact information (email/phone).")

        # 6. Header content (5 points)
        if len(self.sections.get('header', [])) >= 2:
            score += 5
        else:
            suggestions.append("Ensure your name and contact details are at the top.")

        # Cap score at max
        score = min(score, max_score)

        # Determine rating
        if score >= 80:
            rating = "Excellent"
        elif score >= 60:
            rating = "Good"
        elif score >= 40:
            rating = "Needs Improvement"
        else:
            rating = "Poor"

        return {
            'score': score,
            'rating': rating,
            'suggestions': suggestions[:5]  # limit to top 5 suggestions
        }


# ----------------------------------------------------------------------
# Legacy functions (signatures unchanged)
# ----------------------------------------------------------------------

def extract_text(file_stream, file_type):
    parser = ResumeParser()
    parser.parse(file_stream, file_type)
    return parser.text


def parse_resume_sections(text):
    parser = ResumeParser()
    parser.text = text
    parser.sections = parser._extract_sections(text)
    return parser.sections


def extract_keywords(text):
    """
    Extract structured information from resume text.
    Returns a dictionary with keys:
      - skills: list of skill strings
      - project_names: list of project titles
      - project_keywords: RAKE keywords from projects (for backward compatibility)
      - experience: list of strings summarizing each job
      - education: list of strings summarizing each education entry
      - all_keywords: combined list of skills and project titles
      - sections: raw section dictionary
      - projects_full: list of dicts with 'title' and 'description' (new)
      - education_full: list of dicts with 'degree', 'institution', 'graduation_year' (new)
      - experience_full: list of dicts with full details (new)
      - ats_quality: dict with score, rating, suggestions (new)
    """
    parser = ResumeParser()
    parser.text = text
    parser.sections = parser._extract_sections(text)
    parser._parse_skills()
    parser._parse_projects()
    parser._parse_experience()
    parser._parse_education()
    parser._validate_data()

    # RAKE keywords (unchanged)
    rake = Rake()
    project_keywords = []
    if 'projects' in parser.sections:
        project_text = ' '.join(parser.sections['projects'])
        rake.extract_keywords_from_text(project_text)
        all_phrases = rake.get_ranked_phrases()[:20]
        for phrase in all_phrases:
            if len(phrase.split()) <= 3 and len(phrase) > 3:
                project_keywords.append(phrase)
        project_keywords = project_keywords[:10]

    # Format simple strings for backward compatibility
    experience_strings = [
        f"{e['title']} at {e['company']} ({e['start_date']} - {e['end_date']})"
        for e in parser.parsed_data['experience']
    ]
    education_strings = [
        f"{e['degree']}, {e['institution']} ({e['graduation_year']})"
        for e in parser.parsed_data['education'] if e['degree'] and e['institution']
    ]

    # ATS assessment
    ats_quality = parser.assess_ats_quality()

    return {
        'skills': parser.parsed_data['skills'],
        'project_names': [p['title'] for p in parser.parsed_data['projects'] if p['title']],
        'project_keywords': project_keywords,
        'experience': experience_strings,
        'education': education_strings,
        'all_keywords': parser.parsed_data['skills'] + [p['title'] for p in parser.parsed_data['projects'] if p['title']],
        'sections': parser.sections,
        # New detailed fields
        'projects_full': parser.parsed_data['projects'],
        'education_full': parser.parsed_data['education'],
        'experience_full': parser.parsed_data['experience'],
        'ats_quality': ats_quality
    }