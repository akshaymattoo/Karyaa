import type { Task, ScratchpadItem } from '@shared/schema';

const TASKS_KEY = 'taskflow_tasks';
const SCRATCHPAD_KEY = 'taskflow_scratchpad';

export const localStorage = {
  getTasks(): Task[] {
    try {
      const data = window.localStorage.getItem(TASKS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveTasks(tasks: Task[]): void {
    try {
      window.localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Failed to save tasks to localStorage', error);
    }
  },

  getScratchpad(): ScratchpadItem[] {
    try {
      const data = window.localStorage.getItem(SCRATCHPAD_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveScratchpad(items: ScratchpadItem[]): void {
    try {
      window.localStorage.setItem(SCRATCHPAD_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save scratchpad to localStorage', error);
    }
  },

  clear(): void {
    window.localStorage.removeItem(TASKS_KEY);
    window.localStorage.removeItem(SCRATCHPAD_KEY);
  }
};
