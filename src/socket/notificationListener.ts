import { getSocket } from "./socket";

let notificationCallback: ((notification: any) => void) | null = null;

/**
 * =====================================
 * Listen for Notifications
 * =====================================
 */
export const startNotificationListener = (
  callback: (notification: any) => void
) => {
  notificationCallback = callback;

  const socket = getSocket();

  if (!socket) return;

  socket.off("notification");

  socket.on("notification", (notification) => {
    console.log("🔔 Notification received");

    notificationCallback?.(notification);
  });
};

/**
 * =====================================
 * Stop Listening
 * =====================================
 */
export const stopNotificationListener = () => {
  const socket = getSocket();

  if (!socket) return;

  socket.off("notification");
};