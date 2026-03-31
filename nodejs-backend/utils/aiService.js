const axios = require('axios');

class AIService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this.baseURL = 'https://api.groq.com/openai/v1/chat/completions';
    this.model = 'llama-3.1-8b-instant';
  }

  async generateQuestions(keywords, numQuestions = 10, difficulty = 'medium') {
    const context = this.buildContext(keywords);
    const prompt = this.buildQuestionPrompt(context, numQuestions, difficulty);
    
    try {
      const response = await axios.post(this.baseURL, {
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: Math.min(numQuestions * 50, 2048)
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      });

      const content = response.data.choices[0].message.content;
      return this.parseQuestions(content, numQuestions);
    } catch (error) {
      throw new Error(`AI question generation failed: ${error.message}`);
    }
  }

  async analyzeAnswers(questions, answers) {
    const prompt = this.buildAnalysisPrompt(questions, answers);
    
    try {
      const response = await axios.post(this.baseURL, {
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1500
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      });

      const content = response.data.choices[0].message.content;
      return this.parseAnalysis(content);
    } catch (error) {
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }

  buildContext(keywords) {
    const sections = [];
    
    if (keywords.skills && keywords.skills.length > 0) {
      sections.push(`SKILLS:\n${keywords.skills.join(', ')}`);
    }
    
    if (keywords.projects && keywords.projects.length > 0) {
      const projectTexts = keywords.projects.map(p => `- ${p.title}: ${p.description}`);
      sections.push(`PROJECTS:\n${projectTexts.join('\n')}`);
    }
    
    if (keywords.experience && keywords.experience.length > 0) {
      const expTexts = keywords.experience.map(e => `- ${e.title} at ${e.company} (${e.dates})`);
      sections.push(`EXPERIENCE:\n${expTexts.join('\n')}`);
    }
    
    if (keywords.education && keywords.education.length > 0) {
      const eduTexts = keywords.education.map(e => `- ${e.degree} (${e.year})`);
      sections.push(`EDUCATION:\n${eduTexts.join('\n')}`);
    }
    
    return sections.join('\n\n');
  }

  buildQuestionPrompt(context, numQuestions, difficulty) {
    const difficultyInstructions = {
      easy: 'Focus on fundamental concepts, basic understanding, and simple explanations.',
      medium: 'Focus on practical application, problem-solving, and implementation details.',
      hard: 'Focus on advanced concepts, system design, scalability, and architectural decisions.'
    };

    return `You are an expert technical interviewer. Based on the candidate's resume data below, generate ${numQuestions} ${difficulty}-level interview questions.

Resume data:
${context}

${difficultyInstructions[difficulty]}

Return ONLY a JSON array of strings, each string being a question. Do not include any other text.
Example: ["Question 1", "Question 2", ...]`;
  }

  buildAnalysisPrompt(questions, answers) {
    const qaText = questions.map((q, i) => {
      const answer = answers[i] || { answerText: 'No answer provided' };
      return `Q${i + 1}: ${q.questionText}\nA${i + 1}: ${answer.answerText}`;
    }).join('\n\n');

    return `Analyze the following interview Q&A session and provide a comprehensive evaluation:

${qaText}

Provide analysis in this JSON format:
{
  "overallScore": 75,
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"],
  "detailedAnalysis": "detailed analysis text",
  "recommendations": ["recommendation1", "recommendation2"]
}`;
  }

  parseQuestions(content, numQuestions) {
    try {
      // Try parsing as JSON array
      if (content.trim().startsWith('[')) {
        const questions = JSON.parse(content);
        return questions.slice(0, numQuestions).map(q => ({ question: q }));
      }
    } catch (e) {
      // Fallback to text parsing
    }

    // Extract questions from text
    const lines = content.split('\n').filter(line => line.trim());
    const questions = [];
    
    for (const line of lines) {
      const cleanLine = line.replace(/^\d+\.?\s*/, '').replace(/^["\-\*]\s*/, '').replace(/["]*$/, '').trim();
      if (cleanLine.length > 10) {
        questions.push(cleanLine);
        if (questions.length >= numQuestions) break;
      }
    }
    
    return questions.map(q => ({ question: q }));
  }

  parseAnalysis(content) {
    try {
      // Try parsing as JSON
      if (content.trim().startsWith('{')) {
        return JSON.parse(content);
      }
    } catch (e) {
      // Fallback parsing
    }

    // Extract analysis from text format
    return {
      overallScore: 70,
      strengths: ['Good technical knowledge', 'Clear communication'],
      improvements: ['More detailed explanations needed', 'Consider edge cases'],
      detailedAnalysis: content,
      recommendations: ['Practice system design', 'Review core concepts']
    };
  }
}

module.exports = AIService;