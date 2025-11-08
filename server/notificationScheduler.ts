import { storage } from './storage';
import webpush from 'web-push';

interface NotificationCheckState {
  lastCheckedDate: string;
  notifiedUsers: Set<string>;
}

const state: NotificationCheckState = {
  lastCheckedDate: new Date().toISOString().split('T')[0],
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
      console.warn('VAPID keys not configured. Skipping notification send.');
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
    console.log(`Sent reminder to user ${userId}: ${successful}/${subscriptions.length} subscriptions`);
    
    return successful > 0;
  } catch (error) {
    console.error(`Error sending reminder to user ${userId}:`, error);
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
    const currentDate = new Date().toISOString().split('T')[0];
    
    if (currentDate !== state.lastCheckedDate) {
      state.lastCheckedDate = currentDate;
      state.notifiedUsers.clear();
    }

    const currentTime = getCurrentTimeInHHMM();
    
    const allSettings = await storage.getAllUsersWithSettings();
    
    for (const userSetting of allSettings) {
      if (!userSetting.reminderEnabled) {
        continue;
      }

      if (state.notifiedUsers.has(userSetting.userId)) {
        continue;
      }

      if (userSetting.reminderTime === currentTime) {
        const sent = await sendReminderToUser(userSetting.userId);
        if (sent) {
          state.notifiedUsers.add(userSetting.userId);
        }
      }
    }
  } catch (error) {
    console.error('Error in notification scheduler:', error);
  }
}

export function startNotificationScheduler(): void {
  console.log('Starting notification scheduler...');
  
  setInterval(checkAndSendReminders, 60 * 1000);
  
  checkAndSendReminders();
}
