import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadTenantSelection } from "./tenantAccess";

const BASE_URL = "https://backend-emergencias.onrender.com/api";
const ACCESS_TOKEN_KEY = "@auth:token";
const REFRESH_TOKEN_KEY = "@auth:refresh_token";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 45000,
  headers: {
    "Content-Type": "application/json",
    "x-plataforma": "mobile",
  },
});

let isRefreshing = false;
let pendingQueue = [];

function processQueue(error, newToken = null) {
  pendingQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
      return;
    }
    promise.resolve(newToken);
  });
  pendingQueue = [];
}

api.interceptors.request.use(async (config) => {
  config.headers = config.headers || {};

  const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  const storedRefreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  const tenantSelection = await loadTenantSelection();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  const cookieParts = [];
  if (accessToken) {
    cookieParts.push(`access_token=${accessToken}`);
  }
  if (storedRefreshToken) {
    cookieParts.push(`refresh_token=${storedRefreshToken}`);
  }
  if (cookieParts.length > 0) {
    config.headers.Cookie = cookieParts.join("; ");
  }

  config.headers["x-plataforma"] = "mobile";
  if (tenantSelection?.tenantId && !config.headers["x-tenant-id"]) {
    config.headers["x-tenant-id"] = tenantSelection.tenantId;
  }
  config.withCredentials = true;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    const status = error?.response?.status;
    const requestUrl = String(originalRequest?.url || "");
    const skipRefresh =
      Boolean(originalRequest?._skipAuthRefresh) ||
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/refresh") ||
      requestUrl === "/" ||
      requestUrl.endsWith("/");

    if (!originalRequest || status !== 401 || originalRequest._retry || skipRefresh) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((newToken) => {
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return api(originalRequest);
      });
    }

    isRefreshing = true;

    try {
      const storedRefreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      const currentAccessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);

      if (!storedRefreshToken) {
        processQueue(error, null);
        return Promise.reject(error);
      }

      const tenantSelection = await loadTenantSelection();
      const refreshHeaders = {
        "Content-Type": "application/json",
        "x-plataforma": "mobile",
      };
      if (tenantSelection?.tenantId) {
        refreshHeaders["x-tenant-id"] = tenantSelection.tenantId;
      }
      refreshHeaders.Cookie = `refresh_token=${storedRefreshToken}`;

      const refreshResponse = await axios.post(
        `${BASE_URL}/auth/refresh`,
        { refresh_token: storedRefreshToken },
        {
          timeout: 30000,
          headers: refreshHeaders,
          withCredentials: true,
        },
      );

      const newAccessToken = refreshResponse?.data?.jwt || refreshResponse?.data?.access_token;
      const newRefreshToken = refreshResponse?.data?.refresh_token;

      // Compatibilidad: algunos backends solo renuevan cookie y no retornan JWT en body.
      if (!newAccessToken && !newRefreshToken) {
        throw new Error("No se pudo renovar la sesion");
      }

      if (newAccessToken) {
        await AsyncStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
      }
      if (newRefreshToken) {
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
      }

      processQueue(null, newAccessToken || currentAccessToken);

      if (newAccessToken) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }
      return api(originalRequest);
    } catch (refreshError) {
      await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, "@auth:user"]);
      processQueue(refreshError, null);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;

