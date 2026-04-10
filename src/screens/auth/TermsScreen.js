import React, { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";
import { TERMS_FULL, TERMS_PREVIEW } from "../../constants/termsContent";

function sessionHeaders(session) {
  const access = session?.accessToken;

  return {
    Authorization: access ? `Bearer ${access}` : undefined,
    "x-plataforma": "mobile",
    Cookie: session?.refreshToken
      ? `access_token=${access || ""}; refresh_token=${session.refreshToken}`
      : access
        ? `access_token=${access}`
        : undefined,
  };
}

export default function TermsScreen({ navigation, route }) {
  const session = route?.params?.session;
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleAccept = async () => {
    try {
      setLoading(true);
      await api.post("/auth/aceptar-terminos", {}, { headers: sessionHeaders(session) });

      const updatedSession = {
        ...session,
        user: {
          ...(session?.user || {}),
          terminos_aceptados: true,
        },
      };

      navigation.navigate("CompleteProfile", { session: updatedSession });
    } catch (error) {
      Alert.alert(
        "No se pudo guardar",
        error?.response?.data?.error || error?.response?.data?.message || "Intenta de nuevo para continuar.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="document-text-outline" size={28} color="#FFFFFF" />
        </View>

        <Text style={styles.title}>Terminos y Condiciones</Text>
        <Text style={styles.subtitle}>Acepta los terminos para poder seguir con el proceso de registro</Text>

        <ScrollView style={styles.termsBox} contentContainerStyle={styles.termsContent}>
          {TERMS_PREVIEW.map((item) => (
            <Text key={item} style={styles.text}>
              {item}
            </Text>
          ))}
          {expanded
            ? TERMS_FULL.map((item) => (
                <Text key={item} style={styles.text}>
                  {item}
                </Text>
              ))
            : null}
          <Pressable style={styles.moreButton} onPress={() => setExpanded((value) => !value)}>
            <Text style={styles.more}>{expanded ? "Ver menos" : "Ver mas"}</Text>
          </Pressable>
        </ScrollView>

        <Pressable style={styles.acceptBtn} onPress={handleAccept} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.acceptText}>Acepto</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#1D4ED8",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  card: {
    backgroundColor: "#E5E7EB",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 14,
    alignItems: "center",
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
    marginBottom: 10,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    maxWidth: 250,
  },
  termsBox: {
    marginTop: 12,
    width: "100%",
    maxHeight: 300,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#22C55E",
    backgroundColor: "#ECFDF5",
  },
  termsContent: {
    padding: 10,
    gap: 7,
  },
  text: {
    fontSize: 13,
    lineHeight: 18,
    color: "#111827",
  },
  more: {
    color: "#2563EB",
    fontWeight: "700",
    fontSize: 13,
  },
  moreButton: {
    alignSelf: "flex-start",
    marginTop: 2,
    paddingVertical: 4,
  },
  acceptBtn: {
    marginTop: 14,
    width: "100%",
    borderRadius: 7,
    backgroundColor: "#1D4ED8",
    alignItems: "center",
    paddingVertical: 10,
  },
  acceptText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
});
