import { getSocket } from "./socket";

let messageCallback: ((message: any) => void) | null = null;
// 1. ADDED GLOBAL STATUS CALLBACK DECLARATION HERE
let messageStatusCallback: ((status: any) => void) | null = null;

/**
 * =====================================
 * Listen for Messages
 * =====================================
 */
export const startMessageListener = (
  callback: (message: any) => void
) => {
  messageCallback = callback;

  const socket = getSocket();

  if (!socket) return;

  // =====================================
  // New Message Listener
  // =====================================
  socket.off("new_message");
  socket.on("new_message", (message) => {
    console.log("💬 New message");
    messageCallback?.(message);
  });
};

/**
 * =====================================
 * Listen for Message Status Changes
 * =====================================
 */
export const startMessageStatusListener = (
  callback: (status: any) => void
) => {
  messageStatusCallback = callback;

  const socket = getSocket();

  if (!socket) return;

  // =====================================
  // Message Status Listener
  // =====================================
  socket.off("message_status");
  socket.on("message_status", (status) => {
    console.log("🚦 Message status updated");
    messageStatusCallback?.(status); 
  }); // <-- THIS IS WHERE THE BLOCK ENDS
};

/**
 * =====================================
 * Stop Listening
 * =====================================
 */
export const stopMessageListener = () => {
  const socket = getSocket();

  if (!socket) return;

  socket.off("new_message");
  messageCallback = null;
};

/**
 * =====================================
 * Stop Listening for Status Changes
 * =====================================
 */
export const stopMessageStatusListener = () => {
  const socket = getSocket();

  if (!socket) return;

  socket.off("message_status");
  messageStatusCallback = null;
};
