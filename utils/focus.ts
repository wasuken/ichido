import type { Task } from "../types/index";
import { buildChildTasks, filterByTag } from "./tree.ts";
export { filterByTag, availableTags, swapFocusOrders } from "./tree.ts";

// pending is already in display order; filtering preserves that order.
export function pickFocus(pending: Task[], tag?: string | null): { now: Task | null; next: Task | null } {
  const filtered = filterByTag(pending, tag);
  return { now: filtered[0] ?? null, next: filtered[1] ?? null };
}

// Registration always creates roots. IDs share the child creation allocator.
export function buildNewTasks(existing: Task[], texts: string[], now: number): Task[] {
  return buildChildTasks(existing, null, texts, now);
}
