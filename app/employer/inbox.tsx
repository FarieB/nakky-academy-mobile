import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../../src/services/api";

export default function InboxScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");

  const fetchChats = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const user = JSON.parse(await AsyncStorage.getItem("user") || "{}");

      if (!token) return;

      setCurrentUserId(user?._id);

      API.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      const res = await API.get("/messages");

      const unique: any = {};

      res.data.forEach((msg: any) => {
        const otherUser =
          msg.sender._id === currentUserId
            ? msg.receiver
            : msg.sender;

        unique[otherUser._id] = {
          user: otherUser,
          lastMessage: msg.message,
        };
      });

      setChats(Object.values(unique));
    } catch (err: any) {
      console.log("INBOX ERROR:", err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <FlatList
      data={chats}
      keyExtractor={(item: any) => item.user._id}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() =>
            router.push({
              pathname: "/employer/chat" as any,
              params: {
                userId: item.user._id,
                name: item.user.name,
              },
            })
          }
        >
          <Text style={styles.name}>{item.user.name}</Text>
          <Text>{item.lastMessage}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    padding: 15,
    borderBottomWidth: 1,
  },
  name: {
    fontWeight: "bold",
    fontSize: 16,
  },
});