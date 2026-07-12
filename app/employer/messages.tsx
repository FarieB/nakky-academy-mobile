import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import API from "../../src/services/api";

export default function MessagesScreen() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [receiverId, setReceiverId] = useState("");
  const [jobId, setJobId] = useState("");
  const [message, setMessage] = useState("");

  const fetchMessages = async () => {
    try {
      const res = await API.get("/dashboard");
      setMessages(res.data.messages);
    } catch (err: any) {
      console.log("MESSAGE ERROR:", err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!receiverId || !message) {
      alert("Receiver ID and message required");
      return;
    }

    try {
      await API.post("/jobs/message", {
        receiverId,
        jobId,
        message,
      });

      alert("Message sent ✅");
      setMessage("");
      fetchMessages();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to send message");
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  if (loading) return <ActivityIndicator />;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Messages</Text>

      {/* SEND MESSAGE */}
      <View style={styles.card}>
        <TextInput
          placeholder="Receiver ID"
          value={receiverId}
          onChangeText={setReceiverId}
          style={styles.input}
        />

        <TextInput
          placeholder="Job ID (optional)"
          value={jobId}
          onChangeText={setJobId}
          style={styles.input}
        />

        <TextInput
          placeholder="Message"
          value={message}
          onChangeText={setMessage}
          style={styles.input}
        />

        <Button title="Send Message" onPress={sendMessage} />
      </View>

      {/* MESSAGE LIST */}
      <Text style={styles.section}>Recent Messages</Text>

      {messages.map((msg) => (
        <View key={msg._id} style={styles.card}>
          <Text style={styles.bold}>
            {msg.sender?.name} → {msg.receiver?.name}
          </Text>
          <Text>{msg.message}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  section: { marginTop: 20, fontWeight: "bold" },
  card: {
    padding: 15,
    backgroundColor: "#f2f2f2",
    marginBottom: 10,
    borderRadius: 8,
  },
  input: {
    borderWidth: 1,
    marginBottom: 10,
    padding: 10,
    borderRadius: 5,
  },
  bold: { fontWeight: "bold" },
});