import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from "react-native";
import { C } from "../constants/colors";
import { Task } from "../types";
import { CheckIcon, TrashIcon } from "../components/Icons";
import { filterTasks } from "../utils/search";
import { flattenTree, ancestorsOf, countDescendants } from "../utils/tree";

type Props = {
  tasks: Task[];
  query: string;
  setQuery: (query: string) => void;
  doneLength: number;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  clearDone: () => void;
  moveTask: (id: string, direction: "up" | "down") => void;
};

const MoveIcon = ({ direction }: { direction: "up" | "down" }) => (
  <Text style={{ fontSize: 18, color: C.inkMid }}>
    {direction === "up" ? "↑" : "↓"}
  </Text>
);

export function ListScreen({ tasks, query, setQuery, doneLength, toggleTask, deleteTask, clearDone, moveTask }: Props) {
  const searching = query.trim().length > 0;
  const flattened = flattenTree(tasks);
  const filteredTasks = filterTasks(flattened.map(row => row.task), query);
  const rows = searching ? filteredTasks.map(task => ({ task, depth: 0 })) : flattened;
  const handleDelete = (id: string) => {
    const count = countDescendants(tasks, id);
    Alert.alert("削除", `このタスクを消しますか？${count > 0 ? `\n中身${count}件も消えます` : ""}`, [
      { text: "キャンセル", style: "cancel" },
      { text: "消す", style: "destructive", onPress: () => deleteTask(id) },
    ]);
  };

  const handleClearDone = () => {
    Alert.alert("完了済みを削除", `${doneLength}個のタスクを消しますか？`, [
      { text: "キャンセル", style: "cancel" },
      { text: "消す", style: "destructive", onPress: clearDone },
    ]);
  };

  return (
    <View>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="やることを検索"
          placeholderTextColor={C.inkLight}
          accessibilityLabel="やることを検索"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity
            style={styles.resetSearch}
            onPress={() => setQuery("")}
            accessibilityRole="button"
            accessibilityLabel="検索をクリア"
          >
            <Text style={styles.resetSearchText}>クリア</Text>
          </TouchableOpacity>
        )}
      </View>
      {query.trim().length > 0 && (
        <Text style={styles.resultCount}>{filteredTasks.length} 件 / 全 {tasks.length} 件</Text>
      )}
      {filteredTasks.length === 0 ? (
        <View style={[styles.card, styles.emptyCard]}>
          <Text style={styles.emptyText}>{query.trim() ? "見つかりませんでした" : "なにもない"}</Text>
        </View>
      ) : (
        <View style={styles.card}>
          {rows.map(({ task: item, depth }) => {
            const siblings = tasks.filter(task => task.parentId === item.parentId && task.done === item.done).sort((a, b) => a.order - b.order);
            const index = siblings.findIndex(task => task.id === item.id);
            const breadcrumb = searching ? ancestorsOf(tasks, item.id).map(task => task.text).join(" ＞ ") : "";
            return (
              <View key={item.id} style={[styles.taskRow, { paddingLeft: 12 + depth * 16 }]}>
                {breadcrumb.length > 0 && <Text style={styles.breadcrumb} numberOfLines={1} ellipsizeMode="tail">{breadcrumb}</Text>}
                <View style={styles.taskContent}>
                  <TouchableOpacity
                    style={styles.checkButton}
                    onPress={() => toggleTask(item.id)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: item.done }}
                    accessibilityLabel={`${item.text} の完了切り替え`}
                  >
                    <View style={[styles.checkCircle, item.done && styles.checkCircleDone]}>
                      {item.done && <CheckIcon size={13} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                  <Text style={[styles.taskText, item.done && styles.taskTextDone]}>{item.text}</Text>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)} accessibilityRole="button" accessibilityLabel={`${item.text} を削除`}>
                    <TrashIcon size={14} color={C.inkMid} />
                  </TouchableOpacity>
                </View>
                {!searching && (
                  <View style={styles.moveButtons}>
                    {index > 0 && (
                      <TouchableOpacity style={styles.moveButton} onPress={() => moveTask(item.id, "up")} accessibilityRole="button" accessibilityLabel={`${item.text} を上へ`}>
                        <MoveIcon direction="up" />
                      </TouchableOpacity>
                    )}
                    {index < siblings.length - 1 && (
                      <TouchableOpacity style={styles.moveButton} onPress={() => moveTask(item.id, "down")} accessibilityRole="button" accessibilityLabel={`${item.text} を下へ`}>
                        <MoveIcon direction="down" />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {doneLength > 0 && (
        <TouchableOpacity style={styles.clearDoneBtn} onPress={handleClearDone}>
          <Text style={styles.clearDoneBtnText}>すべての完了済み {doneLength} 個を削除</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  breadcrumb: { fontSize: 12, color: C.ink, backgroundColor: C.card, marginBottom: 4 },
  taskContent: { flexDirection: "row", alignItems: "center", gap: 4 },
  checkButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  moveButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  searchRow: {
    marginHorizontal: 20,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 3,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    padding: 12,
    fontSize: 16,
    color: C.ink,
  },
  resetSearch: {
    padding: 12,
  },
  resetSearchText: {
    color: C.inkMid,
    fontSize: 13,
  },
  resultCount: {
    marginHorizontal: 20,
    marginBottom: 10,
    color: C.inkMid,
    fontSize: 13,
  },
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
  taskRow: {
    padding: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ede5d0",
  },
  moveButtons: { flexDirection: "row", gap: 4 },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: C.inkFaint,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  checkCircleDone: {
    backgroundColor: C.green,
    borderColor: C.green,
  },
  taskText: {
    flex: 1,
    fontSize: 18,
    lineHeight: 25,
    color: C.ink,
    fontFamily: Platform.OS === "android" ? "serif" : "Georgia",
  },
  taskTextDone: {
    color: C.inkLight,
    textDecorationLine: "line-through",
  },
  deleteBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  emptyCard: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    color: C.inkLight,
    fontFamily: Platform.OS === "android" ? "serif" : "Georgia",
  },
  clearDoneBtn: {
    minHeight: 44,
    justifyContent: "center",
    marginHorizontal: 20,
    marginTop: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: C.inkFaint,
    borderRadius: 3,
    paddingVertical: 9,
    alignItems: "center",
  },
  clearDoneBtnText: {
    fontSize: 14,
    color: C.inkMid,
    fontFamily: Platform.OS === "android" ? "serif" : "Georgia",
  },
});
