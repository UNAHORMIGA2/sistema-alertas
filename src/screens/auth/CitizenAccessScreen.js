import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { hasExtendedProfile, loadLocalExtendedProfile } from "../../services/localExtendedProfile";
import { isResponderRole, normalizeRole } from "../../services/roles";
import SearchableSelectModal from "../../components/SearchableSelectModal";
import { getMunicipalityOptions, resolveStateOption, STATE_OPTIONS } from "../../services/profileCatalogs";
import { getStateValidationCandidates, loadTenantSelection, saveTenantSelection } from "../../services/tenantAccess";

const ACCESS_CODE_VALIDATION_URL = "https://backend-emergencias.onrender.com/api/public/validar-codigo-acceso";

function buildAuthHeaders(accessToken, refreshToken = "") {
  const headers = {
    Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
    "x-plataforma": "mobile",
  };

  if (accessToken && refreshToken) {
    headers.Cookie = `access_token=${accessToken}; refresh_token=${refreshToken}`;
  } else if (accessToken) {
    headers.Cookie = `access_token=${accessToken}`;
  }

  return headers;
}

function SelectField({ label, value, placeholder, onPress, disabled = false }) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable style={[styles.selectField, disabled && styles.selectDisabled]} onPress={onPress} disabled={disabled}>
        <Text style={[styles.selectValue, !value && styles.placeholderText]}>{value || placeholder}</Text>
        <Text style={styles.chevron}>v</Text>
      </Pressable>
    </View>
  );
}

async function fetchCitizenProfile(accessToken, refreshToken) {
  const response = await api.get("/mobile/ciudadano/perfil", {
    headers: buildAuthHeaders(accessToken, refreshToken),
  });

  return response?.data?.data || {};
}

function hasCitizenProfile(user) {
  return Boolean((user?.nombre || "").trim() && (user?.telefono || "").trim() && hasExtendedProfile(user));
}

function buildSessionFromResponse(data = {}) {
  const session = {
    accessToken: data?.jwt || data?.access_token,
    refreshToken: data?.refresh_token || data?.refreshToken || "",
    user: data?.usuario || data?.user || {},
  };

  if (!session.accessToken) {
    throw new Error("El backend no devolvio token de acceso");
  }

  const role = normalizeRole(session?.user?.rol || session?.user?.role);
  session.user = {
    ...(session.user || {}),
    rol: role,
    role,
  };

  return session;
}

