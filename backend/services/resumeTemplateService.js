class ResumeTemplateService {
  constructor() {
    this.templates = {
      modern: new ModernTemplate(),
      classic: new ClassicTemplate(),
      minimal: new MinimalTemplate(),
      creative: new CreativeTemplate(),
      executive: new ExecutiveTemplate(),
      tech: new TechTemplate()
    }
  }

  getTemplate(templateId) {
    return this.templates[templateId] || this.templates.modern
  }

  getAllTemplates() {
    return [
      {
        id: 'modern',
        name: 'Modern Blue',
        description: 'Clean professional design with blue accents',
        atsScore: 98,
        category: 'Professional',
        bestFor: 'Tech, business, general corporate roles'
      },
      {
        id: 'classic',
        name: 'Classic Black',
        description: 'Traditional format with black accents',
        atsScore: 100,
        category: 'Traditional',
        bestFor: 'Law, finance, consulting, formal industries'
      },
      {
        id: 'minimal',
        name: 'Minimal Clean',
        description: 'Ultra-clean design with maximum readability',
        atsScore: 100,
        category: 'Minimal',
        bestFor: 'Any industry, academic, research roles'
      },
      {
        id: 'creative',
        name: 'Creative Purple',
        description: 'Professional design with creative purple touches',
        atsScore: 95,
        category: 'Creative',
        bestFor: 'Design, marketing, creative industries'
      },
      {
        id: 'executive',
        name: 'Executive Navy',
        description: 'Premium design with navy blue for leadership roles',
        atsScore: 97,
        category: 'Executive',
        bestFor: 'Senior management, C-level, executive positions'
      },
      {
        id: 'tech',
        name: 'Tech Green',
        description: 'Clean design with green accents for tech professionals',
        atsScore: 98,
        category: 'Technical',
        bestFor: 'Software engineering, IT, data science'
      }
    ]
  }

  generateHTML(resumeData, templateId = 'modern') {
    const template = this.getTemplate(templateId)
    return template.render(resumeData)
  }
}

class BaseTemplate {
  constructor() {
    this.colors = {
      primary: '#7C3AED',
      secondary: '#EC4899',
      accent: '#06B6D4',
      text: '#1F2937',
      textLight: '#6B7280',
      background: '#FFFFFF'
    }
  }

