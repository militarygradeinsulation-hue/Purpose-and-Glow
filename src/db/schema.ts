import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table authenticated via Firebase Auth
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at').defaultNow()
});

// Candidate Lead Signals saved and managed by Nicole
export const leads = pgTable('leads', {
  id: text('id').primaryKey(), // ID matching live signal or ingested ID
  userId: text('user_id').references(() => users.uid),
  personName: text('person_name').notNull(),
  headline: text('headline').notNull(),
  location: text('location').notNull(),
  sourceType: text('source_type').notNull(),
  sourceContext: text('source_context').notNull(),
  sourceUrl: text('source_url'),
  authorUrl: text('author_url'),
  rawText: text('raw_text').notNull(),
  yearsExperience: integer('years_experience').default(5),
  isHealthcareOrOps: boolean('is_healthcare_or_ops').default(false),
  detectedCluster: text('detected_cluster').default('general'),
  status: text('status').notNull().default('new_signal'),
  recommendedPackageId: text('recommended_package_id').notNull().default('revamp_99'),
  fitScore: integer('fit_score').default(50),
  diagnosticBottleNeck: text('diagnostic_bottleneck'),
  dutyVsContributionGap: text('duty_vs_contribution_gap'),
  diagnosticQuestionToAsk: text('diagnostic_question_to_ask'),
  publicCommentDraft: text('public_comment_draft'),
  warmDmDraft: text('warm_dm_draft'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Multi-turn Gemini Copilot Chat Messages
export const chatMessages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => users.uid),
  role: text('role').notNull(), // 'user' | 'model'
  content: text('content').notNull(),
  relatedLeadId: text('related_lead_id'),
  createdAt: timestamp('created_at').defaultNow()
});

// Customizable Keyword Scoring Rules
export const customRules = pgTable('keyword_rules', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid),
  phrase: text('phrase').notNull(),
  weight: integer('weight').notNull(),
  category: text('category').notNull(),
  rationale: text('rationale').notNull(),
  enabled: boolean('enabled').default(true),
  createdAt: timestamp('created_at').defaultNow()
});
