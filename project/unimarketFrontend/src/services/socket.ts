import { io, Socket } from "socket.io-client";
import { BASE_URL } from "./api";

let socket: Socket | null = null;
let activeUserEmail = "";

const normalizeEmail = (email = "") => String(email).trim().toLowerCase();

export const getOrCreateMessagingSocket = (userEmail?: string): Socket => {
  const normalized = normalizeEmail(userEmail || activeUserEmail);
  if (normalized) {
    activeUserEmail = normalized;
  }

  if (!socket) {
    socket = io(BASE_URL, {
      autoConnect: true,
    });

    socket.on("connect", () => {
      if (activeUserEmail) {
        socket?.emit("join-user", activeUserEmail);
      }
    });
  }

  if (normalized && socket.connected) {
    socket.emit("join-user", normalized);
  }

  return socket;
};

export const disconnectMessagingSocket = () => {
  if (!socket) return;
  socket.disconnect();
  socket = null;
  activeUserEmail = "";
};
