import { scratchpad, tasks, type InsertScratchpad, type InsertTask, type ScratchpadItem, type Task } from '@shared/schema';
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
  deleteScratchpadItem(id: string, userId: string): Promise<boolean>;
}

export class DbStorage implements IStorage {
  async getTasks(userId: string): Promise<Task[]> {
    console.log("Now fething the tasks for userId",userId);
    return await db.select().from(tasks).where(eq(tasks.userId, userId));
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(id: string, userId: string, updates: Partial<Task>): Promise<Task | undefined> {
    const [updated] = await db
      .update(tasks)
      .set(updates)
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
    console.log("Now fething the scratchpad for userId",userId);
    return await db.select().from(scratchpad).where(eq(scratchpad.userId, userId));
  }

  async createScratchpadItem(item: InsertScratchpad): Promise<ScratchpadItem> {
    const [newItem] = await db.insert(scratchpad).values(item).returning();
    return newItem;
  }

  async deleteScratchpadItem(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(scratchpad)
      .where(and(eq(scratchpad.id, id), eq(scratchpad.userId, userId)))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DbStorage();
