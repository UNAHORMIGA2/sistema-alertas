import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function AlertCreatedScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>!La alerta esta lista!</Text>
        <Text style={styles.subtitle}>
          Procura activar tu wifi o datos moviles para que pueda ser enviada automaticamente a los servicios de
          emergencias.
        </Text>
      </View>

      <Pressable style={styles.primaryButton} onPress={() => navigation.navigate("HelpOnTheWay")}>
        <Text style={styles.primaryText}>Continuar</Text>
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
    lineHeight: 29,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 17,
    color: "#374151",
  },
  primaryButton: {
    marginTop: 18,
    alignSelf: "center",
    borderRadius: 8,
    backgroundColor: "#1D4ED8",
    paddingHorizontal: 22,
    paddingVertical: 9,
  },
  primaryText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
  },
});

