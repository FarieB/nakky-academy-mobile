import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import API from "../../src/services/api";

export default function NotificationsScreen() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  // ==========================================
  // LOAD NOTIFICATIONS
  // ==========================================

  const loadNotifications = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      API.defaults.headers.common["Authorization"] =
        `Bearer ${token}`;

      const response = await API.get("/notifications");

      const loadedNotifications =
        response.data || [];

      // Show maximum 20 notifications
      setNotifications(
        loadedNotifications.slice(0, 20)
      );

      // ==========================================
      // MARK UNREAD NOTIFICATIONS AS READ
      // ==========================================

      const unreadNotifications =
        loadedNotifications.filter(
          (notification: any) =>
            notification.isRead === false
        );

      if (unreadNotifications.length > 0) {
        await Promise.all(
          unreadNotifications.map(
            (notification: any) =>
              API.put(
                `/notifications/${notification._id}/read`
              )
          )
        );

        // Update local state
        setNotifications(
          loadedNotifications
            .slice(0, 20)
            .map((notification: any) => ({
              ...notification,
              isRead: true,
            }))
        );
      }

    } catch (error: any) {
      console.log(
        "NOTIFICATIONS ERROR:",
        error?.response?.data ||
          error.message
      );

      Alert.alert(
        "Notifications",
        "Unable to load notifications."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // CLEAR ALL NOTIFICATIONS
  // ==========================================

  const clearAllNotifications = () => {
    if (notifications.length === 0) {
      return;
    }

    Alert.alert(
      "Clear Notifications",
      "Are you sure you want to clear all your notifications?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear All",
          style: "destructive",
          onPress: confirmClearAll,
        },
      ]
    );
  };

  // ==========================================
  // CONFIRM CLEAR ALL
  // ==========================================

  const confirmClearAll = async () => {
    try {
      setClearing(true);

      const token =
        await AsyncStorage.getItem("token");

      if (!token) {
        return;
      }

      API.defaults.headers.common["Authorization"] =
        `Bearer ${token}`;

      await API.delete("/notifications");

      // Immediately clear the screen
      setNotifications([]);

      Alert.alert(
        "Notifications Cleared",
        "All your notifications have been cleared."
      );

    } catch (error: any) {
      console.log(
        "CLEAR NOTIFICATIONS ERROR:",
        error?.response?.data ||
          error.message
      );

      Alert.alert(
        "Error",
        "Unable to clear notifications. Please try again."
      );

    } finally {
      setClearing(false);
    }
  };

  // ==========================================
  // REFRESH WHEN SCREEN OPENS
  // ==========================================

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <View style={styles.center}>

        <ActivityIndicator
          size="large"
          color="#2E7D32"
        />

        <Text style={styles.loadingText}>
          Loading notifications...
        </Text>

      </View>
    );
  }

  // ==========================================
  // SCREEN
  // ==========================================

  return (
    <View style={styles.container}>

      {/* ===================================== */}
      {/* HEADER */}
      {/* ===================================== */}

      <View style={styles.header}>

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>
            ←
          </Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Notifications
        </Text>

        <TouchableOpacity
          onPress={clearAllNotifications}
          disabled={
            notifications.length === 0 ||
            clearing
          }
          style={[
            styles.clearButton,
            (
              notifications.length === 0 ||
              clearing
            ) && styles.clearButtonDisabled,
          ]}
        >
          <Text style={styles.clearButtonText}>
            {clearing
              ? "Clearing..."
              : "Clear All"}
          </Text>
        </TouchableOpacity>

      </View>

      {/* ===================================== */}
      {/* NOTIFICATIONS */}
      {/* ===================================== */}

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {notifications.length === 0 ? (

          <View style={styles.emptyContainer}>

            <Text style={styles.emptyIcon}>
              🔔
            </Text>

            <Text style={styles.emptyTitle}>
              No notifications
            </Text>

            <Text style={styles.emptyText}>
              You don't have any notifications
              at the moment.
            </Text>

          </View>

        ) : (

          <>
            <View style={styles.infoRow}>

              <Text style={styles.infoText}>
                Showing your latest{" "}
                {notifications.length}{" "}
                notification
                {notifications.length === 1
                  ? ""
                  : "s"}.
              </Text>

            </View>

            {notifications.map(
              (notification: any) => (

                <View
                  key={notification._id}
                  style={[
                    styles.notificationCard,
                    !notification.isRead &&
                      styles.unreadCard,
                  ]}
                >

                  <View
                    style={
                      styles.notificationHeader
                    }
                  >

                    <Text
                      style={
                        styles.notificationTitle
                      }
                    >
                      {notification.title ||
                        "Notification"}
                    </Text>

                    {!notification.isRead && (
                      <View
                        style={styles.unreadDot}
                      />
                    )}

                  </View>

                  <Text
                    style={
                      styles.notificationMessage
                    }
                  >
                    {notification.message}
                  </Text>

                  {notification.createdAt && (
                    <Text
                      style={styles.dateText}
                    >
                      {new Date(
                        notification.createdAt
                      ).toLocaleString()}
                    </Text>
                  )}

                </View>

              )
            )}
          </>

        )}

        <View style={{ height: 40 }} />

      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    padding: 20,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#666",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#2E7D32",
    paddingHorizontal: 12,
    paddingVertical: 14,
  },

  backButton: {
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
  },

  backText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "bold",
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },

  clearButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  clearButtonDisabled: {
    opacity: 0.45,
  },

  clearButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
  },

  content: {
    padding: 18,
  },

  infoRow: {
    marginBottom: 12,
  },

  infoText: {
    fontSize: 13,
    color: "#777",
  },

  notificationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#2E7D32",
  },

  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  notificationTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#222",
    flex: 1,
  },

  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2E7D32",
    marginLeft: 10,
  },

  notificationMessage: {
    fontSize: 15,
    lineHeight: 22,
    color: "#555",
  },

  dateText: {
    fontSize: 12,
    color: "#999",
    marginTop: 10,
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 20,
  },

  emptyIcon: {
    fontSize: 45,
    marginBottom: 15,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 15,
    color: "#888",
    textAlign: "center",
    lineHeight: 22,
  },

});