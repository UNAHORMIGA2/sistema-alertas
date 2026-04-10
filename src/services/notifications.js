import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import api from "./api";

export const EMERGENCY_NOTIFICATION_CHANNEL_ID = "emergency-siren-v6";
export const DEFAULT_NOTIFICATION_CHANNEL_ID = "default-alerts-v3";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function normalizePlatform() {
  const os = (Device.osName || "").toLowerCase();
  if (os.includes("android")) return "android";
  if (os.includes("ios")) return "ios";
  return "web";
}

async function getPushToken() {
  const projectId = Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;

  try {
    if (projectId) {
      const expoResponse = await Notifications.getExpoPushTokenAsync({ projectId });
      if (expoResponse?.data) {
        return {
          token: expoResponse.data,
          provider: "expo",
        };
      }
    }
  } catch (error) {
    console.log("No se pudo obtener ExpoPushToken:", error?.message);
  }

  try {
    const deviceResponse = await Notifications.getDevicePushTokenAsync();
    if (deviceResponse?.data) {
      return {
        token: deviceResponse.data,
        provider: deviceResponse.type || "native",
      };
    }
  } catch (error) {
    console.log("No se pudo obtener device push token:", error?.message);
  }

  return null;
}

export async function setupNotificationChannels() {
  if (Device.osName === "Android" || Device.osName === "android") {
    await Notifications.setNotificationChannelAsync(DEFAULT_NOTIFICATION_CHANNEL_ID, {
      name: "Notificaciones generales",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 180, 180],
      lightColor: "#2563EB",
      sound: "default",
    });

    await Notifications.setNotificationChannelAsync(EMERGENCY_NOTIFICATION_CHANNEL_ID, {
      name: "Alertas de Emergencia",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
      sound: "sirena.wav",
      bypassDnd: true,
    });
  }
}

export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  const tokenInfo = await getPushToken();
  if (!tokenInfo?.token) {
    return null;
  }

  try {
    const userRaw = await AsyncStorage.getItem("@auth:user");
    const user = userRaw ? JSON.parse(userRaw) : null;
    const role = user?.rol || user?.role;
    const endpoint = role === "ciudadano" ? "/tokens/ciudadano/registrar" : "/tokens/registrar";

    await api.post(endpoint, {
      token: tokenInfo.token,
      plataforma: normalizePlatform(),
      proveedor: tokenInfo.provider,
    });
  } catch (error) {
    console.log("No se pudo registrar token push:", error?.message);
  }

  await AsyncStorage.multiSet([
    ["@device:push_token", tokenInfo.token],
    ["@device:push_provider", tokenInfo.provider || "unknown"],
  ]);

  return tokenInfo.token;
}
