import { ScratchpadItem } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { ArrowRight, Trash2 } from 'lucide-react';

interface ScratchpadCardProps {
  item: ScratchpadItem;
  onSendToTasks: (item: ScratchpadItem) => void;
  onDelete: (itemId: string) => void;
}

export function ScratchpadCard({ item, onSendToTasks, onDelete }: ScratchpadCardProps) {
  return (
    <div
      className="group flex items-start justify-between gap-3 p-4 rounded-md border bg-card hover-elevate transition-all"
      data-testid={`scratchpad-card-${item.id}`}
    >
      <div className="flex-1 min-w-0">
        <div className="text-base">{item.title}</div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          onClick={() => onSendToTasks(item)}
          variant="ghost"
          size="sm"
          className="gap-1"
          data-testid={`button-send-to-tasks-${item.id}`}
        >
          <ArrowRight className="h-4 w-4" />
          Send to Tasks
        </Button>
        <Button
          onClick={() => onDelete(item.id)}
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:text-destructive"
          data-testid={`button-delete-scratchpad-${item.id}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
