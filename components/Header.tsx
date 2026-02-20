import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { C } from "../constants/colors";
import { View as ViewType } from "../types";
import { TabButton } from "./TabButton";
import { ArrowIcon, ListIcon, PlusIcon } from "./Icons";

type Props = {
  view: ViewType;
  setView: (v: ViewType) => void;
  pendingCount: number;
};

export function Header({ view, setView, pendingCount }: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>やること</Text>
        {pendingCount > 0 && (
          <Text style={styles.countBadge}>あと {pendingCount} 個</Text>
        )}
      </View>
      <View style={styles.headerBorder} />

      <View style={styles.tabs}>
        <TabButton
          label="いまやる"
          active={view === "focus"}
          icon={<ArrowIcon size={15} color={view === "focus" ? C.ink : C.inkMid} />}
          onPress={() => setView("focus")}
        />
        <TabButton
          label="一覧"
          active={view === "list"}
          icon={<ListIcon size={15} color={view === "list" ? C.ink : C.inkMid} />}
          onPress={() => setView("list")}
        />
        <TabButton
          label="追加"
          active={view === "add"}
          icon={<PlusIcon size={15} color={view === "add" ? C.ink : C.inkMid} />}
          onPress={() => setView("add")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 0,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: C.ink,
    letterSpacing: 0.5,
    fontFamily: Platform.OS === "android" ? "serif" : "Georgia",
  },
  countBadge: {
    fontSize: 15,
    color: C.inkMid,
    fontFamily: Platform.OS === "android" ? "serif" : "Georgia",
  },
  headerBorder: {
    height: 2,
    backgroundColor: C.inkMid,
    marginBottom: 14,
  },
  tabs: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 20,
  },
});
