import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import API from "../../src/services/api";

export default function CandidateProfile() {
  const router = useRouter();

  // ==========================
  // ROUTE PARAMS
  // ==========================
  const { id, jobId } = useLocalSearchParams();

  // ==========================
  // STATE
  // ==========================
  const [loading, setLoading] = useState(true);

  const [candidate, setCandidate] = useState<any>(null);

  // ==========================
  // FETCH PROFILE
  // ==========================
  const fetchProfile = async () => {
    try {
      const res = await API.get(
        `/profile/worker/${id}`
      );

      setCandidate(res.data);

    } catch (err: any) {
      console.log(
        "PROFILE ERROR:",
        err?.response?.data || err.message
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // INVITE
  // ==========================
  const inviteCandidate = async () => {
    try {
      await API.post("/invitations", {
        candidateId: candidate._id,
        jobId,
      });

      Alert.alert(
        "Success",
        "Invitation sent successfully"
      );

    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.message ||
          "Failed to invite candidate"
      );
    }
  };

  // ==========================
  // HIRE
  // ==========================
  const hireCandidate = async () => {
    try {
      await API.post("/hires", {
        candidateId: candidate._id,
        jobId,
      });

      Alert.alert(
        "Success",
        "Candidate hired successfully 🎉"
      );

    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.message ||
          "Failed to hire candidate"
      );
    }
  };

  // ==========================
  // LOAD PROFILE
  // ==========================
  useEffect(() => {
    if (id) {
      fetchProfile();
    }
  }, [id]);

  // ==========================
  // LOADING
  // ==========================
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // ==========================
  // NOT FOUND
  // ==========================
  if (!candidate) {
    return (
      <View style={styles.center}>
        <Text>Candidate not found</Text>
      </View>
    );
  }

  // ==========================
  // UI
  // ==========================
  return (
    <ScrollView style={styles.container}>

      <Text style={styles.title}>
        {candidate.name}
      </Text>

      <View style={styles.card}>

        <Text>
          Type: {candidate.workerType}
        </Text>

        <Text>
          Experience:{" "}
          {candidate.yearsExperience || 0} years
        </Text>

        <Text>
          Location: {candidate.city},{" "}
          {candidate.province}
        </Text>

        <Text>
          Skills:{" "}
          {candidate.skills?.join(", ") || "None"}
        </Text>

        <Text>
          Rating: ⭐{" "}
          {candidate.averageRating || 0}
        </Text>

      </View>

      {/* ===================== */}
      {/* INVITE */}
      {/* ===================== */}
      <View style={{ marginTop: 20 }}>
        <Button
          title="Invite Candidate"
          onPress={inviteCandidate}
        />
      </View>

      {/* ===================== */}
      {/* HIRE */}
      {/* ===================== */}
      <View style={{ marginTop: 10 }}>
        <Button
          title="Hire Candidate"
          onPress={hireCandidate}
        />
      </View>

      {/* ===================== */}
      {/* MESSAGE */}
      {/* ===================== */}
      <View style={{ marginTop: 10 }}>
        <Button
          title="Message Candidate"
          onPress={() =>
            router.push({
              pathname:
                "/employee/chat/[userId]" as any,
              params: {
                userId: candidate._id,
              },
            })
          }
        />
      </View>

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
    padding: 15,
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
  },
});