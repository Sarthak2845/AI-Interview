const jsPDF = require('jspdf')
require('jspdf-autotable')

class PDFGenerator {
  constructor() {
    this.templates = {
      modern: this.modernTemplate.bind(this),
      classic: this.classicTemplate.bind(this),
      minimal: this.minimalTemplate.bind(this),
      creative: this.creativeTemplate.bind(this)
    }
  }

  generatePDF(resumeData, template = 'modern') {
    const doc = new jsPDF()
    const templateFunction = this.templates[template] || this.templates.modern
    
    templateFunction(doc, resumeData)
    
    return doc.output('arraybuffer')
  }

  modernTemplate(doc, data) {
    const { personalInfo, summary, experience, education, skills, projects, certifications } = data
    let yPosition = 20

    // Header
    doc.setFillColor(139, 69, 19)
    doc.rect(0, 0, 210, 40, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text(personalInfo.fullName || 'Your Name', 20, 25)
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const contactInfo = [personalInfo.email, personalInfo.phone, personalInfo.location].filter(Boolean).join(' | ')
    doc.text(contactInfo, 20, 32)
    
    yPosition = 50
    doc.setTextColor(0, 0, 0)

    // Summary
    if (summary) {
      yPosition = this.addSection(doc, 'PROFESSIONAL SUMMARY', yPosition)
      yPosition = this.addParagraph(doc, summary, yPosition)
      yPosition += 10
    }

    // Experience
    if (experience?.length > 0) {
      yPosition = this.addSection(doc, 'PROFESSIONAL EXPERIENCE', yPosition)
      experience.forEach(exp => {
        yPosition = this.addExperience(doc, exp, yPosition)
      })
    }

    // Education
    if (education?.length > 0) {
      yPosition = this.addSection(doc, 'EDUCATION', yPosition)
      education.forEach(edu => {
        yPosition = this.addEducation(doc, edu, yPosition)
      })
    }

    // Skills
    if (skills?.technical?.length > 0 || skills?.soft?.length > 0) {
      yPosition = this.addSection(doc, 'SKILLS', yPosition)
      yPosition = this.addSkills(doc, skills, yPosition)
    }

    // Projects
    if (projects?.length > 0) {
      yPosition = this.addSection(doc, 'PROJECTS', yPosition)
      projects.forEach(project => {
        yPosition = this.addProject(doc, project, yPosition)
      })
    }

    // Certifications
    if (certifications?.length > 0) {
      yPosition = this.addSection(doc, 'CERTIFICATIONS', yPosition)
      certifications.forEach(cert => {
        yPosition = this.addCertification(doc, cert, yPosition)
      })
    }
  }

  classicTemplate(doc, data) {
    const { personalInfo, summary, experience, education, skills, projects, certifications } = data
    let yPosition = 20

    doc.setFontSize(20)
    doc.setFont('times', 'bold')
    doc.text(personalInfo.fullName || 'Your Name', 105, yPosition, { align: 'center' })
    
    yPosition += 8
    doc.setFontSize(10)
    doc.setFont('times', 'normal')
    const contactInfo = [personalInfo.email, personalInfo.phone, personalInfo.location].filter(Boolean).join(' • ')
    doc.text(contactInfo, 105, yPosition, { align: 'center' })
    
    yPosition += 15
    doc.setLineWidth(0.5)
    doc.line(20, yPosition, 190, yPosition)
    yPosition += 10

    this.addSections(doc, data, yPosition)
  }

  minimalTemplate(doc, data) {
    const { personalInfo } = data
    let yPosition = 30

    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(personalInfo.fullName || 'Your Name', 20, yPosition)
    
    yPosition += 6
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(personalInfo.email || '', 20, yPosition)
    doc.text(personalInfo.phone || '', 80, yPosition)
    doc.text(personalInfo.location || '', 140, yPosition)
    
    yPosition += 15
    this.addSections(doc, data, yPosition)
  }

  creativeTemplate(doc, data) {
    this.modernTemplate(doc, data)
  }

  addSection(doc, title, yPosition) {
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(139, 69, 19)
    doc.text(title, 20, yPosition)
    
    doc.setLineWidth(0.5)
    doc.setDrawColor(139, 69, 19)
    doc.line(20, yPosition + 2, 20 + doc.getTextWidth(title), yPosition + 2)
    
    doc.setTextColor(0, 0, 0)
    return yPosition + 8
  }

  addParagraph(doc, text, yPosition, options = {}) {
    const { maxWidth = 170, fontSize = 10 } = options
    
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', 'normal')
    
    const lines = doc.splitTextToSize(text, maxWidth)
    lines.forEach(line => {
      if (yPosition > 270) {
        doc.addPage()
        yPosition = 20
      }
      doc.text(line, 20, yPosition)
      yPosition += 5
    })
    
    return yPosition
  }

  addExperience(doc, exp, yPosition) {
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(exp.jobTitle || '', 20, yPosition)
    
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(139, 69, 19)
    doc.text(exp.company || '', 20, yPosition + 5)
    
    doc.setTextColor(100, 100, 100)
    doc.setFontSize(9)
    const dateText = `${exp.startDate || ''} - ${exp.isCurrentJob ? 'Present' : exp.endDate || ''}`
    doc.text(dateText, 190, yPosition, { align: 'right' })
    
    yPosition += 12
    doc.setTextColor(0, 0, 0)
    
    if (exp.description) {
      yPosition = this.addParagraph(doc, exp.description, yPosition, { fontSize: 9 })
    }
    
    if (exp.achievements?.filter(a => a.trim()).length > 0) {
      exp.achievements.filter(a => a.trim()).forEach(achievement => {
        if (yPosition > 270) {
          doc.addPage()
          yPosition = 20
        }
        doc.setFontSize(9)
        doc.text('•', 25, yPosition)
        const lines = doc.splitTextToSize(achievement, 160)
        lines.forEach(line => {
          doc.text(line, 30, yPosition)
          yPosition += 4
        })
      })
    }
    
    return yPosition + 5
  }

  addEducation(doc, edu, yPosition) {
    if (yPosition > 260) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(edu.degree || '', 20, yPosition)
    
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(139, 69, 19)
    doc.text(edu.institution || '', 20, yPosition + 5)
    
    doc.setTextColor(100, 100, 100)
    doc.setFontSize(9)
    const dateText = `${edu.startDate || ''} - ${edu.endDate || ''}`
    doc.text(dateText, 190, yPosition, { align: 'right' })
    
    doc.setTextColor(0, 0, 0)
    return yPosition + 12
  }

  addSkills(doc, skills, yPosition) {
    if (skills.technical?.length > 0) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Technical Skills:', 20, yPosition)
      yPosition += 5
      
      doc.setFont('helvetica', 'normal')
      const techSkills = skills.technical.map(skill => `${skill.name} (${skill.level})`).join(', ')
      yPosition = this.addParagraph(doc, techSkills, yPosition, { fontSize: 9 })
      yPosition += 3
    }
    
    if (skills.soft?.length > 0) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Soft Skills:', 20, yPosition)
      yPosition += 5
      
      doc.setFont('helvetica', 'normal')
      const softSkills = skills.soft.join(', ')
      yPosition = this.addParagraph(doc, softSkills, yPosition, { fontSize: 9 })
    }
    
