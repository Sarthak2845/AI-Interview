const User = require('../models/User');
const Resume = require('../models/Resume');
const ResumeTemplateService = require('../services/resumeTemplateService');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Import AI functions
const { generateAISummary } = require('./resumeAI');

// Initialize template service
const templateService = new ResumeTemplateService();

// Add the AI summary route
const generateSummary = async (req, res) => {
  return generateAISummary(req, res);
};

// Generate PDF with enhanced templates
const generatePDF = async (req, res) => {
  let browser;
  try {
    console.log('Starting PDF generation...');
    const { resumeData, template = 'modern' } = req.body;
    
    if (!resumeData || !resumeData.personalInfo) {
      return res.status(400).json({
        success: false,
        error: 'Invalid resume data provided'
      });
    }

    console.log('Generating HTML template...');
    // Generate HTML from template
    const html = templateService.generateHTML(resumeData, template);
    console.log('HTML generated successfully');
    
    console.log('Launching Puppeteer...');
    // Launch puppeteer with more options
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
      timeout: 30000
    });
    
    const page = await browser.newPage();
    console.log('Setting page content...');
    
    // Set content with timeout
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    console.log('Generating PDF...');
    // Generate PDF with proper settings
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: false,
      displayHeaderFooter: false,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      },
      timeout: 30000
    });
    
    await browser.close();
    console.log('PDF generated successfully, size:', pdfBuffer.length);
    
    // Set proper response headers for PDF download
    const fileName = `${(resumeData.personalInfo.fullName || 'Resume').replace(/[^a-zA-Z0-9]/g, '_')}_Resume.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Send the PDF buffer
    res.end(pdfBuffer, 'binary');
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate PDF',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get available templates
const getTemplates = async (req, res) => {
  try {
    const templates = templateService.getAllTemplates();
    res.json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('Error getting templates:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Preview resume HTML
const previewResume = async (req, res) => {
  try {
    const { resumeData, template = 'modern' } = req.body;
    
    const html = templateService.generateHTML(resumeData, template);
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error generating preview:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ATS Keywords database for scoring
const ATS_KEYWORDS = {
  technical: [
    'javascript', 'python', 'java', 'react', 'node.js', 'sql', 'mongodb', 'aws', 'docker', 'kubernetes',
    'git', 'agile', 'scrum', 'api', 'rest', 'graphql', 'microservices', 'ci/cd', 'devops', 'machine learning',
    'artificial intelligence', 'data analysis', 'cloud computing', 'cybersecurity', 'blockchain'
  ],
  soft: [
    'leadership', 'communication', 'teamwork', 'problem solving', 'analytical', 'creative', 'adaptable',
    'detail-oriented', 'time management', 'project management', 'collaboration', 'innovation', 'strategic thinking'
  ],
  action: [
    'achieved', 'developed', 'implemented', 'managed', 'led', 'created', 'designed', 'optimized', 'improved',
    'increased', 'reduced', 'streamlined', 'collaborated', 'delivered', 'executed', 'analyzed', 'built'
  ]
};

// Calculate comprehensive ATS score
const calculateATSScore = (resumeData) => {
  let score = 0;
  const { personalInfo, summary, experience, education, skills, projects, certifications } = resumeData;

  // Personal Information (15 points)
  const requiredFields = ['fullName', 'email', 'phone', 'location'];
  const completedFields = requiredFields.filter(field => personalInfo[field]?.trim()).length;
  score += (completedFields / requiredFields.length) * 15;

  // Contact links bonus (5 points)
  if (personalInfo.linkedin) score += 2.5;
  if (personalInfo.github) score += 2.5;

  // Professional Summary (20 points)
  if (summary?.trim()) {
    const summaryWords = summary.trim().split(/\s+/).length;
    if (summaryWords >= 50 && summaryWords <= 150) {
      score += 20;
    } else if (summaryWords >= 30) {
      score += 15;
    } else if (summaryWords >= 15) {
      score += 10;
    }

    // Keyword density in summary
    const summaryLower = summary.toLowerCase();
    const keywordMatches = [...ATS_KEYWORDS.technical, ...ATS_KEYWORDS.soft, ...ATS_KEYWORDS.action]
      .filter(keyword => summaryLower.includes(keyword)).length;
    score += Math.min(keywordMatches * 0.5, 5);
  }

  // Work Experience (25 points)
  if (experience?.length >= 3) {
    score += 25;
  } else if (experience?.length === 2) {
    score += 20;
  } else if (experience?.length === 1) {
    score += 15;
  }

  // Experience quality bonus
  experience?.forEach(exp => {
    if (exp.description?.includes('•') || exp.description?.includes('-')) {
      score += 1; // Bullet points bonus
    }
    const actionWords = ATS_KEYWORDS.action.filter(word => 
      exp.description?.toLowerCase().includes(word)
    ).length;
    score += Math.min(actionWords * 0.5, 3);
  });

  // Education (10 points)
  if (education?.length >= 1) score += 10;

  // Skills (15 points)
  const totalSkills = (skills?.technical?.length || 0) + (skills?.soft?.length || 0);
  if (totalSkills >= 15) {
    score += 15;
  } else if (totalSkills >= 10) {
    score += 12;
  } else if (totalSkills >= 5) {
    score += 8;
  }

  // Projects (10 points)
  if (projects?.length >= 3) {
    score += 10;
  } else if (projects?.length >= 2) {
    score += 7;
  } else if (projects?.length === 1) {
    score += 4;
  }

  // Certifications bonus (5 points)
  if (certifications?.length >= 2) {
    score += 5;
  } else if (certifications?.length === 1) {
    score += 3;
  }

  return Math.min(100, Math.round(score));
};

// Save resume
const saveResume = async (req, res) => {
  try {
    const { resumeData, atsScore, title } = req.body;
    const userId = req.user?.id || 'anonymous';

    const resume = new Resume({
      userId,
      title: title || `Resume - ${new Date().toLocaleDateString()}`,
      resumeData,
      atsScore: atsScore || calculateATSScore(resumeData),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await resume.save();

    res.json({
      success: true,
      message: 'Resume saved successfully',
      resumeId: resume._id,
      atsScore: resume.atsScore
    });
  } catch (error) {
    console.error('Error saving resume:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save resume',
      error: error.message
    });
  }
};

// Get saved resumes
const getSavedResumes = async (req, res) => {
  try {
    const userId = req.user?.id || 'anonymous';
    const resumes = await Resume.find({ userId })
      .sort({ updatedAt: -1 })
      .select('title atsScore createdAt updatedAt');

    res.json({
      success: true,
      resumes
    });
  } catch (error) {
    console.error('Error fetching resumes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resumes',
      error: error.message
    });
  }
};

// Generate resume PDF with Jankoti branding
const generateResume = async (req, res) => {
  try {
    const { resumeData, format = 'pdf' } = req.body;
    const atsScore = calculateATSScore(resumeData);

    if (format !== 'pdf') {
      return res.status(400).json({
        success: false,
        message: 'Only PDF format is currently supported'
      });
    }

    // Create PDF
    const doc = new PDFDocument({ 
      size: 'A4', 
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${resumeData.personalInfo.fullName || 'Resume'}_ATS_Optimized.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add Jankoti watermark/branding
    doc.fontSize(8)
       .fillColor('#9CA3AF')
       .text('Generated by Jankoti AI Interview Platform', 50, 30, { align: 'right' });

    // Add ATS Score badge
    doc.fontSize(10)
       .fillColor('#7C3AED')
       .text(`ATS Score: ${atsScore}%`, 450, 45, { align: 'right' });

    // Header Section
    doc.fontSize(24)
       .fillColor('#1F2937')
       .text(resumeData.personalInfo.fullName || 'Your Name', 50, 80);

    // Contact Information
    let yPosition = 110;
    doc.fontSize(10).fillColor('#4B5563');
    
    if (resumeData.personalInfo.email) {
      doc.text(`Email: ${resumeData.personalInfo.email}`, 50, yPosition);
      yPosition += 15;
    }
    if (resumeData.personalInfo.phone) {
      doc.text(`Phone: ${resumeData.personalInfo.phone}`, 50, yPosition);
      yPosition += 15;
    }
    if (resumeData.personalInfo.location) {
      doc.text(`Location: ${resumeData.personalInfo.location}`, 50, yPosition);
      yPosition += 15;
    }
    if (resumeData.personalInfo.linkedin) {
      doc.text(`LinkedIn: ${resumeData.personalInfo.linkedin}`, 50, yPosition);
      yPosition += 15;
    }
    if (resumeData.personalInfo.github) {
      doc.text(`GitHub: ${resumeData.personalInfo.github}`, 50, yPosition);
      yPosition += 15;
    }

    yPosition += 20;

    // Professional Summary
    if (resumeData.summary) {
      doc.fontSize(14)
         .fillColor('#1F2937')
         .text('PROFESSIONAL SUMMARY', 50, yPosition);
      
      yPosition += 25;
      doc.fontSize(10)
         .fillColor('#374151')
         .text(resumeData.summary, 50, yPosition, { 
           width: 500, 
           align: 'justify',
           lineGap: 2
         });
      
      yPosition += doc.heightOfString(resumeData.summary, { width: 500 }) + 30;
    }

    // Work Experience
    if (resumeData.experience?.length > 0) {
      doc.fontSize(14)
         .fillColor('#1F2937')
         .text('WORK EXPERIENCE', 50, yPosition);
      
      yPosition += 25;

      resumeData.experience.forEach((exp, index) => {
        // Check if we need a new page
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }

        doc.fontSize(12)
           .fillColor('#1F2937')
           .text(exp.title || 'Job Title', 50, yPosition);
        
        doc.fontSize(11)
           .fillColor('#4B5563')
           .text(`${exp.company || 'Company'} | ${exp.duration || 'Duration'}`, 50, yPosition + 15);
        
        if (exp.location) {
          doc.text(exp.location, 400, yPosition + 15);
        }

        yPosition += 35;

        if (exp.description) {
          doc.fontSize(10)
             .fillColor('#374151')
             .text(exp.description, 50, yPosition, { 
               width: 500,
               lineGap: 2
             });
          
          yPosition += doc.heightOfString(exp.description, { width: 500 }) + 20;
        }
      });
    }

    // Skills Section
    if (resumeData.skills?.technical?.length > 0 || resumeData.skills?.soft?.length > 0) {
      if (yPosition > 650) {
        doc.addPage();
        yPosition = 50;
      }

      doc.fontSize(14)
         .fillColor('#1F2937')
         .text('SKILLS', 50, yPosition);
      
      yPosition += 25;

      if (resumeData.skills.technical?.length > 0) {
        doc.fontSize(11)
           .fillColor('#1F2937')
           .text('Technical Skills:', 50, yPosition);
        
        yPosition += 15;
        doc.fontSize(10)
           .fillColor('#374151')
           .text(resumeData.skills.technical.join(' • '), 50, yPosition, { width: 500 });
        
        yPosition += doc.heightOfString(resumeData.skills.technical.join(' • '), { width: 500 }) + 15;
      }

      if (resumeData.skills.soft?.length > 0) {
        doc.fontSize(11)
           .fillColor('#1F2937')
           .text('Soft Skills:', 50, yPosition);
        
        yPosition += 15;
        doc.fontSize(10)
           .fillColor('#374151')
           .text(resumeData.skills.soft.join(' • '), 50, yPosition, { width: 500 });
        
        yPosition += doc.heightOfString(resumeData.skills.soft.join(' • '), { width: 500 }) + 15;
      }
    }

    // Education
    if (resumeData.education?.length > 0) {
      if (yPosition > 650) {
        doc.addPage();
        yPosition = 50;
      }

      doc.fontSize(14)
         .fillColor('#1F2937')
         .text('EDUCATION', 50, yPosition);
      
      yPosition += 25;

      resumeData.education.forEach(edu => {
        doc.fontSize(11)
           .fillColor('#1F2937')
           .text(edu.degree || 'Degree', 50, yPosition);
        
        doc.fontSize(10)
           .fillColor('#4B5563')
           .text(`${edu.institution || 'Institution'} | ${edu.year || 'Year'}`, 50, yPosition + 15);
        
        yPosition += 35;
      });
    }

    // Projects
    if (resumeData.projects?.length > 0) {
      if (yPosition > 650) {
        doc.addPage();
        yPosition = 50;
      }

      doc.fontSize(14)
         .fillColor('#1F2937')
         .text('PROJECTS', 50, yPosition);
      
      yPosition += 25;

      resumeData.projects.forEach(project => {
        doc.fontSize(11)
           .fillColor('#1F2937')
           .text(project.title || 'Project Title', 50, yPosition);
        
        yPosition += 15;
        
        if (project.description) {
          doc.fontSize(10)
             .fillColor('#374151')
             .text(project.description, 50, yPosition, { width: 500 });
          
          yPosition += doc.heightOfString(project.description, { width: 500 }) + 15;
        }
      });
    }

    // Footer with Jankoti branding
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(8)
         .fillColor('#9CA3AF')
         .text('Powered by Jankoti AI Interview Platform - ATS Optimized Resume', 50, 780, { 
           align: 'center',
           width: 500
         });
    }

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error generating resume:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate resume',
      error: error.message
    });
  }
};

// Get ATS optimization suggestions
const getATSOptimizations = async (req, res) => {
  try {
    const { resumeData } = req.body;
    const currentScore = calculateATSScore(resumeData);
    
    const suggestions = [];

    // Personal info suggestions
    const requiredFields = ['fullName', 'email', 'phone', 'location'];
    const missingFields = requiredFields.filter(field => !resumeData.personalInfo?.[field]?.trim());
    if (missingFields.length > 0) {
      suggestions.push({
        category: 'Personal Information',
        priority: 'high',
        suggestion: `Add missing contact information: ${missingFields.join(', ')}`,
        impact: '+5 points'
      });
    }

    // Summary suggestions
    if (!resumeData.summary?.trim()) {
      suggestions.push({
        category: 'Professional Summary',
        priority: 'high',
        suggestion: 'Add a professional summary (50-150 words) highlighting your key achievements',
        impact: '+20 points'
      });
    } else {
      const wordCount = resumeData.summary.trim().split(/\s+/).length;
      if (wordCount < 30) {
        suggestions.push({
          category: 'Professional Summary',
          priority: 'medium',
          suggestion: 'Expand your summary to 50-150 words for better ATS optimization',
          impact: '+10 points'
        });
      }
    }

    // Experience suggestions
    if (!resumeData.experience?.length) {
      suggestions.push({
        category: 'Work Experience',
        priority: 'high',
        suggestion: 'Add at least 2-3 work experiences with detailed descriptions',
        impact: '+25 points'
      });
    } else if (resumeData.experience.length < 2) {
      suggestions.push({
        category: 'Work Experience',
        priority: 'medium',
        suggestion: 'Add more work experiences to strengthen your profile',
        impact: '+10 points'
      });
    }

    // Skills suggestions
    const totalSkills = (resumeData.skills?.technical?.length || 0) + (resumeData.skills?.soft?.length || 0);
    if (totalSkills < 10) {
      suggestions.push({
        category: 'Skills',
        priority: 'medium',
        suggestion: 'Add more relevant technical and soft skills (aim for 10-15 total)',
        impact: '+7 points'
      });
    }

    // Keywords suggestions
    const resumeText = JSON.stringify(resumeData).toLowerCase();
    const missingKeywords = ATS_KEYWORDS.technical.filter(keyword => 
      !resumeText.includes(keyword)
    ).slice(0, 5);
    
    if (missingKeywords.length > 0) {
      suggestions.push({
        category: 'Keywords',
        priority: 'medium',
        suggestion: `Consider adding relevant keywords: ${missingKeywords.join(', ')}`,
        impact: '+3 points'
      });
    }

    res.json({
      success: true,
      currentScore,
      maxPossibleScore: Math.min(100, currentScore + suggestions.reduce((sum, s) => sum + parseInt(s.impact), 0)),
      suggestions
    });

  } catch (error) {
    console.error('Error getting ATS optimizations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get optimization suggestions',
      error: error.message
    });
  }
};

module.exports = {
  saveResume,
  getSavedResumes,
  generateResume,
  generatePDF,
  getTemplates,
  previewResume,
  getATSOptimizations,
  calculateATSScore,
  generateSummary
};

// Fallback PDF generation using simple HTML
const generateSimplePDF = async (req, res) => {
  try {
    console.log('Using fallback PDF generation...');
    const { resumeData, template = 'modern' } = req.body;
    
    if (!resumeData || !resumeData.personalInfo) {
      return res.status(400).json({
        success: false,
        error: 'Invalid resume data provided'
      });
    }

    // Generate simple HTML
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${resumeData.personalInfo.fullName} - Resume</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 30px; padding: 20px; background: #f8f9fa; }
          .name { font-size: 28px; font-weight: bold; margin-bottom: 10px; color: #333; }
          .contact { margin-bottom: 5px; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 18px; font-weight: bold; color: #7c3aed; border-bottom: 2px solid #7c3aed; padding-bottom: 5px; margin-bottom: 15px; }
          .item { margin-bottom: 15px; }
          .item-title { font-weight: bold; font-size: 16px; }
          .item-subtitle { color: #7c3aed; font-weight: 600; }
          .item-date { color: #666; font-size: 14px; }
          .skills { display: flex; flex-wrap: wrap; gap: 8px; }
          .skill { background: #e0e7ff; color: #7c3aed; padding: 4px 12px; border-radius: 15px; font-size: 14px; }
          .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="name">${resumeData.personalInfo.fullName || 'Your Name'}</div>
          ${resumeData.personalInfo.email ? `<div class="contact">Email: ${resumeData.personalInfo.email}</div>` : ''}
          ${resumeData.personalInfo.phone ? `<div class="contact">Phone: ${resumeData.personalInfo.phone}</div>` : ''}
          ${resumeData.personalInfo.location ? `<div class="contact">Location: ${resumeData.personalInfo.location}</div>` : ''}
        </div>
        
        ${resumeData.summary ? `
          <div class="section">
            <div class="section-title">PROFESSIONAL SUMMARY</div>
            <p>${resumeData.summary}</p>
          </div>
        ` : ''}
        
        ${resumeData.experience?.length ? `
          <div class="section">
            <div class="section-title">PROFESSIONAL EXPERIENCE</div>
            ${resumeData.experience.map(exp => `
              <div class="item">
                <div class="item-title">${exp.jobTitle || 'Job Title'}</div>
                <div class="item-subtitle">${exp.company || 'Company'}</div>
                <div class="item-date">${exp.startDate || ''} - ${exp.isCurrentJob ? 'Present' : exp.endDate || ''}</div>
                ${exp.description ? `<p>${exp.description}</p>` : ''}
                ${exp.achievements?.filter(a => a.trim()).length ? `
                  <ul>
                    ${exp.achievements.filter(a => a.trim()).map(achievement => `<li>${achievement}</li>`).join('')}
                  </ul>
                ` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        <div class="footer">
          Generated by Jankoti AI Interview Platform - ATS Optimized Resume
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
    
  } catch (error) {
    console.error('Error in fallback PDF generation:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate resume',
      details: error.message
    });
  }
};