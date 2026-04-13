import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

const WIDGET_LOCATION_KEY = "@citizen:last_known_location";

/**
 * Guarda ultima ubicacion conocida (sin forzar GPS nuevo) para el widget en segundo plano.
 */
export async function cacheCitizenLocationForWidget() {
  try {
    const last = await Location.getLastKnownPositionAsync({});
    if (last?.coords?.latitude == null || last?.coords?.longitude == null) {
      return;
    }
    await AsyncStorage.setItem(
      WIDGET_LOCATION_KEY,
      JSON.stringify({
        lat: last.coords.latitude,
        lng: last.coords.longitude,
      }),
    );
  } catch {
    // Sin permisos o sin dato: el widget puede usar 0,0 o fallar con mensaje del API.
  }
}

export async function setCachedCitizenLocationForWidget(lat, lng) {
  try {
    const a = Number(lat);
    const b = Number(lng);
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      return;
    }
    await AsyncStorage.setItem(WIDGET_LOCATION_KEY, JSON.stringify({ lat: a, lng: b }));
  } catch {}
}

export async function readCachedCitizenLocationForWidget() {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_LOCATION_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    const lat = Number(parsed?.lat);
    const lng = Number(parsed?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }
    return { lat, lng };
  } catch {
    return null;
  }
}
