import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
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

type Props = {
  role: "candidate" | "employer";
};

export default function InterviewsScreen() {
  const router = useRouter();
  const role: "candidate" = "candidate";
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");

  const loadInterviews = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userJson = await AsyncStorage.getItem("user");

      if (!token) {
        router.replace("/login");
        return;
      }

      API.defaults.headers.common.Authorization = `Bearer ${token}`;

      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          setCurrentUserId(String(user?._id || user?.id || ""));
        } catch {
          setCurrentUserId("");
        }
      }

      const response = await API.get("/interviews/my");
      setInterviews(Array.isArray(response.data?.interviews) ? response.data.interviews : []);
    } catch (error: any) {
      console.error("LOAD INTERVIEWS ERROR:", error?.response?.data || error);
      Alert.alert(
        "Unable to Load Interviews",
        error?.response?.data?.message || "Your interviews could not be loaded."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      loadInterviews();
    }, [loadInterviews])
  );

  const refresh = () => {
    setRefreshing(true);
    loadInterviews();
  };

  const respond = async (id: string, response: "accepted" | "rejected") => {
    try {
      setBusyId(id);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        router.replace("/login");
        return;
      }

      API.defaults.headers.common.Authorization = `Bearer ${token}`;

      const result = await API.patch(`/interviews/${id}/respond`, {
        response,
      });

      Alert.alert(
        response === "accepted" ? "Interview Accepted" : "Interview Rejected",
        result.data?.message || "The interview has been updated."
      );

      await loadInterviews();
    } catch (error: any) {
      Alert.alert(
        "Unable to Update Interview",
        error?.response?.data?.message || "The interview could not be updated."
      );
    } finally {
      setBusyId(null);
    }
  };

  const cancel = async (id: string) => {
    Alert.alert("Cancel Interview", "Are you sure you want to cancel this interview request?", [
      { text: "Keep", style: "cancel" },
      {
        text: "Cancel Interview",
        style: "destructive",
        onPress: async () => {
          try {
            setBusyId(id);
            const token = await AsyncStorage.getItem("token");
            if (!token) {
              router.replace("/login");
              return;
            }

            API.defaults.headers.common.Authorization = `Bearer ${token}`;
            const result = await API.patch(`/interviews/${id}/cancel`);

            Alert.alert("Interview Cancelled", result.data?.message || "Interview cancelled.");
            await loadInterviews();
          } catch (error: any) {
            Alert.alert(
              "Unable to Cancel",
              error?.response?.data?.message || "The interview could not be cancelled."
            );
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  };

  const complete = async (id: string) => {
    try {
      setBusyId(id);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        router.replace("/login");
        return;
      }

      API.defaults.headers.common.Authorization = `Bearer ${token}`;
      const result = await API.patch(`/interviews/${id}/complete`);

      Alert.alert("Interview Completed", result.data?.message || "Interview marked as completed.");
      await loadInterviews();
    } catch (error: any) {
      Alert.alert(
        "Unable to Complete",
        error?.response?.data?.message || "The interview could not be completed."
      );
    } finally {
      setBusyId(null);
    }
  };

  const getName = (interview: any) => {
    const person = role === "candidate" ? interview.employer : interview.candidate;
    return (
      person?.firstName ||
      person?.name ||
      [person?.firstName, person?.lastName].filter(Boolean).join(" ") ||
      (role === "candidate" ? "Employer" : "Candidate")
    );
  };

  const formatDate = (value: any) => {
    if (!value) return "Date not specified";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString("en-ZA", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const canRespond = (interview: any) =>
    interview.status === "pending" &&
    String(interview.requestedBy) !== currentUserId;

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#D90072" />
        <Text style={styles.loadingText}>Loading interviews...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>My Interviews</Text>
      <Text style={styles.subtitle}>
        Manage your interview requests, responses and scheduled interviews.
      </Text>

      {interviews.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No Interviews Yet</Text>
          <Text style={styles.emptyText}>
            New interview requests will appear here.
          </Text>
        </View>
      ) : (
        interviews.map((interview: any) => {
          const id = String(interview._id);
          const busy = busyId === id;
          const job = interview.job;

          return (
            <View key={id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.personName}>{getName(interview)}</Text>
                  <Text style={styles.roleText}>
                    {role === "candidate" ? "Employer" : "Candidate"}
                  </Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{String(interview.status || "pending").toUpperCase()}</Text>
                </View>
              </View>

              {job?.title ? (
                <Text style={styles.detail}>💼 {job.title}</Text>
              ) : null}
              <Text style={styles.detail}>📅 {formatDate(interview.proposedDate)}</Text>
              <Text style={styles.detail}>
                🕒 {interview.proposedStartTime || "Not specified"} - {interview.proposedEndTime || "Not specified"}
              </Text>
              <Text style={styles.detail}>📍 {interview.meetingType || "In Person"}</Text>
              {interview.location ? <Text style={styles.detail}>📌 {interview.location}</Text> : null}

              {interview.message ? (
                <View style={styles.messageBox}>
                  <Text style={styles.messageLabel}>Message</Text>
                  <Text style={styles.message}>{interview.message}</Text>
                </View>
              ) : null}

              {interview.responseMessage ? (
                <View style={styles.responseBox}>
                  <Text style={styles.messageLabel}>Response</Text>
                  <Text style={styles.message}>{interview.responseMessage}</Text>
                </View>
              ) : null}

              {canRespond(interview) ? (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.acceptButton, busy && styles.disabled]}
                    disabled={busy}
                    onPress={() => respond(id, "accepted")}
                  >
                    {busy ? <ActivityIndicator color="#FFF" /> : <Text style={styles.actionText}>Accept</Text>}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.rejectButton, busy && styles.disabled]}
                    disabled={busy}
                    onPress={() => respond(id, "rejected")}
                  >
                    <Text style={styles.actionText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {interview.status === "accepted" ? (
                <TouchableOpacity
                  style={[styles.completeButton, busy && styles.disabled]}
                  disabled={busy}
                  onPress={() => complete(id)}
                >
                  {busy ? <ActivityIndicator color="#FFF" /> : <Text style={styles.actionText}>Mark Interview Completed</Text>}
                </TouchableOpacity>
              ) : null}

              {!["rejected", "cancelled", "completed"].includes(interview.status) ? (
                <TouchableOpacity
                  style={[styles.cancelButton, busy && styles.disabled]}
                  disabled={busy}
                  onPress={() => cancel(id)}
                >
                  <Text style={styles.cancelText}>Cancel Request</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F7F7" },
  content: { padding: 18, paddingBottom: 45 },
  loader: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F7F7F7" },
  loadingText: { marginTop: 10, color: "#666" },
  title: { fontSize: 28, fontWeight: "900", color: "#111" },
  subtitle: { marginTop: 6, color: "#666", lineHeight: 21, marginBottom: 18 },
  emptyCard: { backgroundColor: "#FFF", borderRadius: 14, padding: 25, alignItems: "center", borderWidth: 1, borderColor: "#EEE" },
  emptyTitle: { fontSize: 19, fontWeight: "800", color: "#111" },
  emptyText: { marginTop: 6, color: "#777", textAlign: "center" },
  card: { backgroundColor: "#FFF", borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "#EEE" },
  cardTop: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
  personName: { fontSize: 18, fontWeight: "900", color: "#111" },
  roleText: { color: "#777", marginTop: 3 },
  statusBadge: { backgroundColor: "#FFF0F7", borderRadius: 9, paddingHorizontal: 9, paddingVertical: 7 },
  statusText: { color: "#D90072", fontSize: 10, fontWeight: "900" },
  detail: { color: "#555", lineHeight: 23, marginTop: 3 },
  messageBox: { marginTop: 12, padding: 12, backgroundColor: "#F7F7F7", borderRadius: 10 },
  responseBox: { marginTop: 10, padding: 12, backgroundColor: "#F0F8F2", borderRadius: 10 },
  messageLabel: { fontWeight: "800", color: "#333", marginBottom: 4 },
  message: { color: "#555", lineHeight: 20 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  acceptButton: { flex: 1, backgroundColor: "#2E7D32", minHeight: 48, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rejectButton: { flex: 1, backgroundColor: "#D32F2F", minHeight: 48, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  completeButton: { backgroundColor: "#1976D2", minHeight: 48, borderRadius: 10, alignItems: "center", justifyContent: "center", marginTop: 10 },
  actionText: { color: "#FFF", fontWeight: "800" },
  cancelButton: { minHeight: 46, borderRadius: 10, backgroundColor: "#EEE", alignItems: "center", justifyContent: "center", marginTop: 10 },
  cancelText: { color: "#555", fontWeight: "700" },
  disabled: { opacity: 0.55 },
});