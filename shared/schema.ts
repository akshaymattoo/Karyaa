import { sql } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull(),
  title: text("title").notNull(),
  bucket: text("bucket").notNull(), // 'work' or 'personal'
  date: text("date").notNull(), // ISO date string
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const scratchpad = pgTable("scratchpad", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const feedback = pgTable("feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  reminderTime: text("reminder_time").notNull().default("17:00"), // 24-hour format HH:mm
  reminderEnabled: boolean("reminder_enabled").notNull().default(true),
  lastReminderSent: timestamp("last_reminder_sent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Weekly activity blueprints - defines what activities a user wants to do each week
// Each activity is scoped to a specific week (weekStart is the Sunday of that week)
export const weeklyActivities = pgTable("weekly_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull(),
  weekStart: text("week_start").notNull(), // ISO date string for Sunday of the week (YYYY-MM-DD)
  title: text("title").notNull(),
  targetCount: text("target_count").notNull().default("1"), // e.g., "3" for 3x per week
  category: text("category").notNull().default("health"), // health, fitness, nutrition, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Weekly completions - tracks when an activity was completed on a specific date
export const weeklyCompletions = pgTable("weekly_completions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  activityId: varchar("activity_id").notNull(),
  userId: uuid("user_id").notNull(),
  date: text("date").notNull(), // ISO date string YYYY-MM-DD
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertScratchpadSchema = createInsertSchema(scratchpad).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFeedbackSchema = createInsertSchema(feedback).omit({
  id: true,
  createdAt: true,
});

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({
  id: true,
  createdAt: true,
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWeeklyActivitySchema = createInsertSchema(weeklyActivities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWeeklyCompletionSchema = createInsertSchema(weeklyCompletions).omit({
  id: true,
  createdAt: true,
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertScratchpad = z.infer<typeof insertScratchpadSchema>;
export type ScratchpadItem = typeof scratchpad.$inferSelect;

export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type FeedbackItem = typeof feedback.$inferSelect;

export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;

export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UserSettings = typeof userSettings.$inferSelect;

export type InsertWeeklyActivity = z.infer<typeof insertWeeklyActivitySchema>;
export type WeeklyActivity = typeof weeklyActivities.$inferSelect;

export type InsertWeeklyCompletion = z.infer<typeof insertWeeklyCompletionSchema>;
export type WeeklyCompletion = typeof weeklyCompletions.$inferSelect;
