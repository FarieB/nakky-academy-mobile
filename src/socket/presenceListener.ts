import { getSocket } from "./socket";

export const startPresenceListener = (
  onOnline: (userId: string) => void,
  onOffline: (userId: string, lastSeen: string) => void
) => {
  const socket = getSocket();

  if (!socket) return;

  socket.off("user_online");
  socket.off("user_offline");

  socket.on("user_online", ({ userId }) => {
    onOnline(userId);
  });

  socket.on("user_offline", ({ userId, lastSeen }) => {
    onOffline(userId, lastSeen);
  });
};

export const stopPresenceListener = () => {
  const socket = getSocket();

  if (!socket) return;

  socket.off("user_online");
  socket.off("user_offline");
};