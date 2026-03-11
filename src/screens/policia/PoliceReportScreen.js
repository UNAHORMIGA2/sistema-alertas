import React, { useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import api from "../../services/api";

export default function PoliceReportScreen({ navigation, route }) {
  const alert = route?.params?.alert || {};
  const alertId = alert?.id || alert?._id;
  const [descripcion, setDescripcion] = useState("");
  const [photos, setPhotos] = useState([]);
  const [sending, setSending] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Permiso requerido", "Debes permitir acceso a galeria para adjuntar evidencia.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      setPhotos((prev) => [...prev, result.assets[0]]);
    }
  };

  const sendReport = async () => {
    if (!alertId) {
      Alert.alert("Error", "No hay alerta valida para reportar");
      return;
    }

    try {
      setSending(true);
      const formData = new FormData();
      formData.append("descripcion", descripcion.trim());
      photos.forEach((photo, index) => {
        formData.append("fotos", {
          uri: photo.uri,
          type: photo.mimeType || "image/jpeg",
          name: photo.fileName || `foto_${index + 1}.jpg`,
        });
      });

      await api.post(`/reportes/alerta/${alertId}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      try {
        await api.patch(`/mobile/asignaciones/${alertId}/estado`, { estado: "cerrada" });
      } catch {}

      Alert.alert("Exito", "Reporte enviado correctamente");
      navigation.popToTop();
    } catch (error) {
      Alert.alert("Error", error?.response?.data?.message || error?.response?.data?.error || "No se pudo enviar reporte");
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Panel de Policia</Text>
        <Ionicons name="shield-outline" size={22} color="#1D4ED8" />
      </View>
      <Text style={styles.agentText}>{alert?.unidadAsignada || "Unidad en servicio"}</Text>

      <View style={styles.card}>
        <View style={styles.badge}><Text style={styles.badgeText}>En atencion</Text></View>
        <Text style={styles.cardTitle}>Boton de Panico</Text>

        <Text style={styles.label}>Descripcion:</Text>
        <TextInput value={descripcion} onChangeText={setDescripcion} placeholder="Descripcion de lo sucedido" multiline style={styles.input} />

        <Text style={styles.label}>Evidencia:</Text>
        <View style={styles.photosRow}>
          {photos.slice(0, 3).map((photo) => <Image key={photo.uri} source={{ uri: photo.uri }} style={styles.photoPreview} />)}
          <Pressable style={styles.addPhotoButton} onPress={pickImage}><Ionicons name="add" size={24} color="#6B7280" /></Pressable>
        </View>
      </View>

      <Pressable style={styles.primaryButton} onPress={sendReport} disabled={sending}>
        {sending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Enviar Reporte</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  content: { padding: 16, paddingBottom: 32 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "800", color: "#111827" },
  agentText: { marginTop: 3, color: "#6B7280", fontSize: 12, marginBottom: 8 },
  card: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#2563EB", borderRadius: 12, padding: 10 },
  badge: { alignSelf: "flex-end", backgroundColor: "#F97316", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  badgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "700" },
  cardTitle: { fontSize: 14, fontWeight: "800", color: "#111827", marginTop: 2 },
  label: { marginTop: 12, fontWeight: "700", color: "#111827", fontSize: 12 },
  input: { marginTop: 6, minHeight: 170, borderRadius: 10, borderWidth: 1, borderColor: "#9CA3AF", padding: 10, textAlignVertical: "top", backgroundColor: "#F9FAFB" },
  photosRow: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 8 },
  photoPreview: { width: 48, height: 48, borderRadius: 8 },
  addPhotoButton: { width: 48, height: 48, borderRadius: 8, borderWidth: 1, borderColor: "#9CA3AF", alignItems: "center", justifyContent: "center", backgroundColor: "#E5E7EB" },
  primaryButton: { marginTop: 14, height: 42, borderRadius: 10, backgroundColor: "#1D4ED8", alignItems: "center", justifyContent: "center" },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "700" },
});
