const mongoose = require('mongoose');
const Leaderboard = require('./models/Leaderboard');
const QuestionBank = require('./models/QuestionBank');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/jankoti-interview', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const dummyUsers = [
  { name: 'Alex Johnson', email: 'alex@example.com', score: 95, difficulty: 'hard', tags: ['react', 'javascript', 'node.js'] },
  { name: 'Sarah Chen', email: 'sarah@example.com', score: 92, difficulty: 'hard', tags: ['python', 'algorithms', 'database'] },
  { name: 'Mike Rodriguez', email: 'mike@example.com', score: 89, difficulty: 'medium', tags: ['java', 'spring', 'api'] },
  { name: 'Emily Davis', email: 'emily@example.com', score: 87, difficulty: 'hard', tags: ['react', 'css', 'design'] },
  { name: 'David Kim', email: 'david@example.com', score: 85, difficulty: 'medium', tags: ['javascript', 'testing', 'git'] },
  { name: 'Lisa Wang', email: 'lisa@example.com', score: 83, difficulty: 'medium', tags: ['python', 'data-structures', 'algorithms'] },
  { name: 'John Smith', email: 'john@example.com', score: 81, difficulty: 'easy', tags: ['html', 'css', 'javascript'] },
  { name: 'Anna Brown', email: 'anna@example.com', score: 79, difficulty: 'medium', tags: ['node.js', 'database', 'api'] },
  { name: 'Chris Wilson', email: 'chris@example.com', score: 77, difficulty: 'easy', tags: ['react', 'problem-solving'] },
  { name: 'Jessica Lee', email: 'jessica@example.com', score: 75, difficulty: 'easy', tags: ['javascript', 'html', 'css'] },
  { name: 'Ryan Taylor', email: 'ryan@example.com', score: 73, difficulty: 'medium', tags: ['java', 'algorithms', 'debugging'] },
  { name: 'Maria Garcia', email: 'maria@example.com', score: 71, difficulty: 'easy', tags: ['python', 'general'] },
  { name: 'Kevin Zhang', email: 'kevin@example.com', score: 69, difficulty: 'medium', tags: ['react', 'optimization', 'testing'] },
  { name: 'Sophie Miller', email: 'sophie@example.com', score: 67, difficulty: 'easy', tags: ['css', 'design', 'html'] },
  { name: 'Tom Anderson', email: 'tom@example.com', score: 65, difficulty: 'easy', tags: ['javascript', 'communication'] }
];

