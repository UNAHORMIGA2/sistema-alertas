import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { getAlertEffectiveState, isAlertFinalForClient } from "../../services/alertState";
import { formatDateTime, getAlertId } from "../../services/alertUtils";
import { loadLocalExtendedProfile, saveLocalExtendedProfile } from "../../services/localExtendedProfile";
import TermsModal from "../../components/TermsModal";
import {
  AGE_OPTIONS,
  GENDER_OPTIONS,
  getAgeNumber,
  getAgeRangeLabel,
  getAgeSelectionValue,
  getMunicipalityOptions,
  STATE_OPTIONS,
} from "../../services/profileCatalogs";

function normalizeAlertsPayload(payload) {
  const list = payload?.alertas || payload?.data || payload;
  return Array.isArray(list) ? list : [];
}

function getCitizenStatusLabel(state) {
  const normalized = String(state || "").toLowerCase();
  if (normalized === "confirmando") return "En confirmacion";
  if (normalized === "activa") return "Buscando unidad";
  if (normalized === "asignada") return "Ayuda en camino";
  if (normalized === "atendiendo") return "Unidad atendiendo";
  if (normalized === "cerrada") return "Cerrada";
  if (normalized === "cancelada") return "Cancelada";
  if (normalized === "expirada") return "Expirada";
  return "En proceso";
}

function SelectField({ label, value, placeholder, onPress, disabled = false }) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={[styles.selectField, disabled && styles.selectDisabled]} onPress={onPress} disabled={disabled}>
        <Text style={[styles.selectValue, !value && styles.placeholderText]}>{value || placeholder}</Text>
        <Text style={styles.chevron}>v</Text>
      </Pressable>
    </View>
  );
}

