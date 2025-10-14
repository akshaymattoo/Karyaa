import dataByEmoji from 'unicode-emoji-json/data-by-emoji.json';
import orderedEmoji from 'unicode-emoji-json/data-ordered-emoji.json';

export interface EmojiDefinition {
  emoji: string;
  names: string[];
  slug: string;
  name: string;
}

type EmojiMeta = {
  name: string;
  slug: string;
  group: string;
  emoji_version: string;
  unicode_version: string;
  skin_tone_support: boolean;
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const buildDefinitions = (): EmojiDefinition[] => {
  const entries = Object.entries(dataByEmoji as Record<string, EmojiMeta>);

  return entries
    .map(([emoji, meta]) => {
      const names: string[] = [];
      const pushName = (raw: string | undefined) => {
        if (!raw) return;
        const normalized = normalize(raw.replace(/-/g, ' ').replace(/_/g, ' '));
        if (!normalized) return;
        if (!names.includes(normalized)) {
          names.push(normalized);
        }
      };

      // Primary identifiers
      pushName(meta.slug);
      pushName(meta.name);

      // Additional variants
      pushName(meta.slug.replace(/_/g, '-'));
      pushName(meta.name.replace(/\s+/g, '-'));

      return {
        emoji,
        names,
        slug: meta.slug,
        name: meta.name,
      };
    })
    .sort((a, b) => a.emoji.localeCompare(b.emoji, 'en'));
};

export const EMOJI_DEFINITIONS = buildDefinitions();

const dataByEmojiRecord = dataByEmoji as Record<string, EmojiMeta>;

const ORDERED_EMOJI_LIST = (orderedEmoji as string[]).filter((emoji) =>
  Object.prototype.hasOwnProperty.call(dataByEmojiRecord, emoji)
);

export const EMOJI_LIST =
  ORDERED_EMOJI_LIST.length > 0
    ? ORDERED_EMOJI_LIST
    : EMOJI_DEFINITIONS.map((definition) => definition.emoji);

export const EMOJI_SHORTCODES = EMOJI_DEFINITIONS.reduce<Record<string, string>>((acc, definition) => {
  definition.names.forEach((name) => {
    acc[name] = definition.emoji;
  });
  return acc;
}, {});

export function replaceEmojiShortcodes(
  value: string,
  caretPosition?: number,
): { text: string; caretPosition: number } {
  const regex = /:([a-z0-9_+-]+):/gi;
  let result = '';
  let lastIndex = 0;
  let replaced = false;
  const initialCaret = caretPosition ?? value.length;
  let adjustedCaret = initialCaret;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(value)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    const shortcodeKey = match[1].toLowerCase();
    const emoji = EMOJI_SHORTCODES[shortcodeKey];

    result += value.slice(lastIndex, start);

    if (emoji) {
      replaced = true;
      result += emoji;

      if (caretPosition !== undefined) {
        if (end <= caretPosition) {
          adjustedCaret += emoji.length - match[0].length;
        } else if (start < caretPosition && caretPosition <= end) {
          adjustedCaret = start + emoji.length;
        }
      }
    } else {
      result += match[0];
    }

    lastIndex = end;
  }

  if (!replaced) {
    return { text: value, caretPosition: initialCaret };
  }

  result += value.slice(lastIndex);
  return { text: result, caretPosition: adjustedCaret };
}

export function searchEmojiShortcodes(query: string, limit = 8): EmojiDefinition[] {
  const normalized = query.trim().toLowerCase();
  const matches = EMOJI_DEFINITIONS.filter((definition) => {
    if (!normalized) {
      return true;
    }
    return definition.names.some((name) => name.startsWith(normalized));
  });

  return matches.slice(0, limit);
}

export interface ActiveShortcode {
  start: number;
  end: number;
  query: string;
}

export function findActiveShortcode(value: string, caretPosition: number): ActiveShortcode | null {
  const uptoCaret = value.slice(0, caretPosition);
  const lastColon = uptoCaret.lastIndexOf(':');

  if (lastColon === -1) {
    return null;
  }

  const candidate = uptoCaret.slice(lastColon);

  if (!/^:[a-z0-9_+-]*$/i.test(candidate)) {
    return null;
  }

  const query = candidate.slice(1);
  const start = lastColon;
  return {
    start,
    end: caretPosition,
    query,
  };
}

export function replaceShortcodeSegment(
  value: string,
  range: { start: number; end: number },
  emoji: string,
): { text: string; caretPosition: number } {
  const before = value.slice(0, range.start);
  const after = value.slice(range.end);
  const text = `${before}${emoji}${after}`;

  return {
    text,
    caretPosition: before.length + emoji.length,
  };
}