    return yPosition
  }

  addProject(doc, project, yPosition) {
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(project.name || '', 20, yPosition)
    
    doc.setTextColor(100, 100, 100)
    doc.setFontSize(9)
    const dateText = `${project.startDate || ''} - ${project.endDate || ''}`
    doc.text(dateText, 190, yPosition, { align: 'right' })
    
    yPosition += 6
    doc.setTextColor(0, 0, 0)
    
    if (project.description) {
      yPosition = this.addParagraph(doc, project.description, yPosition, { fontSize: 9 })
    }
    
    if (project.technologies?.length > 0) {
      yPosition += 2
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('Technologies: ', 20, yPosition)
      doc.setFont('helvetica', 'normal')
      doc.text(project.technologies.join(', '), 50, yPosition)
      yPosition += 4
    }
    
    return yPosition + 3
  }

  addCertification(doc, cert, yPosition) {
    if (yPosition > 260) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(cert.name || '', 20, yPosition)
    
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(139, 69, 19)
    doc.text(cert.issuer || '', 20, yPosition + 4)
    
    doc.setTextColor(100, 100, 100)
    doc.setFontSize(9)
    const dateText = cert.neverExpires ? 'Never Expires' : 
                    `Issued: ${cert.issueDate || ''} ${cert.expiryDate ? `| Expires: ${cert.expiryDate}` : ''}`
    doc.text(dateText, 190, yPosition, { align: 'right' })
    
    doc.setTextColor(0, 0, 0)
    return yPosition + 10
  }

  addSections(doc, data, yPosition) {
    const { summary, experience, education, skills, projects, certifications } = data

    if (summary) {
      yPosition = this.addSection(doc, 'SUMMARY', yPosition)
      yPosition = this.addParagraph(doc, summary, yPosition)
      yPosition += 10
    }

    if (experience?.length > 0) {
      yPosition = this.addSection(doc, 'EXPERIENCE', yPosition)
      experience.forEach(exp => {
        yPosition = this.addExperience(doc, exp, yPosition)
      })
    }

    if (education?.length > 0) {
      yPosition = this.addSection(doc, 'EDUCATION', yPosition)
      education.forEach(edu => {
        yPosition = this.addEducation(doc, edu, yPosition)
      })
    }

    if (skills?.technical?.length > 0 || skills?.soft?.length > 0) {
      yPosition = this.addSection(doc, 'SKILLS', yPosition)
      yPosition = this.addSkills(doc, skills, yPosition)
    }

    if (projects?.length > 0) {
      yPosition = this.addSection(doc, 'PROJECTS', yPosition)
      projects.forEach(project => {
        yPosition = this.addProject(doc, project, yPosition)
      })
    }

    if (certifications?.length > 0) {
      yPosition = this.addSection(doc, 'CERTIFICATIONS', yPosition)
      certifications.forEach(cert => {
        yPosition = this.addCertification(doc, cert, yPosition)
      })
    }

    return yPosition
  }
}

module.exports = PDFGenerator