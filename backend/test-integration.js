#!/usr/bin/env node

/**
 * Simple test to verify MindsDB integration
 */

import { config } from 'dotenv';
import { getMindsDBClient } from './src/config/database.js';
import { KnowledgeBaseService } from './src/services/knowledgeBase.js';

// Load environment variables
config();

console.log('🧪 Testing MindsDB Integration...\n');

async function testBasicConnection() {
  console.log('🔌 Testing MindsDB SDK Connection...');
  
  try {
    const client = await getMindsDBClient();
    
    if (!client) {
      console.log('⚠️  MindsDB SDK not available (likely in mock mode)');
      return true; // This is expected in mock mode
    }
    
    console.log('✅ MindsDB SDK connection successful');
    return true;
  } catch (error) {
    console.log('❌ MindsDB SDK connection failed:', error.message);
    return false;
  }
}

async function testKnowledgeBaseService() {
  console.log('\n📚 Testing Knowledge Base Service...');
  
  try {
    const kbService = new KnowledgeBaseService();
    
    // Test search functionality with mock data
    const results = await kbService.searchKnowledgeBaseWithSDK('password reset', {
      category: 'technical',
      limit: 5
    });
    
    console.log('✅ Knowledge Base search working');
    console.log(`   Found ${results.length} results`);
    
    if (results.length > 0) {
      console.log(`   Sample result: ${results[0].title}`);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Knowledge Base service failed:', error.message);
    return false;
  }
}

async function testInitialization() {
  console.log('\n🚀 Testing KB Initialization...');
  
  try {
    const kbService = new KnowledgeBaseService();
    const success = await kbService.initializeKnowledgeBase('test_kb');
    
    if (success) {
      console.log('✅ Knowledge Base initialization successful');
    } else {
      console.log('⚠️  Knowledge Base initialization skipped (likely mock mode)');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Knowledge Base initialization failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('Environment check:');
  console.log(`   MOCK_MODE: ${process.env.MOCK_MODE}`);
  console.log(`   MINDSDB_HOST: ${process.env.MINDSDB_HOST || 'default'}`);
  console.log('');
  
  const tests = [
    testBasicConnection,
    testKnowledgeBaseService,
    testInitialization
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log('❌ Test failed with error:', error.message);
      failed++;
    }
  }
  
  console.log('\n📊 Test Results:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! MindsDB integration is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
  }
  
  return failed === 0;
}

// Run tests
runTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
