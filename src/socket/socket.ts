import AsyncStorage from "@react-native-async-storage/async-storage";
import { io, Socket } from "socket.io-client";

// Your verified local network IP address and backend port
const BACKEND_URL = "http://192.168.0.124:5000"; 

let socket: Socket | null = null;

/**
 * =====================================
 * Connect Socket
 * =====================================
 */
export const connectSocket = async () => {
  if (socket?.connected) {
    return socket;
  }

  const token = await AsyncStorage.getItem("token");
  const user = JSON.parse(
    (await AsyncStorage.getItem("user")) || "{}"
  );

  if (!token || !user?._id) {
    return null;
  }

  // Uses your local network IP configuration to bridge with Expo Go
  socket = io(BACKEND_URL, {
    transports: ["websocket"],
    auth: {
      token,
    },
  });

  socket.on("connect", () => {
    console.log("🟢 Socket Connected");

    socket?.emit("register", user._id);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Socket Disconnected");
  });

  return socket;
};

/**
 * =====================================
 * Disconnect Socket
 * =====================================
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * =====================================
 * Get Current Socket
 * =====================================
 */
export const getSocket = () => socket;
