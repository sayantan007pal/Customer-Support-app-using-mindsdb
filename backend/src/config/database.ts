import mysql from 'mysql2/promise';
import MindsDB from 'mindsdb-js-sdk';
import type { MindsDBConfig } from '../types/index.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

let connection: mysql.Connection | null = null;
let mindsdbClient: any = null;

export const config: MindsDBConfig = {
  host: process.env.MINDSDB_HOST || 'localhost',
  port: parseInt(process.env.MINDSDB_PORT || '47334'),
  user: process.env.MINDSDB_USER || 'mindsdb',
  password: process.env.MINDSDB_PASSWORD || '',
  database: process.env.MINDSDB_DATABASE || 'mindsdb',
  // MindsDB Cloud or local instance settings
  mindsdbCloudEmail: process.env.MINDSDB_CLOUD_EMAIL,
  mindsdbCloudPassword: process.env.MINDSDB_CLOUD_PASSWORD,
  useCloud: process.env.MINDSDB_USE_CLOUD === 'true',
  httpUrl: process.env.MINDSDB_HTTP_URL || 'http://localhost:47334'
};

const isMockMode = process.env.MOCK_MODE === 'true';

// Mock data for development
const mockKnowledgeBase = [
  {
    id: 'kb_1',
    title: 'Password Reset Guide',
    content: 'To reset your password: 1. Go to the login page 2. Click "Forgot Password" 3. Enter your email 4. Check your email for reset instructions 5. Follow the link and create a new password',
    category: 'technical',
    priority: 'high',
    product_type: 'web_app',
    tags: ['password', 'reset', 'login'],
    last_updated: new Date('2025-06-24T10:00:00Z'),
    chunk_content: 'Password reset instructions for users who forgot their login credentials',
    relevance: 0.95,
    distance: 0.05
  },
  {
    id: 'kb_2', 
    title: 'Account Billing Information',
    content: 'Your billing information can be found in Account Settings > Billing. Here you can view current plans, payment history, and update payment methods.',
    category: 'billing',
    priority: 'medium',
    product_type: 'web_app',
    tags: ['billing', 'account', 'payment'],
    last_updated: new Date('2025-06-23T15:30:00Z'),
    chunk_content: 'Information about accessing billing details and payment management',
    relevance: 0.88,
    distance: 0.12
  },
  {
    id: 'kb_3',
    title: 'Getting Started Guide',
    content: 'Welcome! To get started: 1. Complete your profile 2. Explore the dashboard 3. Connect your first data source 4. Create your first project 5. Invite team members',
    category: 'general',
    priority: 'low',
    product_type: 'web_app', 
    tags: ['getting-started', 'onboarding'],
    last_updated: new Date('2025-06-22T09:15:00Z'),
    chunk_content: 'Step-by-step guide for new users to get started with the platform',
    relevance: 0.75,
    distance: 0.25
  }
];

function generateMockResponse(query: string): any[] {
  // Simple keyword matching for demo purposes
  const queryLower = query.toLowerCase();
  
  if (queryLower.includes('password') || queryLower.includes('reset') || queryLower.includes('login')) {
    return [mockKnowledgeBase[0]];
  } else if (queryLower.includes('billing') || queryLower.includes('payment') || queryLower.includes('account')) {
    return [mockKnowledgeBase[1]];
  } else if (queryLower.includes('start') || queryLower.includes('help') || queryLower.includes('how')) {
    return [mockKnowledgeBase[2]];
  } else {
    // Return a general helpful response for any other query
    return [mockKnowledgeBase[2]];
  }
}

export async function getConnection(): Promise<mysql.Connection> {
  if (isMockMode) {
    throw new Error('Mock mode enabled - no real database connection needed');
  }
  
  if (!connection) {
    try {
      connection = await mysql.createConnection({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database
      });
      
      console.log('Connected to MindsDB successfully');
    } catch (error) {
      console.error('Failed to connect to MindsDB:', error);
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  return connection;
}

// Initialize MindsDB SDK connection
export async function getMindsDBClient(): Promise<any> {
  if (isMockMode) {
    console.log('Mock mode: MindsDB SDK not initialized');
    return null;
  }
  
  if (!mindsdbClient) {
    try {
      console.log('Attempting to connect to MindsDB...', typeof MindsDB, typeof MindsDB.connect);
      
      if (config.useCloud && config.mindsdbCloudEmail && config.mindsdbCloudPassword) {
        // Connect to MindsDB Cloud
        await MindsDB.connect({
          user: config.mindsdbCloudEmail,
          password: config.mindsdbCloudPassword
        });
        console.log('Connected to MindsDB Cloud successfully');
      } else {
        // Connect to self-hosted MindsDB instance
        await MindsDB.connect({
          host: config.httpUrl || `http://${config.host}:${config.port}`,
          user: config.user,
          password: config.password
        });
        console.log('Connected to MindsDB instance successfully');
      }
      
      // Return MindsDB instance directly - it has query methods
      mindsdbClient = MindsDB;
      
    } catch (error) {
      console.error('Failed to connect to MindsDB via SDK:', error);
      console.log('Falling back to MySQL connection...');
      // Fallback to MySQL connection if SDK fails
      return null;
    }
  }
  return mindsdbClient;
}

export async function executeQuery(sql: string): Promise<any> {
  if (isMockMode) {
    console.log('Mock mode: Simulating query execution:', sql);
    
    // Parse the query to determine what kind of response to return
    const sqlLower = sql.toLowerCase();
    
    if (sqlLower.includes('select') && sqlLower.includes('knowledge_base')) {
      // Extract search term from query (basic parsing)
      const match = sql.match(/'([^']+)'/);
      const searchTerm = match ? match[1] : 'help';
      
      return {
        rows: generateMockResponse(searchTerm),
        affectedRows: 0
      };
    } else if (sqlLower.includes('insert')) {
      return {
        rows: [],
        affectedRows: 1
      };
    } else if (sqlLower.includes('categories')) {
      return {
        rows: [
          { category: 'technical' },
          { category: 'billing' }, 
          { category: 'general' },
          { category: 'shipping' },
          { category: 'returns' }
        ],
        affectedRows: 0
      };
    } else {
      // Default response
      return {
        rows: [],
        affectedRows: 0
      };
    }
  }
  
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute(sql);
    return { rows, affectedRows: (rows as any).affectedRows || 0 };
  } catch (error) {
    console.error('Query execution failed:', error);
    throw new Error(`Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function closeConnection(): Promise<void> {
  if (connection) {
    await connection.end();
    connection = null;
    console.log('MySQL database connection closed');
  }
  
  if (mindsdbClient) {
    // MindsDB SDK doesn't require explicit closing
    mindsdbClient = null;
    console.log('MindsDB SDK connection cleared');
  }
}
