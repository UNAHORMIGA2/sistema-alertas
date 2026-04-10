export function normalizeMunicipalityName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

export function sameMunicipality(left, right) {
  const normalizedLeft = normalizeMunicipalityName(left);
  const normalizedRight = normalizeMunicipalityName(right);
  return Boolean(normalizedLeft && normalizedRight && normalizedLeft === normalizedRight);
}

export function getAlertMunicipality(alert) {
  return (
    alert?.municipio ||
    alert?.ciudadano?.municipio ||
    alert?.user?.municipio ||
    ""
  );
}
