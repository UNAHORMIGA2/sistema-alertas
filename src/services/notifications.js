import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import api from "./api";

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

  const tokenResponse = await Notifications.getExpoPushTokenAsync({
    projectId: Constants?.expoConfig?.extra?.eas?.projectId,
  });

  const token = tokenResponse?.data;
  if (!token) {
    return null;
  }

  try {
    const userRaw = await AsyncStorage.getItem("@auth:user");
    const user = userRaw ? JSON.parse(userRaw) : null;
    const role = user?.rol || user?.role;
    const endpoint = role === "ciudadano" ? "/tokens/ciudadano/registrar" : "/tokens/registrar";

    await api.post(endpoint, {
      token,
      plataforma: normalizePlatform(),
    });
  } catch (error) {
    console.log("No se pudo registrar token push:", error?.message);
  }

  await AsyncStorage.setItem("@device:push_token", token);
  return token;
}
