import { io } from "socket.io-client";

const SOCKET_URL = "https://backend-emergencias.onrender.com";
let socket = null;

export function connectSocket(token) {
  if (socket?.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    transports: ["websocket"],
    auth: token ? { token } : undefined,
    extraHeaders: {
      "x-plataforma": "mobile",
    },
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