  render(data) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.personalInfo.fullName} - Resume</title>
        <style>${this.getStyles()}</style>
      </head>
      <body>
        <div class="resume-container">
          ${this.renderHeader(data.personalInfo)}
          ${this.renderSummary(data.summary)}
          ${this.renderExperience(data.experience)}
          ${this.renderEducation(data.education)}
          ${this.renderSkills(data.skills)}
          ${this.renderProjects(data.projects)}
          ${this.renderCertifications(data.certifications)}
        </div>
      </body>
      </html>
    `
  }

  getStyles() {
    return `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      
      * { margin: 0; padding: 0; box-sizing: border-box; }
      
      body { 
        font-family: 'Inter', Arial, sans-serif;
        line-height: 1.4;
        color: ${this.colors.text};
        background: white;
        font-size: 11px;
      }
      
      .resume-container { 
        max-width: 8.5in; 
        margin: 0 auto; 
        background: white;
        position: relative;
        padding: 0.5in;
      }
      
      /* Header */
      .header {
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .header-content {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
      }
      
      .header-main {
        flex: 1;
      }
      
      .profile-photo {
        flex-shrink: 0;
      }
      
      .profile-img {
        width: 80px;
        height: 80px;
        border-radius: 4px;
        object-fit: cover;
        border: 1px solid #e5e7eb;
      }
      
      .name {
        font-size: 24px;
        font-weight: 700;
        color: ${this.colors.text};
        margin-bottom: 0.25rem;
        line-height: 1.2;
      }
      
      .contact-info {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        font-size: 10px;
        color: ${this.colors.textLight};
      }
      
      .contact-item {
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }
      
      .contact-item a {
        color: inherit;
        text-decoration: none;
      }
      
      /* Sections */
      .section { 
        margin-bottom: 1.25rem;
      }
      
      .section-title { 
        font-size: 12px; 
        font-weight: 600; 
        color: ${this.colors.primary};
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 0.75rem;
        padding-bottom: 0.25rem;
        border-bottom: 1px solid ${this.colors.primary};
      }
      
      /* Items */
      .item { 
        margin-bottom: 1rem;
      }
      
      .item:last-child {
        margin-bottom: 0;
      }
      
      .item-header { 
        display: flex; 
        justify-content: space-between; 
        align-items: flex-start;
        margin-bottom: 0.25rem;
        gap: 1rem;
      }
      
      .item-left {
        flex: 1;
        min-width: 0;
      }
      
      .item-right {
        flex-shrink: 0;
        text-align: right;
      }
      
      .item-title { 
        font-weight: 600; 
        font-size: 11px;
        color: ${this.colors.text};
        line-height: 1.3;
      }
      
      .item-subtitle { 
        color: ${this.colors.primary}; 
        font-weight: 500;
        font-size: 10px;
        margin-top: 0.1rem;
      }
      
      .item-date { 
        color: ${this.colors.textLight}; 
        font-size: 9px;
        font-weight: 500;
        white-space: nowrap;
      }
      
      .item-location {
        color: ${this.colors.textLight};
        font-size: 9px;
        margin-top: 0.1rem;
      }
      
      .item-description { 
        margin-top: 0.5rem;
        font-size: 10px;
        line-height: 1.4;
        color: ${this.colors.text};
      }
      
      /* Skills */
      .skills-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }
      
      .skill-category h4 { 
        font-weight: 600; 
        margin-bottom: 0.5rem;
        color: ${this.colors.text};
        font-size: 10px;
      }
      
      .skill-tags { 
        display: flex; 
        flex-wrap: wrap; 
        gap: 0.25rem; 
      }
      
      .skill-tag { 
        background: #f3f4f6;
        color: ${this.colors.text};
        padding: 0.15rem 0.4rem;
        border-radius: 3px;
        font-size: 9px;
        font-weight: 500;
        border: 1px solid #e5e7eb;
      }
      
      /* Lists */
      ul { 
        padding-left: 1rem;
        margin-top: 0.25rem;
      }
      
      li { 
        margin-bottom: 0.15rem;
        font-size: 10px;
        line-height: 1.3;
      }
      
      /* Summary */
      .summary-text {
        font-size: 10px;
        line-height: 1.4;
        color: ${this.colors.text};
        text-align: justify;
      }
      
      /* Branding */
      .jankoti-branding {
        position: absolute;
        top: 0.25in;
        right: 0.5in;
        font-size: 8px;
        color: #9ca3af;
        text-align: right;
      }
      
      .logo-text {
        font-weight: 600;
        color: ${this.colors.primary};
      }
      
      .branding-text {
        font-size: 7px;
        margin-top: 0.1rem;
      }
      
      /* Print optimization */
      @media print {
        body { background: white; }
        .resume-container { 
          box-shadow: none;
          max-width: none;
          margin: 0;
          padding: 0.5in;
        }
        .section { page-break-inside: avoid; }
        .item { page-break-inside: avoid; }
      }
      
      /* Responsive - only for screen */
      @media screen and (max-width: 768px) {
        .resume-container {
          padding: 1rem;
        }
        
        .header-content {
          flex-direction: column;
          text-align: center;
        }
        
        .contact-info {
          justify-content: center;
        }
        
        .skills-container {
          grid-template-columns: 1fr;
        }
        
        .item-header {
          flex-direction: column;
          align-items: flex-start;
        }
        
        .item-right {
          text-align: left;
        }
      }
    `
  }

  renderHeader(personalInfo) {
    return `
      <header class="header">
        <div class="header-content">
          <div class="header-main">
            ${personalInfo.profilePicture ? `
              <div class="profile-photo">
                <img src="${personalInfo.profilePicture}" alt="${personalInfo.fullName}" class="profile-img" />
              </div>
            ` : ''}
            <div class="header-text">
              <h1 class="name">${personalInfo.fullName || 'Your Name'}</h1>
              <div class="contact-info">
                ${personalInfo.email ? `<span class="contact-item">Email: ${personalInfo.email}</span>` : ''}
                ${personalInfo.phone ? `<span class="contact-item">Phone: ${personalInfo.phone}</span>` : ''}
                ${personalInfo.location ? `<span class="contact-item">Location: ${personalInfo.location}</span>` : ''}
                ${personalInfo.linkedin ? `<span class="contact-item">LinkedIn: <a href="${personalInfo.linkedin}" target="_blank">${personalInfo.linkedin}</a></span>` : ''}
                ${personalInfo.github ? `<span class="contact-item">GitHub: <a href="${personalInfo.github}" target="_blank">${personalInfo.github}</a></span>` : ''}
                ${personalInfo.website ? `<span class="contact-item">Portfolio: <a href="${personalInfo.website}" target="_blank">${personalInfo.website}</a></span>` : ''}
              </div>
            </div>
          </div>
          <div class="jankoti-branding">
            <div class="jankoti-logo">
              <span class="logo-text">JANKOTI</span>
            </div>
            <div class="branding-text">AI-Powered Resume</div>
          </div>
        </div>
      </header>
    `
  }

  renderSummary(summary) {
    if (!summary) return ''
    return `
      <section class="section">
        <h2 class="section-title">Professional Summary</h2>
        <p class="summary-text">${summary}</p>
      </section>
    `
  }

  renderExperience(experience) {
    if (!experience?.length) return ''
    return `
      <section class="section">
        <h2 class="section-title">Professional Experience</h2>
        ${experience.map(exp => `
          <div class="item">
            <div class="item-header">
              <div class="item-left">
                <div class="item-title">${exp.jobTitle || 'Job Title'}</div>
                <div class="item-subtitle">${exp.company || 'Company'}</div>
                ${exp.location ? `<div class="item-location">${exp.location}</div>` : ''}
              </div>
              <div class="item-right">
                <div class="item-date">${exp.startDate || ''} - ${exp.isCurrentJob ? 'Present' : exp.endDate || ''}</div>
              </div>
            </div>
            ${exp.description ? `<div class="item-description">${exp.description}</div>` : ''}
            ${exp.achievements?.filter(a => a.trim()).length ? `
              <ul>
                ${exp.achievements.filter(a => a.trim()).map(achievement => `<li>${achievement}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        `).join('')}
      </section>
    `
  }

  renderEducation(education) {
    if (!education?.length) return ''
    return `
      <section class="section">
        <h2 class="section-title">Education</h2>
        ${education.map(edu => `
          <div class="item">
            <div class="item-header">
              <div class="item-left">
                <div class="item-title">${edu.degree || 'Degree'}</div>
                <div class="item-subtitle">${edu.institution || 'Institution'}</div>
                ${edu.location ? `<div class="item-location">${edu.location}</div>` : ''}
                ${edu.gpa ? `<div class="item-location">GPA: ${edu.gpa}</div>` : ''}
              </div>
              <div class="item-right">
                <div class="item-date">${edu.startDate || ''} - ${edu.endDate || ''}</div>
              </div>
            </div>
          </div>
        `).join('')}
      </section>
    `
  }

  renderSkills(skills) {
    if (!skills?.technical?.length && !skills?.soft?.length) return ''
    return `
      <section class="section">
        <h2 class="section-title">Skills</h2>
        <div class="skills-container">
          ${skills.technical?.length ? `
            <div class="skill-category">
              <h4>Technical Skills</h4>
              <div class="skill-tags">
                ${skills.technical.map(skill => `
                  <span class="skill-tag">${typeof skill === 'object' ? skill.name : skill}</span>
                `).join('')}
              </div>
            </div>
          ` : ''}
          ${skills.soft?.length ? `
            <div class="skill-category">
              <h4>Soft Skills</h4>
              <div class="skill-tags">
                ${skills.soft.map(skill => `
                  <span class="skill-tag">${skill}</span>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </section>
    `
  }

  renderProjects(projects) {
    if (!projects?.length) return ''
    return `
      <section class="section">
        <h2 class="section-title">Projects</h2>
        ${projects.map(project => `
          <div class="item">
            <div class="item-header">
              <div class="item-left">
                <div class="item-title">${project.name || 'Project Name'}</div>
                ${project.technologies?.length ? `
                  <div class="skill-tags" style="margin-top: 0.25rem;">
                    ${project.technologies.map(tech => `<span class="skill-tag">${tech}</span>`).join('')}
                  </div>
                ` : ''}
              </div>
              <div class="item-right">
                <div class="item-date">${project.startDate || ''} - ${project.endDate || ''}</div>
              </div>
            </div>
            ${project.description ? `<div class="item-description">${project.description}</div>` : ''}
            ${project.highlights?.filter(h => h.trim()).length ? `
              <ul>
                ${project.highlights.filter(h => h.trim()).map(highlight => `<li>${highlight}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        `).join('')}
      </section>
    `
  }

  renderCertifications(certifications) {
    if (!certifications?.length) return ''
    return `
      <section class="section">
        <h2 class="section-title">Certifications</h2>
        ${certifications.map(cert => `
          <div class="item">
            <div class="item-header">
              <div class="item-left">
                <div class="item-title">${cert.name || 'Certification'}</div>
                <div class="item-subtitle">${cert.issuer || 'Issuer'}</div>
                ${cert.credentialId ? `<div class="item-location">ID: ${cert.credentialId}</div>` : ''}
              </div>
              <div class="item-right">
                <div class="item-date">Issued: ${cert.issueDate || ''}</div>
                ${cert.neverExpires ? '<div class="item-date">Never Expires</div>' : cert.expiryDate ? `<div class="item-date">Expires: ${cert.expiryDate}</div>` : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </section>
    `
  }
}

class ModernTemplate extends BaseTemplate {
  constructor() {
    super()
    this.colors = {
      primary: '#2563eb',
      secondary: '#1e40af',
      accent: '#3b82f6',
      text: '#1f2937',
      textLight: '#6b7280',
      background: '#ffffff'
    }
  }

  getStyles() {
    return super.getStyles() + `
      .section-title {
        color: #2563eb;
        border-bottom-color: #2563eb;
      }
      
      .item-subtitle {
        color: #2563eb;
      }
      
      .logo-text {
        color: #2563eb;
      }
    `
  }
}

class ClassicTemplate extends BaseTemplate {
  constructor() {
    super()
    this.colors = {
      primary: '#1f2937',
      secondary: '#374151',
      accent: '#6b7280',
      text: '#1f2937',
      textLight: '#6b7280',
      background: '#ffffff'
    }
  }

  getStyles() {
    return super.getStyles() + `
      .section-title {
        color: #1f2937;
        border-bottom-color: #1f2937;
      }
      
      .item-subtitle {
        color: #1f2937;
      }
      
      .logo-text {
        color: #1f2937;
      }
    `
  }
}

class MinimalTemplate extends BaseTemplate {
  constructor() {
    super()
    this.colors = {
      primary: '#000000',
      secondary: '#333333',
      accent: '#666666',
      text: '#000000',
      textLight: '#666666',
      background: '#ffffff'
    }
  }

  getStyles() {
    return super.getStyles() + `
      .section-title {
        color: #000000;
        border-bottom-color: #000000;
      }
      
      .item-subtitle {
        color: #000000;
      }
      
      .logo-text {
        color: #000000;
      }
    `
  }
}

class CreativeTemplate extends BaseTemplate {
  constructor() {
    super()
    this.colors = {
      primary: '#7c3aed',
      secondary: '#a855f7',
      accent: '#c084fc',
      text: '#1f2937',
      textLight: '#6b7280',
      background: '#ffffff'
    }
  }

  getStyles() {
    return super.getStyles() + `
      .section-title {
        color: #7c3aed;
        border-bottom-color: #7c3aed;
      }
      
      .item-subtitle {
        color: #7c3aed;
      }
      
      .logo-text {
        color: #7c3aed;
      }
    `
  }
}

class ExecutiveTemplate extends BaseTemplate {
  constructor() {
    super()
    this.colors = {
      primary: '#1e40af',
      secondary: '#1e3a8a',
      accent: '#3b82f6',
      text: '#1f2937',
      textLight: '#6b7280',
      background: '#ffffff'
    }
  }

  getStyles() {
    return super.getStyles() + `
      .section-title {
        color: #1e40af;
        border-bottom-color: #1e40af;
      }
      
      .item-subtitle {
        color: #1e40af;
      }
      
      .logo-text {
        color: #1e40af;
      }
    `
  }
}

class TechTemplate extends BaseTemplate {
  constructor() {
    super()
    this.colors = {
      primary: '#10b981',
      secondary: '#059669',
      accent: '#34d399',
      text: '#1f2937',
      textLight: '#6b7280',
      background: '#ffffff'
    }
  }

  getStyles() {
    return super.getStyles() + `
      .section-title {
        color: #10b981;
        border-bottom-color: #10b981;
      }
      
      .item-subtitle {
        color: #10b981;
      }
      
      .logo-text {
        color: #10b981;
      }
    `
  }
}

module.exports = ResumeTemplateService