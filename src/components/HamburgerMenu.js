import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function HamburgerMenu({ visible, onClose, title = "Menu", items = [] }) {
  const handleItemPress = async (item) => {
    onClose?.();
    try {
      await item?.onPress?.();
    } catch {
      // No bloqueamos UI por error de accion.
    }
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.overlay} onPress={onClose} />

        <Pressable style={styles.drawer} onPress={() => {}}>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>Accesos</Text>
              <Text style={styles.title}>{title}</Text>
            </View>

            <Pressable style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={20} color="#0F172A" />
            </Pressable>
          </View>

          <View style={styles.items}>
            {items.map((item) => (
              <Pressable key={item.key} style={styles.item} onPress={() => handleItemPress(item)}>
                <View style={[styles.iconWrap, item.color ? { backgroundColor: `${item.color}18` } : null]}>
                  <Ionicons name={item.icon || "ellipse-outline"} size={18} color={item.color || "#1F2937"} />
                </View>
                <Text style={[styles.itemText, item.color ? { color: item.color } : null]}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
              </Pressable>
            ))}
          </View>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.38)",
  },
  drawer: {
    width: 292,
    maxWidth: "82%",
    height: "100%",
    backgroundColor: "#FFFFFF",
    paddingTop: 56,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#0F172A",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 4, height: 0 },
    elevation: 18,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  items: {
    gap: 6,
  },
  item: {
    paddingHorizontal: 12,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
  },
});
