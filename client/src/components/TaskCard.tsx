import { Task } from '@shared/schema';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onEdit?: (task: Task) => void;
}

export function TaskCard({ task, onToggleComplete, onDelete, onEdit }: TaskCardProps) {
  const isEditable = Boolean(onEdit) && !task.completed;

  const handleCardClick = () => {
    if (isEditable && onEdit) {
      onEdit(task);
    }
  };

  return (
    <div
      className={cn(
        'group flex w-full items-start gap-3 p-4 rounded-md border bg-card hover-elevate transition-all',
        task.completed && 'opacity-60',
        isEditable ? 'cursor-pointer' : 'cursor-default'
      )}
      data-testid={`task-card-${task.id}`}
      role={isEditable ? 'button' : undefined}
      tabIndex={isEditable ? 0 : undefined}
      aria-disabled={!isEditable}
      onClick={handleCardClick}
      onKeyDown={(event) => {
        if (!isEditable) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleCardClick();
        }
      }}
    >
      <Checkbox
        checked={task.completed}
        onCheckedChange={() => onToggleComplete(task.id)}
        onClick={(event) => event.stopPropagation()}
        data-testid={`checkbox-task-${task.id}`}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            'text-base font-medium break-words whitespace-pre-wrap',
            task.completed && 'line-through text-muted-foreground'
          )}
        >
          {task.title}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge
            variant={task.bucket === 'work' ? 'default' : 'secondary'}
            className="text-xs"
            data-testid={`badge-bucket-${task.bucket}`}
          >
            {task.bucket === 'work' ? 'Work' : 'Personal'}
          </Badge>
          <span className="text-xs font-mono text-muted-foreground" data-testid="text-task-date">
            {(() => {
              const [year, month, day] = task.date.split('-').map(Number);
              return format(new Date(year, month - 1, day), 'MMM d, yyyy');
            })()}
          </span>
        </div>
      </div>
      {onDelete && (
        <button
          onClick={(event) => {
            event.stopPropagation();
            onDelete(task.id);
          }}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
          data-testid={`button-delete-task-${task.id}`}
        >
          ×
        </button>
      )}
    </div>
  );
}
