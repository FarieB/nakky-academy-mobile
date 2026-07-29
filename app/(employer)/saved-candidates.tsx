import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../../src/services/api";

export default function SavedCandidates() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<any[]>([]);

  // ==========================
  // LOAD SAVED CANDIDATES
  // ==========================
  const loadCandidates = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      API.defaults.headers.common.Authorization = `Bearer ${token}`;
      const response = await API.get("/profile/saved-candidates");
      setCandidates(response.data);
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.message || "Unable to load saved candidates."
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCandidates();
    }, [])
  );

  // ==========================
  // REMOVE SAVED CANDIDATE
  // ==========================
  const removeCandidate = async (candidateId: string) => {
    try {
      const token = await AsyncStorage.getItem("token");
      API.defaults.headers.common.Authorization = `Bearer ${token}`;
      await API.delete(`/profile/saved-candidate/${candidateId}`);
      setCandidates((prev) =>
        prev.filter((item) => item.candidate._id !== candidateId)
      );
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.message || "Unable to remove candidate."
      );
    }
  };

  // ==========================
  // LOADING STATE
  // ==========================
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  // ==========================
  // MAIN RENDER
  // ==========================
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ========================= */}
      {/* HEADER */}
      {/* ========================= */}
      <Text style={styles.heading}>Saved Candidates</Text>
      <Text style={styles.subHeading}>
        You have saved {candidates.length} candidate
        {candidates.length === 1 ? "" : "s"}.
      </Text>

      {/* ========================= */}
      {/* EMPTY STATE */}
      {/* ========================= */}
      {candidates.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Saved Candidates</Text>
          <Text style={styles.emptyText}>
            Save candidates while browsing to build your shortlist.
          </Text>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => router.push("/(employer)/search-candidates")}
          >
            <Text style={styles.searchButtonText}>Search Candidates</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ========================= */}
      {/* SAVED CANDIDATES */}
      {/* ========================= */}
      {candidates.map((item: any) => {
        const candidate = item.candidate;
        return (
          <View key={item._id} style={styles.card}>
            {/* Profile Photo */}
            <Image
              source={{
                uri:
                  candidate.profilePhoto ||
                  candidate.user?.profilePhoto,
              }}
              style={styles.profileImage}
            />

            {/* Name */}
            <Text style={styles.name}>{candidate.firstName}</Text>

            {/* Verification */}
            {candidate.user?.verifiedBadge && (
              <Text style={styles.verified}>✅ Verified Candidate</Text>
            )}

            {/* Worker Types */}
            <Text style={styles.detail}>
              💼 {candidate.workerTypes?.join(", ")}
            </Text>

            {/* Location */}
            <Text style={styles.detail}>
              📍 {candidate.city}, {candidate.province}
            </Text>

            {/* Experience */}
            <Text style={styles.detail}>
              ⭐ {candidate.yearsExperience} Years Experience
            </Text>

            {/* Availability */}
            <Text style={styles.detail}>
              🕒 {candidate.availabilityStatus}
            </Text>

            {/* Salary */}
            <Text style={styles.salary}>
              R {candidate.expectedSalary}/month
            </Text>

            {/* ACTION BUTTONS */}
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() =>
                router.push({
                  pathname: "/(employer)/candidate-details",
                  params: {
                    id: candidate._id,
                  },
                })
              }
            >
              <Text style={styles.viewButtonText}>View Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactButton}
              onPress={() =>
                router.push({
                  pathname: "/(employer)/contact-candidate",
                  params: {
                    id: candidate._id,
                  },
                })
              }
            >
              <Text style={styles.contactButtonText}>Contact Candidate</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.removeButton}
              onPress={() =>
                Alert.alert(
                  "Remove Candidate",
                  "Remove this candidate from your saved list?",
                  [
                    {
                      text: "Cancel",
                      style: "cancel",
                    },
                    {
                      text: "Remove",
                      style: "destructive",
                      onPress: () => removeCandidate(candidate._id),
                    },
                  ]
                )
              }
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        );
      })}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    paddingHorizontal: 18,
    paddingTop: 20,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
  },
  heading: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 6,
  },
  subHeading: {
    fontSize: 16,
    color: "#666",
    marginBottom: 25,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 3,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
    marginBottom: 15,
    borderWidth: 3,
    borderColor: "#2E7D32",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#222",
    marginBottom: 8,
  },
  verified: {
    textAlign: "center",
    color: "#2E7D32",
    fontWeight: "700",
    marginBottom: 15,
  },
  detail: {
    fontSize: 16,
    color: "#555",
    marginBottom: 8,
    lineHeight: 24,
  },
  salary: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2E7D32",
    marginTop: 8,
    marginBottom: 18,
  },
  viewButton: {
    backgroundColor: "#2E7D32",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  viewButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
  },
  contactButton: {
    backgroundColor: "#43A047",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  contactButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
  },
  removeButton: {
    backgroundColor: "#D32F2F",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  removeButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
  },
  emptyContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 40,
    alignItems: "center",
    marginTop: 30,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#444",
    marginBottom: 12,
  },
  emptyText: {
    textAlign: "center",
    color: "#777",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 25,
  },
  searchButton: {
    backgroundColor: "#2E7D32",
    paddingVertical: 15,
    paddingHorizontal: 35,
    borderRadius: 12,
  },
  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
  },
});