import { feedback, FeedbackItem, InsertFeedback, pushSubscriptions, scratchpad, tasks, userSettings, type InsertPushSubscription, type InsertScratchpad, type InsertTask, type InsertUserSettings, type PushSubscription, type ScratchpadItem, type Task, type UserSettings } from '@shared/schema';
import { and, eq } from 'drizzle-orm';
import { db } from './db';

export interface IStorage {
  // Tasks
  getTasks(userId: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, userId: string, updates: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: string, userId: string): Promise<boolean>;

  // Scratchpad
  getScratchpad(userId: string): Promise<ScratchpadItem[]>;
  createScratchpadItem(item: InsertScratchpad): Promise<ScratchpadItem>;
  updateScratchpadItem(id: string, userId: string, updates: Partial<ScratchpadItem>): Promise<ScratchpadItem | undefined>;
  deleteScratchpadItem(id: string, userId: string): Promise<boolean>;

  // feedback
  createFeedbackItem(item: InsertFeedback): Promise<FeedbackItem>;

  // Push Subscriptions
  getPushSubscriptions(userId: string): Promise<PushSubscription[]>;
  createPushSubscription(subscription: InsertPushSubscription): Promise<PushSubscription>;
  deletePushSubscription(endpoint: string, userId: string): Promise<boolean>;
  getAllPushSubscriptions(): Promise<PushSubscription[]>;

  // User Settings
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  createOrUpdateUserSettings(userId: string, settings: Partial<InsertUserSettings> & { lastReminderSent?: Date }): Promise<UserSettings>;
  getAllUsersWithSettings(): Promise<UserSettings[]>;
}

export class DbStorage implements IStorage {
  async getTasks(userId: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.userId, userId));
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(id: string, userId: string, updates: Partial<Task>): Promise<Task | undefined> {
    const updateData: Partial<Task> = {
      ...updates,
      updatedAt: new Date(),
    };
    const [updated] = await db
      .update(tasks)
      .set(updateData)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();
    return updated;
  }

  async deleteTask(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async getScratchpad(userId: string): Promise<ScratchpadItem[]> {
    return await db.select().from(scratchpad).where(eq(scratchpad.userId, userId));
  }

  async createScratchpadItem(item: InsertScratchpad): Promise<ScratchpadItem> {
    const [newItem] = await db.insert(scratchpad).values(item).returning();
    return newItem;
  }

  async updateScratchpadItem(id: string, userId: string, updates: Partial<ScratchpadItem>): Promise<ScratchpadItem | undefined> {
    const [updated] = await db
      .update(scratchpad)
      .set(updates)
      .where(and(eq(scratchpad.id, id), eq(scratchpad.userId, userId)))
      .returning();

    return updated;
  }

  async deleteScratchpadItem(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(scratchpad)
      .where(and(eq(scratchpad.id, id), eq(scratchpad.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async createFeedbackItem(item: InsertFeedback): Promise<FeedbackItem> {
    const [newItem]  = await db
      .insert(feedback)
      .values(item).returning();
      return newItem;
  }

  async getPushSubscriptions(userId: string): Promise<PushSubscription[]> {
    return await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  }

  async createPushSubscription(subscription: InsertPushSubscription): Promise<PushSubscription> {
    const [newSubscription] = await db.insert(pushSubscriptions).values(subscription).returning();
    return newSubscription;
  }

  async deletePushSubscription(endpoint: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(pushSubscriptions)
      .where(and(eq(pushSubscriptions.endpoint, endpoint), eq(pushSubscriptions.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async getAllPushSubscriptions(): Promise<PushSubscription[]> {
    return await db.select().from(pushSubscriptions);
  }

  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return settings;
  }

  async createOrUpdateUserSettings(userId: string, settings: Partial<InsertUserSettings> & { lastReminderSent?: Date }): Promise<UserSettings> {
    const existing = await this.getUserSettings(userId);
    
    if (existing) {
      const [updated] = await db
        .update(userSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(userSettings.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(userSettings)
        .values({ userId, ...settings })
        .returning();
      return created;
    }
  }

  async getAllUsersWithSettings(): Promise<UserSettings[]> {
    return await db.select().from(userSettings);
  }
}

export const storage = new DbStorage();
