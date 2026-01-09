import { feedback, FeedbackItem, InsertFeedback, InsertWeeklyActivity, InsertWeeklyCompletion, pushSubscriptions, scratchpad, tasks, userSettings, weeklyActivities, weeklyCompletions, WeeklyActivity, WeeklyCompletion, type InsertPushSubscription, type InsertScratchpad, type InsertTask, type InsertUserSettings, type PushSubscription, type ScratchpadItem, type Task, type UserSettings } from '@shared/schema';
import { and, desc, eq, gte, lte } from 'drizzle-orm';
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

  // Weekly Activities (week-scoped)
  getWeeklyActivities(userId: string, weekStart: string): Promise<WeeklyActivity[]>;
  createWeeklyActivity(activity: InsertWeeklyActivity): Promise<WeeklyActivity>;
  updateWeeklyActivity(id: string, userId: string, updates: Partial<WeeklyActivity>): Promise<WeeklyActivity | undefined>;
  deleteWeeklyActivity(id: string, userId: string): Promise<boolean>;
  copyActivitiesFromPreviousWeek(userId: string, targetWeekStart: string, sourceWeekStart: string): Promise<WeeklyActivity[]>;

  // Weekly Completions
  getWeeklyCompletions(userId: string, startDate: string, endDate: string): Promise<WeeklyCompletion[]>;
  createWeeklyCompletion(completion: InsertWeeklyCompletion): Promise<WeeklyCompletion>;
  deleteWeeklyCompletion(id: string, userId: string): Promise<boolean>;
  deleteWeeklyCompletionByActivityAndDate(activityId: string, userId: string, date: string): Promise<boolean>;
}

export class DbStorage implements IStorage {
  async getTasks(userId: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.createdAt));
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
    return await db.select().from(scratchpad).where(eq(scratchpad.userId, userId)).orderBy(desc(scratchpad.createdAt));
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

  // Weekly Activities (week-scoped)
  async getWeeklyActivities(userId: string, weekStart: string): Promise<WeeklyActivity[]> {
    return await db.select().from(weeklyActivities)
      .where(and(eq(weeklyActivities.userId, userId), eq(weeklyActivities.weekStart, weekStart)))
      .orderBy(desc(weeklyActivities.createdAt));
  }

  async createWeeklyActivity(activity: InsertWeeklyActivity): Promise<WeeklyActivity> {
    const [newActivity] = await db.insert(weeklyActivities).values(activity).returning();
    return newActivity;
  }

  async updateWeeklyActivity(id: string, userId: string, updates: Partial<WeeklyActivity>): Promise<WeeklyActivity | undefined> {
    const updateData: Partial<WeeklyActivity> = {
      ...updates,
      updatedAt: new Date(),
    };
    const [updated] = await db
      .update(weeklyActivities)
      .set(updateData)
      .where(and(eq(weeklyActivities.id, id), eq(weeklyActivities.userId, userId)))
      .returning();
    return updated;
  }

  async deleteWeeklyActivity(id: string, userId: string): Promise<boolean> {
    // Also delete all completions for this activity
    await db.delete(weeklyCompletions).where(eq(weeklyCompletions.activityId, id));
    
    const result = await db
      .delete(weeklyActivities)
      .where(and(eq(weeklyActivities.id, id), eq(weeklyActivities.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async copyActivitiesFromPreviousWeek(userId: string, targetWeekStart: string, sourceWeekStart: string): Promise<WeeklyActivity[]> {
    const sourceActivities = await this.getWeeklyActivities(userId, sourceWeekStart);
    const newActivities: WeeklyActivity[] = [];
    
    for (const activity of sourceActivities) {
      const newActivity = await this.createWeeklyActivity({
        userId: activity.userId,
        weekStart: targetWeekStart,
        title: activity.title,
        targetCount: activity.targetCount,
        category: activity.category,
      });
      newActivities.push(newActivity);
    }
    
    return newActivities;
  }

  // Weekly Completions
  async getWeeklyCompletions(userId: string, startDate: string, endDate: string): Promise<WeeklyCompletion[]> {
    return await db
      .select()
      .from(weeklyCompletions)
      .where(
        and(
          eq(weeklyCompletions.userId, userId),
          gte(weeklyCompletions.date, startDate),
          lte(weeklyCompletions.date, endDate)
        )
      );
  }

  async createWeeklyCompletion(completion: InsertWeeklyCompletion): Promise<WeeklyCompletion> {
    const [newCompletion] = await db.insert(weeklyCompletions).values(completion).returning();
    return newCompletion;
  }

  async deleteWeeklyCompletion(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(weeklyCompletions)
      .where(and(eq(weeklyCompletions.id, id), eq(weeklyCompletions.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async deleteWeeklyCompletionByActivityAndDate(activityId: string, userId: string, date: string): Promise<boolean> {
    const result = await db
      .delete(weeklyCompletions)
      .where(
        and(
          eq(weeklyCompletions.activityId, activityId),
          eq(weeklyCompletions.userId, userId),
          eq(weeklyCompletions.date, date)
        )
      )
      .returning();
    return result.length > 0;
  }
}

export const storage = new DbStorage();
