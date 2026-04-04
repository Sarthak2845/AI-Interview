const mongoose = require('mongoose');
const QuestionBank = require('./models/QuestionBank');
const { suggestQuestionsForSession, extractTagsFromQuestion } = require('./controllers/questionBankController');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/jankoti-interview', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testSystem() {
  try {
    console.log('🧪 Testing Question Bank System...\n');

    // Test 1: Check if questions exist in bank
    const totalQuestions = await QuestionBank.countDocuments();
    console.log(`📊 Total questions in bank: ${totalQuestions}`);

    // Test 2: Test tag extraction
    const testQuestion = "How do React hooks work and what problems do they solve?";
    const extractedTags = extractTagsFromQuestion(testQuestion);
    console.log(`🏷️  Tags extracted from "${testQuestion}":`, extractedTags);

    // Test 3: Test question suggestion for different skill sets
    const testSkillSets = [
      ['react', 'javascript'],
      ['python', 'database'],
      ['node.js', 'api'],
      ['algorithms', 'data-structures'],
      ['css', 'html']
    ];

    for (const skills of testSkillSets) {
      console.log(`\n🔍 Testing skills: ${skills.join(', ')}`);
      
      const suggestions = await suggestQuestionsForSession(skills, 'medium', 3);
      console.log(`   Found ${suggestions.length} matching questions:`);
      
      suggestions.forEach((q, index) => {
        console.log(`   ${index + 1}. ${q.questionText.substring(0, 60)}...`);
        console.log(`      Tags: ${q.tags.join(', ')}`);
        console.log(`      Usage: ${q.usageCount} times`);
      });
    }

    // Test 4: Check question distribution by tags
    console.log('\n📈 Question distribution by tags:');
    const tagStats = await QuestionBank.aggregate([
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 },
          avgUsage: { $avg: '$usageCount' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    tagStats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} questions (avg usage: ${Math.round(stat.avgUsage)})`);
    });

    // Test 5: Check leaderboard
    const Leaderboard = require('./models/Leaderboard');
    const leaderboardCount = await Leaderboard.countDocuments();
    console.log(`\n🏆 Total leaderboard entries: ${leaderboardCount}`);

    if (leaderboardCount > 0) {
      const topUsers = await Leaderboard.find()
        .sort({ totalScore: -1 })
        .limit(5)
        .select('userName totalScore difficulty tags');

      console.log('   Top 5 users:');
      topUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.userName}: ${user.totalScore}% (${user.difficulty}) - ${user.tags.slice(0, 3).join(', ')}`);
      });
    }

    console.log('\n✅ System test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
testSystem();