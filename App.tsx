import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, StyleSheet, StatusBar, Animated, ScrollView, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import { C } from "./constants/colors";
import { View as ViewType } from "./types";
import { useTasks } from "./hooks/useTasks";
import { Header } from "./components/Header";
import { FocusScreen } from "./screens/FocusScreen";
import { ListScreen } from "./screens/ListScreen";
import { AddScreen } from "./screens/AddScreen";
import { TagsScreen } from "./screens/TagsScreen";
import { availableTags, resolveFocus, leafCount } from "./utils/tree";

const SCROLL_BOTTOM_PADDING = 60;

export default function App() {
  const [view, setView] = useState<ViewType>("focus");
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const { tasks, loaded, tags, addTag, addTasks, toggleTask, deleteTask, clearDone, moveTask, addChildren, swapCurrentAndNext } = useTasks();

  const focusTags = availableTags(tasks);
  // Derive an effective selection immediately, so the last matching completion
  // never renders an empty filtered view while other tasks are pending.
  const activeTag = focusTags.find((tag) =>
    selectedTag !== null && tag.normalize("NFC").toLowerCase() === selectedTag.normalize("NFC").toLowerCase()
  ) ?? null;
  const { now: current, next, path } = resolveFocus(tasks, activeTag);
  const doneLength = tasks.filter(task => task.done).length;

  useEffect(() => {
    if (selectedTag && !activeTag) setSelectedTag(null);
  }, [selectedTag, activeTag]);

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

  const scrollRef = useRef<ScrollView>(null);
  const scrollOffset = useRef(0);
  const splitPanel = useRef<View | null>(null);
  const revealSplitPanel = useCallback(() => {
    if (!splitPanel.current) return;
    requestAnimationFrame(() => {
      scrollRef.current?.getNativeScrollRef()?.measureInWindow((_x, viewportY, _width, viewportHeight) => {
        splitPanel.current?.measureInWindow((_panelX, panelY, _panelWidth, panelHeight) => {
          const overflow = panelY + panelHeight + SCROLL_BOTTOM_PADDING - (viewportY + viewportHeight);
          if (overflow > 0) scrollRef.current?.scrollTo({ y: scrollOffset.current + overflow, animated: true });
        });
      });
    });
  }, []);
  const onSplitPanelLayout = useCallback((panel: View | null) => {
    splitPanel.current = panel;
    if (panel) revealSplitPanel();
  }, [revealSplitPanel]);

  useEffect(() => {
    const listener = Keyboard.addListener("keyboardDidShow", revealSplitPanel);
    return () => listener.remove();
  }, [revealSplitPanel]);

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
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          onLayout={revealSplitPanel}
          onScroll={({ nativeEvent }) => { scrollOffset.current = nativeEvent.contentOffset.y; }}
          scrollEventThrottle={16}
        >
          <Header view={view} setView={setView} pendingCount={leafCount(tasks)} />

          <Animated.View style={{ opacity: fadeAnim }}>
            {view === "focus" && (
              <FocusScreen
                current={current}
                ancestors={path.slice(0, -1)}
                addChildren={addChildren}
                onSplitPanelLayout={onSplitPanelLayout}
                next={next}
                tags={focusTags}
                selectedTag={activeTag}
                onSelectTag={(tag) => setSelectedTag(activeTag === tag ? null : tag)}
                tasksLength={tasks.length}
                doneLength={doneLength}
                toggleTask={toggleTask}
                swapCurrentAndNext={() => swapCurrentAndNext(activeTag)}
                clearDone={clearDone}
                setView={setView}
              />
            )}
            {view === "list" && (
              <ListScreen
                tasks={tasks}
                query={query}
                setQuery={setQuery}
                doneLength={doneLength}
                toggleTask={toggleTask}
                deleteTask={deleteTask}
                clearDone={clearDone}
                moveTask={moveTask}
              />
            )}
            {view === "add" && <AddScreen input={input} setInput={setInput} onAdd={handleAdd} tags={tags} />}
            {view === "tags" && (
              <TagsScreen
                tags={tags}
                addTag={addTag}
                onSelectTag={(tag) => {
                  setQuery(`#${tag}`);
                  setView("list");
                }}
              />
            )}
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
    paddingBottom: SCROLL_BOTTOM_PADDING,
  },
});
