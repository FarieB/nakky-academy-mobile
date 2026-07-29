import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import API from "../../src/services/api";

export default function RecommendedCandidates() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<any[]>([]);

  // ==========================
  // FETCH MATCHES
  // ==========================
  const fetchMatches = async () => {
    try {
      const res = await API.get("/recommendations/candidates");

      // FIXED
      setCandidates(res.data);

    } catch (err: any) {
      console.log(
        "MATCH ERROR:",
        err?.response?.data || err.message
      );
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
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // ==========================
  // UI
  // ==========================
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        Recommended Candidates
      </Text>

      {candidates.length === 0 ? (
        <Text>No matches found</Text>
      ) : (
        candidates.map((item: any, index: number) => (
          <View key={index} style={styles.card}>

            <Text style={styles.bold}>
              {item.candidate?.name}
            </Text>

            <Text>
              Type: {item.candidate?.workerType}
            </Text>

            <Text>
              Experience:{" "}
              {item.candidate?.yearsExperience || 0} years
            </Text>

            <Text>
              Rating: ⭐{" "}
              {item.candidate?.averageRating || 0}
            </Text>

            <Text>
              Match Score: {item.score}
            </Text>

            {/* ===================== */}
            {/* ACTIONS */}
            {/* ===================== */}
            <View style={{ marginTop: 10 }}>

              <Button
                title="View Profile"
                onPress={() =>
                  router.push({
                    pathname:
                      "/employer/candidate-profile" as any,
                    params: {
                      id: item.candidate?._id,
                    },
                  })
                }
              />

            </View>

          </View>
        ))
      )}
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
    marginBottom: 10,
    borderRadius: 8,
  },

  bold: {
    fontWeight: "bold",
  },
});
