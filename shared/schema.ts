import { sql } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  bucket: text("bucket").notNull(), // 'work' or 'personal'
  date: text("date").notNull(), // ISO date string
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const scratchpad = pgTable("scratchpad", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const feedback = pgTable("feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
});

export const insertScratchpadSchema = createInsertSchema(scratchpad).omit({
  id: true,
  createdAt: true,
});

export const insertFeedbackSchema = createInsertSchema(feedback).omit({
  id: true,
  createdAt: true,
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertScratchpad = z.infer<typeof insertScratchpadSchema>;
export type ScratchpadItem = typeof scratchpad.$inferSelect;

export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type FeedbackItem = typeof feedback.$inferSelect;
