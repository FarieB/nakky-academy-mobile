import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../../src/services/api";

export default function ChatScreen() {
  const { userId, name } = useLocalSearchParams();

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState("");

  const fetchMessages = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const user = JSON.parse(await AsyncStorage.getItem("user") || "{}");

      if (!token) return;

      setCurrentUserId(user?._id);

      API.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      const res = await API.get(`/messages/${userId}`);
      setMessages(res.data);
    } catch (err: any) {
      console.log("CHAT ERROR:", err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!text.trim()) return;

    try {
      const res = await API.post("/messages", {
        receiverId: userId, // ✅ FIXED
        message: text,
      });

      setMessages((prev) => [...prev, res.data]);
      setText("");
    } catch (err: any) {
      console.log("SEND ERROR:", err?.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Chat with {name}</Text>

      <FlatList
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          const isMine = item.sender._id === currentUserId;

          return (
            <View
              style={[
                styles.message,
                isMine ? styles.myMessage : styles.theirMessage,
              ]}
            >
              <Text>{item.message}</Text>
            </View>
          );
        }}
      />

      <View style={styles.inputContainer}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Type message..."
          style={styles.input}
        />

        <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
          <Text style={{ color: "#fff" }}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  message: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 8,
    maxWidth: "70%",
  },
  myMessage: {
    backgroundColor: "#d1f7c4",
    alignSelf: "flex-end",
  },
  theirMessage: {
    backgroundColor: "#f1f1f1",
    alignSelf: "flex-start",
  },
  inputContainer: {
    flexDirection: "row",
    marginTop: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
  },
  sendBtn: {
    backgroundColor: "#007bff",
    padding: 10,
    marginLeft: 5,
    borderRadius: 5,
    justifyContent: "center",
  },
});