import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, StatusBar, Animated, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { C } from "./constants/colors";
import { View as ViewType } from "./types";
import { useTasks } from "./hooks/useTasks";
import { Header } from "./components/Header";
import { FocusScreen } from "./screens/FocusScreen";
import { ListScreen } from "./screens/ListScreen";
import { AddScreen } from "./screens/AddScreen";

export default function App() {
  const [view, setView] = useState<ViewType>("focus");
  const [input, setInput] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const { tasks, pending, done, loaded, addTasks, toggleTask, deleteTask, clearDone, reorderTasks } = useTasks();

  useEffect(() => {
    fadeAnim.stopAnimation(() => {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    });
  }, [view]);

  const handleAdd = () => {
    const lines = input.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;
    addTasks(lines);
    setInput("");
    setView("focus");
  };

  if (!loaded) return null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({ length: 40 }).map((_, i) => (
          <View key={i} style={[styles.ruleLine, { top: 28 + i * 28 }]} />
        ))}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Header view={view} setView={setView} pendingCount={pending.length} />

          <Animated.View style={{ opacity: fadeAnim }}>
            {view === "focus" && (
              <FocusScreen
                current={pending[0] ?? null}
                next={pending[1] ?? null}
                tasksLength={tasks.length}
                doneLength={done.length}
                toggleTask={toggleTask}
                clearDone={clearDone}
                setView={setView}
              />
            )}
            {view === "list" && (
              <ListScreen
                tasks={tasks}
                doneLength={done.length}
                toggleTask={toggleTask}
                deleteTask={deleteTask}
                clearDone={clearDone}
                reorderTasks={reorderTasks}
              />
            )}
            {view === "add" && <AddScreen input={input} setInput={setInput} onAdd={handleAdd} />}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  ruleLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: C.line,
    opacity: 0.5,
  },
  scroll: {
    paddingBottom: 60,
  },
});
