import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import API from "../src/services/api";

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      API.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;

      const res = await API.get("/notifications");

      setNotifications(res.data);
    } catch (err: any) {
      console.log(
        "NOTIFICATIONS ERROR:",
        err?.response?.data || err.message
      );
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await API.put(`/notifications/${id}/read`);

      setNotifications((prev) =>
        prev.map((n) =>
          n._id === id
            ? { ...n, isRead: true }
            : n
        )
      );
    } catch (err: any) {
      console.log(
        "MARK READ ERROR:",
        err?.response?.data || err.message
      );
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        Notifications
      </Text>

      {notifications.length === 0 ? (
        <Text>No notifications yet</Text>
      ) : (
        notifications.map((item) => (
          <TouchableOpacity
            key={item._id}
            style={[
              styles.card,
              !item.isRead && styles.unread,
            ]}
            onPress={() => markAsRead(item._id)}
          >
            <Text style={styles.cardTitle}>
              {item.title}
            </Text>

            <Text>{item.message}</Text>

            <Text style={styles.time}>
              {new Date(
                item.createdAt
              ).toLocaleString()}
            </Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#f2f2f2",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },

  unread: {
    borderWidth: 2,
  },

  cardTitle: {
    fontWeight: "bold",
    marginBottom: 5,
  },

  time: {
    marginTop: 10,
    fontSize: 12,
    opacity: 0.7,
  },
});