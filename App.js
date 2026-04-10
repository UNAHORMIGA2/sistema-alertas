import { useEffect } from "react";
import { AuthProvider } from "./src/context/AuthContext";
import { NotificationCenterProvider } from "./src/context/NotificationCenterContext";
import { registerWidgetTaskHandler } from "react-native-android-widget";
import { widgetTaskHandler } from "./src/services/widgetTask";
import AppNavigator from "./src/navigation/AppNavigator";
import { configureGoogleSignin } from "./src/config/google";

if (typeof registerWidgetTaskHandler === "function") {
  registerWidgetTaskHandler(widgetTaskHandler);
}

export default function App() {
  useEffect(() => {
    configureGoogleSignin();
  }, []);

  return (
    <AuthProvider>
      <NotificationCenterProvider>
        <AppNavigator />
      </NotificationCenterProvider>
    </AuthProvider>
  );
}
