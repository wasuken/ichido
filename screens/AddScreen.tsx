import React, { useRef, useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { C } from "../constants/colors";
import { completeTag, getActiveTag, suggestTags } from "../utils/tags";

type Props = {
  input: string;
  setInput: (s: string) => void;
  onAdd: () => void;
  tags: string[];
};

export function AddScreen({ input, setInput, onAdd, tags }: Props) {
  const inputRef = useRef<TextInput>(null);
  const [selection, setSelection] = useState({ start: input.length, end: input.length });
  const [completionSelection, setCompletionSelection] = useState<{ start: number; end: number }>();
  const activeTag = getActiveTag(input, selection);
  const suggestions = activeTag ? suggestTags(tags, activeTag.query) : [];

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(timer);
  }, []);

  const selectTag = (tag: string) => {
    if (!activeTag) return;
    const completed = completeTag(input, activeTag, tag);
    const cursor = { start: completed.cursor, end: completed.cursor };
    setInput(completed.text);
    setSelection(cursor);
    setCompletionSelection(cursor);
    inputRef.current?.focus();
  };

  return (
    <View style={styles.card}>
      <Text style={styles.addHintLabel}>1行1タスク・/でタグを追加</Text>
      <TextInput
        ref={inputRef}
        style={styles.textInput}
        value={input}
        onChangeText={(text) => {
          setCompletionSelection(undefined);
          setInput(text);
        }}
        selection={completionSelection}
        onSelectionChange={({ nativeEvent }) => {
          // Ignore a stale native cursor event while applying a completion.
          if (completionSelection && (
            nativeEvent.selection.start !== completionSelection.start ||
            nativeEvent.selection.end !== completionSelection.end
          )) return;
          setSelection(nativeEvent.selection);
          setCompletionSelection(undefined);
        }}
        accessibilityLabel="タスク入力"
        multiline
        placeholder={"買い物 /暮らし\n資料まとめ /仕事\nメール返信"}
        placeholderTextColor={C.inkFaint}
        textAlignVertical="top"
      />
      {suggestions.length > 0 && (
        <View style={styles.suggestions}>
          <Text style={styles.suggestionLabel}>タグ候補</Text>
          <View style={styles.tagList}>
            {suggestions.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={styles.tagButton}
                onPress={() => selectTag(tag)}
                accessibilityRole="button"
                accessibilityLabel={`タグ ${tag} を挿入`}
              >
                <Text style={styles.tagText}>/{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
      <View style={styles.addFooter}>
        <TouchableOpacity
          style={[styles.addBtn, !input.trim() && styles.addBtnDisabled]}
          onPress={onAdd}
          disabled={!input.trim()}
        >
          <Text style={styles.addBtnText}>追加する</Text>
        </TouchableOpacity>
      </View>
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
  addHintLabel: {
    fontSize: 10,
    letterSpacing: 2,
    color: C.inkLight,
    fontFamily: "monospace",
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 10,
  },
  textInput: {
    fontSize: 19,
    lineHeight: 28,
    color: C.ink,
    paddingHorizontal: 16,
    minHeight: 140,
    fontFamily: Platform.OS === "android" ? "serif" : "Georgia",
  },
  addFooter: {
    borderTopWidth: 1,
    borderTopColor: "#ede5d0",
    padding: 14,
    alignItems: "flex-end",
  },
  suggestions: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: C.cardBorder,
  },
  suggestionLabel: {
    fontSize: 12,
    color: C.inkMid,
    marginBottom: 8,
  },
  tagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 3,
    backgroundColor: C.greenLight,
  },
  tagText: {
    fontSize: 15,
    color: C.ink,
  },
  addBtn: {
    backgroundColor: C.ink,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 3,
    shadowColor: "#1a1208",
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  addBtnDisabled: {
    opacity: 0.4,
  },
  addBtnText: {
    color: C.bg,
    fontSize: 17,
    fontFamily: Platform.OS === "android" ? "serif" : "Georgia",
  },
});