async function validateAccessCodeSelection({ estado, municipio, codigoAcceso }) {
  const stateCandidates = getStateValidationCandidates(estado);
  let lastPayloadError = null;

  for (const stateCandidate of stateCandidates) {
    const response = await fetch(ACCESS_CODE_VALIDATION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        estado: stateCandidate,
        municipio,
        codigo_acceso: codigoAcceso,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (response.ok && payload?.success && payload?.data?.tenant_id) {
      return payload.data;
    }

    lastPayloadError = payload;
    if (payload?.code === "INVALID_ACCESS_CODE") {
      break;
    }
  }

  throw new Error(lastPayloadError?.error || "No fue posible validar el codigo de acceso para ese municipio.");
}

export default function CitizenAccessScreen({ navigation, route }) {
  const pendingGoogleAuth = route?.params?.pendingGoogleAuth || {};
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [estado, setEstado] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [codigoAcceso, setCodigoAcceso] = useState("");
  const [activeSelector, setActiveSelector] = useState("");

  useEffect(() => {
    let active = true;

    loadTenantSelection()
      .then((selection) => {
        if (!active || !selection) {
          return;
        }

        setEstado(resolveStateOption(selection.state || ""));
        setMunicipio(selection.municipality || "");
        setCodigoAcceso(selection.accessCode || "");
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const municipalityOptions = useMemo(() => getMunicipalityOptions(estado), [estado]);
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
    }),
    [estado, municipio, municipalityOptions],
  );
  const currentSelector = selectorConfig[activeSelector];
  const canValidateCitizen = estado.trim().length > 0 && municipio.trim().length > 0 && codigoAcceso.trim().length >= 4;

  const warmupBackend = async (tenantId) => {
    try {
      await api.get("/", {
        headers: tenantId ? { "x-tenant-id": tenantId } : undefined,
      });
    } catch {
      // Puede regresar 404/401 y aun asi despierta el backend.
    }
  };

  const continueWithCitizen = async () => {
    if (!pendingGoogleAuth?.idToken) {
      Alert.alert("Sesion incompleta", "Vuelve a elegir tu cuenta de Google para continuar.");
      navigation.replace("Login");
      return;
    }

    if (!canValidateCitizen) {
      Alert.alert("Faltan datos", "Selecciona estado, municipio y captura el codigo de acceso del municipio.");
      return;
    }

    try {
      setLoading(true);

      const validationResult = await validateAccessCodeSelection({
        estado,
        municipio,
        codigoAcceso,
      });
      const tenantId = validationResult.tenant_id;

      await saveTenantSelection({
        state: validationResult.estado || estado,
        municipality: validationResult.municipio || municipio,
        accessCode: codigoAcceso,
        tenantId,
      });

      await warmupBackend(tenantId);

      const res = await api.post(
        "/auth/login/google/mobile",
        { idToken: pendingGoogleAuth.idToken },
        {
          headers: { "x-tenant-id": tenantId },
        },
      );
      const data = res?.data || {};

      if (data?.success === false) {
        throw new Error(data?.message || "Login fallido");
      }

      const session = buildSessionFromResponse(data);
      await saveTenantSelection({
        state: validationResult.estado || estado,
        municipality: validationResult.municipio || municipio,
        accessCode: codigoAcceso,
        tenantId: session.user?.tenant_id || tenantId,
      });

      const role = normalizeRole(session?.user?.rol || session?.user?.role);
      if (role === "admin" || role === "superadmin") {
        Alert.alert("Acceso no permitido", "Este rol usa panel web, no app movil.");
        return;
      }

      if (isResponderRole(role)) {
        await login(session);
        return;
      }

      let citizenProfile = {};
      try {
        citizenProfile = await fetchCitizenProfile(session.accessToken, session.refreshToken);
      } catch {
        citizenProfile = {};
      }

      const localExtendedProfile = await loadLocalExtendedProfile({
        ...(session.user || {}),
        ...(citizenProfile || {}),
      });

      session.user = {
        ...session.user,
        ...citizenProfile,
        ...localExtendedProfile,
      };

      const acceptedTerms = Boolean(session.user?.terminos_aceptados);
      if (!acceptedTerms) {
        navigation.navigate("Terms", { session });
        return;
      }

      if (!hasCitizenProfile(session.user)) {
        navigation.navigate("CompleteProfile", { session });
        return;
      }

      await login(session);
    } catch (error) {
      Alert.alert("Error", error?.response?.data?.error || error?.message || "No se pudo validar el acceso ciudadano.");
    } finally {
      setLoading(false);
    }
  };

  const continueAsResponder = async () => {
    if (!pendingGoogleAuth?.idToken) {
      Alert.alert("Sesion incompleta", "Vuelve a elegir tu cuenta de Google para continuar.");
      navigation.replace("Login");
      return;
    }

    try {
      setLoading(true);
      await warmupBackend();

      const res = await api.post("/auth/login/google/mobile", { idToken: pendingGoogleAuth.idToken });
      const data = res?.data || {};

      if (data?.success === false) {
        throw new Error(data?.message || "Login fallido");
      }

      const session = buildSessionFromResponse(data);
      const role = normalizeRole(session?.user?.rol || session?.user?.role);

      if (isResponderRole(role)) {
        await login(session);
        return;
      }

      if (role === "admin" || role === "superadmin") {
        Alert.alert("Acceso no permitido", "Este rol usa panel web, no app movil.");
        return;
      }

      Alert.alert(
        "Cuenta ciudadana detectada",
        "Ese correo no esta dado de alta como policia o paramedico. Usa la validacion municipal para continuar como ciudadano.",
      );
    } catch (error) {
      Alert.alert(
        "No se pudo entrar como personal",
        error?.response?.data?.error || error?.message || "Verifica que el correo ya este registrado por tu municipio.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Continuar con tu cuenta</Text>
        <Text style={styles.description}>
          Cuenta seleccionada: <Text style={styles.email}>{pendingGoogleAuth?.email || "Sin correo detectado"}</Text>
        </Text>

        <Pressable style={[styles.responderButton, loading && styles.buttonDisabled]} onPress={continueAsResponder} disabled={loading}>
          {loading ? <ActivityIndicator color="#1D4ED8" /> : <Text style={styles.responderButtonText}>Soy policia o paramedico</Text>}
        </Pressable>
        <Text style={styles.responderHint}>
          Usa esta opcion solo si tu correo ya fue dado de alta por el municipio como personal operativo.
        </Text>

        <View style={styles.dividerWrap}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>Ciudadano</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.form}>
          <SelectField
            label="Estado"
            value={estado}
            placeholder="Selecciona un estado"
            onPress={() => setActiveSelector("estado")}
          />

          <SelectField
            label="Municipio"
            value={municipio}
            placeholder={estado ? "Selecciona un municipio" : "Primero elige tu estado"}
            onPress={() => setActiveSelector("municipio")}
            disabled={!estado}
          />

          <Text style={styles.fieldLabel}>Codigo de acceso municipal</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. PUE72000"
            value={codigoAcceso}
            onChangeText={(value) => setCodigoAcceso(value.toUpperCase().replace(/\s+/g, ""))}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>

        <Pressable
          style={[styles.primaryButton, (!canValidateCitizen || loading) && styles.buttonDisabled]}
          onPress={continueWithCitizen}
          disabled={loading || !canValidateCitizen}
        >
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Validar codigo y continuar</Text>}
        </Pressable>
      </View>

      <SearchableSelectModal
        visible={Boolean(activeSelector)}
        title={currentSelector?.title || "Selecciona una opcion"}
        options={currentSelector?.options || []}
        onClose={() => setActiveSelector("")}
        onSelect={(option) => {
          currentSelector?.onSelect?.(option);
          setActiveSelector("");
        }}
        searchPlaceholder={activeSelector === "municipio" ? "Buscar municipio" : "Buscar estado"}
        emptyText="No hay resultados con ese criterio."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1E3A8A",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#F5F5F5",
    borderRadius: 18,
    paddingHorizontal: 22,
    paddingVertical: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
  },
  description: {
    marginTop: 8,
    marginBottom: 14,
    color: "#4B5563",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  email: {
    fontWeight: "800",
    color: "#1D4ED8",
  },
  responderButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#93C5FD",
    backgroundColor: "#EFF6FF",
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  responderButtonText: {
    color: "#1D4ED8",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  responderHint: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    color: "#475569",
    textAlign: "center",
  },
  dividerWrap: {
    marginTop: 18,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#CBD5E1",
  },
  dividerText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#475569",
    textTransform: "uppercase",
  },
  form: {
    gap: 10,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "700",
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#0F172A",
  },
  selectField: {
    borderRadius: 14,
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
  primaryButton: {
    width: "100%",
    borderRadius: 12,
    backgroundColor: "#2563EB",
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
