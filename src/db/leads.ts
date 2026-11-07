import { db } from './index.ts';
import { leads } from './schema.ts';
import { desc, eq } from 'drizzle-orm';

export async function getSavedLeads(userId?: string) {
  try {
    if (userId) {
      return await db.select().from(leads).where(eq(leads.userId, userId)).orderBy(desc(leads.createdAt));
    }
    return await db.select().from(leads).orderBy(desc(leads.createdAt)).limit(50);
  } catch (error) {
    console.error('Failed to fetch leads from DB:', error);
    return [];
  }
}

export async function upsertLead(leadData: typeof leads.$inferInsert) {
  try {
    const result = await db
      .insert(leads)
      .values(leadData)
      .onConflictDoUpdate({
        target: leads.id,
        set: {
          status: leadData.status,
          recommendedPackageId: leadData.recommendedPackageId,
          fitScore: leadData.fitScore,
          notes: leadData.notes,
          updatedAt: new Date()
        }
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Failed to upsert lead in DB:', error);
    throw new Error('Database upsert lead failed.', { cause: error });
  }
}

export async function updateLeadStatus(leadId: string, status: string, notes?: string) {
  try {
    const result = await db
      .update(leads)
      .set({
        status,
        ...(notes !== undefined ? { notes } : {}),
        updatedAt: new Date()
      })
      .where(eq(leads.id, leadId))
      .returning();
    return result[0];
  } catch (error) {
    console.error('Failed to update lead status in DB:', error);
    throw new Error('Database update lead status failed.', { cause: error });
  }
}
