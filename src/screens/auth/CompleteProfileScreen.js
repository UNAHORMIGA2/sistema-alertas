import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import api from "../../services/api";
import { saveLocalExtendedProfile } from "../../services/localExtendedProfile";
import {
  AGE_OPTIONS,
  GENDER_OPTIONS,
  getAgeNumber,
  getAgeRangeLabel,
  getAgeSelectionValue,
  getMunicipalityOptions,
  resolveStateOption,
  STATE_OPTIONS,
} from "../../services/profileCatalogs";
import SearchableSelectModal from "../../components/SearchableSelectModal";
import { isAccessCodeCompatible, saveTenantSelection } from "../../services/tenantAccess";


function sanitizePhone(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 10);
}

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

export default function CompleteProfileScreen({ navigation, route }) {
  const session = route?.params?.session;
  const baseUser = session?.user || {};
  const role = baseUser?.rol || baseUser?.role || "ciudadano";

  const [nombre, setNombre] = useState(baseUser?.nombre || "");
  const [telefono, setTelefono] = useState(sanitizePhone(baseUser?.telefono || ""));
  const [estado, setEstado] = useState(resolveStateOption(baseUser?.estado || ""));
  const [municipio, setMunicipio] = useState(baseUser?.municipio || "");
  const [accessCode, setAccessCode] = useState("");
  const [edad, setEdad] = useState(getAgeSelectionValue(baseUser?.edad, baseUser?.edad_texto));
  const [genero, setGenero] = useState(baseUser?.genero || "");
  const [loading, setLoading] = useState(false);
  const [activeSelector, setActiveSelector] = useState("");


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
          const resolvedState = resolveStateOption(option);
          setEstado(resolvedState);
          if (!getMunicipalityOptions(resolvedState).includes(municipio)) {
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
  const requiresAccessCode = role === "ciudadano";

  const canContinue = useMemo(() => {
    const baseValid =
      nombre.trim().length > 1 &&
      telefono.trim().length === 10 &&
      estado.trim().length > 0 &&
      municipio.trim().length > 0 &&
      edad.trim().length > 0 &&
      genero.trim().length > 0;

    if (requiresAccessCode) {
      return baseValid && accessCode.trim().length >= 3;
    }
    return baseValid;
  }, [edad, estado, genero, municipio, nombre, telefono, accessCode, requiresAccessCode]);

  const handleContinue = async () => {
    if (!canContinue) {
      Alert.alert("Faltan datos", "Verifica que todos los campos obligatorios esten completos y que el telefono tenga exactamente 10 digitos.");
      return;
    }

    try {
      setLoading(true);

      if (requiresAccessCode) {
        // 1. Validar localmente la estructura
        if (!isAccessCodeCompatible(municipio, accessCode)) {
          Alert.alert("Codigo invalido", "El codigo municipal no parece coincidir con el municipio seleccionado. Revisa y vuelve a intentar.");
          setLoading(false);
          return;
        }

        // 2. Validar con el backend que el codigo es el correcto para el municipio y esta activo
        try {
          const validacionRes = await api.post("/public/validar-codigo-acceso", {
            estado: estado.trim(),
            municipio: municipio.trim(),
            codigo_acceso: accessCode.trim(),
          });
          
          if (!validacionRes?.data?.success) {
            Alert.alert("Error de validacion", "El codigo de acceso ingresado es incorrecto o el municipio no tiene una membresia activa.");
            setLoading(false);
            return;
          }
        } catch (valError) {
          const msg = valError?.response?.data?.message || valError?.response?.data?.error || "El codigo no es valido para este municipio.";
          Alert.alert("Error", msg);
          setLoading(false);
          return;
        }

        // 3. Todo bien, guardar seleccion local
        await saveTenantSelection({
          state: estado.trim(),
          municipality: municipio.trim(),
          accessCode: accessCode.trim(),
        });
      }


      const profilePayload = {
        nombre: nombre.trim(),
        telefono: sanitizePhone(telefono),
        estado: estado.trim(),
        municipio: municipio.trim(),
        edad: getAgeNumber(edad),
        edad_texto: getAgeRangeLabel(edad),
        genero: genero.trim(),
      };

      let updatedUser = { ...baseUser, ...profilePayload };

      if (role === "ciudadano") {
        if (profilePayload.telefono.length !== 10) {
          throw new Error("El telefono debe tener exactamente 10 digitos.");
        }

        const backendProfilePayload = {
          nombre: profilePayload.nombre,
          telefono: profilePayload.telefono,
          estado: profilePayload.estado,
          municipio: profilePayload.municipio,
          edad: profilePayload.edad,
          genero: profilePayload.genero,
        };

        const response = await api.patch(
          "/mobile/ciudadano/perfil",
          backendProfilePayload,
          {
            headers: sessionHeaders(session),
          },
        );

        updatedUser = {
          ...updatedUser,
          ...(response?.data?.data || response?.data?.usuario || response?.data?.user || {}),
          ...profilePayload,
        };
      }

      await saveLocalExtendedProfile(updatedUser, profilePayload);

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
      const rawMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || "";
      const normalizedMessage = String(rawMessage).toLowerCase();

      Alert.alert(
        "Error",
        normalizedMessage.includes("telefono") && normalizedMessage.includes("exist")
          ? "Ese telefono ya esta registrado. Usa otro numero."
          : rawMessage || "No fue posible completar tu perfil.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (option) => {
    currentSelector?.onSelect?.(option);
    setActiveSelector("");
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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
          onChangeText={(value) => setTelefono(sanitizePhone(value))}
          keyboardType="number-pad"
          maxLength={10}
        />

        <SelectField
          label="Estado (obligatorio)"
          value={estado}
          placeholder="Selecciona un estado"
          onPress={() => setActiveSelector("estado")}
        />

        <SelectField
          label="Municipio (obligatorio)"
          value={municipio}
          placeholder={estado ? "Selecciona un municipio" : "Primero elige tu estado"}
          onPress={() => setActiveSelector("municipio")}
          disabled={!estado}
        />

        {requiresAccessCode && (
          <>
            <Text style={styles.label}>Codigo Municipal (obligatorio)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. TEP12345"
              value={accessCode}
              onChangeText={setAccessCode}
              autoCapitalize="characters"
            />
          </>
        )}

        <View style={styles.row}>
          <View style={styles.col}>
            <SelectField
              label="Edad (obligatorio)"
              value={edad}
              placeholder="Selecciona"
              onPress={() => setActiveSelector("edad")}
            />
          </View>
          <View style={styles.col}>
            <SelectField
              label="Genero (obligatorio)"
              value={genero}
              placeholder="Selecciona"
              onPress={() => setActiveSelector("genero")}
            />
          </View>
        </View>

        <Pressable
          style={[styles.primaryButton, !canContinue && styles.disabled]}
          onPress={handleContinue}
          disabled={!canContinue || loading}
        >
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>Continuar</Text>}
        </Pressable>
      </ScrollView>

      <SearchableSelectModal
        visible={Boolean(activeSelector)}
        title={currentSelector?.title || "Selecciona una opcion"}
        options={currentSelector?.options || []}
        onClose={() => setActiveSelector("")}
        onSelect={handleSelectOption}
        searchPlaceholder={activeSelector === "municipio" ? "Buscar municipio" : "Buscar opcion"}
        emptyText="No hay resultados con ese criterio."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  content: { paddingHorizontal: 20, paddingTop: 44, paddingBottom: 28 },
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
  selectField: {
    marginTop: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectDisabled: {
    opacity: 0.55,
  },
  selectValue: {
    flex: 1,
    fontSize: 16,
    color: "#0F172A",
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
