import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from "react-native";
import { C } from "../constants/colors";
import { Task } from "../types";
import { CheckIcon, PlusIcon } from "../components/Icons";

type Props = {
  current: Task | null;
  next: Task | null;
  tasksLength: number;
  doneLength: number;
  toggleTask: (id: string) => void;
  clearDone: () => void;
  setView: (v: "add") => void;
};

export function FocusScreen({ current, next, tasksLength, doneLength, toggleTask, clearDone, setView }: Props) {
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
      {current ? (
        <Animated.View style={[styles.card, styles.focusCard, { transform: [{ scale: cardScale }] }]}>
          <Text style={styles.nowLabel}>NOW</Text>
          <Text style={styles.focusText}>{current.text}</Text>
          <View style={styles.doneRow}>
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => handleComplete(current.id)}
              activeOpacity={0.7}
            >
              <CheckIcon size={22} color={C.green} />
            </TouchableOpacity>
            <Text style={styles.doneHint}>
              {justDone ? "✓ 完了！" : "タップで完了"}
            </Text>
          </View>
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

      {next && (
        <View style={styles.nextCard}>
          <Text style={styles.nextLabel}>NEXT</Text>
          <Text style={styles.nextText}>{next.text}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: "rgba(255,255,255,0.55)",
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
