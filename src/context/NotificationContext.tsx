import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import API from "../services/api";

import {
  startNotificationListener,
  stopNotificationListener,
} from "../socket/notificationListener";

import { getSocket } from "../socket/socket";

type NotificationContextType = {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
};

const NotificationContext =
  createContext<NotificationContextType>({
    unreadCount: 0,
    refreshUnreadCount: async () => {},
  });

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [unreadCount, setUnreadCount] =
    useState(0);

  // ==========================
  // Load unread count
  // ==========================

  const refreshUnreadCount = async () => {
    try {
      const token = await AsyncStorage.getItem(
        "token"
      );

      if (!token) return;

      API.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;

      const res = await API.get(
        "/notifications/unread-count"
      );

      setUnreadCount(res.data.unread);
    } catch (err: any) {
      console.log(
        "UNREAD ERROR:",
        err?.response?.data || err.message
      );
    }
  };

  useEffect(() => {
    refreshUnreadCount();

    // Existing notification listener
    startNotificationListener(() => {
      refreshUnreadCount();
    });

    // Live badge updates
    const socket = getSocket();

    socket?.off("notification_badge");

    socket?.on(
      "notification_badge",
      ({ unread }) => {
        setUnreadCount(unread);
      }
    );

    return () => {
      stopNotificationListener();
      socket?.off("notification_badge");
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        refreshUnreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () =>
  useContext(NotificationContext);