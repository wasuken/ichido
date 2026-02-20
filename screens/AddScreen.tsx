import React, { useRef, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { C } from "../constants/colors";

type Props = {
  input: string;
  setInput: (s: string) => void;
  onAdd: () => void;
};

export function AddScreen({ input, setInput, onAdd }: Props) {
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 200);
  }, []);

  return (
    <View style={styles.card}>
      <Text style={styles.addHintLabel}>1行1タスク</Text>
      <TextInput
        ref={inputRef}
        style={styles.textInput}
        value={input}
        onChangeText={setInput}
        multiline
        placeholder={"買い物\n資料まとめ\nメール返信"}
        placeholderTextColor={C.inkFaint}
        textAlignVertical="top"
      />
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
