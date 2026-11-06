import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Task } from "../types";
import { mergeTags, parseTagName } from "../utils/tags";
import { buildNewTasks, swapFocusOrders } from "../utils/focus";

const STORAGE_KEY = "wasu-todo-v2";
const TAGS_STORAGE_KEY = "wasu-tags-v1";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY).catch(() => null),
      AsyncStorage.getItem(TAGS_STORAGE_KEY).catch(() => null),
    ]).then(([raw, rawTags]) => {
      let restoredTasks: Task[] = [];
      let restoredTags: string[] = [];
      if (raw) {
        try {
          restoredTasks = JSON.parse(raw);
          setTasks(restoredTasks);
        } catch {}
      }
      try {
        const parsed: unknown = JSON.parse(rawTags ?? "[]");
        if (Array.isArray(parsed)) {
          restoredTags = parsed.filter((tag): tag is string =>
            typeof tag === "string" && /^[\p{L}\p{N}\p{M}_-]+$/u.test(tag));
        }
      } catch {}
      setTags(mergeTags(restoredTags, ...restoredTasks.map((task) => task.tags)));
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded) {
      AsyncStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(tags)).catch(() => {});
    }
  }, [tags, loaded]);

  const persist = useCallback((newTasks: Task[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks)).catch(() => {});
  }, []);

  const addTag = useCallback((input: string) => {
    const tag = parseTagName(input);
    if (!tag) return;
    setTags((previous) => mergeTags(previous, [tag]));
  }, []);

  const addTasks = useCallback((texts: string[]) => {
    const newTasks = buildNewTasks(tasks, texts, Date.now());
    setTasks(newTasks);
    persist(newTasks);
    setTags((previous) => mergeTags(previous, ...newTasks.slice(tasks.length).map((task) => task.tags)));
  }, [tasks, persist]);

  const toggleTask = useCallback((id: string) => {
    const newTasks = tasks.map((t) => {
      if (t.id === id) {
        const toggled = { ...t, done: !t.done };
        // 完了したら最後に移動
        if (toggled.done) {
          toggled.order = Math.max(...tasks.map(t => t.order)) + 1;
        }
        return toggled;
      }
      return t;
    });
    setTasks(newTasks);
    persist(newTasks);
  }, [tasks, persist]);

  const deleteTask = useCallback((id: string) => {
    const newTasks = tasks.filter((t) => t.id !== id);
    setTasks(newTasks);
    persist(newTasks);
  }, [tasks, persist]);

  const clearDone = useCallback(() => {
    const newTasks = tasks.filter((t) => !t.done);
    setTasks(newTasks);
    persist(newTasks);
  }, [tasks, persist]);

  const reorderTasks = useCallback((fromIndex: number, toIndex: number) => {
    // Indices refer to the list, which displays pending tasks before done tasks.
    const sorted = [...tasks].sort((a, b) => Number(a.done) - Number(b.done) || a.order - b.order);
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= sorted.length || toIndex >= sorted.length) return;
    const [moved] = sorted.splice(fromIndex, 1);
    sorted.splice(toIndex, 0, moved);
    
    const reordered = sorted.map((t, i) => ({ ...t, order: i }));
    setTasks(reordered);
    persist(reordered);
  }, [tasks, persist]);

  const swapCurrentAndNext = useCallback((tag?: string | null) => {
    const swapped = swapFocusOrders(tasks, tag);
    if (swapped === tasks) return;
    setTasks(swapped);
    persist(swapped);
  }, [tasks, persist]);

  const pending = tasks.filter((t) => !t.done).sort((a, b) => a.order - b.order);
  const done = tasks.filter((t) => t.done).sort((a, b) => a.order - b.order);
  const sortedTasks = [...pending, ...done];

  return {
    tasks: sortedTasks,
    pending,
    done,
    loaded,
    tags,
    addTag,
    addTasks,
    toggleTask,
    deleteTask,
    clearDone,
    reorderTasks,
    swapCurrentAndNext,
  };
}
