import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../../src/services/api";
import {
  startMessageListener,
  stopMessageListener,
} from "../../src/socket/messageListener";
import {
  startMessageStatusListener,
  stopMessageStatusListener,
} from "../../src/socket/messageStatusListener";
import {
  startPresenceListener,
  stopPresenceListener,
} from "../../src/socket/presenceListener";
import { getSocket } from "../../src/socket/socket";
import {
  startTypingListener,
  stopTypingListener,
} from "../../src/socket/typingListener";

export default function ChatScreen() {
  const { userId, name } = useLocalSearchParams();
  const flatListRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState("");

 const markConversationRead = async (loadedMessages: any[]) => {
  try {
    const unread = loadedMessages.filter(
      (msg) => msg.sender._id === userId && msg.status !== "read"
    );

    if (unread.length > 0) {
      // 1. Mark all unread messages as read in the database
      await Promise.all(
        unread.map((msg) => API.put(`/messages/${msg._id}/read`))
      );

      // 2. Safely tell the server to recalculate counts so the parent screen updates
      await API.get("/messages/unread/counts").catch(() => null);
    }
  } catch (err: any) {
    console.log("READ ERROR:", err.message);
  }
};
 
 

  const fetchMessages = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const user = JSON.parse(
        (await AsyncStorage.getItem("user")) || "{}"
      );
      if (!token) return;
      setCurrentUserId(user._id);
      API.defaults.headers.common.Authorization = `Bearer ${token}`;
      const res = await API.get(`/messages/${userId}`);
      
      setMessages(res.data);
      markConversationRead(res.data);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({
          animated: true,
        });
      }, 100);
    } catch (err: any) {
      console.log(err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };
 

  // WITH THIS NEW LIVE SOCKET BLOCK:
   // REPLACE YOUR OLD EFFECT WITH THIS ONE:
    useEffect(() => {
    fetchMessages();

    // Live Incoming Messages
    startMessageListener(async (message) => {
      setMessages((prev) => [...prev, message]);
      try {
        await API.put(`/messages/${message._id}/delivered`);
        await API.put(`/messages/${message._id}/read`);
      } catch (err: any) {
        console.log("Live status update error:", err.message);
      }
    });

    // Live Status Listener
    startMessageStatusListener((status) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === status.messageId
            ? {
                ...msg,
                status: status.status,
                deliveredAt: status.deliveredAt,
                readAt: status.readAt,
              }
            : msg
        )
      );
    });

    // Live Typing Indicators
    startTypingListener(
      (senderId) => {
        if (senderId === userId) {
          setIsTyping(true);
        }
      },
      (senderId) => {
        if (senderId === userId) {
          setIsTyping(false);
        }
      }
    );

    // 👇 ADD THIS: Live Presence Monitoring (Uses variable 'userId' from useLocalSearchParams)
    startPresenceListener(
      (onlineUserId) => {
        if (onlineUserId === userId) {
          setIsOnline(true);
        }
      },
      (offlineUserId, seen) => {
        if (offlineUserId === userId) {
          setIsOnline(false);
          setLastSeen(seen);
        }
      }
    );

    return () => {
      stopMessageListener();
      stopMessageStatusListener();
      stopTypingListener();
      // 👇 ADD THIS: Cleanup Presence Listener
      stopPresenceListener(); 
    };
  }, []);

 


  const sendMessage = async () => {
    if (!text.trim()) return;
    try {
      const res = await API.post("/messages", {
        receiverId: userId,
        message: text,
      });
      setMessages((prev) => [...prev, res.data]);
      setText("");
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({
          animated: true,
        });
      }, 100);
    } catch (err: any) {
      console.log(err?.response?.data || err.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E91E63" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{name}</Text>
        <Text style={styles.online}>
          {isOnline
            ? "🟢 Online"
            : lastSeen
            ? `Last seen ${new Date(lastSeen).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
            : "Offline"}
        </Text>
      </View>

      {isTyping && (
        <Text
          style={{
            color: "gray",
            fontStyle: "italic",
            marginBottom: 10,
          }}
        >
          Typing...
        </Text>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{
          padding: 15,
        }}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({
            animated: true,
          })
        }
        renderItem={({ item }) => {
          const mine = item.sender._id === currentUserId;
          return (
            <View
              style={[
                styles.messageContainer,
                mine ? styles.mine : styles.theirs,
              ]}
            >
              <Text style={styles.messageText}>{item.message}</Text>
              <Text style={styles.time}>
                {new Date(item.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>

              {mine && (
                <Text
                  style={{
                    fontSize: 10,
                    color: item.status === "read" ? "#2196F3" : "#777",
                    marginTop: 2,
                    textAlign: "right",
                  }}
                >
                  {item.status === "sent" && "✓ Sent"}
                  {item.status === "delivered" && "✓✓ Delivered"}
                  {item.status === "read" && "✓✓ Read"}
                </Text>
              )}
            </View>
          );
        }}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={text}
          onChangeText={(value) => {
            setText(value);

            const socket = getSocket();
            socket?.emit("typing", {
              receiverId: userId,
              senderId: currentUserId,
            });

            if (typingTimeout.current) {
              clearTimeout(typingTimeout.current);
            }

            typingTimeout.current = setTimeout(() => {
              socket?.emit("stop_typing", {
                receiverId: userId,
                senderId: currentUserId,
              });
            }, 1500);
          }}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  },
  header: {
    padding: 18,
    backgroundColor: "#E91E63",
    elevation: 4,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  online: {
    color: "#fff",
    opacity: 0.8,
  },
  messageContainer: {
    maxWidth: "78%",
    padding: 12,
    borderRadius: 18,
    marginBottom: 12,
  },
  mine: {
    alignSelf: "flex-end",
    backgroundColor: "#DCF8C6",
  },
  theirs: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
  },
  messageText: {
    fontSize: 16,
    color: "#333",
  },
  time: {
    fontSize: 11,
    color: "#777",
    marginTop: 6,
    textAlign: "right",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    backgroundColor: "#F2F2F2",
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 12,
    maxHeight: 120,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: "#E91E63",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  sendText: {
    color: "#fff",
    fontWeight: "bold",
  },
});