import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import AmbulanceDashboardScreen from "../screens/ambulancia/AmbulanceDashboardScreen";
import AmbulanceAlertScreen from "../screens/ambulancia/AmbulanceAlertScreen";
import AmbulanceReportScreen from "../screens/ambulancia/AmbulanceReportScreen";
import AmbulanceProfileScreen from "../screens/ambulancia/AmbulanceProfileScreen";

const Stack = createNativeStackNavigator();

export default function AmbulanceStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AmbulanceDashboard"
        component={AmbulanceDashboardScreen}
        options={{ title: "Panel ambulancia" }}
      />
      <Stack.Screen
        name="AmbulanceAlert"
        component={AmbulanceAlertScreen}
        options={{ title: "Detalle emergencia" }}
      />
      <Stack.Screen
        name="AmbulanceReport"
        component={AmbulanceReportScreen}
        options={{ title: "Enviar reporte" }}
      />
      <Stack.Screen name="AmbulanceProfile" component={AmbulanceProfileScreen} options={{ title: "Perfil" }} />
    </Stack.Navigator>
  );
}
