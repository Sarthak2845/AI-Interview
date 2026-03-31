const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

class ResumeParser {
  async extractText(buffer, fileType) {
    try {
      switch (fileType.toLowerCase()) {
        case 'pdf':
          const pdfData = await pdfParse(buffer);
          return pdfData.text;
        case 'docx':
          const docxData = await mammoth.extractRawText({ buffer });
          return docxData.value;
        case 'txt':
          return buffer.toString('utf-8');
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      throw new Error(`Text extraction failed: ${error.message}`);
    }
  }

  extractKeywords(text) {
    const sections = this.extractSections(text);
    const skills = this.extractSkills(sections);
    const projects = this.extractProjects(sections);
    const experience = this.extractExperience(sections);
    const education = this.extractEducation(sections);

    return {
      skills,
      projects,
      experience,
      education,
      sections,
      atsQuality: this.assessATSQuality(sections, skills, projects, experience, education)
    };
  }

  extractSections(text) {
    const sections = {};
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    let currentSection = 'header';
    sections[currentSection] = [];

    const sectionPatterns = {
      summary: /^(summary|professional summary|profile|objective)\s*:?/i,
      education: /^(education|academic background|qualifications)\s*:?/i,
      experience: /^(experience|work experience|employment|professional experience)\s*:?/i,
      projects: /^(projects|personal projects|academic projects|key projects)\s*:?/i,
      skills: /^(skills|technical skills|core competencies|expertise|technologies)\s*:?/i,
      certifications: /^(certifications|courses|training)\s*:?/i
    };

    for (const line of lines) {
      let matched = false;
      for (const [sectionName, pattern] of Object.entries(sectionPatterns)) {
        if (pattern.test(line)) {
          currentSection = sectionName;
          if (!sections[currentSection]) sections[currentSection] = [];
          matched = true;
          break;
        }
      }
      if (!matched) {
        sections[currentSection].push(line);
      }
    }

    return sections;
  }

  extractSkills(sections) {
    const skills = new Set();
    const skillSections = ['skills', 'technologies'];
    
    for (const section of skillSections) {
      if (sections[section]) {
        for (const line of sections[section]) {
          const cleanLine = line.replace(/^[A-Za-z/&\s]+:?\s*/, '').trim();
          const candidates = cleanLine.split(/[,•\-\*\/]/).map(s => s.trim()).filter(s => s);
          
          for (const skill of candidates) {
            if (this.isValidSkill(skill)) {
              skills.add(skill);
            }
          }
        }
      }
    }
    
    return Array.from(skills);
  }

  extractProjects(sections) {
    if (!sections.projects) return [];
    
    const projects = [];
    let currentProject = null;
    
    for (const line of sections.projects) {
      if (line.length > 10 && !line.startsWith('•') && !line.startsWith('-')) {
        if (currentProject) projects.push(currentProject);
        currentProject = { title: line, description: '' };
      } else if (currentProject) {
        currentProject.description += (currentProject.description ? ' ' : '') + line.replace(/^[•\-\*]\s*/, '');
      }
    }
    
    if (currentProject) projects.push(currentProject);
    return projects;
  }

  extractExperience(sections) {
    if (!sections.experience) return [];
    
    const experiences = [];
    const datePattern = /\b(19|20)\d{2}\b/g;
    
    for (const line of sections.experience) {
      const dates = line.match(datePattern);
      if (dates && line.length > 20) {
        const parts = line.split(/\s+at\s+|\s+@\s+|\s*,\s*/);
        experiences.push({
          title: parts[0] || '',
          company: parts[1] || '',
          dates: dates.join(' - '),
          description: line
        });
      }
    }
    
    return experiences;
  }

  extractEducation(sections) {
    if (!sections.education) return [];
    
    const education = [];
    const degreeKeywords = ['bachelor', 'master', 'phd', 'b.s.', 'b.a.', 'm.s.', 'm.a.', 'b.tech', 'm.tech'];
    
    for (const line of sections.education) {
      if (degreeKeywords.some(kw => line.toLowerCase().includes(kw))) {
        const yearMatch = line.match(/\b(19|20)\d{2}\b/);
        education.push({
          degree: line,
          year: yearMatch ? yearMatch[0] : '',
          description: line
        });
      }
    }
    
    return education;
  }

  isValidSkill(skill) {
    return skill.length >= 2 && skill.length <= 50 && /[a-zA-Z]/.test(skill);
  }

  assessATSQuality(sections, skills, projects, experience, education) {
    let score = 0;
    const suggestions = [];
    
    // Essential sections (30 points)
    const essentialSections = ['summary', 'skills', 'experience', 'education', 'projects'];
    for (const section of essentialSections) {
      if (sections[section] && sections[section].length > 0) {
        score += 6;
      } else {
        suggestions.push(`Add a '${section}' section`);
      }
    }
    
    // Skills count (20 points)
    if (skills.length >= 15) score += 20;
    else if (skills.length >= 10) score += 15;
    else if (skills.length >= 5) score += 10;
    else suggestions.push('List more technical skills (aim for 10+)');
    
    // Projects (20 points)
    if (projects.length > 0) {
      const avgDescLength = projects.reduce((sum, p) => sum + p.description.length, 0) / projects.length;
      if (avgDescLength > 100) score += 20;
      else if (avgDescLength > 50) score += 15;
      else score += 10;
    } else {
      suggestions.push('Include detailed project descriptions');
    }
    
    // Experience (15 points)
    if (experience.length > 0) score += 15;
    else suggestions.push('Add work experience or internships');
    
    // Contact info (15 points)
    const headerText = sections.header ? sections.header.join(' ') : '';
    if (/@/.test(headerText) || /\d{10}/.test(headerText)) score += 15;
    else suggestions.push('Include contact information');
    
    const rating = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Needs Improvement' : 'Poor';
    
    return { score, rating, suggestions: suggestions.slice(0, 5) };
  }
}

module.exports = ResumeParser;