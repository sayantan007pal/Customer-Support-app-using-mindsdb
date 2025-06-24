import type { KnowledgeBaseEntry } from '../types/index.js';
import { executeQuery } from '../config/database.js';

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
}
