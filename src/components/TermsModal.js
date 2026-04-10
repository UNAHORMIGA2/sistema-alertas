import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { TERMS_FULL } from "../constants/termsContent";

export default function TermsModal({ visible, onClose, title = "Terminos y condiciones" }) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
            {TERMS_FULL.map((item) => (
              <Text key={item} style={styles.text}>
                {item}
              </Text>
            ))}
          </ScrollView>
          <Pressable style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Cerrar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    maxHeight: "78%",
    paddingTop: 16,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
  },
  scroll: {
    marginTop: 12,
  },
  content: {
    gap: 10,
    paddingBottom: 12,
  },
  text: {
    color: "#374151",
    fontSize: 14,
    lineHeight: 21,
  },
  button: {
    marginTop: 8,
    backgroundColor: "#1D4ED8",
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 12,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },
});
