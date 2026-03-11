import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import api from "../../services/api";
import { getCurrentLocation, startLocationUpdates } from "../../services/location";
import { useAuth } from "../../context/AuthContext";
import HamburgerMenu from "../../components/HamburgerMenu";

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeActiveAlerts(payload) {
  const list = toArray(payload?.alertas || payload?.data || payload);
  return list.map((item) => ({ ...item, source: "activas", estado: item?.estado || "activa" }));
}

function normalizeMyAlerts(payload) {
  const list = toArray(payload?.data || payload?.alertas || payload);
  return list.map((item) => ({ ...item, source: "mias" }));
}

function mergeAlerts(activeAlerts, myAlerts) {
  const map = new Map();
  [...activeAlerts, ...myAlerts].forEach((item) => {
    const id = String(item?.id || item?._id || "");
    if (!id) return;
    map.set(id, item);
  });
  return [...map.values()];
}

function citizenName(alerta) {
  return (typeof alerta?.ciudadano === "string" ? alerta?.ciudadano : alerta?.ciudadano?.nombre) || "Sin nombre";
}

function citizenPhone(alerta) {
  return alerta?.ciudadano?.telefono || alerta?.telefono_ciudadano || alerta?.telefono || "Sin telefono";
}

function getNumeric(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function extractLatLng(alerta) {
  const directLat = getNumeric(alerta?.lat ?? alerta?.latitude ?? alerta?.dataValues?.lat);
  const directLng = getNumeric(alerta?.lng ?? alerta?.longitude ?? alerta?.dataValues?.lng);
  if (directLat !== null && directLng !== null) {
    return { lat: directLat, lng: directLng };
  }

  const coords = alerta?.ubicacion?.coordinates;
  if (Array.isArray(coords) && coords.length >= 2) {
    const lng = getNumeric(coords[0]);
    const lat = getNumeric(coords[1]);
    if (lat !== null && lng !== null) {
      return { lat, lng };
    }
  }

  return null;
}

function alertLocationText(alerta) {
  if (typeof alerta?.direccion === "string" && alerta.direccion.trim()) {
    return alerta.direccion.trim();
  }
  const coords = extractLatLng(alerta);
  if (coords) {
    return `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
  }
  return "Direccion no disponible";
}

export default function PoliceDashboardScreen({ navigation }) {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [available, setAvailable] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [unitLocation, setUnitLocation] = useState(null);

  const menuItems = useMemo(
    () => [
      {
        key: "profile",
        label: "Mi perfil",
        icon: "person-outline",
        onPress: () => navigation.navigate("PoliceProfile"),
      },
      {
        key: "logout",
        label: "Cerrar sesion",
        icon: "log-out-outline",
        color: "#DC2626",
        onPress: logout,
      },
    ],
    [logout, navigation],
  );

  const pendingAlerts = useMemo(
    () => alerts.filter((item) => (item?.tipo || "").toLowerCase() !== "medica" && item?.estado !== "cerrada"),
    [alerts],
  );

  const activeCount = pendingAlerts.filter((item) => item?.estado === "atendiendo").length;
  const waitingCount = pendingAlerts.filter((item) => item?.estado !== "atendiendo").length;
  const closedCount = alerts.filter((item) => item?.estado === "cerrada").length;

  const ensureLocation = useCallback(async () => {
    if (unitLocation?.lat && unitLocation?.lng) {
      return unitLocation;
    }

    const coords = await getCurrentLocation();
    setUnitLocation(coords);
    return coords;
  }, [unitLocation]);

  const loadAlerts = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const myAlertsPromise = api.get("/mobile/asignaciones/mias");

      let nearAlertsPromise = Promise.resolve({ data: { alertas: [] } });
      try {
        const coords = await ensureLocation();
        nearAlertsPromise = api.get("/alertas/activas", {
          params: {
            lat: coords.lat,
            lng: coords.lng,
            radio: 25,
          },
        });
      } catch {
        if (isRefresh) {
          Alert.alert("Ubicacion requerida", "Activa permisos de ubicacion para ver alertas cercanas.");
        }
      }

      const [myRes, nearRes] = await Promise.allSettled([myAlertsPromise, nearAlertsPromise]);

      const myAlerts = myRes.status === "fulfilled" ? normalizeMyAlerts(myRes.value?.data) : [];
      const nearAlerts = nearRes.status === "fulfilled" ? normalizeActiveAlerts(nearRes.value?.data) : [];

      setAlerts(mergeAlerts(nearAlerts, myAlerts));
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [ensureLocation]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  useEffect(() => {
    const polling = setInterval(() => {
      loadAlerts(false);
    }, 12000);

    return () => clearInterval(polling);
  }, [loadAlerts]);

  useEffect(() => {
    let watcher = null;

    if (available) {
      startLocationUpdates(async (coords) => {
        setUnitLocation(coords);
        try {
          await api.patch("/mobile/unidades/ubicacion", coords);
        } catch {
          // No bloqueamos si falla ubicacion.
        }
      }, 10000)
        .then((subscription) => {
          watcher = subscription;
        })
        .catch(() => {
          watcher = null;
        });
    }

    return () => {
      watcher?.remove?.();
    };
  }, [available]);

  const handleAccept = async (alerta) => {
    const alertId = alerta?.id || alerta?._id;
    if (!alertId) {
      Alert.alert("Error", "La alerta no tiene identificador valido");
      return;
    }

    try {
      await api.post(`/mobile/asignaciones/${alertId}/aceptar`);
      navigation.navigate("PoliceAlert", { alert: { ...alerta, estado: "asignada" } });
    } catch (error) {
      Alert.alert("Error", error?.response?.data?.message || error?.response?.data?.error || "No se pudo aceptar la alerta");
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1D4ED8" />
      </View>
    );
  }

  const topAlert = pendingAlerts[0];
  const isAssignedToMe =
    topAlert?.source === "mias" || topAlert?.unidad_id || topAlert?.estado === "asignada" || topAlert?.estado === "atendiendo";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadAlerts(true)} />}
    >
      <View style={styles.topbar}>
        <Pressable style={styles.menuButton} onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu" size={22} color="#111827" />
        </Pressable>
        <View style={styles.topbarBrand}>
          <Ionicons name="shield-outline" size={17} color="#1D4ED8" />
          <Text style={styles.topbarText}>Sistema de Alertas</Text>
        </View>
      </View>

      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>Panel de Policia</Text>
          <Text style={styles.agentText}>Unidad activa</Text>
        </View>
        <Pressable onPress={() => navigation.navigate("PoliceProfile")}>
          <Ionicons name="shield-outline" size={22} color="#1D4ED8" />
        </Pressable>
      </View>

      <View style={styles.statusCard}>
        <View style={styles.statusDot} />
        <View style={styles.statusTextWrap}>
          <Text style={styles.statusTitle}>Estado de disponibilidad</Text>
          <Text style={styles.statusSubtitle}>{available ? "Disponible para recibir alertas" : "Fuera de servicio"}</Text>
        </View>
        <Switch value={available} onValueChange={setAvailable} />
      </View>

      <Text style={styles.sectionTitle}>Emergencias Policiales Pendientes de Confirmacion ({pendingAlerts.length})</Text>

      {topAlert ? (
        <View style={styles.alertCard}>
          <View style={styles.alertCardHeader}>
            <Text style={styles.alertCardTitle}>Emergencias asignadas</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{topAlert?.estado || "pendiente"}</Text>
            </View>
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Datos del ciudadano</Text>
            <Text style={styles.infoText}>Nombre: {citizenName(topAlert)}</Text>
            <Text style={styles.infoText}>Telefono: {citizenPhone(topAlert)}</Text>
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Ubicacion</Text>
            <Text style={styles.infoText}>{alertLocationText(topAlert)}</Text>
          </View>

          <Pressable
            style={styles.primaryButton}
            onPress={() => {
              if (isAssignedToMe) {
                navigation.navigate("PoliceAlert", { alert: topAlert });
                return;
              }
              handleAccept(topAlert);
            }}
          >
            <Ionicons name={isAssignedToMe ? "eye-outline" : "checkmark"} color="#FFFFFF" size={16} />
            <Text style={styles.primaryButtonText}>{isAssignedToMe ? "Ver detalle" : "Confirmar atencion"}</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Emergencias asignadas</Text>
          <Text style={styles.emptyText}>Sin alertas por ahora. Recuerda: nuevas alertas tardan aprox. 30s en activarse.</Text>
        </View>
      )}

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statTitle}>Alertas Activas</Text>
          <View style={styles.statRow}>
            <Text style={styles.statValue}>{activeCount}</Text>
            <MaterialIcons name="graphic-eq" size={24} color="#FB923C" />
          </View>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statTitle}>En Espera</Text>
          <View style={styles.statRow}>
            <Text style={styles.statValue}>{waitingCount}</Text>
            <Ionicons name="alert-circle" size={24} color="#EF4444" />
          </View>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statTitle}>Completadas</Text>
          <View style={styles.statRow}>
            <Text style={styles.statValue}>{closedCount}</Text>
            <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
          </View>
        </View>
      </View>

      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>Instrucciones de Operacion</Text>
        <Text style={styles.instructionsItem}>- Mantente en estado "Disponible" cuando estes en servicio.</Text>
        <Text style={styles.instructionsItem}>- Responde alertas dentro del SLA institucional.</Text>
        <Text style={styles.instructionsItem}>- Actualiza estado de la alerta al llegar al incidente.</Text>
        <Text style={styles.instructionsItem}>- Completa reporte de cierre al finalizar la atencion.</Text>
      </View>

      <HamburgerMenu visible={menuVisible} onClose={() => setMenuVisible(false)} title="Menu policia" items={menuItems} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  content: { padding: 14, paddingBottom: 34 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F3F4F6" },
  topbar: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 28,
  },
  menuButton: {
    position: "absolute",
    left: 0,
    top: 1,
    padding: 2,
  },
  topbarBrand: { flexDirection: "row", alignItems: "center", gap: 5 },
  topbarText: { fontWeight: "700", color: "#111827", fontSize: 13 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, marginBottom: 10 },
  headerTitle: { fontSize: 30, fontWeight: "800", color: "#111827" },
  agentText: { color: "#6B7280", fontSize: 13 },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#86EFAC",
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  statusDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: "#22C55E", marginRight: 10 },
  statusTextWrap: { flex: 1 },
  statusTitle: { fontWeight: "700", color: "#111827", fontSize: 13 },
  statusSubtitle: { fontSize: 11, color: "#4B5563" },
  sectionTitle: { fontSize: 14, color: "#DC2626", fontWeight: "800", marginBottom: 10 },
  alertCard: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#2563EB", borderRadius: 14, padding: 10 },
  alertCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  alertCardTitle: { fontSize: 13, fontWeight: "700", color: "#111827" },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: "#16A34A" },
  badgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "700", textTransform: "capitalize" },
  infoBlock: { marginBottom: 8, borderRadius: 10, backgroundColor: "#F9FAFB", padding: 9 },
  infoLabel: { fontWeight: "700", color: "#111827", marginBottom: 4, fontSize: 12 },
  infoText: { color: "#374151", fontSize: 12 },
  primaryButton: {
    marginTop: 2,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "800", textTransform: "uppercase", fontSize: 12 },
  emptyCard: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#F97316", borderRadius: 12, padding: 12 },
  emptyTitle: { color: "#111827", fontWeight: "700", marginBottom: 6 },
  emptyText: {
    color: "#6B7280",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    textAlign: "center",
  },
  statsGrid: { marginTop: 10, gap: 8 },
  statCard: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 10 },
  statTitle: { color: "#111827", fontSize: 13 },
  statRow: { marginTop: 3, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statValue: { fontSize: 24, fontWeight: "800", color: "#111827" },
  instructionsCard: {
    marginTop: 12,
    backgroundColor: "#EFF6FF",
    borderColor: "#3B82F6",
    borderWidth: 1,
    borderRadius: 12,
    padding: 11,
  },
  instructionsTitle: { fontWeight: "800", color: "#1D4ED8", marginBottom: 6 },
  instructionsItem: { color: "#1E3A8A", fontSize: 11, marginBottom: 3 },
});


