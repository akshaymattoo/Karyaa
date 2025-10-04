import { useState } from 'react';
import { ScratchpadItem, Task } from '@shared/schema';
import { ScratchpadCard } from './ScratchpadCard';
import { EmptyState } from './EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { FileText, CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';

interface ScratchpadTabProps {
  items: ScratchpadItem[];
  tasks: Task[];
  onAddItem: (title: string) => void;
  onDeleteItem: (itemId: string) => void;
  onSendToTasks: (itemId: string, bucket: 'work' | 'personal', date: string) => void;
}

export function ScratchpadTab({ items, tasks, onAddItem, onDeleteItem, onSendToTasks }: ScratchpadTabProps) {
  const [newItemTitle, setNewItemTitle] = useState('');
  const [sendToTasksItem, setSendToTasksItem] = useState<ScratchpadItem | null>(null);
  const [selectedBucket, setSelectedBucket] = useState<'work' | 'personal'>('work');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [error, setError] = useState('');

  const activeTasks = tasks.filter(t => !t.completed);
  const remainingSlots = 8 - activeTasks.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newItemTitle.trim()) {
      setError('Idea title required');
      return;
    }

    onAddItem(newItemTitle.trim());
    setNewItemTitle('');
    setError('');
  };

  const handleSendToTasks = () => {
    if (!sendToTasksItem) return;

    if (remainingSlots === 0) {
      setError('Task limit reached. Complete or delete a task first.');
      return;
    }

    onSendToTasks(sendToTasksItem.id, selectedBucket, selectedDate.toISOString().split('T')[0]);
    setSendToTasksItem(null);
    setError('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-4">
          <div className="flex-1">
            <Label htmlFor="item-title" className="sr-only">Idea or note</Label>
            <Input
              id="item-title"
              type="text"
              placeholder="Capture an idea or note..."
              value={newItemTitle}
              onChange={(e) => {
                setNewItemTitle(e.target.value);
                setError('');
              }}
              className={error && 'border-destructive'}
              data-testid="input-scratchpad-title"
            />
            {error && <p className="text-sm text-destructive mt-1">{error}</p>}
          </div>
          <Button type="submit" className="gap-2" data-testid="button-add-scratchpad">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </form>

      {items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Your scratchpad is empty"
          description="Capture quick ideas, notes, and thoughts. Send them to your tasks when you're ready to schedule them."
        />
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <ScratchpadCard
              key={item.id}
              item={item}
              onSendToTasks={(item) => {
                setSendToTasksItem(item);
                setSelectedDate(new Date());
                setSelectedBucket('work');
              }}
              onDelete={onDeleteItem}
            />
          ))}
        </div>
      )}

      <Dialog open={!!sendToTasksItem} onOpenChange={(open) => !open && setSendToTasksItem(null)}>
        <DialogContent data-testid="dialog-send-to-tasks">
          <DialogHeader>
            <DialogTitle>Send to Tasks</DialogTitle>
            <DialogDescription>
              Schedule this item as a task. {remainingSlots} task slot{remainingSlots !== 1 ? 's' : ''} remaining.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="dialog-bucket">Bucket</Label>
              <Select value={selectedBucket} onValueChange={(value: 'work' | 'personal') => setSelectedBucket(value)}>
                <SelectTrigger id="dialog-bucket" data-testid="select-dialog-bucket">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="work">Work</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dialog-date">Date</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    data-testid="button-dialog-date"
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
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setSendToTasksItem(null)}
                data-testid="button-cancel-send"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendToTasks}
                disabled={remainingSlots === 0}
                data-testid="button-confirm-send"
              >
                Add to Tasks
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
