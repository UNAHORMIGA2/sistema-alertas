import { useEffect } from "react";
import { AuthProvider } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { configureGoogleSignin } from "./src/config/google";

export default function App() {
  useEffect(() => {
    configureGoogleSignin();
  }, []);

  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
