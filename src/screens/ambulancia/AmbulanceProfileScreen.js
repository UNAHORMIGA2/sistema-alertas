import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import TermsModal from "../../components/TermsModal";
import api from "../../services/api";

export default function AmbulanceProfileScreen() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [termsVisible, setTermsVisible] = useState(false);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await api.get("/mobile/personal/perfil");
        const profile = response?.data?.data || {};
        setNombre(profile?.nombre || user?.nombre || "");
        setEmail(profile?.email || user?.email || "");
        setTelefono(profile?.telefono || user?.telefono || "");
      } catch {
        setNombre(user?.nombre || "");
        setEmail(user?.email || "");
        setTelefono(user?.telefono || "");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  const save = async () => {
    try {
      const cleanPhone = telefono.trim();
      if (cleanPhone.length < 8) {
        Alert.alert("Telefono incompleto", "Ingresa un telefono valido para guardar cambios.");
        return;
      }

      setSaving(true);
      const response = await api.patch("/mobile/personal/perfil", { telefono: cleanPhone });
      const data = response?.data?.data || { telefono: cleanPhone };
      await updateUser({ ...user, ...data });
      setEditing(false);
      Alert.alert("Perfil actualizado", "Telefono actualizado correctamente.");
    } catch (error) {
      Alert.alert("Error", error?.response?.data?.error || "No se pudo actualizar perfil.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditPress = () => {
    if (editing) {
      save();
      return;
    }

    setEditing(true);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Mi Perfil</Text>
        <Pressable style={styles.editButton} onPress={handleEditPress} disabled={saving}>
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.editButtonText}>{editing ? "Guardar" : "Editar perfil"}</Text>}
        </Pressable>
      </View>
      <Text style={styles.subtitle}>Revisa tu informacion personal y edita solo cuando lo necesites.</Text>

      <View style={styles.card}>
        <View style={styles.avatarWrap}>
          <Ionicons name="heart-outline" color="#FFFFFF" size={28} />
        </View>
        <Text style={styles.name}>{nombre || "Unidad de Ambulancia"}</Text>

        <Text style={styles.label}>Nombre completo</Text>
        <TextInput style={[styles.input, styles.readonly]} value={nombre} editable={false} />

        <Text style={styles.label}>Correo electronico</Text>
        <TextInput style={[styles.input, styles.readonly]} value={email} editable={false} />

        <Text style={styles.label}>Telefono</Text>
        <TextInput
          style={[styles.input, !editing && styles.readonly]}
          value={telefono}
          onChangeText={setTelefono}
          keyboardType="phone-pad"
          editable={editing}
          placeholder="Telefono de contacto"
          placeholderTextColor="#94A3B8"
        />

        <Text style={styles.label}>Seguridad</Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>Contrasena administrada por tu cuenta institucional.</Text>
        </View>

        <Text style={styles.label}>Permisos</Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>Ubicacion habilitada para recibir y atender emergencias.</Text>
        </View>

        <Text style={styles.label}>Privacidad</Text>
        <Pressable style={styles.termsButton} onPress={() => setTermsVisible(true)}>
          <Text style={styles.termsButtonText}>Ver terminos y condiciones</Text>
        </Pressable>
      </View>

      <TermsModal visible={termsVisible} onClose={() => setTermsVisible(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ECEEF3" },
  content: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#ECEEF3" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 32, fontWeight: "900", color: "#111827" },
  editButton: {
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 110,
    alignItems: "center",
  },
  editButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  subtitle: { marginTop: 4, color: "#6B7280", fontSize: 14 },
  card: {
    marginTop: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    padding: 14,
  },
  avatarWrap: {
    alignSelf: "center",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
  },
  name: { marginTop: 10, textAlign: "center", fontSize: 26, fontWeight: "800", color: "#111827" },
  label: { marginTop: 12, color: "#111827", fontWeight: "700", fontSize: 13 },
  input: {
    marginTop: 6,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#0F172A",
  },
  readonly: {
    backgroundColor: "#F8FAFC",
    color: "#475569",
  },
  infoBox: {
    marginTop: 6,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  infoText: { color: "#475569", fontSize: 14, lineHeight: 20 },
  termsButton: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#F8FAFC",
  },
  termsButtonText: { color: "#DC2626", fontWeight: "700", fontSize: 14 },
});
