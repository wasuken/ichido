import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Task } from "../types";

const STORAGE_KEY = "wasu-todo-v1";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          // orderがない古いデータ対応
          const withOrder = parsed.map((t: Task, i: number) => ({
            ...t,
            order: t.order ?? i,
          }));
          setTasks(withOrder);
        } catch {}
      }
      setLoaded(true);
    });
  }, []);

  const persist = useCallback((newTasks: Task[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks)).catch(() => {});
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
    const sorted = [...tasks].sort((a, b) => a.order - b.order);
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
    addTasks,
    toggleTask,
    deleteTask,
    clearDone,
    reorderTasks,
  };
}
