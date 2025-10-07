import { insertScratchpadSchema, insertTaskSchema, type Task } from "@shared/schema";
import { createClient } from "@supabase/supabase-js";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function getUserFromRequest(req: any): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) return null;
  return user.id;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all tasks for authenticated user
  app.get('/api/tasks', async (req, res) => {
    try {
      const userId = await getUserFromRequest(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const tasks = await storage.getTasks(userId);
      res.json(tasks);
    } catch (error) {
      console.error('Error fetching tasks:', JSON.stringify(error));
      res.status(500).json({ error: 'Failed to fetch tasks',msg:error });
    }
  });

  // Create a new task
  app.post('/api/tasks', async (req, res) => {
    try {
      const userId = await getUserFromRequest(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check 8-task limit per day (count ALL tasks for the target date)
      const targetDate = req.body.date;
      const existingTasks = await storage.getTasks(userId);
      const tasksForDate = existingTasks.filter(t => t.date === targetDate);
      
      if (tasksForDate.length >= 8) {
        return res.status(400).json({ error: 'Task limit reached for this day. Delete a task to add more.' });
      }

      const validatedData = insertTaskSchema.parse({ ...req.body, userId });
      const task = await storage.createTask(validatedData);
      res.json(task);
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(400).json({ error: 'Failed to create task' });
    }
  });

  // Update a task
  app.patch('/api/tasks/:id', async (req, res) => {
    try {
      const userId = await getUserFromRequest(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const task = await storage.updateTask(id, userId, req.body);
      
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json(task);
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(400).json({ error: 'Failed to update task' });
    }
  });

  // Delete a task
  app.delete('/api/tasks/:id', async (req, res) => {
    try {
      const userId = await getUserFromRequest(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const success = await storage.deleteTask(id, userId);
      
      if (!success) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  });

  // Get all scratchpad items for authenticated user
  app.get('/api/scratchpad', async (req, res) => {
    try {
      const userId = await getUserFromRequest(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const items = await storage.getScratchpad(userId);
      res.json(items);
    } catch (error) {
      console.error('Error fetching scratchpad:', JSON.stringify(error));
      res.status(500).json({ error: 'Failed to fetch scratchpad',msg:error });
    }
  });

  // Create a new scratchpad item
  app.post('/api/scratchpad', async (req, res) => {
    try {
      const userId = await getUserFromRequest(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const validatedData = insertScratchpadSchema.parse({ ...req.body, userId });
      const item = await storage.createScratchpadItem(validatedData);
      res.json(item);
    } catch (error) {
      console.error('Error creating scratchpad item:', error);
      res.status(400).json({ error: 'Failed to create scratchpad item' });
    }
  });

  // Delete a scratchpad item
  app.delete('/api/scratchpad/:id', async (req, res) => {
    try {
      const userId = await getUserFromRequest(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const success = await storage.deleteScratchpadItem(id, userId);
      
      if (!success) {
        return res.status(404).json({ error: 'Scratchpad item not found' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting scratchpad item:', error);
      res.status(500).json({ error: 'Failed to delete scratchpad item' });
    }
  });

  // Batch create tasks (for migration from localStorage)
  app.post('/api/tasks/batch', async (req, res) => {
    try {
      const userId = await getUserFromRequest(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { tasks: tasksToCreate } = req.body;
      if (!Array.isArray(tasksToCreate)) {
        return res.status(400).json({ error: 'Invalid request body' });
      }

      // Check existing tasks to enforce 8-task limit per day
      const existingTasks = await storage.getTasks(userId);
      
      // Group tasks to migrate by date
      const tasksByDate = new Map<string, typeof tasksToCreate>();
      for (const task of tasksToCreate) {
        if (!tasksByDate.has(task.date)) {
          tasksByDate.set(task.date, []);
        }
        tasksByDate.get(task.date)!.push(task);
      }
      
      const tasksToMigrate: typeof tasksToCreate = [];
      let skippedCount = 0;
      
      // For each date, enforce the 8-task limit (count ALL tasks, not just active)
      for (const [date, dateTasks] of Array.from(tasksByDate.entries())) {
        const existingTasksForDate = existingTasks.filter((t: Task) => t.date === date);
        const slotsAvailable = Math.max(0, 8 - existingTasksForDate.length);
        
        // Migrate up to available slots, prioritize completed tasks first
        const completedTasksForDate = dateTasks.filter((t: any) => t.completed);
        const activeTasksForDate = dateTasks.filter((t: any) => !t.completed);
        
        // Take completed tasks first, then active tasks to fill remaining slots
        const tasksInPriorityOrder = [...completedTasksForDate, ...activeTasksForDate];
        const tasksToMigrateForDate = tasksInPriorityOrder.slice(0, slotsAvailable);
        
        tasksToMigrate.push(...tasksToMigrateForDate);
        skippedCount += Math.max(0, dateTasks.length - slotsAvailable);
      }
      
      const createdTasks = await Promise.all(
        tasksToMigrate.map(task =>
          storage.createTask(insertTaskSchema.parse({ ...task, userId }))
        )
      );

      if (skippedCount > 0) {
        return res.json({
          tasks: createdTasks,
          warning: `Migrated ${createdTasks.length} tasks. ${skippedCount} active task(s) were skipped due to the 8-task-per-day limit.`
        });
      }

      res.json({ tasks: createdTasks });
    } catch (error) {
      console.error('Error batch creating tasks:', error);
      res.status(400).json({ error: 'Failed to batch create tasks' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