const dummyQuestions = [
  // JavaScript Questions
  { text: 'What is the difference between let, const, and var in JavaScript?', tags: ['javascript'], difficulty: 'easy', category: 'technical' },
  { text: 'Explain the concept of closures in JavaScript with an example.', tags: ['javascript'], difficulty: 'medium', category: 'technical' },
  { text: 'How does event delegation work in JavaScript?', tags: ['javascript'], difficulty: 'medium', category: 'technical' },
  { text: 'What are JavaScript promises and how do they work?', tags: ['javascript'], difficulty: 'medium', category: 'technical' },
  
  // React Questions
  { text: 'How do React hooks work and what problems do they solve?', tags: ['react', 'javascript'], difficulty: 'medium', category: 'technical' },
  { text: 'What is the difference between state and props in React?', tags: ['react'], difficulty: 'easy', category: 'technical' },
  { text: 'Explain the React component lifecycle methods.', tags: ['react'], difficulty: 'medium', category: 'technical' },
  { text: 'How would you optimize a React application for performance?', tags: ['react', 'optimization'], difficulty: 'hard', category: 'technical' },
  
  // Node.js Questions
  { text: 'Explain the concept of middleware in Express.js.', tags: ['node.js', 'api'], difficulty: 'medium', category: 'technical' },
  { text: 'How do you handle error handling in a Node.js application?', tags: ['node.js', 'debugging'], difficulty: 'medium', category: 'technical' },
  { text: 'What is the event loop in Node.js and how does it work?', tags: ['node.js'], difficulty: 'hard', category: 'technical' },
  
  // Python Questions
  { text: 'What are Python decorators and how do you use them?', tags: ['python'], difficulty: 'medium', category: 'technical' },
  { text: 'Explain the difference between lists and tuples in Python.', tags: ['python'], difficulty: 'easy', category: 'technical' },
  { text: 'How does memory management work in Python?', tags: ['python'], difficulty: 'hard', category: 'technical' },
  
  // Database Questions
  { text: 'Explain the difference between SQL and NoSQL databases.', tags: ['database'], difficulty: 'easy', category: 'technical' },
  { text: 'What are database indexes and how do they improve performance?', tags: ['database', 'optimization'], difficulty: 'medium', category: 'technical' },
  { text: 'How would you design a database schema for an e-commerce application?', tags: ['database', 'design'], difficulty: 'hard', category: 'technical' },
  
  // Algorithm Questions
  { text: 'Implement a function to reverse a linked list.', tags: ['algorithms', 'data-structures'], difficulty: 'hard', category: 'algorithms' },
  { text: 'What is the time complexity of different sorting algorithms?', tags: ['algorithms', 'optimization'], difficulty: 'medium', category: 'algorithms' },
  { text: 'How would you find the shortest path between two nodes in a graph?', tags: ['algorithms', 'data-structures'], difficulty: 'hard', category: 'algorithms' },
  
  // API Questions
  { text: 'How would you optimize a slow-performing API endpoint?', tags: ['api', 'optimization', 'debugging'], difficulty: 'hard', category: 'technical' },
  { text: 'What are the key considerations when implementing authentication in a web app?', tags: ['api', 'security'], difficulty: 'medium', category: 'technical' },
  { text: 'Explain the difference between REST and GraphQL APIs.', tags: ['api'], difficulty: 'medium', category: 'technical' },
  
  // CSS Questions
  { text: 'What are the principles of responsive web design?', tags: ['css', 'design'], difficulty: 'easy', category: 'technical' },
  { text: 'How does CSS Grid differ from Flexbox?', tags: ['css'], difficulty: 'medium', category: 'technical' },
  { text: 'How would you implement a CSS-only dropdown menu?', tags: ['css'], difficulty: 'medium', category: 'technical' },
  
  // Testing Questions
  { text: 'What is the difference between unit testing and integration testing?', tags: ['testing'], difficulty: 'easy', category: 'technical' },
  { text: 'How would you test an API endpoint?', tags: ['testing', 'api'], difficulty: 'medium', category: 'technical' },
  { text: 'What are the best practices for writing maintainable tests?', tags: ['testing'], difficulty: 'medium', category: 'technical' },
  
  // Soft Skills Questions
  { text: 'Explain the Git workflow you would use in a team environment.', tags: ['git'], difficulty: 'easy', category: 'soft-skills' },
  { text: 'How would you approach debugging a complex issue in production?', tags: ['debugging', 'problem-solving'], difficulty: 'hard', category: 'soft-skills' },
  { text: 'Describe how you would design a scalable web application architecture.', tags: ['design', 'api', 'database'], difficulty: 'hard', category: 'technical' },
  { text: 'How do you stay updated with new technologies and best practices?', tags: ['communication'], difficulty: 'easy', category: 'soft-skills' },
  
  // AWS Questions
  { text: 'What are the main services offered by AWS and their use cases?', tags: ['aws'], difficulty: 'easy', category: 'technical' },
  { text: 'How would you deploy a web application on AWS?', tags: ['aws', 'deployment'], difficulty: 'medium', category: 'technical' },
  { text: 'Explain the difference between EC2 and Lambda in AWS.', tags: ['aws'], difficulty: 'medium', category: 'technical' },
  
  // Docker Questions
  { text: 'What are the benefits of using Docker containers?', tags: ['docker'], difficulty: 'easy', category: 'technical' },
  { text: 'How would you optimize a Docker image for production?', tags: ['docker', 'optimization'], difficulty: 'medium', category: 'technical' },
  { text: 'Explain the difference between Docker and Kubernetes.', tags: ['docker'], difficulty: 'medium', category: 'technical' }
];

async function populateDummyData() {
  try {
    // Clear existing data
    await Leaderboard.deleteMany({});
    await QuestionBank.deleteMany({});
    
    console.log('Cleared existing data');

    // Add dummy questions to question bank
    for (const q of dummyQuestions) {
      await QuestionBank.create({
        questionText: q.text,
        tags: q.tags,
        difficulty: q.difficulty,
        category: q.category,
        usageCount: Math.floor(Math.random() * 20) + 1,
        averageScore: Math.floor(Math.random() * 40) + 60
      });
    }
    
    console.log(`Added ${dummyQuestions.length} questions to question bank`);

    // Add dummy leaderboard entries
    for (let i = 0; i < dummyUsers.length; i++) {
      const user = dummyUsers[i];
      const sessionId = new mongoose.Types.ObjectId();
      
      await Leaderboard.create({
        userId: `user_${i + 1}`,
        userName: user.name,
        userEmail: user.email,
        sessionId: sessionId,
        totalScore: user.score,
        difficulty: user.difficulty,
        questionsAnswered: 10,
        totalQuestions: 10,
        completionPercentage: 100,
        tags: user.tags,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
      });
    }
    
    console.log(`Added ${dummyUsers.length} users to leaderboard`);
    console.log('Dummy data population completed!');
    
  } catch (error) {
    console.error('Error populating dummy data:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
populateDummyData();