import React, { useRef, useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Platform } from "react-native";
import { C } from "../constants/colors";
import { applyTagChip, insertHash, toolbarState } from "../utils/tags";

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
  const [focused, setFocused] = useState(false);
  const toolbar = toolbarState(input, selection, tags);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(timer);
  }, []);

  const applyEdit = (edit: ReturnType<typeof insertHash>) => {
    setInput(edit.text);
    setSelection(edit.selection);
    setCompletionSelection(edit.selection);
    inputRef.current?.focus();
  };

  return (
    <View style={styles.card}>
      <Text style={styles.addHintLabel}>1行1タスク・#でタグを追加</Text>
      <TextInput
        ref={inputRef}
        style={styles.textInput}
        value={input}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
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
        placeholder={"買い物 #暮らし\n資料まとめ #仕事\nメール返信"}
        placeholderTextColor={C.inkFaint}
        textAlignVertical="top"
      />
      {focused && (
        <View style={styles.toolbar}>
          <TouchableOpacity
            style={styles.hashButton}
            onPress={() => applyEdit(insertHash(input, selection))}
            accessibilityRole="button"
            accessibilityLabel="タグの # を挿入"
          >
            <Text style={styles.hashText}>#</Text>
          </TouchableOpacity>
          <ScrollView
            horizontal
            style={styles.tagScroll}
            contentContainerStyle={styles.tagList}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="none"
            showsHorizontalScrollIndicator={false}
          >
            {toolbar.candidates.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[styles.tagButton, toolbar.mode === "prefix" && styles.candidateButton]}
                onPress={() => applyEdit(applyTagChip(input, selection, tag))}
                accessibilityRole="button"
                accessibilityLabel={`${toolbar.mode === "prefix" ? "候補" : "履歴"}タグ ${tag} を挿入`}
              >
                <Text style={[styles.tagText, toolbar.mode === "prefix" && styles.candidateText]}>#{tag}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: C.cardBorder,
    backgroundColor: C.bg,
  },
  hashButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.ink,
    borderRadius: 3,
    backgroundColor: C.card,
  },
  hashText: {
    fontSize: 22,
    color: C.ink,
    fontWeight: "700",
  },
  tagScroll: {
    flex: 1,
  },
  tagList: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tagButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: C.cardBorder,
    backgroundColor: C.card,
  },
  candidateButton: {
    borderWidth: 2,
    borderColor: C.ink,
    backgroundColor: C.greenLight,
  },
  tagText: {
    fontSize: 15,
    color: C.ink,
  },
  candidateText: {
    fontWeight: "700",
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
