import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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

  // ==========================
  // Fetch Notifications
  // ==========================

  const fetchNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) return;

      API.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;

      const res = await API.get("/notifications");

      setNotifications(res.data);
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

useEffect(() => {
    fetchNotifications();

    startNotificationListener((notification) => {
      setNotifications((prev) => [notification, ...prev]);
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
        <ActivityIndicator size="large" color="#E91E63" />
      </View>
    );
  }

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
      <Text style={styles.title}>
        🔔 Notifications
      </Text>

      {/* ========================== */}
      {/* Empty State */}
      {/* ========================== */}

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔔</Text>

          <Text style={styles.emptyTitle}>
            No Notifications
          </Text>

          <Text style={styles.emptyText}>
            You're all caught up.
          </Text>
        </View>
      ) : (
        notifications.map((notification) => (
          <TouchableOpacity
            key={notification._id}
            activeOpacity={0.8}
            onPress={async () => {
              try {
                // Mark as read
                if (!notification.isRead) {
                  await API.put(
                    `/notifications/${notification._id}/read`
                  );
                }

                // Refresh notifications
                fetchNotifications();

                // Navigate according to action
                switch (notification.action) {
                  case "open_chat":
                    router.push({
                      pathname: "/messaging/[userId]",
                      params: {
                        userId:
                          notification.actionData?.userId,
                      },
                    });
                    break;

                  case "open_profile":
                    router.push({
                      pathname:
                        "/(candidate)/profile-builder",
                    });
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
                   router.push("/student/courses");
                    break;

                  case "open_certificate":
                    router.push("/student/courses");
                    break;

                  default:
                    break;
                }
              } catch (err: any) {
                console.log(
                  "NOTIFICATION OPEN ERROR:",
                  err?.response?.data || err.message
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
                {getIcon(notification.type)}
              </Text>

              <View style={styles.content}>
                <Text style={styles.cardTitle}>
                  {notification.title}
                </Text>

                <Text style={styles.message}>
                  {notification.message}
                </Text>

                <Text style={styles.date}>
                  {formatDate(notification.createdAt)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}
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

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 20,
  },

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

  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
    marginBottom: 5,
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