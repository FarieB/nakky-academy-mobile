import { useState } from "react";
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

export default function SearchCandidates() {
  const [loading, setLoading] = useState(false);
  const [workers, setWorkers] = useState<any[]>([]);

  const [workerType, setWorkerType] = useState("");
  const [province, setProvince] = useState("");
  const [minRating, setMinRating] = useState("");

  const search = async () => {
    try {
      setLoading(true);

      const res = await API.get("/search/workers", {
        params: {
          workerType,
          province,
          minRating,
        },
      });

      setWorkers(res.data);
    } catch (err: any) {
      console.log("SEARCH ERROR:", err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Search Candidates</Text>

      {/* FILTERS */}
      <TextInput
        placeholder="Worker Type (caregiver, nanny...)"
        value={workerType}
        onChangeText={setWorkerType}
        style={styles.input}
      />

      <TextInput
        placeholder="Province"
        value={province}
        onChangeText={setProvince}
        style={styles.input}
      />

      <TextInput
        placeholder="Minimum Rating"
        value={minRating}
        onChangeText={setMinRating}
        keyboardType="numeric"
        style={styles.input}
      />

      <Button title="Search" onPress={search} />

      {/* RESULTS */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        workers.map((worker) => (
          <View key={worker._id} style={styles.card}>
            <Text style={styles.bold}>{worker.name}</Text>

            <Text>Type: {worker.workerType}</Text>
            <Text>Province: {worker.province}</Text>
            <Text>Experience: {worker.yearsExperience} yrs</Text>
            <Text>Rating: ⭐ {worker.averageRating || 0}</Text>

            {worker.verifiedBadge && (
              <Text style={{ color: "green" }}>✔ Verified</Text>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  card: {
    padding: 15,
    backgroundColor: "#f2f2f2",
    marginTop: 10,
    borderRadius: 8,
  },
  bold: { fontWeight: "bold" },
});