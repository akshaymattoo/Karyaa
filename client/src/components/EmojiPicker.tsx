import { Smile } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EMOJI_LIST } from '@/lib/emoji';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  align?: 'start' | 'center' | 'end';
}

export function EmojiPicker({ onSelect, align = 'end' }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
        >
          <Smile className="h-5 w-5" />
          <span className="sr-only">Insert emoji</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className="w-64 p-3"
      >
        <div className="grid max-h-64 grid-cols-6 gap-2 overflow-y-auto pr-1">
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleSelect(emoji)}
              className="flex h-9 w-9 items-center justify-center rounded-md text-lg transition-colors hover:bg-muted"
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
