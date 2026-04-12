import AsyncStorage from "@react-native-async-storage/async-storage";

const TENANT_SELECTION_KEY = "@tenant:selection";

let cachedSelection = null;

const STATE_BACKEND_EQUIVALENTS = {
  "Estado de Mexico": ["Mexico", "Estado de Mexico"],
  Coahuila: ["Coahuila", "Coahuila de Zaragoza"],
  Michoacan: ["Michoacan", "Michoacan de Ocampo"],
  Veracruz: ["Veracruz", "Veracruz de Ignacio de la Llave"],
};

function normalizeTenantText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

export function buildTenantIdFromMunicipality(municipality) {
  const normalized = normalizeTenantText(municipality).toLowerCase();
  return normalized.replace(/[^a-z0-9-]/g, "-");
}

export function buildAccessCodePrefix(municipality) {
  return normalizeTenantText(municipality).slice(0, 3).toUpperCase();
}

export function isAccessCodeCompatible(municipality, accessCode) {
  const normalizedCode = normalizeTenantText(accessCode).toUpperCase();
  const prefix = buildAccessCodePrefix(municipality);
  // Debe comenzar con el prefijo del municipio Y tener al menos 5 caracteres en total
  return Boolean(
    prefix &&
    normalizedCode &&
    normalizedCode.startsWith(prefix) &&
    normalizedCode.length >= 5,
  );
}

export function getStateValidationCandidates(state) {
  const trimmedState = String(state || "").trim();
  if (!trimmedState) {
    return [];
  }

  const variants = STATE_BACKEND_EQUIVALENTS[trimmedState] || [trimmedState];
  return [...new Set(variants.filter(Boolean))];
}

export async function loadTenantSelection() {
  if (cachedSelection) {
    return cachedSelection;
  }

  try {
    const raw = await AsyncStorage.getItem(TENANT_SELECTION_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    cachedSelection = parsed && typeof parsed === "object" ? parsed : null;
    return cachedSelection;
  } catch {
    cachedSelection = null;
    return null;
  }
}

export async function saveTenantSelection(selection = {}) {
  const nextSelection = {
    state: String(selection?.state || "").trim(),
    municipality: String(selection?.municipality || "").trim(),
    accessCode: String(selection?.accessCode || "").trim().toUpperCase(),
    tenantId: String(
      selection?.tenantId || buildTenantIdFromMunicipality(selection?.municipality || ""),
    ).trim(),
  };

  cachedSelection = nextSelection;
  await AsyncStorage.setItem(TENANT_SELECTION_KEY, JSON.stringify(nextSelection));
  return nextSelection;
}

export async function syncTenantSelectionFromUser(user = {}) {
  const tenantId = String(user?.tenant_id || user?.tenantId || "").trim();
  if (!tenantId) {
    return null;
  }

  const current = (await loadTenantSelection()) || {};
  if (current.tenantId === tenantId) {
    return current;
  }

  const merged = {
    ...current,
    tenantId,
  };

  return saveTenantSelection(merged);
}

export async function clearTenantSelection() {
  cachedSelection = null;
  await AsyncStorage.removeItem(TENANT_SELECTION_KEY);
}
