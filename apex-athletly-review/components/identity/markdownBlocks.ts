/**
 * markdownBlocks - Athletly V2
 *
 * Lightweight, dependency-free markdown block parser for the identity
 * sections that the AI coach writes in a constrained, markdown-flavoured
 * shape ("**Event:** ...", bullet lists, occasional paragraphs).
 *
 * The parser intentionally supports a small subset:
 *   - Key/value lines:    **Label:** value
 *   - Bullets:            - text  or  * text
 *   - Headings:           # text   (up to ###)
 *   - Paragraphs:         everything else, joined across consecutive lines
 *
 * Inline markdown (bold, italic, links) is NOT rendered. Stray `**...**`
 * fragments are stripped to plain text so that no raw asterisks leak into
 * the UI.
 *
 * Pure TypeScript, no React or React Native imports. Trivially testable;
 * tests are intentionally omitted because the project has no jest/vitest
 * configured.
 */

export type Block =
  | { readonly type: 'keyValue'; readonly key: string; readonly value: string }
  | { readonly type: 'bullet'; readonly text: string }
  | { readonly type: 'paragraph'; readonly text: string }
  | { readonly type: 'heading'; readonly level: 1 | 2 | 3; readonly text: string };

const KEY_VALUE_RE = /^\*\*([^:]+?):\*\*\s*(.+)$/;
const BULLET_RE = /^\s*[-*]\s+(.+)$/;
const HEADING_RE = /^(#{1,3})\s+(.+)$/;

/**
 * Strip simple inline markdown noise (bold markers, italic markers,
 * "_(not yet filled in)_"-style placeholders) so we never render raw
 * asterisks or underscores in the UI.
 */
export function stripMarkdown(text: string): string {
  return text
    .replace(/_\([^)]*\)_/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*\*/g, '')
    .replace(/__/g, '')
    .trim();
}

function flushParagraph(buffer: readonly string[], blocks: Block[]): void {
  if (buffer.length === 0) return;
  const text = stripMarkdown(buffer.join(' '));
  if (text.length > 0) {
    blocks.push({ type: 'paragraph', text });
  }
}

export function parseBlocks(markdown: string): readonly Block[] {
  if (!markdown || markdown.trim().length === 0) {
    return [];
  }

  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let paragraphBuffer: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.trim().length === 0) {
      flushParagraph(paragraphBuffer, blocks);
      paragraphBuffer = [];
      continue;
    }

    const headingMatch = line.match(HEADING_RE);
    if (headingMatch) {
      flushParagraph(paragraphBuffer, blocks);
      paragraphBuffer = [];
      const level = Math.min(3, headingMatch[1].length) as 1 | 2 | 3;
      const text = stripMarkdown(headingMatch[2]);
      if (text.length > 0) {
        blocks.push({ type: 'heading', level, text });
      }
      continue;
    }

    const kvMatch = line.match(KEY_VALUE_RE);
    if (kvMatch) {
      flushParagraph(paragraphBuffer, blocks);
      paragraphBuffer = [];
      const key = stripMarkdown(kvMatch[1]);
      const value = stripMarkdown(kvMatch[2]);
      if (key.length > 0) {
        blocks.push({ type: 'keyValue', key, value });
      }
      continue;
    }

    const bulletMatch = line.match(BULLET_RE);
    if (bulletMatch) {
      flushParagraph(paragraphBuffer, blocks);
      paragraphBuffer = [];
      const text = stripMarkdown(bulletMatch[1]);
      if (text.length > 0) {
        blocks.push({ type: 'bullet', text });
      }
      continue;
    }

    paragraphBuffer.push(line.trim());
  }

  flushParagraph(paragraphBuffer, blocks);
  return blocks;
}

/**
 * Look up a keyValue block whose key matches any of the candidate names,
 * case-insensitive. Returns the first matching value or null.
 */
export function findValue(
  blocks: readonly Block[],
  candidates: readonly string[],
): string | null {
  const lowered = candidates.map((c) => c.toLowerCase());
  for (const block of blocks) {
    if (block.type !== 'keyValue') continue;
    if (lowered.includes(block.key.toLowerCase())) {
      return block.value;
    }
  }
  return null;
}

/**
 * Return all keyValue blocks whose key does NOT match any of the excluded
 * names. Useful when a specialized card has already consumed some keys
 * and the remaining ones should be listed generically.
 */
export function findRemainingKeyValues(
  blocks: readonly Block[],
  excludedKeys: readonly string[],
): readonly { readonly key: string; readonly value: string }[] {
  const lowered = excludedKeys.map((c) => c.toLowerCase());
  const out: { key: string; value: string }[] = [];
  for (const block of blocks) {
    if (block.type !== 'keyValue') continue;
    if (lowered.includes(block.key.toLowerCase())) continue;
    out.push({ key: block.key, value: block.value });
  }
  return out;
}
