import { Fragment } from 'react';
import { cn } from '@/lib/utils';

interface LinkifiedTextProps {
  text: string;
  className?: string;
}

const urlRegex = /(https?:\/\/[^\s]+)/gi;

export function LinkifiedText({ text, className }: LinkifiedTextProps) {
  const segments: Array<string | JSX.Element> = [];
  let lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(text)) !== null) {
    const url = match[0];
    const matchIndex = match.index ?? 0;

    if (matchIndex > lastIndex) {
      segments.push(text.slice(lastIndex, matchIndex));
    }

    segments.push(
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline underline-offset-2 hover:text-blue-700 break-all"
      >
        {url}
      </a>
    );

    lastIndex = matchIndex + url.length;
  }

  if (lastIndex < text.length) {
    segments.push(text.slice(lastIndex));
  }

  if (segments.length === 0) {
    segments.push(text);
  }

  return (
    <span className={cn('break-words whitespace-pre-wrap', className)}>
      {segments.map((segment, index) => (
        typeof segment === 'string' ? (
          <Fragment key={`text-${index}`}>{segment}</Fragment>
        ) : (
          <Fragment key={`link-${index}`}>{segment}</Fragment>
        )
      ))}
    </span>
  );
}
