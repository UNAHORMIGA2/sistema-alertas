import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function PoliceProfileScreen() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        setTelefono(profile?.telefono || "");
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
      setSaving(true);
      const response = await api.patch("/mobile/personal/perfil", { telefono: telefono.trim() });
      const data = response?.data?.data || { telefono: telefono.trim() };
      await updateUser(data);
      Alert.alert("Perfil actualizado", "Telefono actualizado correctamente.");
    } catch (error) {
      Alert.alert("Error", error?.response?.data?.error || "No se pudo actualizar perfil.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#1D4ED8" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Mi Perfil</Text>
        <Pressable style={styles.editButton} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.editButtonText}>Editar perfil</Text>}
        </Pressable>
      </View>
      <Text style={styles.subtitle}>Revisa tu informacion personal</Text>
      <View style={styles.card}>
        <View style={styles.avatarWrap}><Ionicons name="person-outline" color="#FFFFFF" size={24} /></View>
        <Text style={styles.name}>{nombre || "Maria Garcia"}</Text>

        <Text style={styles.label}>Nombre completo</Text>
        <TextInput style={[styles.input, styles.readonly]} value={nombre} editable={false} />

        <Text style={styles.label}>Correo electronico</Text>
        <TextInput style={[styles.input, styles.readonly]} value={email} editable={false} />

        <Text style={styles.label}>Telefono</Text>
        <TextInput style={styles.input} value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />

        <Text style={styles.label}>Seguridad</Text>
        <View style={styles.fakeInput}><Text style={styles.fakeInputText}>Contrasena</Text></View>

        <Text style={styles.label}>Permisos</Text>
        <View style={styles.fakeInput}><Text style={styles.fakeInputText}>Ubicacion</Text></View>

        <Text style={styles.label}>Privacidad</Text>
        <Text style={styles.privacy}>Terminos y condiciones de uso</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6", padding: 16 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F3F4F6" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 40, fontWeight: "900", color: "#111827" },
  editButton: { backgroundColor: "#111827", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, minWidth: 90, alignItems: "center" },
  editButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 12 },
  subtitle: { marginTop: 2, color: "#4B5563", fontSize: 12 },
  card: { marginTop: 14, backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#111827", padding: 14 },
  avatarWrap: { alignSelf: "center", width: 50, height: 50, borderRadius: 25, backgroundColor: "#2563EB", alignItems: "center", justifyContent: "center" },
  name: { marginTop: 8, textAlign: "center", fontSize: 32, fontWeight: "700", color: "#111827" },
  label: { marginTop: 10, fontWeight: "700", color: "#111827", fontSize: 13 },
  input: { marginTop: 4, height: 34, borderRadius: 6, borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#F3F4F6", paddingHorizontal: 10 },
  readonly: { opacity: 0.75 },
  fakeInput: { marginTop: 4, height: 34, borderRadius: 6, backgroundColor: "#F3F4F6", justifyContent: "center", paddingHorizontal: 10 },
  fakeInputText: { color: "#6B7280" },
  privacy: { marginTop: 4, color: "#374151", fontSize: 12 },
});
