import React, { useEffect, useState } from "react";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useNotificationCenter } from "../context/NotificationCenterContext";

import LoginScreen from "../screens/auth/LoginScreen";
import CitizenAccessScreen from "../screens/auth/CitizenAccessScreen";
import TermsScreen from "../screens/auth/TermsScreen";
import TermsDeclinedScreen from "../screens/auth/TermsDeclinedScreen";
import CompleteProfileScreen from "../screens/auth/CompleteProfileScreen";
import AccountCreatedScreen from "../screens/auth/AccountCreatedScreen";

import CitizenStack from "./CitizenStack";
import PoliceStack from "./PoliceStack";
import AmbulanceStack from "./AmbulanceStack";
import { buildAlertFromNotificationPayload, getNotificationTargetForRole } from "../services/notificationNavigation";
import { isAmbulanceRole, isCitizenRole, isPoliceRole, normalizeRole } from "../services/roles";

const RootStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();

function LoadingScreen() {
  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#0A84FF" />
      <Text style={styles.subtitle}>Cargando sesion...</Text>
    </View>
  );
}

function UnauthorizedScreen() {
  const { logout, user } = useAuth();

  return (
    <View style={styles.centered}>
      <Text style={styles.title}>Rol no permitido en app movil</Text>
      <Text style={styles.subtitle}>
        El rol actual es &quot;{user?.rol || "desconocido"}&quot;. Usa el panel web para admin/superadmin.
      </Text>
      <Pressable style={styles.primaryButton} onPress={logout}>
        <Text style={styles.primaryButtonText}>Cerrar sesion</Text>
      </Pressable>
    </View>
  );
}

function AuthNavigator() {
  return (
      <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="CitizenAccess" component={CitizenAccessScreen} />
      <AuthStack.Screen name="Terms" component={TermsScreen} />
      <AuthStack.Screen name="TermsDeclined" component={TermsDeclinedScreen} />
      <AuthStack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
      <AuthStack.Screen name="AccountCreated" component={AccountCreatedScreen} />
    </AuthStack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();
  const { pendingNotification, clearPendingNotification } = useNotificationCenter();
  const [navigationReady, setNavigationReady] = useState(false);
  const role = normalizeRole(user?.rol);

  useEffect(() => {
    if (!navigationReady || !pendingNotification || !role) {
      return;
    }

    const target = getNotificationTargetForRole(role, pendingNotification.payload);
    const alert = buildAlertFromNotificationPayload(pendingNotification.payload);

    if (!target || !alert || !navigationRef.isReady()) {
      clearPendingNotification();
      return;
    }

    navigationRef.navigate(target.root, {
      screen: target.screen,
      params: {
        alert,
        readOnly: false,
      },
    });

    clearPendingNotification();
  }, [clearPendingNotification, navigationReady, pendingNotification, role]);

  if (loading) {
    return <LoadingScreen />;
  }

  const isCitizen = isCitizenRole(role);
  const isPolice = isPoliceRole(role);
  const isAmbulance = isAmbulanceRole(role);

  return (
    <NavigationContainer ref={navigationRef} onReady={() => setNavigationReady(true)}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!user && <RootStack.Screen name="Auth" component={AuthNavigator} />}
        {isCitizen && <RootStack.Screen name="CitizenApp" component={CitizenStack} />}
        {isPolice && <RootStack.Screen name="PoliceApp" component={PoliceStack} />}
        {isAmbulance && <RootStack.Screen name="AmbulanceApp" component={AmbulanceStack} />}
        {user && !isCitizen && !isPolice && !isAmbulance && (
          <RootStack.Screen name="Unauthorized" component={UnauthorizedScreen} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F8FAFF",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    color: "#0F172A",
  },
  subtitle: {
    marginTop: 12,
    fontSize: 15,
    textAlign: "center",
    color: "#475569",
  },
  primaryButton: {
    marginTop: 18,
    backgroundColor: "#0A84FF",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
