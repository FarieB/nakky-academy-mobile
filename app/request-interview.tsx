import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import API from "../src/services/api";

export default function RequestInterviewScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    recipientId?: string;
    recipientName?: string;
    jobId?: string;
    jobTitle?: string;
  }>();

  const recipientId = params.recipientId || "";
  const recipientName = params.recipientName || "the selected person";
  const jobId = params.jobId || "";
  const jobTitle = params.jobTitle || "";

  const [proposedDate, setProposedDate] = useState("");
  const [proposedStartTime, setProposedStartTime] = useState("");
  const [proposedEndTime, setProposedEndTime] = useState("");

  const [meetingType, setMeetingType] =
    useState<"In Person" | "Online" | "Phone">("In Person");

  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!recipientId) {
      Alert.alert(
        "Unable to continue",
        "The selected candidate or employer could not be identified."
      );
      return false;
    }

    if (!proposedDate.trim()) {
      Alert.alert(
        "Date required",
        "Please enter the proposed interview date."
      );
      return false;
    }

    if (!proposedStartTime.trim()) {
      Alert.alert(
        "Start time required",
        "Please enter the proposed interview start time."
      );
      return false;
    }

    if (!proposedEndTime.trim()) {
      Alert.alert(
        "End time required",
        "Please enter the proposed interview end time."
      );
      return false;
    }

    if (
      meetingType === "In Person" &&
      !location.trim()
    ) {
      Alert.alert(
        "Location required",
        "Please enter the interview location."
      );
      return false;
    }

    return true;
  };

  const submitRequest = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert(
          "Session expired",
          "Please log in again."
        );

        router.replace("/login");
        return;
      }

      /*
       * The backend accepts:
       *
       * recipientId
       * candidateId
       * employerId
       * jobId
       * proposedDate
       * proposedStartTime
       * proposedEndTime
       * meetingType
       * location
       * message
       *
       * We intentionally send recipientId only.
       *
       * The backend determines whether the recipient
       * is the candidate or employer.
       */

      const response = await API.post(
        "/interviews",
        {
          recipientId,
          ...(jobId ? { jobId } : {}),
          proposedDate: proposedDate.trim(),
          proposedStartTime:
            proposedStartTime.trim(),
          proposedEndTime:
            proposedEndTime.trim(),
          meetingType,
          location:
            meetingType === "In Person"
              ? location.trim()
              : "",
          message: message.trim(),
        }
      );

      Alert.alert(
        "Interview Request Sent",
        response.data?.message ||
          "Your interview request has been sent successfully.",
        [
          {
            text: "View Interviews",
            onPress: () => {
              router.replace("/interviews");
            },
          },
          {
            text: "Done",
            style: "cancel",
            onPress: () => {
              router.back();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error(
        "CREATE INTERVIEW REQUEST ERROR:",
        error?.response?.data || error
      );

      const status =
        error?.response?.status;

      const message =
        error?.response?.data?.message ||
        "Failed to send the interview request.";

      if (status === 403) {
        Alert.alert(
          "Subscription Required",
          message
        );
        return;
      }

      if (status === 409) {
        Alert.alert(
          "Request Already Exists",
          message
        );
        return;
      }

      Alert.alert(
        "Interview Request Failed",
        message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            Request Interview
          </Text>

          <Text style={styles.subtitle}>
            Send an interview request to{" "}
            <Text style={styles.bold}>
              {recipientName}
            </Text>
          </Text>

          {jobTitle ? (
            <View style={styles.jobBox}>
              <Text style={styles.jobLabel}>
                Job
              </Text>

              <Text style={styles.jobTitle}>
                {jobTitle}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Interview Date
          </Text>

          <Text style={styles.helpText}>
            Use the format YYYY-MM-DD.
          </Text>

          <TextInput
            value={proposedDate}
            onChangeText={setProposedDate}
            placeholder="2026-10-20"
            placeholderTextColor="#999"
            style={styles.input}
            autoCapitalize="none"
          />

          <Text style={styles.sectionTitle}>
            Start Time
          </Text>

          <TextInput
            value={proposedStartTime}
            onChangeText={setProposedStartTime}
            placeholder="10:00"
            placeholderTextColor="#999"
            style={styles.input}
            keyboardType="numbers-and-punctuation"
          />

          <Text style={styles.sectionTitle}>
            End Time
          </Text>

          <TextInput
            value={proposedEndTime}
            onChangeText={setProposedEndTime}
            placeholder="11:00"
            placeholderTextColor="#999"
            style={styles.input}
            keyboardType="numbers-and-punctuation"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Meeting Type
          </Text>

          <View style={styles.optionRow}>
            {[
              "In Person",
              "Online",
              "Phone",
            ].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.optionButton,
                  meetingType === type &&
                    styles.optionButtonActive,
                ]}
                onPress={() =>
                  setMeetingType(
                    type as
                      | "In Person"
                      | "Online"
                      | "Phone"
                  )
                }
              >
                <Text
                  style={[
                    styles.optionText,
                    meetingType === type &&
                      styles.optionTextActive,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {meetingType === "In Person" ? (
            <>
              <Text style={styles.sectionTitle}>
                Location
              </Text>

              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="Enter interview location"
                placeholderTextColor="#999"
                style={styles.input}
              />
            </>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Message
          </Text>

          <Text style={styles.helpText}>
            Add any information you would like the
            other person to know about the interview.
          </Text>

          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Write your message..."
            placeholderTextColor="#999"
            style={[
              styles.input,
              styles.messageInput,
            ]}
            multiline
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            loading &&
              styles.submitButtonDisabled,
          ]}
          onPress={submitRequest}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>
              Send Interview Request
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.cancelText}>
            Cancel
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },

  header: {
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
  },

  bold: {
    fontWeight: "700",
    color: "#111",
  },

  jobBox: {
    marginTop: 15,
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },

  jobLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#888",
    marginBottom: 5,
    textTransform: "uppercase",
  },

  jobTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginTop: 8,
    marginBottom: 8,
  },

  helpText: {
    fontSize: 12,
    color: "#777",
    marginBottom: 8,
    lineHeight: 18,
  },

  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#111",
    backgroundColor: "#fff",
    marginBottom: 12,
  },

  messageInput: {
    minHeight: 120,
    paddingTop: 14,
  },

  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },

  optionButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },

  optionButtonActive: {
    backgroundColor: "#d90072",
    borderColor: "#d90072",
  },

  optionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
  },

  optionTextActive: {
    color: "#fff",
  },

  submitButton: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: "#d90072",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  submitButtonDisabled: {
    opacity: 0.6,
  },

  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },

  cancelButton: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  cancelText: {
    color: "#555",
    fontSize: 15,
    fontWeight: "600",
  },
});