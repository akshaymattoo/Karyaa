import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { localStorage as localStorageService } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { InsertTask, Task } from '@shared/schema';
import { useEffect, useState } from 'react';

export function useTasks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrated, setMigrated] = useState(false);

  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      
      if (user) {
        try {
          const session = await supabase.auth.getSession();
          const token = session.data.session?.access_token;

          if (!token) {
            setLoading(false);
            return;
          }

          const response = await fetch('/api/tasks', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setTasks(data);
            localStorageService.saveTasks(data);
          }
        } catch (error) {
          console.error('Error loading tasks:', error);
          const localTasks = localStorageService.getTasks();
          setTasks(localTasks);
        }
      } else {
        const localTasks = localStorageService.getTasks();
        setTasks(localTasks);
      }
      
      setLoading(false);
    };

    loadTasks();
  }, [user]);


  /*
  useEffect(() => {
    const migrateLocalData = async () => {
      if (!user || migrated) return;

      const localTasks = localStorageService.getTasks();
      if (localTasks.length === 0) {
        setMigrated(true);
        return;
      }

      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;

        if (!token) return;

        const tasksToMigrate = localTasks.map(task => ({
          title: task.title,
          bucket: task.bucket,
          date: task.date,
          completed: task.completed,
          userId: user.id,
        }));

        const response = await fetch('/api/tasks/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ tasks: tasksToMigrate }),
        });

        if (response.ok) {
          const result = await response.json();
          const migratedTasks = result.tasks || result;
          setTasks(migratedTasks);
          localStorageService.clear();
          
          if (result.warning) {
            toast({
              title: 'Data synced with limit',
              description: result.warning,
              variant: 'default',
            });
          } else {
            toast({
              title: 'Data synced',
              description: `${migratedTasks.length} task${migratedTasks.length !== 1 ? 's' : ''} migrated to the cloud`,
            });
          }
        }
      } catch (error) {
        console.error('Error migrating tasks:', error);
      }

      setMigrated(true);
    };

    migrateLocalData();
  }, [user, migrated, toast]);
*/

  const addTask = async (title: string, bucket: 'work' | 'personal', date: string) => {
    const newTask: InsertTask = {
      userId: user?.id || 'local',
      title,
      bucket,
      date,
      completed: false,
    };

    if (user) {
      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;

        if (!token) {
          throw new Error('No auth token');
        }

        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(newTask),
        });

        if (response.ok) {
          const createdTask = await response.json();
          const updatedTasks = [...tasks, createdTask];
          setTasks(updatedTasks);
          localStorageService.saveTasks(updatedTasks);
          return createdTask;
        }
      } catch (error) {
        console.error('Error creating task:', error);
        toast({
          title: 'Error',
          description: 'Failed to create task. Please try again.',
          variant: 'destructive',
        });
      }
    } else {
      const timestamp = new Date();
      const localTask: Task = {
        ...newTask,
        id: crypto.randomUUID(),
        completed: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      const updatedTasks = [...tasks, localTask];
      setTasks(updatedTasks);
      localStorageService.saveTasks(updatedTasks);
      return localTask;
    }
  };

  const toggleComplete = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedTask = { ...task, completed: !task.completed, updatedAt: new Date() };

    if (user) {
      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;

        if (!token) {
          throw new Error('No auth token');
        }

        const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ completed: updatedTask.completed }),
        });

        if (response.ok) {
          const updated = await response.json();
          const updatedTasks = tasks.map(t => t.id === taskId ? updated : t);
          setTasks(updatedTasks);
          localStorageService.saveTasks(updatedTasks);
        }
      } catch (error) {
        console.error('Error updating task:', error);
      }
    } else {
      const updatedTasks = tasks.map(t => t.id === taskId ? updatedTask : t);
      setTasks(updatedTasks);
      localStorageService.saveTasks(updatedTasks);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (user) {
      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;

        if (!token) {
          throw new Error('No auth token');
        }

        const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const updatedTasks = tasks.filter(t => t.id !== taskId);
          setTasks(updatedTasks);
          localStorageService.saveTasks(updatedTasks);
        }
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    } else {
      const updatedTasks = tasks.filter(t => t.id !== taskId);
      setTasks(updatedTasks);
      localStorageService.saveTasks(updatedTasks);
    }
  };

  return {
    tasks,
    loading,
    addTask,
    toggleComplete,
    deleteTask,
  };
}