export default function PerfilScreen({ navigation }) {
  const { user, updateUser, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [latestAlert, setLatestAlert] = useState(null);
  const [termsVisible, setTermsVisible] = useState(false);
  const [activeSelector, setActiveSelector] = useState("");

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [edad, setEdad] = useState("");
  const [genero, setGenero] = useState("");

  const trackedAlertIdRef = useRef("");
  const handledClosedAlertIdRef = useRef("");

  const municipalityOptions = useMemo(() => {
    const baseOptions = getMunicipalityOptions(estado);
    if (municipio && !baseOptions.includes(municipio)) {
      return [municipio, ...baseOptions];
    }
    return baseOptions;
  }, [estado, municipio]);

  const selectorConfig = useMemo(
    () => ({
      estado: {
        title: "Selecciona tu estado",
        options: STATE_OPTIONS,
        onSelect: (option) => {
          setEstado(option);
          if (!getMunicipalityOptions(option).includes(municipio)) {
            setMunicipio("");
          }
        },
      },
      municipio: {
        title: estado ? `Selecciona tu municipio en ${estado}` : "Selecciona primero tu estado",
        options: municipalityOptions,
        onSelect: (option) => setMunicipio(option),
      },
      edad: {
        title: "Selecciona tu edad",
        options: AGE_OPTIONS,
        onSelect: (option) => setEdad(option),
      },
      genero: {
        title: "Selecciona tu genero",
        options: GENDER_OPTIONS,
        onSelect: (option) => setGenero(option),
      },
    }),
    [estado, municipio, municipalityOptions],
  );

  const currentSelector = selectorConfig[activeSelector];

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/mobile/ciudadano/perfil");
      const profile = response?.data?.data || {};
      const localExtended = await loadLocalExtendedProfile({ ...user, ...profile });

      const merged = {
        ...user,
        ...profile,
        ...localExtended,
      };

      setNombre(merged?.nombre || "");
      setTelefono(merged?.telefono || "");
      setEmail(merged?.email || "");
      setEstado(merged?.estado || "");
      setMunicipio(merged?.municipio || "");
      setEdad(getAgeSelectionValue(merged?.edad, merged?.edad_texto));
      setGenero(merged?.genero || "");
    } catch {
      const localExtended = await loadLocalExtendedProfile(user);
      const merged = { ...user, ...localExtended };
      setNombre(merged?.nombre || "");
      setTelefono(merged?.telefono || "");
      setEmail(merged?.email || "");
      setEstado(merged?.estado || "");
      setMunicipio(merged?.municipio || "");
      setEdad(getAgeSelectionValue(merged?.edad, merged?.edad_texto));
      setGenero(merged?.genero || "");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshLatestAlert = useCallback(async () => {
    try {
      const response = await api.get("/mobile/ciudadano/mis-alertas", {
        params: { pagina: 1, limite: 10 },
      });

      const alerts = normalizeAlertsPayload(response?.data);
      const activeAlert = alerts.find((item) => !isAlertFinalForClient(item));
      const latest = activeAlert || alerts[0] || null;
      setLatestAlert(latest);

      if (activeAlert) {
        trackedAlertIdRef.current = String(getAlertId(activeAlert) || "");
        return;
      }

      if (!trackedAlertIdRef.current) {
        return;
      }

      const trackedAlert = alerts.find((item) => String(getAlertId(item) || "") === trackedAlertIdRef.current);
      const trackedState = trackedAlert ? getAlertEffectiveState(trackedAlert) : "expirada";

      if (trackedAlert && trackedState === "cerrada" && handledClosedAlertIdRef.current !== trackedAlertIdRef.current) {
        handledClosedAlertIdRef.current = trackedAlertIdRef.current;
        trackedAlertIdRef.current = "";
        navigation.navigate("AlertClosed", { alert: trackedAlert });
        return;
      }

      if (!trackedAlert || trackedState === "cancelada" || trackedState === "expirada") {
        trackedAlertIdRef.current = "";
      }
    } catch {
      // Conservamos la ultima informacion si falla la consulta.
    }
  }, [navigation]);

  useEffect(() => {
    loadProfile();
    refreshLatestAlert();
  }, [loadProfile, refreshLatestAlert]);

  useFocusEffect(
    useCallback(() => {
      refreshLatestAlert();
      const interval = setInterval(() => {
        refreshLatestAlert();
      }, 12000);

      return () => clearInterval(interval);
    }, [refreshLatestAlert]),
  );

  const handleSelectOption = (option) => {
    currentSelector?.onSelect?.(option);
    setActiveSelector("");
  };

  const saveProfile = async () => {
    try {
      setSaving(true);

      const payload = {
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        estado: estado.trim(),
        municipio: municipio.trim(),
        edad: getAgeNumber(edad),
        edad_texto: getAgeRangeLabel(edad),
        genero: genero.trim(),
      };

      if (
        !payload.nombre ||
        payload.telefono.length < 8 ||
        !payload.estado ||
        !payload.municipio ||
        !edad ||
        !payload.genero
      ) {
        Alert.alert("Faltan datos", "Completa nombre, telefono, estado, municipio, edad y genero.");
        return;
      }

      const response = await api.patch("/mobile/ciudadano/perfil", payload);
      const updated = {
        ...user,
        ...(response?.data?.data || payload),
        ...payload,
      };

      await updateUser(updated);
      await saveLocalExtendedProfile(updated, payload);
      setEditing(false);
      Alert.alert("Perfil actualizado", "Tus datos fueron guardados correctamente.");
    } catch (error) {
      Alert.alert("Error", error?.response?.data?.error || error?.response?.data?.message || "No se pudo guardar el perfil.");
    } finally {
      setSaving(false);
    }
  };

  const toggleEditing = () => {
    if (editing) {
      saveProfile();
      return;
    }
    setEditing(true);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1D4ED8" />
      </View>
    );
  }

  const latestState = latestAlert ? getAlertEffectiveState(latestAlert) : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Mi Perfil</Text>
        <Pressable style={styles.editButton} onPress={toggleEditing} disabled={saving}>
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.editButtonText}>{editing ? "Guardar" : "Editar perfil"}</Text>}
        </Pressable>
      </View>

      <Text style={styles.subtitle}>Revisa y actualiza tu informacion personal.</Text>

      {latestAlert ? (
        <View style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <Ionicons name="pulse-outline" size={18} color="#1D4ED8" />
            <Text style={styles.alertTitle}>Estado de tu ultima alerta</Text>
          </View>
          <Text style={styles.alertLine}>Estado: {getCitizenStatusLabel(latestState)}</Text>
          <Text style={styles.alertLine}>Tipo: {latestAlert?.tipo || "Sin tipo"}</Text>
          <Text style={styles.alertLine}>Creada: {formatDateTime(latestAlert?.fecha_creacion)}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <View style={styles.avatarWrap}>
          <Ionicons name="person-outline" size={28} color="#FFFFFF" />
        </View>

        <Text style={styles.name}>{nombre || "Usuario"}</Text>

        <Text style={styles.label}>Nombre completo</Text>
        <TextInput
          style={[styles.input, !editing && styles.readonly]}
          value={nombre}
          onChangeText={setNombre}
          editable={editing}
          placeholder="Tu nombre completo"
        />

        <Text style={styles.label}>Correo electronico</Text>
        <TextInput style={[styles.input, styles.readonly]} value={email} editable={false} />

        <Text style={styles.label}>Telefono</Text>
        <TextInput
          style={[styles.input, !editing && styles.readonly]}
          value={telefono}
          onChangeText={setTelefono}
          keyboardType="phone-pad"
          editable={editing}
          placeholder="Tu telefono"
        />

        <SelectField
          label="Estado"
          value={estado}
          placeholder="Selecciona un estado"
          onPress={() => editing && setActiveSelector("estado")}
          disabled={!editing}
        />

        <SelectField
          label="Municipio"
          value={municipio}
          placeholder={estado ? "Selecciona un municipio" : "Primero elige tu estado"}
          onPress={() => editing && setActiveSelector("municipio")}
          disabled={!editing || !estado}
        />

        <View style={styles.row}>
          <View style={styles.col}>
            <SelectField
              label="Edad"
              value={edad}
              placeholder="Selecciona"
              onPress={() => editing && setActiveSelector("edad")}
              disabled={!editing}
            />
          </View>
          <View style={styles.col}>
            <SelectField
              label="Genero"
              value={genero}
              placeholder="Selecciona"
              onPress={() => editing && setActiveSelector("genero")}
              disabled={!editing}
            />
          </View>
        </View>

        <Text style={styles.label}>Privacidad</Text>
        <Pressable style={styles.termsButton} onPress={() => setTermsVisible(true)}>
          <Text style={styles.termsButtonText}>Ver terminos y condiciones</Text>
        </Pressable>

        <Pressable onPress={logout} style={styles.deleteButton}>
          <Text style={styles.deleteText}>Cerrar sesion</Text>
        </Pressable>
      </View>

      <Modal transparent visible={Boolean(activeSelector)} animationType="fade" onRequestClose={() => setActiveSelector("")}>
        <Pressable style={styles.modalOverlay} onPress={() => setActiveSelector("")}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>{currentSelector?.title || "Selecciona una opcion"}</Text>
            <ScrollView style={styles.optionsList} contentContainerStyle={styles.optionsContent}>
              {(currentSelector?.options || []).map((option) => (
                <Pressable key={option} style={styles.optionItem} onPress={() => handleSelectOption(option)}>
                  <Text style={styles.optionText}>{option}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <TermsModal visible={termsVisible} onClose={() => setTermsVisible(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ECEEF3" },
  content: { padding: 16, paddingBottom: 34 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#ECEEF3" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 32, fontWeight: "900", color: "#111827" },
  editButton: { backgroundColor: "#111827", borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, minWidth: 110, alignItems: "center" },
  editButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  subtitle: { marginTop: 4, color: "#6B7280", fontSize: 14 },
  alertCard: {
    marginTop: 12,
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2563EB",
    padding: 12,
  },
  alertHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  alertTitle: { color: "#1E3A8A", fontWeight: "800", fontSize: 15 },
  alertLine: { marginTop: 6, color: "#1E3A8A", fontSize: 12 },
  card: { marginTop: 12, backgroundColor: "#FFFFFF", borderRadius: 18, borderWidth: 1, borderColor: "#D1D5DB", padding: 14 },
  avatarWrap: { alignSelf: "center", width: 64, height: 64, borderRadius: 32, backgroundColor: "#2563EB", alignItems: "center", justifyContent: "center" },
  name: { marginTop: 10, textAlign: "center", color: "#1F2937", fontWeight: "800", fontSize: 26 },
  label: { marginTop: 12, color: "#111827", fontWeight: "700", fontSize: 13 },
  input: {
    marginTop: 6,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    fontSize: 16,
    color: "#0F172A",
  },
  readonly: {
    backgroundColor: "#F8FAFC",
    color: "#475569",
  },
  selectField: {
    marginTop: 6,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectDisabled: {
    opacity: 0.6,
    backgroundColor: "#F8FAFC",
  },
  selectValue: {
    flex: 1,
    color: "#111827",
    fontSize: 16,
  },
  placeholderText: {
    color: "#94A3B8",
  },
  chevron: {
    marginLeft: 10,
    color: "#64748B",
    fontWeight: "700",
    fontSize: 16,
  },
  row: { flexDirection: "row", gap: 10 },
  col: { flex: 1 },
  termsButton: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#F8FAFC",
  },
  termsButtonText: {
    color: "#1D4ED8",
    fontWeight: "700",
    fontSize: 14,
  },
  deleteButton: { marginTop: 14, alignItems: "flex-end" },
  deleteText: { color: "#DC2626", fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  modalCard: {
    maxHeight: "70%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  optionsList: {
    width: "100%",
  },
  optionsContent: {
    paddingHorizontal: 10,
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
});
