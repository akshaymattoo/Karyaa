import { useState } from 'react';
import { Task } from '@shared/schema';
import { TaskCard } from './TaskCard';
import { EmptyState } from './EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ChevronLeft, ChevronRight, CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TasksTabProps {
  tasks: Task[];
  onAddTask: (title: string, bucket: 'work' | 'personal', date: string) => void;
  onToggleComplete: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

export function TasksTab({ tasks, onAddTask, onToggleComplete, onDeleteTask }: TasksTabProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedBucket, setSelectedBucket] = useState<'work' | 'personal'>('work');
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [filterBucket, setFilterBucket] = useState<'all' | 'work' | 'personal'>('all');
  const [viewDate, setViewDate] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [error, setError] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);

  const activeTasks = tasks.filter(t => !t.completed);
  const taskCount = activeTasks.length;
  const canAddTask = taskCount < 8;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTaskTitle.trim()) {
      setError('Task title required');
      return;
    }

    if (!canAddTask) {
      setError('Task limit reached. Complete or delete a task to add more.');
      return;
    }

    // Format date as YYYY-MM-DD in local timezone
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const localDateString = `${year}-${month}-${day}`;

    onAddTask(newTaskTitle.trim(), selectedBucket, localDateString);
    setNewTaskTitle('');
    setError('');
  };

  const filteredTasks = tasks.filter(task => {
    // Format viewDate as YYYY-MM-DD in local timezone
    const year = viewDate.getFullYear();
    const month = String(viewDate.getMonth() + 1).padStart(2, '0');
    const day = String(viewDate.getDate()).padStart(2, '0');
    const viewDateString = `${year}-${month}-${day}`;
    
    const matchesDate = task.date === viewDateString;
    const matchesBucket = filterBucket === 'all' || task.bucket === filterBucket;
    return matchesDate && matchesBucket;
  });

  const workTasks = filteredTasks.filter(t => t.bucket === 'work');
  const personalTasks = filteredTasks.filter(t => t.bucket === 'personal');

  const goToPreviousDay = () => {
    const newDate = new Date(viewDate);
    newDate.setDate(newDate.getDate() - 1);
    newDate.setHours(0, 0, 0, 0);
    setViewDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(viewDate);
    newDate.setDate(newDate.getDate() + 1);
    newDate.setHours(0, 0, 0, 0);
    setViewDate(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setViewDate(today);
  };

  // Check if viewDate is today by comparing date strings
  const isViewingToday = () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const viewStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(viewDate.getDate()).padStart(2, '0')}`;
    return todayStr === viewStr;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
      <div className={cn(
        'mb-6 p-4 rounded-md border text-sm font-medium',
        taskCount === 8 ? 'bg-destructive/10 border-destructive text-destructive' : 
        taskCount >= 7 ? 'bg-chart-3/10 border-chart-3 text-chart-3' : 
        'bg-muted border-border text-muted-foreground'
      )} data-testid="banner-task-limit">
        {taskCount === 8 ? 'Task limit reached. Complete or delete a task to add more.' : `${8 - taskCount} slot${8 - taskCount === 1 ? '' : 's'} remaining`}
      </div>

      <form onSubmit={handleSubmit} className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="task-title" className="sr-only">Task title</Label>
            <Input
              id="task-title"
              type="text"
              placeholder="Add a new task..."
              value={newTaskTitle}
              onChange={(e) => {
                setNewTaskTitle(e.target.value);
                setError('');
              }}
              className={cn('h-10', error && 'border-destructive')}
              data-testid="input-task-title"
            />
            {error && <p className="text-sm text-destructive mt-1" data-testid="text-error">{error}</p>}
          </div>

          <Select value={selectedBucket} onValueChange={(value: 'work' | 'personal') => setSelectedBucket(value)}>
            <SelectTrigger className="w-full md:w-40 h-10" data-testid="select-bucket">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="work">Work</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
            </SelectContent>
          </Select>

          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full md:w-48 h-10 justify-start gap-2"
                data-testid="button-select-date"
              >
                <CalendarIcon className="h-4 w-4" />
                <span className="font-mono text-sm">{format(selectedDate, 'MMM d, yyyy')}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                    setCalendarOpen(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button type="submit" className="h-10 gap-2" disabled={!canAddTask} data-testid="button-add-task">
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </div>
      </form>

      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousDay}
            data-testid="button-previous-day"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant={isViewingToday() ? 'default' : 'outline'}
            onClick={goToToday}
            className="min-w-24"
            data-testid="button-today"
          >
            {isViewingToday() ? 'Today' : format(viewDate, 'MMM d')}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextDay}
            data-testid="button-next-day"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant={filterBucket === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterBucket('all')}
            data-testid="filter-all"
          >
            All
          </Button>
          <Button
            variant={filterBucket === 'work' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterBucket('work')}
            data-testid="filter-work"
          >
            Work
          </Button>
          <Button
            variant={filterBucket === 'personal' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterBucket('personal')}
            data-testid="filter-personal"
          >
            Personal
          </Button>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No tasks for this day"
          description={`No ${filterBucket === 'all' ? '' : filterBucket + ' '}tasks scheduled for ${format(viewDate, 'MMMM d, yyyy')}.`}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filterBucket === 'all' && (
            <>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium">Work</h3>
                  <Badge variant="secondary" className="text-xs">{workTasks.length}</Badge>
                </div>
                <div className="space-y-3">
                  {workTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No work tasks</p>
                  ) : (
                    workTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggleComplete={onToggleComplete}
                        onDelete={onDeleteTask}
                      />
                    ))
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium">Personal</h3>
                  <Badge variant="secondary" className="text-xs">{personalTasks.length}</Badge>
                </div>
                <div className="space-y-3">
                  {personalTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No personal tasks</p>
                  ) : (
                    personalTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggleComplete={onToggleComplete}
                        onDelete={onDeleteTask}
                      />
                    ))
                  )}
                </div>
              </div>
            </>
          )}
          {filterBucket !== 'all' && (
            <div className="md:col-span-3">
              <div className="space-y-3">
                {filteredTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleComplete={onToggleComplete}
                    onDelete={onDeleteTask}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
