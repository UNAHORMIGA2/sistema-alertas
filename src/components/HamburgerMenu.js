import React from "react";
import { Modal, Pressable, StyleSheet, Text } from "react-native";
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
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>

          {items.map((item) => (
            <Pressable key={item.key} style={styles.item} onPress={() => handleItemPress(item)}>
              <Ionicons name={item.icon || "ellipse-outline"} size={18} color={item.color || "#1F2937"} />
              <Text style={[styles.itemText, item.color ? { color: item.color } : null]}>{item.label}</Text>
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 6,
  },
  item: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  itemText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
  },
});

