import { useState } from 'react';
import { Task } from '@shared/schema';
import { TaskCard } from './TaskCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface CalendarTabProps {
  tasks: Task[];
  onToggleComplete: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

export function CalendarTab({ tasks, onToggleComplete, onDeleteTask }: CalendarTabProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const firstDayOfWeek = monthStart.getDay();
  const daysToShow = [...Array(firstDayOfWeek).fill(null), ...daysInMonth];

  const getTasksForDay = (day: Date) => {
    // Format day as YYYY-MM-DD in local timezone
    const year = day.getFullYear();
    const month = String(day.getMonth() + 1).padStart(2, '0');
    const dayNum = String(day.getDate()).padStart(2, '0');
    const dayString = `${year}-${month}-${dayNum}`;
    
    return tasks.filter(task => task.date === dayString);
  };

  const selectedDayTasks = selectedDay ? getTasksForDay(selectedDay) : [];
  const workTasks = selectedDayTasks.filter(t => t.bucket === 'work');
  const personalTasks = selectedDayTasks.filter(t => t.bucket === 'personal');

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousMonth}
            data-testid="button-previous-month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={goToToday}
            data-testid="button-current-month"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextMonth}
            data-testid="button-next-month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground p-2">
            {day}
          </div>
        ))}

        {daysToShow.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dayTasks = getTasksForDay(day);
          const workCount = dayTasks.filter(t => t.bucket === 'work').length;
          const personalCount = dayTasks.filter(t => t.bucket === 'personal').length;
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isDayToday = isToday(day);
          const isSelected = selectedDay && isSameDay(day, selectedDay);

          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDay(day)}
              className={cn(
                'aspect-square p-2 rounded-md border transition-colors text-left relative hover-elevate',
                !isCurrentMonth && 'opacity-40',
                isDayToday && 'border-primary border-2',
                isSelected && 'bg-primary text-primary-foreground'
              )}
              data-testid={`calendar-day-${format(day, 'yyyy-MM-dd')}`}
            >
              <div className={cn('text-sm font-medium', isSelected && 'text-primary-foreground')}>
                {format(day, 'd')}
              </div>
              {(workCount > 0 || personalCount > 0) && (
                <div className="flex gap-1 mt-1 flex-wrap">
                  {workCount > 0 && (
                    <Badge variant="default" className="text-[10px] h-4 px-1" data-testid="badge-work-count">
                      W:{workCount}
                    </Badge>
                  )}
                  {personalCount > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-4 px-1" data-testid="badge-personal-count">
                      P:{personalCount}
                    </Badge>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <Sheet open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto" data-testid="sheet-day-details">
          {selectedDay && (
            <>
              <SheetHeader>
                <SheetTitle>{format(selectedDay, 'EEEE, MMMM d, yyyy')}</SheetTitle>
                <SheetDescription>
                  {selectedDayTasks.length} task{selectedDayTasks.length !== 1 ? 's' : ''} scheduled
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
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
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
