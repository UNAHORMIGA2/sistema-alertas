export function normalizeRole(role) {
  const normalized = String(role || "").trim().toLowerCase();
  const plain = normalized.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (plain === "paramedico") {
    return "ambulancia";
  }

  return plain;
}

export function isCitizenRole(role) {
  return normalizeRole(role) === "ciudadano";
}

export function isPoliceRole(role) {
  return normalizeRole(role) === "policia";
}

export function isAmbulanceRole(role) {
  return normalizeRole(role) === "ambulancia";
}

export function isResponderRole(role) {
  const normalized = normalizeRole(role);
  return normalized === "policia" || normalized === "ambulancia";
}
