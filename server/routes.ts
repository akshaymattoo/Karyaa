import { insertFeedbackSchema, insertPushSubscriptionSchema, insertScratchpadSchema, insertTaskSchema, insertUserSettingsSchema, type Task } from "@shared/schema";
import { createClient } from "@supabase/supabase-js";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import webpush from "web-push";

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  '';

const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase URL / service key missing. Authenticated routes will fail.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

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
      res.status(400).json({ error: 'Failed to create scratchpad item' });
    }
  });

  // Update a scratchpad item
  app.patch('/api/scratchpad/:id', async (req, res) => {
    try {
      const userId = await getUserFromRequest(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const { title } = req.body;

      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ error: 'Invalid scratchpad title' });
      }
       

      const updatedItem = await storage.updateScratchpadItem(id, userId, { title: title.trim() });
      
      if (!updatedItem) {
        return res.status(404).json({ error: 'Scratchpad item not found' });
      }

      res.json(updatedItem);
    } catch (error) {
      console.error('Error updating scratchpad item:', error);
      res.status(400).json({ error: 'Failed to update scratchpad item' });
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

  //add feedback
  app.post('/api/feedback' , async (req,res) => {
    try {
      const validatedData = insertFeedbackSchema.parse({ ...req.body });
      const item = await storage.createFeedbackItem(validatedData);
      res.json(item);
    } catch(error){
      res.status(400).json({ error: 'Failed to create feedback item' });
    }
  });

  // Get VAPID public key
  app.get('/api/push/vapid-public-key', (req, res) => {
    const publicKey = process.env.VAPID_PUBLIC_KEY || '';
    if (!publicKey) {
      return res.status(500).json({ error: 'VAPID public key not configured' });
    }
    res.json({ publicKey });
  });

  // Subscribe to push notifications
  app.post('/api/push/subscribe', async (req, res) => {
    try {
      const userId = await getUserFromRequest(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { endpoint, keys } = req.body;
      if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
        return res.status(400).json({ error: 'Invalid subscription data' });
      }

      const validatedData = insertPushSubscriptionSchema.parse({
        userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      });

      const subscription = await storage.createPushSubscription(validatedData);
      res.json(subscription);
    } catch (error) {
      console.error('Error subscribing to push:', error);
      res.status(400).json({ error: 'Failed to subscribe to push notifications' });
    }
  });

  // Unsubscribe from push notifications
  app.post('/api/push/unsubscribe', async (req, res) => {
    try {
      const userId = await getUserFromRequest(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { endpoint } = req.body;
      if (!endpoint) {
        return res.status(400).json({ error: 'Endpoint required' });
      }

      const success = await storage.deletePushSubscription(endpoint, userId);
      res.json({ success });
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      res.status(500).json({ error: 'Failed to unsubscribe from push notifications' });
    }
  });

  // Send push notification (test endpoint)
  app.post('/api/push/send', async (req, res) => {
    try {
      const userId = await getUserFromRequest(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { title, body } = req.body;
      if (!title || !body) {
        return res.status(400).json({ error: 'Title and body required' });
      }

      const subscriptions = await storage.getPushSubscriptions(userId);
      
      if (subscriptions.length === 0) {
        return res.status(400).json({ error: 'No push subscriptions found' });
      }

      const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
      const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
      const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@karyaa.app';

      if (!vapidPublicKey || !vapidPrivateKey) {
        return res.status(500).json({ error: 'VAPID keys not configured' });
      }

      webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);

      const payload = JSON.stringify({ title, body });

      const results = await Promise.allSettled(
        subscriptions.map(sub =>
          webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            payload
          )
        )
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      res.json({ 
        success: true, 
        sent: successful,
        failed,
        total: subscriptions.length 
      });
    } catch (error) {
      console.error('Error sending push notification:', error);
      res.status(500).json({ error: 'Failed to send push notification' });
    }
  });

  // Get user settings
  app.get('/api/settings', async (req, res) => {
    try {
      const userId = await getUserFromRequest(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      let settings = await storage.getUserSettings(userId);
      
      if (!settings) {
        settings = await storage.createOrUpdateUserSettings(userId, {});
      }

      res.json(settings);
    } catch (error) {
      console.error('Error fetching user settings:', error);
      res.status(500).json({ error: 'Failed to fetch user settings' });
    }
  });

  // Update user settings
  app.patch('/api/settings', async (req, res) => {
    try {
      const userId = await getUserFromRequest(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { reminderTime, reminderEnabled } = req.body;
      
      const updates: Partial<{ reminderTime: string; reminderEnabled: boolean }> = {};
      
      if (reminderTime !== undefined) {
        if (typeof reminderTime !== 'string' || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(reminderTime)) {
          return res.status(400).json({ error: 'Invalid reminder time format. Use HH:mm (24-hour format)' });
        }
        updates.reminderTime = reminderTime;
      }
      
      if (reminderEnabled !== undefined) {
        if (typeof reminderEnabled !== 'boolean') {
          return res.status(400).json({ error: 'reminderEnabled must be a boolean' });
        }
        updates.reminderEnabled = reminderEnabled;
      }
      
      const updatedSettings = await storage.createOrUpdateUserSettings(userId, updates);

      res.json(updatedSettings);
    } catch (error) {
      console.error('Error updating user settings:', error);
      res.status(400).json({ error: 'Failed to update user settings' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
