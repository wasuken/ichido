import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from "react-native";
import { C } from "../constants/colors";
import { Task } from "../types";
import { CheckIcon, TrashIcon } from "../components/Icons";

type Props = {
  tasks: Task[];
  doneLength: number;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  clearDone: () => void;
  reorderTasks: (from: number, to: number) => void;
};

const MoveIcon = ({ direction }: { direction: "up" | "down" }) => (
  <Text style={{ fontSize: 18, color: C.inkMid }}>
    {direction === "up" ? "↑" : "↓"}
  </Text>
);

export function ListScreen({ tasks, doneLength, toggleTask, deleteTask, clearDone, reorderTasks }: Props) {
  const handleDelete = (id: string) => {
    Alert.alert("削除", "このタスクを消しますか？", [
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
      {tasks.length === 0 ? (
        <View style={[styles.card, styles.emptyCard]}>
          <Text style={styles.emptyText}>なにもない</Text>
        </View>
      ) : (
        <View style={styles.card}>
          {tasks.map((item, index) => (
            <View key={item.id} style={styles.taskRow}>
              <View style={styles.moveButtons}>
                {index > 0 && (
                  <TouchableOpacity onPress={() => reorderTasks(index, index - 1)}>
                    <MoveIcon direction="up" />
                  </TouchableOpacity>
                )}
                {index < tasks.length - 1 && (
                  <TouchableOpacity onPress={() => reorderTasks(index, index + 1)}>
                    <MoveIcon direction="down" />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={[styles.checkCircle, item.done && styles.checkCircleDone]}
                onPress={() => toggleTask(item.id)}
              >
                {item.done && <CheckIcon size={13} color="#fff" />}
              </TouchableOpacity>

              <Text style={[styles.taskText, item.done && styles.taskTextDone]}>{item.text}</Text>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <TrashIcon size={14} color={C.inkFaint} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {doneLength > 0 && (
        <TouchableOpacity style={styles.clearDoneBtn} onPress={handleClearDone}>
          <Text style={styles.clearDoneBtnText}>完了済み {doneLength} 個を削除</Text>
        </TouchableOpacity>
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
  taskRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ede5d0",
  },
  moveButtons: {
    gap: 4,
    marginRight: 4,
  },
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
  deleteBtn: {
    marginTop: 4,
  },
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
