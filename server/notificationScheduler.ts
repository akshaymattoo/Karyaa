import { storage } from './storage';
import webpush from 'web-push';

interface NotificationCheckState {
  lastCheckedDate: string;
  lastCheckedMinute: string;
  notifiedUsers: Set<string>;
}

const state: NotificationCheckState = {
  lastCheckedDate: new Date().toISOString().split('T')[0],
  lastCheckedMinute: '',
  notifiedUsers: new Set(),
};

async function sendReminderToUser(userId: string): Promise<boolean> {
  try {
    const tasks = await storage.getTasks(userId);
    const today = new Date().toISOString().split('T')[0];
    
    const incompleteTasks = tasks.filter(task => 
      task.date === today && !task.completed
    );

    if (incompleteTasks.length === 0) {
      return false;
    }

    const subscriptions = await storage.getPushSubscriptions(userId);
    
    if (subscriptions.length === 0) {
      return false;
    }

    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
    const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@karyaa.app';

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn('[Scheduler] VAPID keys not configured. Skipping notification send.');
      return false;
    }

    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);

    const taskCount = incompleteTasks.length;
    const taskWord = taskCount === 1 ? 'task' : 'tasks';
    const payload = JSON.stringify({
      title: 'Task Reminder',
      body: `You have ${taskCount} incomplete ${taskWord} for today!`,
    });

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
    
    if (successful > 0) {
      console.log(`[Scheduler] Sent reminder to user ${userId}: ${successful}/${subscriptions.length} subscriptions`);
      await storage.createOrUpdateUserSettings(userId, {
        lastReminderSent: new Date(),
      });
      return true;
    } else {
      console.warn(`[Scheduler] Failed to send reminder to user ${userId}: 0/${subscriptions.length} subscriptions succeeded`);
      return false;
    }
  } catch (error) {
    console.error(`[Scheduler] Error sending reminder to user ${userId}:`, error);
    return false;
  }
}

function getCurrentTimeInHHMM(): string {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

async function checkAndSendReminders(): Promise<void> {
  try {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = getCurrentTimeInHHMM();
    
    if (currentDate !== state.lastCheckedDate) {
      console.log(`[Scheduler] New day detected: ${currentDate}`);
      state.lastCheckedDate = currentDate;
      state.notifiedUsers.clear();
      state.lastCheckedMinute = '';
    }

    if (state.lastCheckedMinute === currentTime) {
      return;
    }
    
    state.lastCheckedMinute = currentTime;
    
    const allSettings = await storage.getAllUsersWithSettings();
    
    let scheduledCount = 0;
    let sentCount = 0;
    
    for (const userSetting of allSettings) {
      if (!userSetting.reminderEnabled) {
        continue;
      }

      if (userSetting.reminderTime !== currentTime) {
        continue;
      }

      if (userSetting.lastReminderSent) {
        const lastSentDate = new Date(userSetting.lastReminderSent).toISOString().split('T')[0];
        if (lastSentDate === currentDate) {
          continue;
        }
      }

      scheduledCount++;
      const sent = await sendReminderToUser(userSetting.userId);
      if (sent) {
        state.notifiedUsers.add(userSetting.userId);
        sentCount++;
      }
    }
    
    if (scheduledCount > 0) {
      console.log(`[Scheduler] ${currentTime}: Sent ${sentCount}/${scheduledCount} scheduled reminders`);
    }
  } catch (error) {
    console.error('[Scheduler] Error in notification scheduler:', error);
  }
}

export function startNotificationScheduler(): void {
  console.log('[Scheduler] Starting notification scheduler (checks every minute)...');
  console.log('[Scheduler] Note: Reminders use server timezone. Ensure server timezone matches target audience.');
  
  setInterval(checkAndSendReminders, 60 * 1000);
  
  checkAndSendReminders();
}
