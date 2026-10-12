import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../lib/theme";
import { CategoryItem } from "../types";

export type RootStackParamList = {
  Main: undefined;
  Watch: { slug: string };
  List: { title: string; mode: "category" | "topic" | "year" | "recently" | "new"; slug?: string };
  Search: { initial?: string };
  Filter: undefined;
};

interface Props {
  categories: CategoryItem[];
}

export default function Header({ categories }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <LinearGradient colors={["#16161f", colors.background]} style={styles.header}>
      <View style={styles.row}>
        <TouchableOpacity onPress={() => navigation.navigate("Main")} activeOpacity={0.7}>
          <Text style={styles.logo}>
            Phim<Text style={{ color: colors.primary }}>Ảnh</Text>
          </Text>
        </TouchableOpacity>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate("Search", {})}
            accessibilityLabel="Tìm kiếm"
          >
            <Text style={styles.iconText}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setMenuOpen(true)} accessibilityLabel="Danh mục">
            <Text style={styles.iconText}>☰</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick category chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {categories.slice(0, 12).map((c) => (
          <TouchableOpacity
            key={c.slug}
            style={styles.chip}
            onPress={() => navigation.navigate("List", { title: c.name, mode: "category", slug: c.slug })}
          >
            <Text style={styles.chipText} numberOfLines={1}>{c.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal visible={menuOpen} transparent animationType="slide" onRequestClose={() => setMenuOpen(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setMenuOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Danh mục thể loại</Text>
            <TouchableOpacity onPress={() => setMenuOpen(false)}>
              <Text style={styles.closeText}>Đóng ✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.sheetGrid}>
            {categories.map((c) => (
              <TouchableOpacity
                key={c.slug}
                style={styles.sheetItem}
                onPress={() => {
                  setMenuOpen(false);
                  navigation.navigate("List", { title: c.name, mode: "category", slug: c.slug });
                }}
              >
                <Text style={styles.chipText}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 8, paddingBottom: 6 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12 },
  logo: { color: colors.text, fontSize: 22, fontWeight: "900" },
  actions: { flexDirection: "row" },
  iconBtn: { padding: 8, marginLeft: 4 },
  iconText: { color: colors.text, fontSize: 18 },
  chips: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  chip: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { color: colors.text, fontSize: 12 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    padding: 16,
  },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sheetTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  closeText: { color: colors.primary, fontSize: 14, fontWeight: "600" },
  sheetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sheetItem: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
