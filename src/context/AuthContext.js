import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import api from "../services/api";
import { getGoogleSignin } from "../config/google";

const ACCESS_TOKEN_KEY = "@auth:token";
const REFRESH_TOKEN_KEY = "@auth:refresh_token";
const USER_KEY = "@auth:user";

const AuthContext = createContext({
  user: null,
  token: null,
  refreshToken: null,
  loading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  updateUser: async () => {},
});

function buildUserFromToken(accessToken, fallbackUser = {}) {
  try {
    const decoded = jwtDecode(accessToken);
    return {
      id: decoded.id || decoded.sub || fallbackUser.id || null,
      nombre: fallbackUser.nombre || fallbackUser.name || decoded.nombre || decoded.name || "",
      email: fallbackUser.email || decoded.email || "",
      rol: decoded.rol || decoded.role || fallbackUser.rol || fallbackUser.role || "ciudadano",
      plataforma: "mobile",
      ...fallbackUser,
    };
  } catch {
    return {
      plataforma: "mobile",
      rol: fallbackUser.rol || fallbackUser.role || "ciudadano",
      ...fallbackUser,
    };
  }
}

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const [storedToken, storedRefreshToken, storedUserRaw] = await AsyncStorage.multiGet([
          ACCESS_TOKEN_KEY,
          REFRESH_TOKEN_KEY,
          USER_KEY,
        ]);

        const access = storedToken?.[1] || null;
        const refresh = storedRefreshToken?.[1] || null;
        const parsedStoredUser = storedUserRaw?.[1] ? JSON.parse(storedUserRaw[1]) : null;

        if (access) {
          const normalizedUser = buildUserFromToken(access, parsedStoredUser || {});
          setToken(access);
          setRefreshToken(refresh);
          setUser(normalizedUser);
        }
      } catch (error) {
        console.log("No se pudo restaurar la sesion:", error?.message);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, []);

  const login = async ({ accessToken, refreshToken: newRefreshToken, user: incomingUser = {} }) => {
    const normalizedUser = buildUserFromToken(accessToken, incomingUser);
    setToken(accessToken);
    setRefreshToken(newRefreshToken || null);
    setUser(normalizedUser);

    const entries = [
      [ACCESS_TOKEN_KEY, accessToken],
      [USER_KEY, JSON.stringify(normalizedUser)],
    ];

    if (newRefreshToken) {
      entries.push([REFRESH_TOKEN_KEY, newRefreshToken]);
    }

    await AsyncStorage.multiSet(entries);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout", {});
    } catch {
      // Limpiamos sesion local aunque falle backend.
    }

    try {
      const GoogleSignin = getGoogleSignin();
      if (GoogleSignin) {
        try {
          await GoogleSignin.revokeAccess();
        } catch {}
        await GoogleSignin.signOut();
      }
    } catch {
      // Si falla cierre de google, continuamos con limpieza local.
    }

    setToken(null);
    setRefreshToken(null);
    setUser(null);
    await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
  };

  const updateUser = async (patch) => {
    setUser((prev) => {
      const updated = { ...(prev || {}), ...(patch || {}) };
      AsyncStorage.setItem(USER_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  };

  const value = useMemo(
    () => ({
      user,
      token,
      refreshToken,
      loading,
      isAuthenticated: Boolean(user && token),
      login,
      logout,
      updateUser,
    }),
    [user, token, refreshToken, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

