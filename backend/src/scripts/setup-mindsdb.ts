#!/usr/bin/env node

/**
 * MindsDB Knowledge Base Setup Script
 * 
 * This script helps initialize your MindsDB instance with:
 * - Knowledge Base creation
 * - Sample data insertion
 * - AI Tables setup for response generation
 */

import dotenv from 'dotenv';
import { getMindsDBClient } from '../config/database.js';
import { KnowledgeBaseService } from '../services/knowledgeBase.js';

// Load environment variables
dotenv.config();

const sampleKnowledgeBaseData = [
  {
    content: 'To reset your password: 1. Go to the login page 2. Click "Forgot Password" 3. Enter your email 4. Check your email for reset instructions 5. Follow the link and create a new password',
    metadata: {
      title: 'Password Reset Guide',
      category: 'technical',
      priority: 'high',
      product_type: 'web_app',
      tags: ['password', 'reset', 'login']
    }
  },
  {
    content: 'Your billing information can be found in Account Settings > Billing. Here you can view current plans, payment history, and update payment methods.',
    metadata: {
      title: 'Account Billing Information',
      category: 'billing',
      priority: 'medium',
      product_type: 'web_app',
      tags: ['billing', 'account', 'payment']
    }
  },
  {
    content: 'Welcome! To get started: 1. Complete your profile 2. Explore the dashboard 3. Connect your first data source 4. Create your first project 5. Invite team members',
    metadata: {
      title: 'Getting Started Guide',
      category: 'general',
      priority: 'low',
      product_type: 'web_app',
      tags: ['getting-started', 'onboarding']
    }
  },
  {
    content: 'To cancel your subscription: 1. Go to Account Settings > Billing 2. Click "Manage Subscription" 3. Select "Cancel Subscription" 4. Follow the confirmation steps. Note: Your access continues until the end of the billing period.',
    metadata: {
      title: 'Subscription Cancellation',
      category: 'billing',
      priority: 'high',
      product_type: 'web_app',
      tags: ['subscription', 'cancel', 'billing']
    }
  },
  {
    content: 'For shipping inquiries: Standard shipping takes 3-5 business days, Express shipping takes 1-2 business days. You can track your order using the tracking number sent to your email.',
    metadata: {
      title: 'Shipping Information',
      category: 'shipping',
      priority: 'medium',
      product_type: 'physical',
      tags: ['shipping', 'delivery', 'tracking']
    }
  }
];

async function setupKnowledgeBase() {
  console.log('🚀 Starting MindsDB Knowledge Base setup...\n');
  
  try {
    const kbService = new KnowledgeBaseService();
    
    // Step 1: Initialize Knowledge Base
    console.log('📚 Initializing Knowledge Base...');
    const kbInitialized = await kbService.initializeKnowledgeBase('support_kb');
    
    if (kbInitialized) {
      console.log('✅ Knowledge Base initialized successfully');
    } else {
      console.log('⚠️  Knowledge Base initialization skipped (SDK not available)');
    }
    
    // Step 2: Add sample data
    console.log('\n📝 Adding sample knowledge base entries...');
    
    let successCount = 0;
    for (const [index, data] of sampleKnowledgeBaseData.entries()) {
      try {
        const success = await kbService.addToKnowledgeBaseWithSDK(
          data.content,
          data.metadata,
          'support_kb'
        );
        
        if (success) {
          successCount++;
          console.log(`✅ Added entry ${index + 1}/${sampleKnowledgeBaseData.length}: ${data.metadata.title}`);
        } else {
          console.log(`⚠️  Skipped entry ${index + 1}/${sampleKnowledgeBaseData.length}: ${data.metadata.title} (SDK not available)`);
        }
      } catch (error) {
        console.log(`❌ Failed to add entry ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    console.log(`\n📊 Successfully added ${successCount}/${sampleKnowledgeBaseData.length} entries`);
    
  } catch (error) {
    console.error('❌ Setup failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

async function createAITables() {
  console.log('\n🤖 Setting up AI Tables...');
  
  try {
    const client = await getMindsDBClient();
    
    if (!client) {
      console.log('⚠️  MindsDB SDK not available, skipping AI Tables setup');
      return;
    }
    
    // Create query classification model using proper MindsDB syntax
    console.log('🔍 Creating query classification model...');
    try {
      const classifierSql = `
        CREATE MODEL query_classifier
        PREDICT category
        USING
          engine = 'openai',
          model_name = 'gpt-3.5-turbo',
          api_key = '${process.env.OPENAI_API_KEY || 'your-api-key'}',
          prompt_template = 'Classify the following customer support query into one of these categories: technical, billing, shipping, general. Query: {{query}} Category:';
      `;
      
      await client.SQL.runQuery(classifierSql);
      console.log('✅ Query classifier created');
    } catch (error) {
      console.log('⚠️  Query classifier might already exist');
    }
    
    // Create response generation model using proper MindsDB syntax
    console.log('💬 Creating response generation model...');
    try {
      const responseSql = `
        CREATE MODEL response_generator
        PREDICT response
        USING
          engine = 'openai',
          model_name = 'gpt-3.5-turbo',
          api_key = '${process.env.OPENAI_API_KEY || 'your-api-key'}',
          prompt_template = 'You are a helpful customer support assistant. Based on the knowledge base information provided, generate a helpful and accurate response. Query: {{query}} Context: {{context}} Response:';
      `;
      
      await client.SQL.runQuery(responseSql);
      console.log('✅ Response generator created');
    } catch (error) {
      console.log('⚠️  Response generator might already exist');
    }
    
  } catch (error) {
    console.error('❌ AI Tables setup failed:', error instanceof Error ? error.message : 'Unknown error');
  }
}

async function main() {
  console.log('🔧 MindsDB Customer Support Setup\n');
  console.log('This script will set up your MindsDB instance for customer support.\n');
  
  await setupKnowledgeBase();
  await createAITables();
  
  console.log('\n🎉 Setup completed!');
  console.log('\nNext steps:');
  console.log('1. Update your .env file with MindsDB credentials');
  console.log('2. Set MOCK_MODE=false to use MindsDB');
  console.log('3. Start your development server: npm run dev');
  console.log('4. Test the knowledge base search functionality');
  
  process.exit(0);
}

// Run the setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { setupKnowledgeBase, createAITables };
