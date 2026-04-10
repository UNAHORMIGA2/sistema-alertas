import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import DashboardScreen from "../screens/ciudadano/DashboardScreen";
import AlertCreatedScreen from "../screens/ciudadano/AlertCreatedScreen";
import HelpOnTheWayScreen from "../screens/ciudadano/HelpOnTheWayScreen";
import AlertClosedScreen from "../screens/ciudadano/AlertClosedScreen";
import HistorialScreen from "../screens/ciudadano/HistorialScreen";
import PerfilScreen from "../screens/ciudadano/PerfilScreen";

const Stack = createNativeStackNavigator();

export default function CitizenStack() {
  return (
    <Stack.Navigator screenOptions={{ headerBackTitleVisible: false }}>
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: "Inicio", headerBackVisible: false, headerLeft: () => null, gestureEnabled: false }}
      />
      <Stack.Screen name="AlertCreated" component={AlertCreatedScreen} options={{ title: "Alerta creada" }} />
      <Stack.Screen name="HelpOnTheWay" component={HelpOnTheWayScreen} options={{ title: "Ayuda en camino" }} />
      <Stack.Screen name="AlertClosed" component={AlertClosedScreen} options={{ title: "Alerta cerrada" }} />
      <Stack.Screen name="Historial" component={HistorialScreen} options={{ title: "Historial" }} />
      <Stack.Screen name="Perfil" component={PerfilScreen} options={{ title: "Perfil" }} />
    </Stack.Navigator>
  );
}
