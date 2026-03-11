import React from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";
import api from "../../services/api";

export default function PoliceAlertScreen({ navigation, route }) {
  const alert = route?.params?.alert || {};
  const getNumeric = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };
  const pointCoords = Array.isArray(alert?.ubicacion?.coordinates) ? alert.ubicacion.coordinates : null;
  const latitude = getNumeric(alert?.lat ?? alert?.latitude ?? alert?.dataValues?.lat ?? pointCoords?.[1]) ?? 19.4326;
  const longitude = getNumeric(alert?.lng ?? alert?.longitude ?? alert?.dataValues?.lng ?? pointCoords?.[0]) ?? -99.1332;
  const alertId = alert?.id || alert?._id;
  const citizenName = (typeof alert?.ciudadano === "string" ? alert?.ciudadano : alert?.ciudadano?.nombre) || "Sin nombre";
  const citizenPhone = alert?.ciudadano?.telefono || alert?.telefono_ciudadano || alert?.telefono || "Sin telefono";
  const locationText =
    typeof alert?.direccion === "string" && alert.direccion.trim()
      ? alert.direccion.trim()
      : `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

  const openMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url).catch(() => {});
  };

  const goToReport = async () => {
    if (alertId) {
      try {
        await api.patch(`/mobile/asignaciones/${alertId}/estado`, { estado: "atendiendo" });
      } catch {}
    }
    navigation.navigate("PoliceReport", { alert });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Panel de Policia</Text>
        <Ionicons name="shield-outline" size={22} color="#1D4ED8" />
      </View>
      <Text style={styles.agentText}>{alert?.unidadAsignada || "Unidad en servicio"}</Text>

      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>Boton de Panico</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>En atencion</Text></View>
        </View>
        <Text style={styles.sectionLabel}>Detalles de la emergencia:</Text>
        <Text style={styles.line}>Nombre: {citizenName}</Text>
        <Text style={styles.line}>Telefono: {citizenPhone}</Text>
        <Text style={styles.line}>Ubicacion: {locationText}</Text>
        <Text style={styles.line}>Unidad asignada: {alert?.unidadAsignada || "Patrulla"}</Text>
        <Text style={styles.sectionLabel}>Ruta a seguir:</Text>
        <MapView style={styles.map} initialRegion={{ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }}>
          <Marker coordinate={{ latitude, longitude }} title="Emergencia" />
        </MapView>
        <Pressable style={styles.secondaryButton} onPress={openMaps}><Text style={styles.secondaryButtonText}>Ver en Google Maps</Text></Pressable>
      </View>
      <Pressable style={styles.primaryButton} onPress={goToReport}><Text style={styles.primaryButtonText}>Enviar reporte</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6", padding: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "800", color: "#111827" },
  agentText: { marginTop: 3, color: "#6B7280", fontSize: 12, marginBottom: 8 },
  card: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#2563EB", borderRadius: 12, padding: 10 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 14, fontWeight: "800", color: "#111827" },
  badge: { backgroundColor: "#F97316", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  badgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "700" },
  sectionLabel: { marginTop: 10, fontWeight: "700", color: "#111827", fontSize: 12 },
  line: { marginTop: 3, color: "#374151", fontSize: 12 },
  map: { marginTop: 8, height: 210, borderRadius: 10 },
  secondaryButton: { marginTop: 10, borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 999, alignItems: "center", paddingVertical: 7 },
  secondaryButtonText: { color: "#374151", fontWeight: "600", fontSize: 12 },
  primaryButton: { marginTop: 14, height: 42, borderRadius: 10, backgroundColor: "#1D4ED8", alignItems: "center", justifyContent: "center" },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "700" },
});
