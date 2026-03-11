import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function AlertClosedScreen({ navigation }) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>!Alerta Terminada!</Text>
        <Text style={styles.subtitle}>
          Deja una calificacion de acuerdo a como fue la atencion del elemento, esto nos ayudara a mejorar el servicio.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Calificacion</Text>
      <View style={styles.starsWrap}>
        {[1, 2, 3, 4, 5].map((value) => (
          <Pressable key={value} onPress={() => setRating(value)}>
            <Ionicons name={rating >= value ? "star" : "star-outline"} size={32} color="#1F2937" />
          </Pressable>
        ))}
      </View>

      <TextInput
        style={styles.textArea}
        value={feedback}
        onChangeText={setFeedback}
        multiline
        placeholder="Descripcion sobre la atencion del elemento (Opcional)"
        textAlignVertical="top"
      />

      <Pressable style={styles.primaryButton} onPress={() => navigation.navigate("Dashboard")}>
        <Text style={styles.primaryText}>Enviar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ECEEF3",
    padding: 16,
    paddingTop: 22,
  },
  card: {
    borderWidth: 1,
    borderColor: "#22C55E",
    borderRadius: 14,
    backgroundColor: "#ECFDF5",
    padding: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1F2937",
    lineHeight: 30,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 17,
    color: "#374151",
  },
  sectionTitle: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
  starsWrap: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#111827",
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
  },
  textArea: {
    marginTop: 12,
    minHeight: 124,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#111827",
    backgroundColor: "#FFFFFF",
    padding: 10,
    fontSize: 14,
  },
  primaryButton: {
    marginTop: 14,
    borderRadius: 8,
    backgroundColor: "#1D4ED8",
    alignItems: "center",
    paddingVertical: 10,
  },
  primaryText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
});

