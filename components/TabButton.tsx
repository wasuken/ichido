import React from "react";
import { TouchableOpacity, Text, StyleSheet, Platform } from "react-native";
import { C } from "../constants/colors";

type Props = {
  label: string;
  active: boolean;
  icon: React.ReactNode;
  onPress: () => void;
};

export function TabButton({ label, active, icon, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[styles.tabBtn, active && styles.tabBtnActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon}
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  tabBtnActive: {
    backgroundColor: C.card,
    shadowColor: C.cardShadow,
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  tabLabel: {
    fontSize: 15,
    color: C.inkMid,
    fontFamily: Platform.OS === "android" ? "serif" : "Georgia",
  },
  tabLabelActive: {
    color: C.ink,
    fontWeight: "600",
  },
});
