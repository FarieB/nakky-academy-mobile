import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import API from "../../src/services/api";

export default function RecommendedCandidates() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<any[]>([]);

  // ==========================
  // FETCH RECOMMENDED CANDIDATES
  // ==========================
  const fetchMatches = async () => {
    try {
      setLoading(true);

      const res = await API.get("/recommendations/candidates");

      console.log(
        "RECOMMENDED CANDIDATES:",
        JSON.stringify(res.data, null, 2)
      );

      setCandidates(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      console.log(
        "MATCH ERROR:",
        err?.response?.data || err.message
      );

      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  // ==========================
  // LOADING
  // ==========================
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E91E63" />
      </View>
    );
  }

  // ==========================
  // UI
  // ==========================
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>
        Recommended Candidates
      </Text>

      <Text style={styles.subtitle}>
        Candidates recommended based on your employer profile.
      </Text>

      {candidates.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>
            No Recommended Candidates
          </Text>

          <Text style={styles.emptyText}>
            Complete your employer profile and search preferences
            to receive candidate recommendations.
          </Text>
        </View>
      ) : (
        candidates.map((candidate: any) => (
          <View
            key={candidate._id}
            style={styles.card}
          >
            {/* NAME */}
            <Text style={styles.name}>
              {candidate.firstName || "Candidate"}
              {candidate.surname
                ? ` ${candidate.surname}`
                : ""}
            </Text>

            {/* VERIFIED */}
            {(
              candidate.profileVerified ||
              candidate.user?.verifiedBadge
            ) && (
              <Text style={styles.verified}>
                ✔ Verified Candidate
              </Text>
            )}

            {/* WORKER TYPES */}
            <Text style={styles.detail}>
              💼{" "}
              {candidate.workerTypes?.length
                ? candidate.workerTypes.join(", ")
                : "Not specified"}
            </Text>

            {/* LOCATION */}
            <Text style={styles.detail}>
              📍{" "}
              {[
                candidate.suburb,
                candidate.city,
                candidate.province,
              ]
                .filter(Boolean)
                .join(", ") || "Location not specified"}
            </Text>

            {/* EXPERIENCE */}
            <Text style={styles.detail}>
              ⭐ Experience:{" "}
              {candidate.yearsExperience || 0} years
            </Text>

            {/* RATING */}
            <Text style={styles.detail}>
              ⭐ Rating:{" "}
              {candidate.averageRating || 0} / 5
              {"  "}
              ({candidate.totalReviews || 0} reviews)
            </Text>

            {/* LANGUAGES */}
            <Text style={styles.detail}>
              🌍{" "}
              {candidate.languages?.length
                ? candidate.languages.join(", ")
                : "Languages not specified"}
            </Text>

            {/* SALARY */}
            <Text style={styles.detail}>
              💰 Expected Salary:{" "}
              {candidate.expectedSalary
                ? `R${candidate.expectedSalary}`
                : "Not specified"}
            </Text>

            {/* AVAILABILITY */}
            <Text style={styles.detail}>
              🟢{" "}
              {candidate.availabilityStatus ||
                "Availability not specified"}
            </Text>

            {/* VIEW PROFILE */}
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() =>
                router.push({
                  pathname: "/(employer)/candidate-details",
                  params: {
                    id: candidate._id,
                  },
                })
              }
            >
              <Text style={styles.profileButtonText}>
                VIEW PROFILE
              </Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F8FA",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    color: "#666",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 8,
  },

  verified: {
    color: "#2E7D32",
    fontWeight: "bold",
    marginBottom: 10,
  },

  detail: {
    fontSize: 15,
    color: "#555",
    marginBottom: 7,
    lineHeight: 22,
  },

  profileButton: {
    backgroundColor: "#2E7D32",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
  },

  profileButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },

  emptyCard: {
    backgroundColor: "#FFF",
    padding: 30,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 20,
  },

  emptyTitle: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#444",
    marginBottom: 10,
  },

  emptyText: {
    fontSize: 15,
    color: "#777",
    textAlign: "center",
    lineHeight: 22,
  },
});