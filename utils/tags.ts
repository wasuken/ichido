// Tags start at a word boundary and contain letters, numbers, marks, _ or -.
// Unicode properties allow Japanese names as well as Latin names.
const TAG_PATTERN = /(^|[^\p{L}\p{N}\p{M}_\/-])\/([\p{L}\p{N}\p{M}_-]+)/gu;
const TAG_CHARACTER = /[\p{L}\p{N}\p{M}_-]/u;

export function parseTagName(input: string): string | null {
  const name = input.trim().replace(/^\//u, "").normalize("NFC");
  return /^[\p{L}\p{N}\p{M}_-]+$/u.test(name) ? name : null;
}

export function mergeTags(...groups: string[][]): string[] {
  const names = new Map<string, string>();
  for (const tag of groups.flat()) {
    const normalized = tag.normalize("NFC");
    const key = normalized.toLowerCase();
    if (!names.has(key)) names.set(key, normalized);
  }
  return [...names.values()];
}

export function extractTags(text: string): string[] {
  return mergeTags([...text.matchAll(TAG_PATTERN)].map((match) => match[2]));
}

export type ActiveTag = { start: number; end: number; query: string };

export function getActiveTag(
  text: string,
  selection: { start: number; end: number },
): ActiveTag | null {
  if (selection.start !== selection.end) return null;
  const cursor = selection.start;
  const match = text.slice(0, cursor).match(/(^|[^\p{L}\p{N}\p{M}_\/-])\/([\p{L}\p{N}\p{M}_-]*)$/u);
  if (!match) return null;

  let end = cursor;
  // Replace the entire tag when completing with the cursor in its middle.
  for (const character of text.slice(cursor)) {
    if (!TAG_CHARACTER.test(character)) break;
    end += character.length;
  }
  return { start: cursor - match[2].length - 1, end, query: match[2] };
}

export function suggestTags(tags: string[], query: string): string[] {
  const prefix = query.normalize("NFC").toLowerCase();
  return tags.filter((tag) => tag.toLowerCase().startsWith(prefix));
}

export function completeTag(text: string, active: ActiveTag, tag: string) {
  const suffix = text.slice(active.end);
  const reuseSpace = /^[ \t]/u.test(suffix);
  const inserted = `/${tag}${reuseSpace ? "" : " "}`;
  return {
    text: text.slice(0, active.start) + inserted + suffix,
    cursor: active.start + inserted.length + (reuseSpace ? 1 : 0),
  };
}
