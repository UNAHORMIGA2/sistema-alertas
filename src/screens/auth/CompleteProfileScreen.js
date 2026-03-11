import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import api from "../../services/api";

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

export default function CompleteProfileScreen({ navigation, route }) {
  const session = route?.params?.session;
  const baseUser = session?.user || {};
  const role = baseUser?.rol || baseUser?.role || "ciudadano";

  const [nombre, setNombre] = useState(baseUser?.nombre || "");
  const [telefono, setTelefono] = useState(baseUser?.telefono || "");
  const [estado, setEstado] = useState(baseUser?.estado || "");
  const [municipio, setMunicipio] = useState(baseUser?.municipio || "");
  const [edad, setEdad] = useState(baseUser?.edad ? String(baseUser.edad) : "");
  const [genero, setGenero] = useState(baseUser?.genero || "");
  const [loading, setLoading] = useState(false);

  const canContinue = useMemo(() => nombre.trim().length > 1 && telefono.trim().length >= 8, [nombre, telefono]);

  const handleContinue = async () => {
    if (!canContinue) {
      Alert.alert("Faltan datos", "Debes completar nombre completo y telefono.");
      return;
    }

    try {
      setLoading(true);

      const profilePayload = {
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        estado: estado.trim(),
        municipio: municipio.trim(),
        edad: edad ? Number(edad) : undefined,
        genero: genero.trim(),
      };

      let updatedUser = { ...baseUser, ...profilePayload };

      if (role === "ciudadano") {
        const response = await api.patch(
          "/mobile/ciudadano/perfil",
          {
            nombre: profilePayload.nombre,
            telefono: profilePayload.telefono,
          },
          {
            headers: sessionHeaders(session),
          },
        );

        updatedUser = {
          ...updatedUser,
          ...(response?.data?.data || response?.data?.usuario || response?.data?.user || {}),
        };
      }

      navigation.navigate("AccountCreated", {
        session: {
          ...session,
          user: {
            ...updatedUser,
            terminos_aceptados: true,
          },
        },
      });
    } catch (error) {
      Alert.alert(
        "Error",
        error?.response?.data?.error || error?.response?.data?.message || "No fue posible completar tu perfil.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Completa tu perfil</Text>
      <Text style={styles.subtitle}>Necesitamos estos datos para activar tu cuenta en el municipio.</Text>

      <Text style={styles.label}>Nombre completo (obligatorio)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. Juan Perez"
        value={nombre}
        onChangeText={setNombre}
        autoCapitalize="words"
      />

      <Text style={styles.label}>Telefono (obligatorio)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. 2381234567"
        value={telefono}
        onChangeText={setTelefono}
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Estado (opcional)</Text>
      <TextInput style={styles.input} placeholder="Ej. Puebla" value={estado} onChangeText={setEstado} />

      <Text style={styles.label}>Municipio (opcional)</Text>
      <TextInput style={styles.input} placeholder="Ej. Tehuacan" value={municipio} onChangeText={setMunicipio} />

      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.label}>Edad (opcional)</Text>
          <TextInput style={styles.input} placeholder="Ej. 27" value={edad} onChangeText={setEdad} keyboardType="numeric" />
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>Genero (opcional)</Text>
          <TextInput style={styles.input} placeholder="Ej. Femenino" value={genero} onChangeText={setGenero} />
        </View>
      </View>

      <Pressable style={[styles.primaryButton, !canContinue && styles.disabled]} onPress={handleContinue} disabled={!canContinue || loading}>
        {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>Continuar</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6", paddingHorizontal: 20, paddingTop: 44 },
  title: { fontSize: 26, fontWeight: "800", color: "#0F172A" },
  subtitle: { marginTop: 8, fontSize: 16, color: "#4B5563", lineHeight: 22, marginBottom: 8 },
  label: { marginTop: 10, fontSize: 13, color: "#374151", fontWeight: "700" },
  input: {
    marginTop: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  row: { flexDirection: "row", gap: 10 },
  col: { flex: 1 },
  primaryButton: {
    marginTop: 20,
    borderRadius: 18,
    backgroundColor: "#60A5FA",
    alignItems: "center",
    paddingVertical: 15,
  },
  primaryText: { color: "#E0F2FE", fontWeight: "800", fontSize: 20 },
  disabled: { opacity: 0.6 },
});
