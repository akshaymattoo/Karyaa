import { AuthButton } from '@/components/AuthButton';
import { CalendarTab } from '@/components/CalendarTab';
import { EmptyState } from '@/components/EmptyState';
import FeedbackModal from '@/components/FeedbackModal';
import { ScratchpadTab } from '@/components/ScratchpadTab';
import { TasksTab } from '@/components/TasksTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useFeedback } from '@/hooks/useFeedback';
import { useScratchpad } from '@/hooks/useScratchpad';
import { useTasks } from '@/hooks/useTasks';
import { Calendar, CheckCircle2, FileText, Lock, NotebookPenIcon } from 'lucide-react';
import { useState } from 'react';

export default function Home() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const { tasks, loading: tasksLoading, addTask, toggleComplete, deleteTask } = useTasks();
  const { items: scratchpadItems, loading: scratchpadLoading, addItem, deleteItem } = useScratchpad();
  const {   addFeedbackItem } = useFeedback();
  const [activeTab, setActiveTab] = useState('tasks');

  const handleAddTask = async (title: string, bucket: 'work' | 'personal', date: string) => {
    await addTask(title, bucket, date);
    toast({
      title: 'Task added',
      description: `Added to ${bucket} tasks`,
    });
  };

  const handleToggleComplete = async (taskId: string) => {
    await toggleComplete(taskId);
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
    toast({
      title: 'Task deleted',
      variant: 'destructive',
    });
  };

  const handleAddScratchpad = async (title: string) => {
    await addItem(title);
    toast({
      title: 'Idea captured',
    });
  };

  const handleDeleteScratchpad = async (itemId: string) => {
    await deleteItem(itemId);
    toast({
      title: 'Item deleted',
      variant: 'destructive',
    });
  };

  const handleEditScratchpad = async (itemId: string) => {
     
    toast({
      title: 'Item edited',
    });
  };

  const handleAddFeedback = async (itemId:string) => {
    await addFeedbackItem(itemId);
     toast({
      title: 'Feedback submitted',
    });
  }

  const handleSendToTasks = async (itemId: string, bucket: 'work' | 'personal', date: string) => {
    const item = scratchpadItems.find(i => i.id === itemId);
    if (!item) return;

    await addTask(item.title, bucket, date);
    await deleteItem(itemId);
    
    toast({
      title: 'Sent to tasks',
      description: `Added to ${bucket} tasks`,
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1">
              <NotebookPenIcon  className="h-5 w-5"/>
              <h1 className="text-xl font-semibold">Karyaa</h1>
            </div>
            <p className="text-sm text-muted-foreground">Organize your work & life</p>
          </div>
          <AuthButton />
        </div>
      </header>

      <main>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b">
            <div className="max-w-6xl mx-auto px-4 md:px-6">
              <TabsList className="h-12 bg-transparent border-0 gap-8">
                <TabsTrigger
                  value="tasks"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent"
                  data-testid="tab-tasks"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Tasks
                </TabsTrigger>
                <TabsTrigger
                  value="scratchpad"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent"
                  disabled={!user}
                  data-testid="tab-scratchpad"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Scratchpad
                  {!user && <Lock className="h-3 w-3 ml-2" />}
                </TabsTrigger>
                <TabsTrigger
                  value="calendar"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent"
                  disabled={!user}
                  data-testid="tab-calendar"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Calendar
                  {!user && <Lock className="h-3 w-3 ml-2" />}
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="tasks" className="mt-0">
            {tasksLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-pulse text-muted-foreground">Loading tasks...</div>
              </div>
            ) : (
              <TasksTab
                tasks={tasks}
                onAddTask={handleAddTask}
                onToggleComplete={handleToggleComplete}
                onDeleteTask={handleDeleteTask}
              />
            )}
          </TabsContent>

          <TabsContent value="scratchpad" className="mt-0">
            {!user ? (
              <EmptyState
                icon={Lock}
                title="Sign in to unlock Scratchpad"
                description="Capture unlimited ideas and notes. Available with a free Google account."
                actionLabel="Sign in with Google"
                onAction={signInWithGoogle}
              />
            ) : scratchpadLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-pulse text-muted-foreground">Loading scratchpad...</div>
              </div>
            ) : (
              <ScratchpadTab
                items={scratchpadItems}
                tasks={tasks}
                onAddItem={handleAddScratchpad}
                onDeleteItem={handleDeleteScratchpad}
                onSendToTasks={handleSendToTasks}
                editItem = {handleEditScratchpad}
              />
            )}
          </TabsContent>

          <TabsContent value="calendar" className="mt-0">
            {!user ? (
              <EmptyState
                icon={Lock}
                title="Sign in to view your calendar"
                description="Visualize your tasks across the month. Available with a free Google account."
                actionLabel="Sign in with Google"
                onAction={signInWithGoogle}
              />
            ) : tasksLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-pulse text-muted-foreground">Loading calendar...</div>
              </div>
            ) : (
              <CalendarTab
                tasks={tasks}
                onToggleComplete={handleToggleComplete}
                onDeleteTask={handleDeleteTask}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>

      <footer>
        <FeedbackModal onAddItem={handleAddFeedback} />
      </footer>
    </div>
  );
}
