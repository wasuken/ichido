import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Task } from "../types";
import { mergeTags, parseTagName } from "../utils/tags";
import { buildNewTasks } from "../utils/focus";
import { buildChildTasks, toggleWithCascade, deleteWithDescendants, moveSibling, swapFocusOrders } from "../utils/tree";

const STORAGE_KEY = "wasu-todo-v3";
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
    const newTasks = toggleWithCascade(tasks, id);
    setTasks(newTasks);
    persist(newTasks);
  }, [tasks, persist]);

  const deleteTask = useCallback((id: string) => {
    const newTasks = deleteWithDescendants(tasks, id);
    setTasks(newTasks);
    persist(newTasks);
  }, [tasks, persist]);

  const clearDone = useCallback(() => {
    const newTasks = tasks.filter((t) => !t.done);
    setTasks(newTasks);
    persist(newTasks);
  }, [tasks, persist]);

  const addChildren = useCallback((parentId: string, texts: string[]) => {
    // The split panel can only add to a pending NOW leaf.
    if (!tasks.some(task => task.id === parentId && !task.done)) return;
    const newTasks = buildChildTasks(tasks, parentId, texts, Date.now());
    setTasks(newTasks);
    persist(newTasks);
    setTags(previous => mergeTags(previous, ...newTasks.slice(tasks.length).map(task => task.tags)));
  }, [tasks, persist]);

  const moveTask = useCallback((id: string, direction: "up" | "down") => {
    const newTasks = moveSibling(tasks, id, direction);
    if (newTasks === tasks) return;
    setTasks(newTasks);
    persist(newTasks);
  }, [tasks, persist]);

  const swapCurrentAndNext = useCallback((tag?: string | null) => {
    const swapped = swapFocusOrders(tasks, tag);
    if (swapped === tasks) return;
    setTasks(swapped);
    persist(swapped);
  }, [tasks, persist]);

  return {
    tasks,
    loaded,
    tags,
    addTag,
    addTasks,
    toggleTask,
    deleteTask,
    clearDone,
    addChildren,
    moveTask,
    swapCurrentAndNext,
  };
}
