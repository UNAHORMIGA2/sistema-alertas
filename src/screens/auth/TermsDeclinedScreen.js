import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function TermsDeclinedScreen({ navigation, route }) {
  const session = route?.params?.session;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>No pudimos continuar</Text>
      <Text style={styles.description}>
        Debes aceptar los terminos para usar el sistema de emergencias. Si cambias de opinion, puedes volver a
        revisarlos.
      </Text>

      <Pressable style={styles.primaryButton} onPress={() => navigation.navigate("Terms", { session })}>
        <Text style={styles.primaryText}>Volver a terminos</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => navigation.popToTop()}>
        <Text style={styles.secondaryText}>Regresar a login</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#F8FAFF",
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
  },
  description: {
    marginTop: 14,
    fontSize: 15,
    color: "#475569",
    lineHeight: 22,
  },
  primaryButton: {
    marginTop: 22,
    backgroundColor: "#0A84FF",
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 14,
  },
  primaryText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryButton: {
    marginTop: 12,
    alignItems: "center",
    paddingVertical: 12,
  },
  secondaryText: {
    color: "#475569",
    fontWeight: "600",
  },
});
