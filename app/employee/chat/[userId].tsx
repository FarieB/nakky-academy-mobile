import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Button,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import API from "../../../src/services/api";
export default function ChatScreen() {
  const { userId } = useLocalSearchParams();

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");

  const fetchMessages = async () => {
    try {
      const res = await API.get(`/messages/${userId}`);
      setMessages(res.data);
    } catch (err) {
      console.log("CHAT ERROR:", err);
    }
  };

  const sendMessage = async () => {
    if (!text) return;

    try {
      await API.post("/messages", {
        receiverId: userId,
        message: text
      });

      setText("");
      fetchMessages();
    } catch (err) {
      console.log("SEND ERROR:", err);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.message,
              item.sender._id === userId
                ? styles.received
                : styles.sent
            ]}
          >
            <Text>{item.message}</Text>
          </View>
        )}
      />

      <View style={styles.inputContainer}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Type message..."
          style={styles.input}
        />
        <Button title="Send" onPress={sendMessage} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  message: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 8,
    maxWidth: "70%"
  },
  sent: {
    backgroundColor: "#d1f7c4",
    alignSelf: "flex-end"
  },
  received: {
    backgroundColor: "#eee",
    alignSelf: "flex-start"
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center"
  },
  input: {
    flex: 1,
    borderWidth: 1,
    padding: 10,
    marginRight: 10
  }
});