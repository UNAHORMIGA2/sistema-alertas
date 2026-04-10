import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const BASE_URL = "https://backend-emergencias.onrender.com/api";
const ACCESS_TOKEN_KEY = "@auth:token";

export async function widgetTaskHandler(props) {
  const { widgetAction } = props;

  if (widgetAction === "PANIC_BUTTON_CLICK") {
    try {
      const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (!accessToken) {
        console.log("Widget: No access token found");
        return;
      }

      await axios.post(
        `${BASE_URL}/alertas`,
        {
          tipo: "panico",
          lat: 0, // En un widget básico no siempre hay GPS inmediato, el backend debería manejarlo o pedirlo.
          lng: 0,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "x-plataforma": "mobile",
          },
        }
      );
      console.log("Widget: Alerta de pánico enviada correctamente");
    } catch (error) {
      console.error("Widget: Error al enviar alerta", error?.message);
    }
  }
}
