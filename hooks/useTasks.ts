import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Task } from "../types";
import { extractTags, mergeTags, parseTagName } from "../utils/tags";

const STORAGE_KEY = "wasu-todo-v1";
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
          const parsed = JSON.parse(raw);
          // orderがない古いデータ対応
          const withOrder = parsed.map((t: Task, i: number) => ({
            ...t,
            order: t.order ?? i,
          }));
          setTasks(withOrder);
          restoredTasks = withOrder;
        } catch {}
      }
      try {
        const parsed: unknown = JSON.parse(rawTags ?? "[]");
        if (Array.isArray(parsed)) {
          restoredTags = parsed.filter((tag): tag is string =>
            typeof tag === "string" && /^[\p{L}\p{N}\p{M}_-]+$/u.test(tag));
        }
      } catch {}
      // Include tags in tasks created before tag history was introduced.
      setTags(mergeTags(restoredTags, ...restoredTasks.map((task) => extractTags(task.text))));
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
    const maxOrder = tasks.length > 0 ? Math.max(...tasks.map(t => t.order)) : -1;
    const newTasks: Task[] = [
      ...tasks,
      ...texts.map((text, i) => ({
        id: `${Date.now()}-${Math.random()}`,
        text,
        done: false,
        createdAt: Date.now(),
        order: maxOrder + i + 1,
      })),
    ];
    setTasks(newTasks);
    persist(newTasks);
    setTags((previous) => mergeTags(previous, ...texts.map(extractTags)));
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
  };
}
