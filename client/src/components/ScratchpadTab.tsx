import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScratchpadItem, Task } from '@shared/schema';
import { format } from 'date-fns';
import { CalendarIcon, FileText, Plus } from 'lucide-react';
import { type ChangeEvent, type KeyboardEvent, useRef, useState } from 'react';
import { EmptyState } from './EmptyState';
import { ScratchpadCard } from './ScratchpadCard';
import { AutoResizeTextarea } from '@/components/ui/auto-resize-textarea';
import { EmojiPicker } from '@/components/EmojiPicker';
import {
  findActiveShortcode,
  replaceEmojiShortcodes,
  replaceShortcodeSegment,
  searchEmojiShortcodes,
  type EmojiDefinition,
} from '@/lib/emoji';
import { cn } from '@/lib/utils';

interface ScratchpadTabProps {
  items: ScratchpadItem[];
  tasks: Task[];
  onAddItem: (title: string) => void;
  onDeleteItem: (itemId: string) => void;
  editItem: (itemId: string) => void;
  onSendToTasks: (itemId: string, bucket: 'work' | 'personal', date: string) => void;
}

export function ScratchpadTab({ items, tasks, onAddItem, onDeleteItem, onSendToTasks,editItem }: ScratchpadTabProps) {
  const [newItemTitle, setNewItemTitle] = useState('');
  const [sendToTasksItem, setSendToTasksItem] = useState<ScratchpadItem | null>(null);
  const [selectedBucket, setSelectedBucket] = useState<'work' | 'personal'>('work');
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [emojiSuggestions, setEmojiSuggestions] = useState<EmojiDefinition[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [activeShortcode, setActiveShortcode] = useState<{ start: number; end: number; query: string } | null>(null);
  const suggestionsVisible = emojiSuggestions.length > 0;

  // Calculate remaining slots for the selected date (count ALL tasks, not just active)
  const getTasksForDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    return tasks.filter(t => t.date === dateString);
  };

  const tasksForSelectedDate = getTasksForDate(selectedDate);
  const remainingSlots = 8 - tasksForSelectedDate.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let workingTitle = newItemTitle;
    if (activeShortcode && emojiSuggestions.length > 0) {
      const candidate = emojiSuggestions[activeSuggestionIndex] ?? emojiSuggestions[0];
      const replaced = replaceShortcodeSegment(
        workingTitle,
        { start: activeShortcode.start, end: activeShortcode.end },
        candidate.emoji,
      );
      workingTitle = replaced.text;
    }

    const { text } = replaceEmojiShortcodes(workingTitle);
    const normalized = text.trim();

    if (!normalized) {
      setError('Idea title required');
      return;
    }
    onAddItem(normalized);
    setNewItemTitle('');
    setError('');
    clearEmojiSuggestions();
  };

  const handleSendToTasks = () => {
    if (!sendToTasksItem) return;

    if (remainingSlots === 0) {
      setError(`Task limit reached for ${format(selectedDate, 'MMM d')}. Delete a task first.`);
      return;
    }

    // Format date as YYYY-MM-DD in local timezone
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const localDateString = `${year}-${month}-${day}`;

    onSendToTasks(sendToTasksItem.id, selectedBucket, localDateString);
    setSendToTasksItem(null);
    setError('');
  };

  const clearEmojiSuggestions = () => {
    setEmojiSuggestions([]);
    setActiveSuggestionIndex(0);
    setActiveShortcode(null);
  };

  const updateEmojiSuggestions = (text: string, caretPosition: number) => {
    const shortcode = findActiveShortcode(text, caretPosition);

    if (!shortcode) {
      clearEmojiSuggestions();
      return;
    }

    const matches = searchEmojiShortcodes(shortcode.query);

    if (matches.length === 0) {
      clearEmojiSuggestions();
      return;
    }

    setEmojiSuggestions(matches);
    setActiveShortcode(shortcode);
    setActiveSuggestionIndex((prev) => Math.min(prev, matches.length - 1));
  };

  const handleTextareaChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const { value, selectionStart } = event.target;
    const { text, caretPosition } = replaceEmojiShortcodes(
      value,
      selectionStart ?? value.length,
    );

    setNewItemTitle(text);
    setError('');
    updateEmojiSuggestions(text, caretPosition);

    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.setSelectionRange(caretPosition, caretPosition);
      }
    });
  };

  const handleInsertEmoji = (emoji: string) => {
    clearEmojiSuggestions();
    const textarea = textareaRef.current;
    if (!textarea) {
      setNewItemTitle(prev => prev + emoji);
      return;
    }

    const selectionStart = textarea.selectionStart ?? newItemTitle.length;
    const selectionEnd = textarea.selectionEnd ?? newItemTitle.length;

    const newValue =
      newItemTitle.slice(0, selectionStart) + emoji + newItemTitle.slice(selectionEnd);

    setNewItemTitle(newValue);
    setError('');

    requestAnimationFrame(() => {
      const cursorPosition = selectionStart + emoji.length;
      textarea.setSelectionRange(cursorPosition, cursorPosition);
      textarea.focus();
    });
  };

  const applyEmojiSuggestion = (emoji: string) => {
    if (!activeShortcode) {
      handleInsertEmoji(emoji);
      return;
    }

    const { text, caretPosition } = replaceShortcodeSegment(
      newItemTitle,
      { start: activeShortcode.start, end: activeShortcode.end },
      emoji,
    );

    setNewItemTitle(text);
    setError('');
    clearEmojiSuggestions();

    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(caretPosition, caretPosition);
      }
    });
  };

  const handleTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (emojiSuggestions.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveSuggestionIndex((prev) => (prev + 1) % emojiSuggestions.length);
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveSuggestionIndex((prev) => (prev - 1 + emojiSuggestions.length) % emojiSuggestions.length);
        return;
      }

      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        applyEmojiSuggestion(emojiSuggestions[activeSuggestionIndex].emoji);
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        clearEmojiSuggestions();
        return;
      }
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-4 items-start">
          <div className="flex-1">
            <Label htmlFor="item-title" className="sr-only">Idea or note</Label>
            <div className="relative">
              <AutoResizeTextarea
                ref={textareaRef}
                id="item-title"
                placeholder="Capture an idea or note..."
                value={newItemTitle}
                onChange={handleTextareaChange}
                onKeyDown={handleTextareaKeyDown}
                className={`${error ? 'border-destructive' : ''} min-h-[40px] pr-12`}
                data-testid="input-scratchpad-title"
              />
              <div className="absolute bottom-1.5 right-1.5">
                <EmojiPicker onSelect={handleInsertEmoji} />
              </div>
              {suggestionsVisible && (
                <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-md border bg-popover p-1 shadow-md">
                  {emojiSuggestions.map((suggestion, index) => (
                    <button
                      key={`${suggestion.emoji}-${suggestion.names[0]}`}
                      type="button"
                      className={cn(
                        'flex w-full items-center gap-2 rounded-sm px-2 py-1 text-sm transition-colors',
                        index === activeSuggestionIndex ? 'bg-muted text-foreground' : 'text-muted-foreground',
                      )}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        applyEmojiSuggestion(suggestion.emoji);
                      }}
                    >
                      <span className="text-lg">{suggestion.emoji}</span>
                      <span className="text-xs">:{suggestion.names[0]}:</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {error && <p className="text-sm text-destructive mt-1">{error}</p>}
          </div>
          <Button
            type="submit"
            className="h-10 gap-2 flex-shrink-0 self-start"
            data-testid="button-add-scratchpad"
          >
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
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                setSelectedDate(today);
                setSelectedBucket('work');
              }}
              onDelete={onDeleteItem}
              editTask={editItem}
            />
          ))}
        </div>
      )}

      <Dialog open={!!sendToTasksItem} onOpenChange={(open) => !open && setSendToTasksItem(null)}>
        <DialogContent data-testid="dialog-send-to-tasks">
          <DialogHeader>
            <DialogTitle>Send to Tasks</DialogTitle>
            <DialogDescription>
              Schedule this item as a task. {remainingSlots} task slot{remainingSlots !== 1 ? 's' : ''} remaining for {format(selectedDate, 'MMM d')}.
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
