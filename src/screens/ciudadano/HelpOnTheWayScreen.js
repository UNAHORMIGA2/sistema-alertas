import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { connectSocket, getSocket } from "../../services/socket";

export default function HelpOnTheWayScreen({ navigation, route }) {
  const { token } = useAuth();
  const alert = route?.params?.alert || {};
  const [status, setStatus] = useState(alert?.estado || "asignada");
  const [seconds, setSeconds] = useState(0);

  const statusText = useMemo(() => {
    if (status === "asignada") return "Una unidad confirmo tu alerta y esta en camino a tu ubicacion.";
    if (status === "atendiendo") return "La unidad ya se encuentra atendiendo tu emergencia.";
    if (status === "cerrada") return "La alerta fue cerrada correctamente.";
    return "Mantente en calma y permanece en un lugar seguro.";
  }, [status]);

  useEffect(() => {
    const interval = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const socket = connectSocket(token);

    const onUpdated = (payload) => {
      const sameAlert = String(payload?.alertaId || payload?.id || "") === String(alert?.id || alert?._id || "");
      if (sameAlert || !alert?.id) {
        const next = payload?.nuevoEstado || payload?.estado;
        if (next) setStatus(next);
      }
    };

    socket.on("alerta-actualizada", onUpdated);

    return () => {
      const current = getSocket();
      current?.off("alerta-actualizada", onUpdated);
    };
  }, [alert?.id, alert?._id, token]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>!La ayuda va en camino!</Text>
        <Text style={styles.subtitle}>{statusText}</Text>
        <Text style={styles.tip}>Manten la calma y permanece en un lugar seguro.</Text>
      </View>

      <View style={styles.timerWrap}>
        <Ionicons name="time-outline" size={16} color="#1D4ED8" />
        <Text style={styles.timerText}>Tiempo transcurrido: {seconds} segundos</Text>
      </View>

      <Pressable style={styles.primaryButton} onPress={() => navigation.navigate("AlertClosed")}>
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
    marginTop: 8,
    fontSize: 12,
    lineHeight: 17,
    color: "#374151",
  },
  tip: {
    marginTop: 8,
    color: "#374151",
    fontSize: 11,
  },
  timerWrap: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#2563EB",
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
    paddingVertical: 9,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timerText: {
    color: "#1D4ED8",
    fontWeight: "700",
    fontSize: 11,
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
    fontSize: 14,
  },
});
