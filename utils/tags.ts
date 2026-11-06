// Tags start at the beginning of text or after whitespace.
// Unicode properties allow Japanese names as well as Latin names.
const TAG_PATTERN = /(^|\s)#([\p{L}\p{N}\p{M}_-]+)/gu;
const TAG_CHARACTER = /[\p{L}\p{N}\p{M}_-]/u;

export function parseTagName(input: string): string | null {
  const name = input.trim().replace(/^#/u, "").normalize("NFC");
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
  const match = text.slice(0, cursor).match(/(^|\s)#([\p{L}\p{N}\p{M}_-]*)$/u);
  // A cursor between the hashes in ## must not offer completion either.
  if (!match || (match[2] === "" && text[cursor] === "#")) return null;

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
  return tags.filter((tag) => tag.normalize("NFC").toLowerCase().startsWith(prefix));
}

export function completeTag(text: string, active: ActiveTag, tag: string) {
  const suffix = text.slice(active.end);
  const reuseSpace = /^[ \t]/u.test(suffix);
  const inserted = `#${tag}${reuseSpace ? "" : " "}`;
  return {
    text: text.slice(0, active.start) + inserted + suffix,
    cursor: active.start + inserted.length + (reuseSpace ? 1 : 0),
  };
}

type Selection = { start: number; end: number };
type InputEdit = { text: string; selection: Selection };

export function insertAtCursor(text: string, selection: Selection, insert: string): InputEdit {
  const cursor = selection.start + insert.length;
  return {
    text: text.slice(0, selection.start) + insert + text.slice(selection.end),
    selection: { start: cursor, end: cursor },
  };
}

export function insertHash(text: string, selection: Selection): InputEdit {
  const boundary = selection.start === 0 || /\s/u.test(text[selection.start - 1]);
  return insertAtCursor(text, selection, boundary ? "#" : " #");
}

export function toolbarState(text: string, selection: Selection, history: string[]): {
  mode: "prefix" | "history";
  query: string;
  candidates: string[];
} {
  const active = getActiveTag(text, selection);
  const query = active?.query ?? "";
  return {
    mode: active ? "prefix" : "history",
    query,
    candidates: suggestTags(history, query).reverse(),
  };
}

export function applyTagChip(text: string, selection: Selection, tag: string): InputEdit {
  const active = getActiveTag(text, selection);
  if (!active) {
    const hashed = insertHash(text, selection);
    return insertAtCursor(hashed.text, hashed.selection, `${tag} `);
  }

  // Reuse the existing whole-token completion. Complete before the suffix so
  // the toolbar always adds a literal space, including before a tab/newline.
  const completed = completeTag(text.slice(0, active.end), active, tag);
  const suffix = text.slice(active.end);
  return {
    text: completed.text + (suffix.startsWith(" ") ? suffix.slice(1) : suffix),
    selection: { start: completed.cursor, end: completed.cursor },
  };
}
