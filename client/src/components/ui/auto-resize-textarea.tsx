import { forwardRef, useCallback, useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';

export interface AutoResizeTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxRows?: number;
}

export const AutoResizeTextarea = forwardRef<
  HTMLTextAreaElement,
  AutoResizeTextareaProps
>(({ className, maxRows = 3, onChange, onInput, ...props }, ref) => {
  const innerRef = useRef<HTMLTextAreaElement | null>(null);

  const setRef = useCallback(
    (node: HTMLTextAreaElement | null) => {
      innerRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref],
  );

  const resize = useCallback(() => {
    const element = innerRef.current;
    if (!element) return;

    element.style.height = 'auto';

    const computedStyles = window.getComputedStyle(element);
    const lineHeight = parseFloat(computedStyles.lineHeight || '20');
    const maxHeight = lineHeight * maxRows;

    const nextHeight = Math.min(element.scrollHeight, maxHeight);
    element.style.height = `${nextHeight}px`;
    element.style.overflowY = element.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [maxRows]);

  useEffect(() => {
    resize();
  }, [resize]);

  useEffect(() => {
    resize();
  }, [resize, props.value]);

  return (
    <textarea
      {...props}
      ref={setRef}
      rows={1}
      className={cn(
        'flex w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-base leading-6 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      onChange={(event) => {
        onChange?.(event);
        requestAnimationFrame(resize);
      }}
      onInput={(event) => {
        onInput?.(event);
        requestAnimationFrame(resize);
      }}
    />
  );
});

AutoResizeTextarea.displayName = 'AutoResizeTextarea';
