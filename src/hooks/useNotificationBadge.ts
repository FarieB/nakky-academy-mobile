import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import API from "../services/api";

import {
    startNotificationBadgeListener,
    stopNotificationBadgeListener,
} from "../socket/notificationBadgeListener";

export default function useNotificationBadge() {
  const [badge, setBadge] = useState(0);

  // ==========================================
  // LOAD CURRENT UNREAD COUNT
  // ==========================================

  const loadBadge = useCallback(async () => {
    try {
      const res = await API.get(
        "/notifications/unread-count"
      );

      setBadge(
        Number(res.data?.unread || 0)
      );

    } catch (error: any) {
      console.log(
        "NOTIFICATION BADGE ERROR:",
        error?.response?.data || error.message
      );
    }
  }, []);

  // ==========================================
  // REFRESH WHEN SCREEN COMES INTO FOCUS
  // ==========================================

  useFocusEffect(
    useCallback(() => {
      loadBadge();
    }, [loadBadge])
  );

  // ==========================================
  // REAL-TIME SOCKET NOTIFICATIONS
  // ==========================================

  useEffect(() => {
    startNotificationBadgeListener(setBadge);

    return () => {
      stopNotificationBadgeListener();
    };
  }, []);

  return badge;
}