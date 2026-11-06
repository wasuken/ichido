import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { C } from "../constants/colors";
import { parseTagName } from "../utils/tags";

type Props = {
  tags: string[];
  addTag: (tag: string) => void;
  onSelectTag: (tag: string) => void;
};

export function TagsScreen({ tags, addTag, onSelectTag }: Props) {
  const [input, setInput] = useState("");
  const name = parseTagName(input);
  const exists = name !== null && tags.some((tag) => tag.toLowerCase() === name.toLowerCase());
  const canAdd = name !== null && !exists;

  const handleAdd = () => {
    if (!canAdd || !name) return;
    addTag(name);
    setInput("");
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>タグ管理</Text>
      <Text style={styles.hint}>タグをタップすると、一覧を検索します</Text>
      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="タグ名（例：仕事）"
          placeholderTextColor={C.inkLight}
          accessibilityLabel="追加するタグ名"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleAdd}
        />
        <TouchableOpacity
          style={[styles.addButton, !canAdd && styles.disabled]}
          onPress={handleAdd}
          disabled={!canAdd}
          accessibilityRole="button"
          accessibilityLabel="タグを追加"
        >
          <Text style={styles.addButtonText}>追加</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.inputHint} accessibilityLiveRegion="polite">
        {exists ? "このタグは登録済みです" : input.trim() && !name
          ? "タグ名には文字・数字・_・-が使えます"
          : "先頭の # は省略できます"}
      </Text>
      {tags.length === 0 ? (
        <Text style={styles.emptyText}>まだタグがありません</Text>
      ) : (
        <View style={styles.tagList}>
          {tags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={styles.tagButton}
              onPress={() => onSelectTag(tag)}
              accessibilityRole="button"
              accessibilityLabel={`#${tag} で一覧を検索`}
            >
              <Text style={styles.tagText}>#{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 2,
  },
  title: { fontSize: 20, fontWeight: "600", color: C.ink, marginBottom: 8 },
  hint: { fontSize: 13, color: C.inkMid, marginBottom: 16 },
  addRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 3,
    padding: 12,
    fontSize: 16,
    color: C.ink,
  },
  addButton: { backgroundColor: C.ink, borderRadius: 3, padding: 12 },
  addButtonText: { color: C.bg, fontSize: 16 },
  disabled: { opacity: 0.4 },
  inputHint: { fontSize: 12, color: C.inkMid, marginTop: 8, marginBottom: 20 },
  tagList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tagButton: { backgroundColor: C.greenLight, borderRadius: 3, padding: 12, maxWidth: "100%" },
  tagText: { fontSize: 16, color: C.ink },
  emptyText: { fontSize: 15, color: C.inkMid, paddingVertical: 16, textAlign: "center" },
});
