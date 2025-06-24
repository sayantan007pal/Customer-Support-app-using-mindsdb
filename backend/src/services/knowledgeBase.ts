import type { KnowledgeBaseEntry } from '../types/index.js';
import { executeQuery, getMindsDBClient } from '../config/database.js';

export interface SearchFilters {
  category?: string;
  priority?: string;
  product_type?: string;
  limit?: number;
  relevance_threshold?: number;
}

export class KnowledgeBaseService {
  /**
   * Search the knowledge base using semantic search
   */
  async searchKnowledgeBase(
    query: string, 
    filters: SearchFilters = {}
  ): Promise<KnowledgeBaseEntry[]> {
    try {
      const {
        category,
        priority,
        product_type,
        limit = 10,
        relevance_threshold = 0.7
      } = filters;

      let sql = `
        SELECT id, chunk_content, metadata, relevance, distance
        FROM support_knowledge_base
        WHERE content = '${query}'
        AND relevance >= ${relevance_threshold}
      `;

      // Add metadata filters
      if (category) {
        sql += ` AND category = '${category}'`;
      }
      if (priority) {
        sql += ` AND priority = '${priority}'`;
      }
      if (product_type) {
        sql += ` AND product_type = '${product_type}'`;
      }

      sql += ` ORDER BY relevance DESC LIMIT ${limit}`;

      const result = await executeQuery(sql);
      
      return result.rows.map((row: any) => {
        const metadata = JSON.parse(row.metadata || '{}');
        return {
          id: row.id,
          title: metadata.title || '',
          content: metadata.content || row.chunk_content,
          category: metadata.category || 'general',
          priority: metadata.priority || 'medium',
          product_type: metadata.product_type,
          tags: metadata.tags || [],
          last_updated: new Date(metadata.last_updated || Date.now()),
          chunk_content: row.chunk_content,
          relevance: row.relevance,
          distance: row.distance
        } as KnowledgeBaseEntry;
      });
    } catch (error) {
      throw new Error(`Failed to search knowledge base: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add a new entry to the knowledge base
   */
  async addKnowledgeBaseEntry(
    entry: Omit<KnowledgeBaseEntry, 'id' | 'last_updated'>
  ): Promise<boolean> {
    try {
      const id = `kb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date().toISOString();

      const sql = `
        INSERT INTO support_knowledge_base (
          id, title, content, category, priority, product_type, tags, last_updated
        ) VALUES (
          '${id}',
          '${entry.title}',
          '${entry.content}',
          '${entry.category}',
          '${entry.priority}',
          '${entry.product_type || ''}',
          '${JSON.stringify(entry.tags)}',
          '${timestamp}'
        )
      `;

      const result = await executeQuery(sql);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Failed to add knowledge base entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an existing knowledge base entry
   */
  async updateKnowledgeBaseEntry(
    id: string,
    updates: Partial<Omit<KnowledgeBaseEntry, 'id'>>
  ): Promise<boolean> {
    try {
      const updateFields: string[] = [];
      
      if (updates.title) updateFields.push(`title = '${updates.title}'`);
      if (updates.content) updateFields.push(`content = '${updates.content}'`);
      if (updates.category) updateFields.push(`category = '${updates.category}'`);
      if (updates.priority) updateFields.push(`priority = '${updates.priority}'`);
      if (updates.product_type) updateFields.push(`product_type = '${updates.product_type}'`);
      if (updates.tags) updateFields.push(`tags = '${JSON.stringify(updates.tags)}'`);
      
      updateFields.push(`last_updated = '${new Date().toISOString()}'`);

      const sql = `
        UPDATE support_knowledge_base 
        SET ${updateFields.join(', ')}
        WHERE id = '${id}'
      `;

      const result = await executeQuery(sql);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Failed to update knowledge base entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a knowledge base entry
   */
  async deleteKnowledgeBaseEntry(id: string): Promise<boolean> {
    try {
      const sql = `DELETE FROM support_knowledge_base WHERE id = '${id}'`;
      const result = await executeQuery(sql);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Failed to delete knowledge base entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all categories available in the knowledge base
   */
  async getCategories(): Promise<string[]> {
    try {
      const sql = `SELECT DISTINCT category FROM support_knowledge_base ORDER BY category`;
      const result = await executeQuery(sql);
      return result.rows.map((row: any) => row.category);
    } catch (error) {
      throw new Error(`Failed to get categories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get statistics about the knowledge base
   */
  async getStats(): Promise<{
    total_entries: number;
    by_category: Record<string, number>;
    by_priority: Record<string, number>;
  }> {
    try {
      const totalSql = `SELECT COUNT(*) as total FROM support_knowledge_base`;
      const categorySql = `SELECT category, COUNT(*) as count FROM support_knowledge_base GROUP BY category`;
      const prioritySql = `SELECT priority, COUNT(*) as count FROM support_knowledge_base GROUP BY priority`;

      const [totalResult, categoryResult, priorityResult] = await Promise.all([
        executeQuery(totalSql),
        executeQuery(categorySql),
        executeQuery(prioritySql)
      ]);

      const by_category: Record<string, number> = {};
      categoryResult.rows.forEach((row: any) => {
        by_category[row.category] = row.count;
      });

      const by_priority: Record<string, number> = {};
      priorityResult.rows.forEach((row: any) => {
        by_priority[row.priority] = row.count;
      });

      return {
        total_entries: totalResult.rows[0].total,
        by_category,
        by_priority
      };
    } catch (error) {
      throw new Error(`Failed to get stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search knowledge base using MindsDB SDK (preferred method)
   */
  async searchKnowledgeBaseWithSDK(
    query: string,
    filters: SearchFilters = {}
  ): Promise<KnowledgeBaseEntry[]> {
    try {
      const client = await getMindsDBClient();
      
      if (!client) {
        console.log('MindsDB SDK not available, falling back to SQL search');
        return this.searchKnowledgeBase(query, filters);
      }

      const {
        category,
        priority,
        product_type,
        limit = 10,
        relevance_threshold = 0.7
      } = filters;

      // Use proper MindsDB Knowledge Base SQL syntax
      let sql = `
        SELECT id, chunk_id, chunk_content, metadata, distance, relevance
        FROM support_kb
        WHERE content = '${query.replace(/'/g, "''")}'
      `;

      // Add relevance filtering
      if (relevance_threshold) {
        sql += ` AND relevance >= ${relevance_threshold}`;
      }

      // Add metadata filters using proper MindsDB syntax
      if (category) {
        sql += ` AND JSON_EXTRACT(metadata, '$.category') = '${category}'`;
      }
      if (priority) {
        sql += ` AND JSON_EXTRACT(metadata, '$.priority') = '${priority}'`;
      }
      if (product_type) {
        sql += ` AND JSON_EXTRACT(metadata, '$.product_type') = '${product_type}'`;
      }

      // Order by relevance and limit results
      sql += ` ORDER BY relevance DESC LIMIT ${limit}`;

      console.log('Executing MindsDB Knowledge Base query:', sql);

      // Execute query using MindsDB SDK
      const results = await client.SQL.runQuery(sql);

      // Transform results to match our interface
      return results.rows.map((result: any) => {
        const metadata = typeof result.metadata === 'string' 
          ? JSON.parse(result.metadata) 
          : result.metadata || {};

        return {
          id: result.id || result.chunk_id || `kb_${Date.now()}_${Math.random()}`,
          title: metadata.title || result.chunk_content?.substring(0, 50) + '...' || 'Untitled',
          content: result.chunk_content || metadata.content || '',
          category: metadata.category || 'general',
          priority: metadata.priority || 'medium',
          product_type: metadata.product_type,
          tags: metadata.tags || [],
          last_updated: new Date(metadata.last_updated || Date.now()),
          chunk_content: result.chunk_content,
          relevance: result.relevance || 0,
          distance: result.distance || 1
        } as KnowledgeBaseEntry;
      });

    } catch (error) {
      console.error('MindsDB SDK search failed:', error);
      console.log('Falling back to SQL search...');
      return this.searchKnowledgeBase(query, filters);
    }
  }

  /**
   * Initialize knowledge base using MindsDB Knowledge Base SQL syntax
   */
  async initializeKnowledgeBase(kbName: string = 'support_kb'): Promise<boolean> {
    try {
      const client = await getMindsDBClient();
      
      if (!client) {
        console.log('MindsDB SDK not available, skipping KB initialization');
        return false;
      }

      // Check if knowledge base already exists
      try {
        const checkSql = `SELECT * FROM information_schema.knowledge_bases WHERE name = '${kbName}'`;
        const existing = await client.SQL.runQuery(checkSql);
        if (existing && existing.rows && existing.rows.length > 0) {
          console.log(`Knowledge base "${kbName}" already exists`);
          return true;
        }
      } catch (error) {
        // KB doesn't exist, we'll create it
        console.log(`Knowledge base "${kbName}" not found, creating...`);
      }

      // Create knowledge base using MindsDB SQL syntax
      const createSql = `
        CREATE KNOWLEDGE_BASE ${kbName}
        USING
          embedding_model = {
            "provider": "openai",
            "model_name": "text-embedding-ada-002",
            "api_key": "${process.env.OPENAI_API_KEY || 'your-api-key'}"
          },
          metadata_columns = ['category', 'priority', 'product_type', 'tags'],
          content_columns = ['content'],
          id_column = 'id';
      `;

      await client.SQL.runQuery(createSql);
      console.log(`Knowledge base "${kbName}" created successfully`);
      return true;

    } catch (error) {
      console.error('Failed to initialize knowledge base:', error);
      return false;
    }
  }

  /**
   * Add content to knowledge base using MindsDB Knowledge Base SQL syntax
   */
  async addToKnowledgeBaseWithSDK(
    content: string,
    metadata: Record<string, any> = {},
    kbName: string = 'support_kb'
  ): Promise<boolean> {
    try {
      const client = await getMindsDBClient();
      
      if (!client) {
        console.log('MindsDB SDK not available, using fallback method');
        return false;
      }

      // Generate a unique ID
      const id = metadata.id || `kb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Insert data using MindsDB Knowledge Base SQL syntax
      const insertSql = `
        INSERT INTO ${kbName} (
          id, content, category, priority, product_type, tags
        ) VALUES (
          '${id}',
          '${content.replace(/'/g, "''")}',
          '${metadata.category || 'general'}',
          '${metadata.priority || 'medium'}',
          '${metadata.product_type || ''}',
          '${JSON.stringify(metadata.tags || []).replace(/'/g, "''")}'
        );
      `;

      await client.SQL.runQuery(insertSql);
      console.log('Content added to knowledge base successfully');
      return true;

    } catch (error) {
      console.error('Failed to add content to knowledge base:', error);
      return false;
    }
  }
}
