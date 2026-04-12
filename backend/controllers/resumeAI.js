// Add this to resumeController.js

const generateAISummary = async (req, res) => {
  try {
    const { personalInfo, experience, education, skills, projects } = req.body;

    // Create a comprehensive profile for AI analysis
    const profile = {
      name: personalInfo?.fullName || 'Professional',
      experience: experience || [],
      education: education || [],
      technicalSkills: skills?.technical || [],
      softSkills: skills?.soft || [],
      projects: projects || []
    };

    // Generate AI summary using Groq or similar service
    const summaryPrompt = `
Create a professional ATS-optimized resume summary for ${profile.name} based on the following information:

Experience: ${profile.experience.map(exp => `${exp.title} at ${exp.company} - ${exp.description}`).join('; ')}
Education: ${profile.education.map(edu => `${edu.degree} from ${edu.institution}`).join('; ')}
Technical Skills: ${profile.technicalSkills.join(', ')}
Soft Skills: ${profile.softSkills.join(', ')}
Projects: ${profile.projects.map(proj => proj.title).join(', ')}

Requirements:
- 50-150 words
- Include quantifiable achievements where possible
- Use ATS-friendly keywords
- Focus on most relevant experience
- Professional tone
- Action verbs (achieved, developed, managed, etc.)

Generate 3 different summary variations and provide ATS optimization tips.
`;

    // For now, generate a template-based summary
    // In production, you would call an AI service like Groq
    const summaryVariations = generateTemplateSummary(profile);
    
    const suggestions = [
      "Results-driven professional with proven track record in delivering high-impact solutions and driving organizational growth through innovative approaches.",
      "Experienced specialist with strong analytical skills and expertise in cross-functional collaboration to achieve strategic objectives.",
      "Dynamic professional with comprehensive background in technology and business, committed to excellence and continuous improvement."
    ];

    res.json({
      success: true,
      summary: summaryVariations[0],
      suggestions: summaryVariations,
      tips: [
        "Include specific metrics and achievements",
        "Use industry-relevant keywords",
        "Keep between 50-150 words",
        "Focus on your most recent experience",
        "Highlight unique value proposition"
      ]
    });

  } catch (error) {
    console.error('Error generating AI summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI summary',
      error: error.message
    });
  }
};

const generateTemplateSummary = (profile) => {
  const { experience, education, technicalSkills, softSkills } = profile;
  
  const yearsExp = experience.length > 0 ? `${experience.length}+` : 'Multiple';
  const primarySkills = technicalSkills.slice(0, 3).join(', ');
  const topEducation = education[0]?.degree || 'relevant education';
  const keyStrengths = softSkills.slice(0, 2).join(' and ') || 'leadership and communication';

  const templates = [
    `${yearsExp} years experienced professional with expertise in ${primarySkills}. Proven track record of delivering innovative solutions and driving business growth. Strong background in ${topEducation} with exceptional ${keyStrengths} skills. Committed to excellence and continuous learning in dynamic environments.`,
    
    `Results-oriented professional with ${yearsExp} years of experience specializing in ${primarySkills}. Demonstrated ability to lead cross-functional teams and implement strategic initiatives. Educational foundation in ${topEducation} complemented by strong ${keyStrengths} capabilities.`,
    
    `Dynamic professional combining technical expertise in ${primarySkills} with ${yearsExp} years of hands-on experience. Strong analytical and problem-solving abilities with proven success in project management and team collaboration. ${topEducation} graduate with focus on innovation and quality delivery.`
  ];

  return templates;
};

module.exports = {
  // ... existing exports
  generateAISummary
};