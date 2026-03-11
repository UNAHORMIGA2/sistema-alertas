import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import PoliceDashboardScreen from "../screens/policia/PoliceDashboardScreen";
import PoliceAlertScreen from "../screens/policia/PoliceAlertScreen";
import PoliceReportScreen from "../screens/policia/PoliceReportScreen";
import PoliceProfileScreen from "../screens/policia/PoliceProfileScreen";

const Stack = createNativeStackNavigator();

export default function PoliceStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="PoliceDashboard" component={PoliceDashboardScreen} options={{ title: "Panel policia" }} />
      <Stack.Screen name="PoliceAlert" component={PoliceAlertScreen} options={{ title: "Detalle emergencia" }} />
      <Stack.Screen name="PoliceReport" component={PoliceReportScreen} options={{ title: "Enviar reporte" }} />
      <Stack.Screen name="PoliceProfile" component={PoliceProfileScreen} options={{ title: "Perfil" }} />
    </Stack.Navigator>
  );
}
