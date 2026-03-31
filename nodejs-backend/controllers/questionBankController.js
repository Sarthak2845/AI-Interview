const QuestionBank = require('../models/QuestionBank');
const Question = require('../models/Question');

// Add questions to bank after AI generation
const addQuestionsToBank = async (questions, sessionDifficulty) => {
  try {
    for (const question of questions) {
      // Extract tags from question text using enhanced matching
      const tags = extractTagsFromQuestion(question.question);
      const category = determineCategoryFromTags(tags);

      // Check if question already exists
      const existingQuestion = await QuestionBank.findOne({
        questionText: question.question
      });

      if (!existingQuestion) {
        const newQuestion = await QuestionBank.create({
          questionText: question.question,
          tags,
          difficulty: sessionDifficulty,
          category,
          usageCount: 1
        });
        console.log(`Added new question to bank with tags: ${tags.join(', ')}`);
      } else {
        // Update usage count and last used
        existingQuestion.usageCount += 1;
        existingQuestion.lastUsed = new Date();
        await existingQuestion.save();
        console.log(`Updated existing question usage count: ${existingQuestion.usageCount}`);
      }
    }
  } catch (error) {
    console.error('Error adding questions to bank:', error);
  }
};

// Extract tags from question text
const extractTagsFromQuestion = (questionText) => {
  const text = questionText.toLowerCase();
  const tags = [];

  // Technology tags with more comprehensive keywords
  const techKeywords = {
    'react': ['react', 'jsx', 'component', 'hook', 'usestate', 'useeffect', 'props', 'state', 'virtual dom'],
    'javascript': ['javascript', 'js', 'function', 'variable', 'array', 'object', 'promise', 'async', 'callback'],
    'node.js': ['node', 'nodejs', 'express', 'npm', 'backend', 'server', 'middleware'],
    'python': ['python', 'django', 'flask', 'pandas', 'numpy', 'pip', 'virtualenv'],
    'java': ['java', 'spring', 'maven', 'jvm', 'hibernate', 'servlet'],
    'database': ['sql', 'mysql', 'mongodb', 'database', 'query', 'nosql', 'postgresql', 'redis'],
    'css': ['css', 'styling', 'flexbox', 'grid', 'responsive', 'bootstrap', 'sass', 'less'],
    'html': ['html', 'dom', 'element', 'tag', 'semantic', 'accessibility'],
    'api': ['api', 'rest', 'endpoint', 'http', 'request', 'response', 'json', 'graphql'],
    'testing': ['test', 'testing', 'unit test', 'integration', 'jest', 'mocha', 'cypress'],
    'git': ['git', 'version control', 'commit', 'branch', 'merge', 'github', 'gitlab'],
    'algorithms': ['algorithm', 'sorting', 'searching', 'complexity', 'big o', 'recursion'],
    'data-structures': ['array', 'linked list', 'tree', 'graph', 'stack', 'queue', 'hash table'],
    'aws': ['aws', 'amazon', 'ec2', 's3', 'lambda', 'cloud', 'devops'],
    'docker': ['docker', 'container', 'kubernetes', 'deployment'],
    'security': ['security', 'authentication', 'authorization', 'encryption', 'jwt', 'oauth']
  };

  // Skill tags
  const skillKeywords = {
    'problem-solving': ['solve', 'problem', 'approach', 'solution', 'debug', 'troubleshoot'],
    'design': ['design', 'architecture', 'pattern', 'structure', 'scalable', 'maintainable'],
    'optimization': ['optimize', 'performance', 'efficient', 'speed', 'memory', 'cache'],
    'communication': ['explain', 'describe', 'communicate', 'present', 'documentation'],
    'leadership': ['lead', 'manage', 'team', 'mentor', 'coordinate']
  };

  // Check for technology tags
  Object.entries(techKeywords).forEach(([tag, keywords]) => {
    if (keywords.some(keyword => text.includes(keyword))) {
      tags.push(tag);
    }
  });

  // Check for skill tags
  Object.entries(skillKeywords).forEach(([tag, keywords]) => {
    if (keywords.some(keyword => text.includes(keyword))) {
      tags.push(tag);
    }
  });

  return tags.length > 0 ? tags : ['general'];
};

