import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform, ScrollView, TextInput, Keyboard } from "react-native";
import { C } from "../constants/colors";
import { Task } from "../types";
import type { Next } from "../utils/tree";
import { CheckIcon, PlusIcon } from "../components/Icons";

type Props = {
  tags: string[];
  selectedTag: string | null;
  onSelectTag: (tag: string) => void;
  current: Task | null;
  next: Next;
  ancestors: Task[];
  addChildren: (parentId: string, texts: string[]) => void;
  onSplitPanelLayout: (panel: View | null) => void;
  tasksLength: number;
  doneLength: number;
  toggleTask: (id: string) => void;
  swapCurrentAndNext: () => void;
  clearDone: () => void;
  setView: (v: "add") => void;
};

export function FocusScreen({ tags, selectedTag, onSelectTag, current, next, ancestors, addChildren, onSplitPanelLayout, tasksLength, doneLength, toggleTask, swapCurrentAndNext, clearDone, setView }: Props) {
  const [splitTarget, setSplitTarget] = useState<string | null>(null);
  const splitting = current !== null && splitTarget === current.id;
  const [childInput, setChildInput] = useState("");
  const inputRef = useRef<TextInput>(null);
  const panelRef = useRef<View>(null);

  useEffect(() => {
    setSplitTarget(null);
    setChildInput("");
  }, [current?.id]);

  useEffect(() => {
    if (!splitting) return;
    const timer = setTimeout(() => {
      inputRef.current?.focus();
      onSplitPanelLayout(panelRef.current);
    }, 200);
    return () => {
      clearTimeout(timer);
      onSplitPanelLayout(null);
    };
  }, [splitting, onSplitPanelLayout]);

  const closeSplit = () => {
    Keyboard.dismiss();
    setSplitTarget(null);
    setChildInput("");
  };
  const addSplit = () => {
    const lines = childInput.split("\n").map(line => line.trim()).filter(Boolean);
    if (!current || !lines.length) return;
    addChildren(current.id, lines);
    closeSplit();
  };
  const [justDone, setJustDone] = useState(false);
  const cardScale = useRef(new Animated.Value(0.93)).current;

  useEffect(() => {
    Animated.spring(cardScale, {
      toValue: 1,
      tension: 120,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleComplete = (id: string) => {
    toggleTask(id);
    setJustDone(true);
    setTimeout(() => setJustDone(false), 1500);
  };

  return (
    <View>
      {tags.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagRow}
          keyboardShouldPersistTaps="handled"
        >
          {tags.map((tag) => {
            const selected = selectedTag !== null && tag.normalize("NFC").toLowerCase() === selectedTag.normalize("NFC").toLowerCase();
            return (
              <TouchableOpacity
                key={tag}
                style={[styles.tagChip, selected && styles.selectedChip]}
                onPress={() => onSelectTag(tag)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`#${tag} で絞り込み`}
              >
                <Text style={[styles.tagText, selected && styles.selectedTagText]}>#{tag}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
      {current ? (
        <Animated.View style={[styles.card, styles.focusCard, { transform: [{ scale: cardScale }] }]}>
          {ancestors.length > 0 && (
            <Text style={styles.breadcrumb} numberOfLines={1} ellipsizeMode="tail">
              {ancestors.map(task => task.text).join(" ＞ ")}
            </Text>
          )}
          <Text style={styles.nowLabel}>NOW</Text>
          <Text style={styles.focusText}>{current.text}</Text>
          <View style={styles.doneRow}>
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => handleComplete(current.id)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="完了"
            >
              <CheckIcon size={22} color={C.green} />
            </TouchableOpacity>
            <Text style={styles.doneHint}>
              {justDone ? "✓ 完了！" : "タップで完了"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.splitButton}
            onPress={() => splitting ? closeSplit() : setSplitTarget(current.id)}
            accessibilityRole="button"
            accessibilityState={{ expanded: splitting }}
          >
            <Text style={styles.actionText}>{splitting ? "− 割る入力を閉じる" : "＋ 割る"}</Text>
          </TouchableOpacity>
          {splitting && (
            <View ref={panelRef} collapsable={false} style={styles.splitPanel} onLayout={() => onSplitPanelLayout(panelRef.current)}>
              <Text style={styles.breadcrumb}>1行1タスクに割る</Text>
              <TextInput
                ref={inputRef}
                multiline
                value={childInput}
                onChangeText={setChildInput}
                style={styles.childInput}
                textAlignVertical="top"
                placeholder="小さな一歩を1行ずつ"
                placeholderTextColor={C.inkMid}
                accessibilityLabel="子タスク入力"
                onFocus={() => onSplitPanelLayout(panelRef.current)}
              />
              <View style={styles.splitActions}>
                <TouchableOpacity style={styles.splitButton} onPress={addSplit} accessibilityRole="button">
                  <Text style={styles.actionText}>追加</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.splitButton} onPress={closeSplit} accessibilityRole="button">
                  <Text style={styles.actionText}>やめる</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>
      ) : (
        <View style={[styles.card, styles.emptyCard]}>
          {tasksLength > 0 ? (
            <>
              <Text style={styles.emptyEmoji}>🎉</Text>
              <Text style={styles.emptyDoneText}>全部おわった！</Text>
              {doneLength > 0 && (
                <TouchableOpacity style={styles.clearBtn} onPress={clearDone}>
                  <Text style={styles.clearBtnText}>完了済みを消す</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <Text style={styles.emptyText}>まだなにもない</Text>
              <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setView("add")}>
                <PlusIcon size={14} color={C.inkMid} />
                <Text style={styles.emptyAddText}>追加する</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {next?.kind === "sibling" ? (
        <TouchableOpacity
          style={styles.nextCard}
          onPress={() => {
            setJustDone(false);
            swapCurrentAndNext();
          }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`NEXT: ${next.task.text}`}
          accessibilityHint="現在のタスクと順番を入れ替えます"
        >
          <Text style={styles.nextLabel}>NEXT</Text>
          <Text style={styles.nextText}>{next.task.text}</Text>
          <Text style={styles.nextHint}>タップでNOWと入れ替え</Text>
        </TouchableOpacity>
      ) : next?.kind === "up" ? (
        <View style={styles.nextCard}>
          <Text style={styles.upLabel}>↑ 一個上へ</Text>
          <Text style={styles.nextText}>{next.task.text}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  breadcrumb: { fontSize: 12, color: C.ink, backgroundColor: C.card, marginBottom: 10 },
  splitButton: { minHeight: 44, minWidth: 44, paddingHorizontal: 12, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: C.inkMid, borderRadius: 3, marginTop: 12 },
  actionText: { fontSize: 16, color: C.ink },
  splitPanel: { marginTop: 12, borderTopWidth: 1, borderColor: C.cardBorder, paddingTop: 12 },
  childInput: { height: 112, fontSize: 16, lineHeight: 24, color: C.ink, backgroundColor: C.bg, padding: 8, borderWidth: 1, borderColor: C.inkMid },
  splitActions: { flexDirection: "row", gap: 12 },
  upLabel: { fontSize: 13, fontWeight: "700", color: C.ink, marginBottom: 6 },
  tagRow: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  tagChip: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: C.cardBorder,
    backgroundColor: C.card,
  },
  selectedChip: {
    borderColor: C.ink,
    backgroundColor: C.greenLight,
  },
  tagText: { color: C.ink, fontSize: 15 },
  selectedTagText: { fontWeight: "700" },
  card: {
    marginHorizontal: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 2,
    shadowColor: C.cardShadow,
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  focusCard: {
    padding: 24,
  },
  nowLabel: {
    fontSize: 10,
    letterSpacing: 2.5,
    color: C.inkLight,
    marginBottom: 14,
    fontFamily: "monospace",
  },
  focusText: {
    fontSize: 26,
    lineHeight: 38,
    color: C.ink,
    fontWeight: "600",
    marginBottom: 28,
    fontFamily: Platform.OS === "android" ? "serif" : "Georgia",
  },
  doneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  doneBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: C.green,
    alignItems: "center",
    justifyContent: "center",
  },
  doneHint: {
    fontSize: 14,
    color: C.inkMid,
    fontFamily: Platform.OS === "android" ? "serif" : "Georgia",
  },
  nextCard: {
    marginHorizontal: 20,
    marginTop: 10,
    padding: 12,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 2,
  },
  nextLabel: {
    fontSize: 9,
    letterSpacing: 2,
    color: C.inkLight,
    marginBottom: 4,
    fontFamily: "monospace",
  },
  nextText: {
    fontSize: 16,
    color: C.inkMid,
    lineHeight: 22,
    fontFamily: Platform.OS === "android" ? "serif" : "Georgia",
  },
  nextHint: {
    marginTop: 6,
    fontSize: 12,
    color: C.inkLight,
  },
  emptyCard: {
    padding: 40,
    alignItems: "center",
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyDoneText: {
    fontSize: 20,
    color: C.green,
    fontWeight: "600",
    fontFamily: Platform.OS === "android" ? "serif" : "Georgia",
  },
  emptyText: {
    fontSize: 18,
    color: C.inkLight,
    fontFamily: Platform.OS === "android" ? "serif" : "Georgia",
  },
  emptyAddBtn: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  emptyAddText: {
    fontSize: 15,
    color: C.inkMid,
    fontFamily: Platform.OS === "android" ? "serif" : "Georgia",
  },
  clearBtn: {
    minHeight: 44,
    justifyContent: "center",
    marginTop: 16,
    borderWidth: 1,
    borderColor: C.inkFaint,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 3,
  },
  clearBtnText: {
    fontSize: 14,
    color: C.inkMid,
    fontFamily: Platform.OS === "android" ? "serif" : "Georgia",
  },
});
