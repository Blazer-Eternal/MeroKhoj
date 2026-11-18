import { getSequelize } from '../../config';

/**
 * Data access for `ai_chat_messages` (Phase 2, career assistant).
 *
 * Messages are stored flat per user; the service reads the most recent
 * window as conversation history and appends each turn (user + assistant)
 * in one call.
 */

export type AIChatRole = 'user' | 'assistant';

export interface IAIChatMessageRow {
  id: string;
  user_id: string;
  role: AIChatRole;
  content: string;
  context: unknown;
  created_at: Date;
}

class AIChatMessageRepository {
  /** Append one message and return its id. */
  async append(
    userId: string,
    role: AIChatRole,
    content: string,
    context?: Record<string, unknown> | null,
  ): Promise<string> {
    const rows = (await getSequelize().query(
      `INSERT INTO ai_chat_messages (user_id, role, content, context)
       VALUES (:userId, :role, :content, :context::jsonb)
       RETURNING id`,
      {
        replacements: {
          userId,
          role,
          content,
          context: context ? JSON.stringify(context) : null,
        },
        type: 'SELECT' as const,
      },
    )) as Array<{ id: string }>;
    return rows[0].id;
  }

  /** Most recent conversation window, oldest first (ready for the LLM). */
  async listRecent(userId: string, limit = 12): Promise<IAIChatMessageRow[]> {
    const rows = (await getSequelize().query(
      `SELECT id, user_id, role, content, context, created_at
       FROM (
         SELECT id, user_id, role, content, context, created_at
         FROM ai_chat_messages
         WHERE user_id = :userId
         ORDER BY created_at DESC
         LIMIT :limit
       ) recent
       ORDER BY created_at ASC`,
      { replacements: { userId, limit }, type: 'SELECT' as const },
    )) as IAIChatMessageRow[];
    return rows;
  }

  /** Trim history to the newest `keep` messages (bounded storage). */
  async prune(userId: string, keep = 100): Promise<void> {
    await getSequelize().query(
      `DELETE FROM ai_chat_messages
       WHERE user_id = :userId
         AND id NOT IN (
           SELECT id FROM ai_chat_messages
           WHERE user_id = :userId
           ORDER BY created_at DESC
           LIMIT :keep
         )`,
      { replacements: { userId, keep } },
    );
  }

  /** Wipe a user's chat history. */
  async clearForUser(userId: string): Promise<void> {
    await getSequelize().query(`DELETE FROM ai_chat_messages WHERE user_id = :userId`, {
      replacements: { userId },
    });
  }
}

export default new AIChatMessageRepository();
