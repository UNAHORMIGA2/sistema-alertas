import { isAmbulanceRole, isCitizenRole, isPoliceRole } from "./roles";

function toNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function parseAlertCandidate(value) {
  if (value && typeof value === "object") {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  return {};
}

export function buildAlertFromNotificationPayload(payload = {}) {
  const sourceAlert = parseAlertCandidate(payload?.alert);
  const alertId = payload?.alerta_id || payload?.alertaId || payload?.id || sourceAlert?.id || sourceAlert?._id || null;
  const lat = toNumber(payload?.lat ?? payload?.latitude ?? sourceAlert?.lat ?? sourceAlert?.latitude);
  const lng = toNumber(payload?.lng ?? payload?.longitude ?? sourceAlert?.lng ?? sourceAlert?.longitude);

  const alert = {
    ...sourceAlert,
  };

  if (alertId && !alert.id && !alert._id) {
    alert.id = alertId;
  }
  if (payload?.tipo && !alert.tipo) {
    alert.tipo = payload.tipo;
  }
  const payloadState = payload?.estado || payload?.nuevoEstado;
  if (payloadState && !alert.estado) {
    alert.estado = payloadState;
  }
  if (payload?.direccion && !alert.direccion) {
    alert.direccion = payload.direccion;
  }
  if (lat !== null) {
    alert.lat = lat;
  }
  if (lng !== null) {
    alert.lng = lng;
  }

  return Object.keys(alert).length > 0 ? alert : null;
}

export function hydrateNotificationPayload(payload = {}) {
  const alert = buildAlertFromNotificationPayload(payload);
  if (!alert) {
    return payload;
  }

  return {
    ...payload,
    alert,
  };
}

export function getNotificationTargetForRole(role, payload = {}) {
  if (!payload) {
    return null;
  }

  if (isPoliceRole(role)) {
    return { root: "PoliceApp", screen: "PoliceAlert" };
  }

  if (isAmbulanceRole(role)) {
    return { root: "AmbulanceApp", screen: "AmbulanceAlert" };
  }

  if (isCitizenRole(role)) {
    const state = String(
      payload?.estado || payload?.nuevoEstado || payload?.alert?.estado || payload?.status || "",
    ).toLowerCase();

    if (state === "cerrada") {
      return { root: "CitizenApp", screen: "AlertClosed" };
    }

    return { root: "CitizenApp", screen: "HelpOnTheWay" };
  }

  return null;
}
