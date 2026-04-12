const axios = require('axios');

const testResumeData = {
  personalInfo: {
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    location: 'New York, NY',
    linkedin: 'https://linkedin.com/in/johndoe',
    github: 'https://github.com/johndoe'
  },
  summary: 'Experienced software engineer with 5+ years of experience in full-stack development. Skilled in React, Node.js, and cloud technologies.',
  experience: [
    {
      jobTitle: 'Senior Software Engineer',
      company: 'Tech Corp',
      startDate: '2020-01',
      endDate: '2024-01',
      isCurrentJob: false,
      location: 'New York, NY',
      description: 'Led development of web applications using React and Node.js',
      achievements: [
        'Improved application performance by 40%',
        'Led a team of 5 developers',
        'Implemented CI/CD pipelines'
      ]
    }
  ],
  education: [
    {
      degree: 'Bachelor of Science in Computer Science',
      institution: 'University of Technology',
      startDate: '2016-09',
      endDate: '2020-05',
      gpa: '3.8'
    }
  ],
  skills: {
    technical: [
      { name: 'JavaScript', level: 'Expert' },
      { name: 'React', level: 'Advanced' },
      { name: 'Node.js', level: 'Advanced' }
    ],
    soft: ['Leadership', 'Communication', 'Problem Solving']
  },
  projects: [
    {
      name: 'E-commerce Platform',
      description: 'Built a full-stack e-commerce platform with React and Node.js',
      technologies: ['React', 'Node.js', 'MongoDB'],
      startDate: '2023-01',
      endDate: '2023-06'
    }
  ],
  certifications: [
    {
      name: 'AWS Certified Solutions Architect',
      issuer: 'Amazon Web Services',
      issueDate: '2023-03',
      neverExpires: false,
      expiryDate: '2026-03'
    }
  ]
};

async function testPDFGeneration() {
  console.log('Testing PDF generation...');
  
  try {
    // Test main PDF generation
    console.log('Testing main PDF generation endpoint...');
    const response = await axios.post('http://localhost:8080/api/resume/generate-pdf', {
      resumeData: testResumeData,
      template: 'modern'
    }, {
      responseType: 'blob',
      timeout: 30000
    });
    
    console.log('✅ Main PDF generation successful!');
    console.log('Response size:', response.data.size, 'bytes');
    
  } catch (error) {
    console.log('❌ Main PDF generation failed:', error.message);
    
    // Test fallback PDF generation
    try {
      console.log('Testing fallback PDF generation...');
      const fallbackResponse = await axios.post('http://localhost:8080/api/resume/generate-pdf-fallback', {
        resumeData: testResumeData,
        template: 'modern'
      });
      
      console.log('✅ Fallback PDF generation successful!');
      console.log('Response type:', typeof fallbackResponse.data);
      console.log('Response length:', fallbackResponse.data.length, 'characters');
      
    } catch (fallbackError) {
      console.log('❌ Fallback PDF generation also failed:', fallbackError.message);
    }
  }
  
  // Test templates endpoint
  try {
    console.log('Testing templates endpoint...');
    const templatesResponse = await axios.get('http://localhost:8080/api/resume/templates');
    console.log('✅ Templates endpoint successful!');
    console.log('Available templates:', templatesResponse.data.templates?.length || 0);
  } catch (error) {
    console.log('❌ Templates endpoint failed:', error.message);
  }
  
  // Test preview endpoint
  try {
    console.log('Testing preview endpoint...');
    const previewResponse = await axios.post('http://localhost:8080/api/resume/preview', {
      resumeData: testResumeData,
      template: 'modern'
    });
    console.log('✅ Preview endpoint successful!');
    console.log('Preview HTML length:', previewResponse.data.length, 'characters');
  } catch (error) {
    console.log('❌ Preview endpoint failed:', error.message);
  }
}

testPDFGeneration().then(() => {
  console.log('Test completed!');
}).catch(error => {
  console.error('Test failed:', error);
});