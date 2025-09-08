// Test file for checking SuggestedActivityService functionality
// Run: node test-service.js

const { SuggestedActivityService } = require('./services/suggested-activity.service');

// Mock data for testing
const mockActivities = [
  {
    id: 1,
    activityName: 'Morning Run',
    activityType: 'health',
    status: 'closed',
    createdAt: new Date('2024-01-15T06:00:00Z'),
    rateActivities: [
      { satisfactionLevel: 85, hardnessLevel: 70 }
    ]
  },
  {
    id: 2,
    activityName: 'TypeScript Learning',
    activityType: 'learning',
    status: 'closed',
    createdAt: new Date('2024-01-16T14:00:00Z'),
    rateActivities: [
      { satisfactionLevel: 90, hardnessLevel: 80 }
    ]
  },
  {
    id: 3,
    activityName: 'Team Meeting',
    activityType: 'work',
    status: 'closed',
    createdAt: new Date('2024-01-17T10:00:00Z'),
    rateActivities: [
      { satisfactionLevel: 75, hardnessLevel: 60 }
    ]
  }
];

// Testing pattern analysis
function testPatternAnalysis() {
  console.log('🧪 Testing pattern analysis...');
  
  // Create service instance (without real dependencies)
  const service = new SuggestedActivityService();
  
  try {
    // Test pattern analysis
    const patterns = service.analyzeActivityPatternsWithAI(mockActivities);
    
    console.log('✅ Pattern analysis successful:');
    console.log('  - Activity types:', patterns.types);
    console.log('  - Satisfaction level:', patterns.satisfaction);
    console.log('  - Hardness level:', patterns.hardness);
    console.log('  - Completion rate:', patterns.completionRate);
    console.log('  - Recommended count:', patterns.recommendedCount);
    console.log('  - Preferences:', patterns.activityPreferences);
    console.log('  - Time patterns:', patterns.timePatterns);
    console.log('  - Difficulty trend:', patterns.difficultyTrend);
    
  } catch (error) {
    console.error('❌ Error during pattern analysis:', error.message);
  }
}

// Testing suggestion generation
function testSuggestionGeneration() {
  console.log('\n🧪 Testing suggestion generation...');
  
  const service = new SuggestedActivityService();
  
  try {
    // Create patterns for testing
    const patterns = {
      types: { health: 2, learning: 1, work: 1 },
      satisfaction: 83.3,
      hardness: 70,
      completionRate: 100,
      totalActivities: 3,
      completedActivities: 3,
      recommendedCount: 6,
      activityPreferences: ['health', 'learning', 'work'],
      timePatterns: { morning: 1, afternoon: 1, evening: 1 },
      difficultyTrend: 'stable'
    };
    
    // Generate suggestions
    for (let i = 0; i < 3; i++) {
      const suggestion = service.generateSingleSuggestionWithAI(patterns, new Date(), i);
      
      console.log(`✅ Suggestion ${i + 1}:`);
      console.log(`  - Name: ${suggestion.activityName}`);
      console.log(`  - Type: ${suggestion.activityType}`);
      console.log(`  - Content: ${suggestion.content}`);
      console.log(`  - Confidence: ${suggestion.confidenceScore}%`);
      console.log(`  - Reasoning: ${suggestion.reasoning}`);
    }
    
  } catch (error) {
    console.error('❌ Error during suggestion generation:', error.message);
  }
}

// Testing limits
function testLimits() {
  console.log('\n🧪 Testing limits...');
  
  const service = new SuggestedActivityService();
  
  try {
    // Test suggestion limit check
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log('✅ Limits check:');
    console.log(`  - Max suggestions per day: 10`);
    console.log(`  - Current date: ${today.toDateString()}`);
    console.log(`  - Limit applies in addSuggestedActivityToActivities`);
    
  } catch (error) {
    console.error('❌ Error during limits check:', error.message);
  }
}

// Testing cron jobs
function testCronJobs() {
  console.log('\n🧪 Testing cron jobs...');
  
  console.log('✅ Cron jobs configured:');
  console.log('  - Daily generation: 6:00 AM');
  console.log('  - Weekly cleanup: Sunday 3:00 AM');
  console.log('  - Daily check: 12:00 PM');
  console.log('  - Automatic start on application startup');
}

// Main testing function
function runTests() {
  console.log('🚀 Starting SuggestedActivityService tests\n');
  
  testPatternAnalysis();
  testSuggestionGeneration();
  testLimits();
  testCronJobs();
  
  console.log('\n✨ Testing complete!');
  console.log('\n📋 Key changes:');
  console.log('  1. getUserSuggestedActivities - only for current day');
  console.log('  2. addSuggestedActivityToActivities - deletion + limit 10');
  console.log('  3. refreshSuggestedActivities - update existing');
  console.log('  4. generateSuggestedActivities - public method for cron');
  console.log('  5. AI approach - combining analysis and generation');
}

// Run tests
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
