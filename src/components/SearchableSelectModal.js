import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function SearchableSelectModal({
  visible,
  title,
  options = [],
  onClose,
  onSelect,
  searchPlaceholder = "Buscar...",
  emptyText = "No se encontraron resultados.",
}) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!visible) {
      setQuery("");
    }
  }, [visible]);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) => normalizeSearchText(option).includes(normalizedQuery));
  }, [options, query]);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{title || "Selecciona una opcion"}</Text>

          <TextInput
            style={styles.searchInput}
            placeholder={searchPlaceholder}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <ScrollView style={styles.optionsList} contentContainerStyle={styles.optionsContent} keyboardShouldPersistTaps="handled">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <Pressable
                  key={option}
                  style={styles.optionItem}
                  onPress={() => {
                    onSelect?.(option);
                    onClose?.();
                  }}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </Pressable>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>{emptyText}</Text>
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  card: {
    maxHeight: "78%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingTop: 16,
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 10,
  },
  searchInput: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: "#0F172A",
    marginBottom: 10,
  },
  optionsList: {
    width: "100%",
  },
  optionsContent: {
    paddingBottom: 10,
  },
  optionItem: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 13,
  },
  optionText: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  emptyText: {
    color: "#64748B",
    fontSize: 14,
    textAlign: "center",
  },
});