// Determine category from tags
const determineCategoryFromTags = (tags) => {
  const techTags = ['react', 'javascript', 'node.js', 'python', 'java', 'database', 'css', 'html', 'api'];
  const algorithmTags = ['algorithms', 'data-structures'];
  const softSkillTags = ['problem-solving', 'communication', 'design'];

  if (tags.some(tag => techTags.includes(tag))) return 'technical';
  if (tags.some(tag => algorithmTags.includes(tag))) return 'algorithms';
  if (tags.some(tag => softSkillTags.includes(tag))) return 'soft-skills';
  
  return 'general';
};

// Get questions from bank based on tags and difficulty
const getQuestionsFromBank = async (req, res) => {
  try {
    const { tags, difficulty, category, limit = 10 } = req.query;
    
    let filter = {};
    if (tags) filter.tags = { $in: tags.split(',') };
    if (difficulty) filter.difficulty = difficulty;
    if (category) filter.category = category;

    const questions = await QuestionBank.find(filter)
      .sort({ usageCount: -1, averageScore: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      questions,
      count: questions.length
    });
  } catch (error) {
    console.error('Error fetching questions from bank:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch questions from bank',
      error: error.message
    });
  }
};

// Get available tags
const getAvailableTags = async (req, res) => {
  try {
    const tags = await QuestionBank.distinct('tags');
    const categories = await QuestionBank.distinct('category');

    const tagStats = await QuestionBank.aggregate([
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 },
          averageScore: { $avg: '$averageScore' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      tags,
      categories,
      tagStats
    });
  } catch (error) {
    console.error('Error fetching available tags:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available tags',
      error: error.message
    });
  }
};

// Suggest questions from bank for a session
const suggestQuestionsForSession = async (resumeSkills, difficulty, count = 5) => {
  try {
    console.log(`Looking for questions matching skills: ${resumeSkills.join(', ')} with difficulty: ${difficulty}`);
    
    // Try to get questions matching resume skills and difficulty
    let questions = await QuestionBank.find({
      tags: { $in: resumeSkills },
      difficulty: difficulty
    })
    .sort({ usageCount: -1, averageScore: -1 })
    .limit(count);

    console.log(`Found ${questions.length} questions matching skills and difficulty`);

    // If not enough questions, get from same skills but different difficulty
    if (questions.length < count && resumeSkills.length > 0) {
      const additionalQuestions = await QuestionBank.find({
        tags: { $in: resumeSkills },
        difficulty: { $ne: difficulty },
        _id: { $nin: questions.map(q => q._id) }
      })
      .sort({ usageCount: -1 })
      .limit(count - questions.length);

      questions = [...questions, ...additionalQuestions];
      console.log(`Added ${additionalQuestions.length} questions from different difficulty levels`);
    }

    // If still not enough, get general questions of same difficulty
    if (questions.length < count) {
      const generalQuestions = await QuestionBank.find({
        difficulty: difficulty,
        _id: { $nin: questions.map(q => q._id) }
      })
      .sort({ usageCount: -1 })
      .limit(count - questions.length);

      questions = [...questions, ...generalQuestions];
      console.log(`Added ${generalQuestions.length} general questions`);
    }

    // Update usage count for selected questions
    for (const question of questions) {
      question.usageCount += 1;
      question.lastUsed = new Date();
      await question.save();
    }

    console.log(`Returning ${questions.length} questions from bank`);
    return questions;
  } catch (error) {
    console.error('Error suggesting questions:', error);
    return [];
  }
};

// Update question performance
const updateQuestionPerformance = async (questionId, score) => {
  try {
    const question = await QuestionBank.findById(questionId);
    if (question) {
      // Update average score using weighted average
      const totalResponses = question.usageCount;
      const currentAverage = question.averageScore || 0;
      const newAverage = ((currentAverage * (totalResponses - 1)) + score) / totalResponses;
      
      question.averageScore = Math.round(newAverage * 100) / 100;
      await question.save();
    }
  } catch (error) {
    console.error('Error updating question performance:', error);
  }
};

module.exports = {
  addQuestionsToBank,
  getQuestionsFromBank,
  getAvailableTags,
  suggestQuestionsForSession,
  updateQuestionPerformance,
  extractTagsFromQuestion,
  determineCategoryFromTags
};