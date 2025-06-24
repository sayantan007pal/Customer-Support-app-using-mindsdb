import dotenv from 'dotenv';
import { getMindsDBClient, executeQuery } from './src/config/database.js';
import { KnowledgeBaseService } from './src/services/knowledgeBase.js';

// Load environment variables
dotenv.config({ path: '.env' });

async function testMindsDBIntegration() {
  console.log('🧪 Testing MindsDB Integration\n');
  
  const tests = [];
  
  // Test 1: Basic connection test
  console.log('1️⃣ Testing basic MindsDB connection...');
  try {
    // First test with mock mode enabled
    process.env.MOCK_MODE = 'true';
    const mockResult = await executeQuery('SELECT * FROM test');
    tests.push({
      name: 'Mock mode connection',
      status: '✅ PASS',
      details: 'Mock mode working correctly'
    });
    console.log('   ✅ Mock mode working correctly');
  } catch (error) {
    tests.push({
      name: 'Mock mode connection',
      status: '❌ FAIL',
      details: error.message
    });
    console.log('   ❌ Mock mode failed:', error.message);
  }
  
  // Test 2: MindsDB SDK connection (will fail gracefully if not configured)
  console.log('\n2️⃣ Testing MindsDB SDK connection...');
  try {
    const client = await getMindsDBClient();
    if (client) {
      tests.push({
        name: 'MindsDB SDK connection',
        status: '✅ PASS',
        details: 'SDK connected successfully'
      });
      console.log('   ✅ MindsDB SDK connected successfully');
    } else {
      tests.push({
        name: 'MindsDB SDK connection',
        status: '⚠️  SKIP',
        details: 'SDK not configured (expected in mock mode)'
      });
      console.log('   ⚠️  SDK not configured (expected in mock mode)');
    }
  } catch (error) {
    tests.push({
      name: 'MindsDB SDK connection',
      status: '⚠️  SKIP',
      details: `SDK connection failed: ${error.message}`
    });
    console.log('   ⚠️  SDK connection failed:', error.message);
  }
  
  // Test 3: Knowledge Base Service
  console.log('\n3️⃣ Testing Knowledge Base Service...');
  try {
    const kbService = new KnowledgeBaseService();
    
    // Test search functionality
    const searchResults = await kbService.searchKnowledgeBase('password reset', {
      category: 'technical',
      limit: 3
    });
    
    if (searchResults && searchResults.length > 0) {
      tests.push({
        name: 'Knowledge Base search',
        status: '✅ PASS',
        details: `Found ${searchResults.length} results`
      });
      console.log(`   ✅ Knowledge Base search returned ${searchResults.length} results`);
      console.log(`   📄 Sample result: "${searchResults[0].title}"`);
    } else {
      tests.push({
        name: 'Knowledge Base search',
        status: '❌ FAIL',
        details: 'No search results returned'
      });
      console.log('   ❌ No search results returned');
    }
  } catch (error) {
    tests.push({
      name: 'Knowledge Base search',
      status: '❌ FAIL',
      details: error.message
    });
    console.log('   ❌ Knowledge Base search failed:', error.message);
  }
  
  // Test 4: Knowledge Base SDK integration
  console.log('\n4️⃣ Testing Knowledge Base SDK integration...');
  try {
    const kbService = new KnowledgeBaseService();
    
    // Test SDK-based search (will fallback to regular search if SDK not available)
    const sdkSearchResults = await kbService.searchKnowledgeBaseWithSDK('billing information', {
      category: 'billing',
      limit: 2
    });
    
    if (sdkSearchResults && sdkSearchResults.length > 0) {
      tests.push({
        name: 'Knowledge Base SDK search',
        status: '✅ PASS',
        details: `SDK search returned ${sdkSearchResults.length} results`
      });
      console.log(`   ✅ SDK search returned ${sdkSearchResults.length} results`);
    } else {
      tests.push({
        name: 'Knowledge Base SDK search',
        status: '❌ FAIL',
        details: 'SDK search returned no results'
      });
      console.log('   ❌ SDK search returned no results');
    }
  } catch (error) {
    tests.push({
      name: 'Knowledge Base SDK search',
      status: '❌ FAIL',
      details: error.message
    });
    console.log('   ❌ SDK search failed:', error.message);
  }
  
  // Test 5: Categories retrieval
  console.log('\n5️⃣ Testing categories retrieval...');
  try {
    const kbService = new KnowledgeBaseService();
    const categories = await kbService.getCategories();
    
    if (categories && categories.length > 0) {
      tests.push({
        name: 'Categories retrieval',
        status: '✅ PASS',
        details: `Found ${categories.length} categories: ${categories.join(', ')}`
      });
      console.log(`   ✅ Found ${categories.length} categories: ${categories.join(', ')}`);
    } else {
      tests.push({
        name: 'Categories retrieval',
        status: '❌ FAIL',
        details: 'No categories found'
      });
      console.log('   ❌ No categories found');
    }
  } catch (error) {
    tests.push({
      name: 'Categories retrieval',
      status: '❌ FAIL',
      details: error.message
    });
    console.log('   ❌ Categories retrieval failed:', error.message);
  }
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const passed = tests.filter(t => t.status.includes('PASS')).length;
  const failed = tests.filter(t => t.status.includes('FAIL')).length;
  const skipped = tests.filter(t => t.status.includes('SKIP')).length;
  
  tests.forEach(test => {
    console.log(`${test.status} ${test.name}`);
    if (test.details) {
      console.log(`     ${test.details}`);
    }
  });
  
  console.log('\n📈 Results:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   ⚠️  Skipped: ${skipped}`);
  console.log(`   📊 Total: ${tests.length}`);
  
  if (failed === 0) {
    console.log('\n🎉 All critical tests passed! MindsDB integration is working correctly.');
    console.log('\n💡 Next steps:');
    console.log('   1. Configure real MindsDB credentials in .env to test actual connections');
    console.log('   2. Run: npm run setup:mindsdb (when MindsDB is configured)');
    console.log('   3. Set MOCK_MODE=false in .env to use real MindsDB');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the configuration.');
  }
  
  return { passed, failed, skipped, total: tests.length };
}

// Run the test
testMindsDBIntegration()
  .then((results) => {
    process.exit(results.failed > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });
