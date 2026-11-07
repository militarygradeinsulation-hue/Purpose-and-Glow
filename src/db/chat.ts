import { db } from './index.ts';
import { chatMessages } from './schema.ts';
import { asc, eq } from 'drizzle-orm';

export async function getChatHistory(userId?: string) {
  try {
    if (userId) {
      return await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.userId, userId))
        .orderBy(asc(chatMessages.createdAt))
        .limit(50);
    }
    return await db.select().from(chatMessages).orderBy(asc(chatMessages.createdAt)).limit(30);
  } catch (error) {
    console.error('Failed to get chat history:', error);
    return [];
  }
}

export async function saveChatMessage(message: typeof chatMessages.$inferInsert) {
  try {
    const result = await db.insert(chatMessages).values(message).returning();
    return result[0];
  } catch (error) {
    console.error('Failed to save chat message:', error);
    throw new Error('Database chat message save failed.', { cause: error });
  }
}
