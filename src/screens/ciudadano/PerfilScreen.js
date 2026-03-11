import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function PerfilScreen() {
  const { user, updateUser, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get("/mobile/ciudadano/perfil");
      const profile = response?.data?.data || {};

      setNombre(profile?.nombre || user?.nombre || "");
      setTelefono(profile?.telefono || "");
      setEmail(profile?.email || user?.email || "");
    } catch {
      setNombre(user?.nombre || "");
      setTelefono(user?.telefono || "");
      setEmail(user?.email || "");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const saveProfile = async () => {
    try {
      setSaving(true);
      const payload = {
        nombre: nombre.trim(),
        telefono: telefono.trim(),
      };

      const response = await api.patch("/mobile/ciudadano/perfil", payload);
      const updated = response?.data?.data || payload;
      await updateUser(updated);
      Alert.alert("Perfil actualizado", "Tus datos fueron guardados correctamente.");
    } catch (error) {
      Alert.alert("Error", error?.response?.data?.error || error?.response?.data?.message || "No se pudo guardar el perfil.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1D4ED8" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Mi Perfil</Text>
        <Pressable style={styles.editButton} onPress={saveProfile} disabled={saving}>
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.editButtonText}>Editar perfil</Text>}
        </Pressable>
      </View>

      <Text style={styles.subtitle}>Revisa tu informacion personal</Text>

      <View style={styles.card}>
        <View style={styles.avatarWrap}>
          <Ionicons name="person-outline" size={26} color="#FFFFFF" />
        </View>

        <Text style={styles.name}>{nombre || "Usuario"}</Text>

        <Text style={styles.label}>Nombre completo</Text>
        <TextInput style={styles.input} value={nombre} onChangeText={setNombre} />

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

        <Pressable onPress={logout} style={styles.deleteButton}>
          <Text style={styles.deleteText}>Eliminar mi cuenta</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ECEEF3" },
  content: { padding: 16, paddingBottom: 34 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#ECEEF3" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 40, fontWeight: "900", color: "#111827" },
  editButton: { backgroundColor: "#111827", borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10, minWidth: 95, alignItems: "center" },
  editButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 12 },
  subtitle: { marginTop: 2, color: "#6B7280", fontSize: 13 },
  card: { marginTop: 12, backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#111827", padding: 12 },
  avatarWrap: { alignSelf: "center", width: 58, height: 58, borderRadius: 29, backgroundColor: "#2563EB", alignItems: "center", justifyContent: "center" },
  name: { marginTop: 8, textAlign: "center", color: "#1F2937", fontWeight: "700", fontSize: 32 },
  label: { marginTop: 10, color: "#111827", fontWeight: "700", fontSize: 13 },
  input: { marginTop: 4, height: 34, borderRadius: 6, backgroundColor: "#F3F4F6", paddingHorizontal: 10, borderWidth: 1, borderColor: "#E5E7EB" },
  readonly: { opacity: 0.75 },
  fakeInput: { marginTop: 4, height: 34, borderRadius: 6, backgroundColor: "#F3F4F6", justifyContent: "center", paddingHorizontal: 10 },
  fakeInputText: { color: "#6B7280" },
  privacy: { marginTop: 4, color: "#374151", fontSize: 12 },
  deleteButton: { marginTop: 10, alignItems: "flex-end" },
  deleteText: { color: "#DC2626", fontWeight: "600" },
});
