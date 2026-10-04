import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import API from "../../src/services/api";

import {
  startNotificationListener,
  stopNotificationListener,
} from "../../src/socket/notificationListener";

export default function NotificationsScreen() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clearing, setClearing] = useState(false);

  // ==========================
  // Fetch Notifications
  // ==========================

  const fetchNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      API.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;

      const res = await API.get("/notifications");

      // Show maximum 20 notifications
      setNotifications(
        Array.isArray(res.data)
          ? res.data.slice(0, 20)
          : []
      );

    } catch (err: any) {
      console.log(
        "NOTIFICATION ERROR:",
        err?.response?.data || err.message
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ==========================
  // Initial Load + Socket
  // ==========================

  useEffect(() => {
    fetchNotifications();

    startNotificationListener((notification) => {
      setNotifications((prev) => {
        const updated = [
          notification,
          ...prev,
        ];

        // Keep maximum of 20
        return updated.slice(0, 20);
      });
    });

    return () => {
      stopNotificationListener();
    };
  }, []);

  // ==========================
  // Pull To Refresh
  // ==========================

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, []);

  // ==========================
  // Clear All Notifications
  // ==========================

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

  // ==========================
  // Confirm Clear All
  // ==========================

  const confirmClearAll = async () => {
    try {
      setClearing(true);

      const token =
        await AsyncStorage.getItem("token");

      if (!token) {
        return;
      }

      API.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;

      await API.delete("/notifications");

      // Immediately clear the screen
      setNotifications([]);

      console.log(
        "All notifications cleared successfully."
      );

    } catch (err: any) {
      console.log(
        "CLEAR NOTIFICATIONS ERROR:",
        err?.response?.data || err.message
      );

      Alert.alert(
        "Error",
        "Unable to clear notifications. Please try again."
      );

    } finally {
      setClearing(false);
    }
  };

  // ==========================
  // Notification Icons
  // ==========================

  const getIcon = (type: string) => {
    switch (type) {
      case "message_received":
        return "💬";

      case "candidate_saved":
        return "❤️";

      case "verification_request":
        return "📄";

      case "verification_approved":
        return "✅";

      case "verification_rejected":
        return "❌";

      case "subscription_activated":
        return "💳";

      case "subscription_renewed":
        return "🔄";

      case "subscription_expired":
        return "⏰";

      case "subscription_cancelled":
        return "🚫";

      case "certificate_issued":
        return "🏆";

      case "announcement":
        return "📢";

      default:
        return "🔔";
    }
  };

  // ==========================
  // Time Formatter
  // ==========================

  const formatDate = (date: string) => {
    const created = new Date(date);

    return created.toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // ==========================
  // Loading
  // ==========================

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#E91E63"
        />
      </View>
    );
  }

  // ==========================
  // SCREEN
  // ==========================

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
    >

      {/* ========================== */}
      {/* HEADER */}
      {/* ========================== */}

      <View style={styles.headerRow}>

        <Text style={styles.title}>
          🔔 Notifications
        </Text>

        {notifications.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearAllNotifications}
            disabled={clearing}
          >
            <Text style={styles.clearButtonText}>
              {clearing
                ? "Clearing..."
                : "Clear All"}
            </Text>
          </TouchableOpacity>
        )}

      </View>

      {/* ========================== */}
      {/* INFO */}
      {/* ========================== */}

      {notifications.length > 0 && (
        <Text style={styles.limitText}>
          Showing your latest{" "}
          {notifications.length}{" "}
          notification
          {notifications.length === 1
            ? ""
            : "s"}
          {notifications.length === 20
            ? " (maximum 20)"
            : ""}
          .
        </Text>
      )}

      {/* ========================== */}
      {/* EMPTY STATE */}
      {/* ========================== */}

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>

          <Text style={styles.emptyIcon}>
            🔔
          </Text>

          <Text style={styles.emptyTitle}>
            No Notifications
          </Text>

          <Text style={styles.emptyText}>
            You're all caught up.
          </Text>

        </View>
      ) : (

        // ==========================
        // NOTIFICATIONS
        // ==========================

        notifications.map((notification) => (

          <TouchableOpacity
            key={notification._id}
            activeOpacity={0.8}
            onPress={async () => {

              try {

                // ==========================
                // Mark as read
                // ==========================

                if (!notification.isRead) {

                  await API.put(
                    `/notifications/${notification._id}/read`
                  );

                  // Immediately update local state
                  setNotifications((prev) =>
                    prev.map((item) =>
                      item._id === notification._id
                        ? {
                            ...item,
                            isRead: true,
                          }
                        : item
                    )
                  );
                }

                // ==========================
                // Navigate according to action
                // ==========================

                switch (
                  notification.action
                ) {

                  case "open_chat":

                    router.push({
                      pathname:
                        "/messaging/[userId]",
                      params: {
                        userId:
                          notification
                            .actionData
                            ?.userId,
                      },
                    });

                    break;

                  case "open_profile":

                    router.push(
                      "/(candidate)/profile-builder"
                    );

                    break;

                  case "open_subscription":

                    router.push(
                      "/(employer)/subscribe"
                    );

                    break;

                  case "open_documents":

                    router.push(
                      "/(candidate)/upload-documents"
                    );

                    break;

                  case "open_verification":

                    router.push(
                      "/admin/verifications"
                    );

                    break;

                  case "open_course":

                    router.push(
                      "/student/courses"
                    );

                    break;

                  case "open_certificate":

                    router.push(
                      "/student/courses"
                    );

                    break;

                  default:
                    break;
                }

              } catch (err: any) {

                console.log(
                  "NOTIFICATION OPEN ERROR:",
                  err?.response?.data ||
                    err.message
                );

              }

            }}
          >

            <View
              style={[
                styles.card,
                !notification.isRead &&
                  styles.unreadCard,
              ]}
            >

              <Text style={styles.icon}>
                {getIcon(
                  notification.type
                )}
              </Text>

              <View style={styles.content}>

                <View style={styles.cardHeader}>

                  <Text
                    style={styles.cardTitle}
                  >
                    {notification.title}
                  </Text>

                  {!notification.isRead && (
                    <View
                      style={
                        styles.unreadDot
                      }
                    />
                  )}

                </View>

                <Text style={styles.message}>
                  {notification.message}
                </Text>

                <Text style={styles.date}>
                  {formatDate(
                    notification.createdAt
                  )}
                </Text>

              </View>

            </View>

          </TouchableOpacity>

        ))
      )}

      <View style={{ height: 40 }} />

    </ScrollView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    padding: 20,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // ==========================
  // HEADER
  // ==========================

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#222",
    flex: 1,
  },

  clearButton: {
    backgroundColor: "#D32F2F",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    marginLeft: 10,
  },

  clearButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
  },

  limitText: {
    fontSize: 13,
    color: "#888",
    marginBottom: 16,
  },

  // ==========================
  // EMPTY STATE
  // ==========================

  emptyContainer: {
    marginTop: 80,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyIcon: {
    fontSize: 60,
    marginBottom: 15,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#444",
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 15,
    color: "#777",
    textAlign: "center",
  },

  // ==========================
  // NOTIFICATION CARD
  // ==========================

  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  unreadCard: {
    borderLeftWidth: 5,
    borderLeftColor: "#E91E63",
    backgroundColor: "#FFF6FA",
  },

  icon: {
    fontSize: 30,
    marginRight: 15,
    marginTop: 3,
  },

  content: {
    flex: 1,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
    flex: 1,
  },

  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#E91E63",
    marginLeft: 8,
  },

  message: {
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
    marginBottom: 8,
  },

  date: {
    fontSize: 12,
    color: "#999",
  },

});