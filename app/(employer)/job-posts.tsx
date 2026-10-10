
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../../src/services/api";

type Job = {
  _id: string;
  title: string;
  city: string;
  province: string;
  employmentType: string;
  workArrangement?: string;
  salaryType?: string;
  salaryAmount?: number;
  salaryMin?: number;
  salaryMax?: number;
  status: string;
  createdAt?: string;
};

export default function EmployerJobPostsScreen() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadJobs = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const response = await API.get("/jobs/employer/my-jobs");

      setJobs(
        Array.isArray(response.data?.jobs)
          ? response.data.jobs
          : []
      );
    } catch (error: any) {
      Alert.alert(
        "Unable to load job posts",
        error?.response?.data?.message ||
          "Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const formatSalary = (job: Job) => {
    if (job.salaryMin || job.salaryMax) {
      return `R${Number(job.salaryMin || 0).toLocaleString("en-ZA")} – R${Number(
        job.salaryMax || 0
      ).toLocaleString("en-ZA")}`;
    }

    if (job.salaryAmount) {
      return `R${Number(job.salaryAmount).toLocaleString("en-ZA")} / ${
        job.salaryType || "Monthly"
      }`;
    }

    return "Salary not specified";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#16804A";
      case "paused":
        return "#B7791F";
      case "draft":
        return "#666666";
      default:
        return "#D41472";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>

        <Text style={styles.heading}>My Job Posts</Text>
        <Text style={styles.subtitle}>
          Manage your advertised positions.
        </Text>

        <TouchableOpacity 
          style={styles.createButton} 
          onPress={() => router.push("/(employer)/create-job")}
        >
          <Text style={styles.createButtonText}>+ Create Job Post</Text>
        </TouchableOpacity>
        </View>


      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#D41472" />
          <Text style={styles.muted}>Loading your job posts...</Text>
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadJobs(true)}
              tintColor="#D41472"
            />
          }
          ListHeaderComponent={
            <Text style={styles.count}>
              {jobs.length} job post{jobs.length === 1 ? "" : "s"}
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                You have no job posts yet
              </Text>
              <Text style={styles.muted}>
                Create a job advertisement to get started.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.titleRow}>
                <Text style={styles.jobTitle}>{item.title}</Text>
                <Text
                  style={[
                    styles.status,
                    { color: getStatusColor(item.status) },
                  ]}
                >
                  {item.status.toUpperCase()}
                </Text>
              </View>

              <Text style={styles.location}>
                {item.city}, {item.province}
              </Text>

              <Text style={styles.detail}>
                {item.employmentType} · {item.workArrangement || "Flexible"}
              </Text>

              <Text style={styles.salary}>{formatSalary(item)}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7FA",
  },
  header: {
    padding: 20,
    backgroundColor: "#171717",
  },
  backText: {
    color: "#D41472",
    fontSize: 16,
    fontWeight: "700",
  },
  heading: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
    marginTop: 18,
  },
  subtitle: {
    color: "#DDDDDD",
    marginTop: 6,
  },
  createButton: {
    backgroundColor: "#D41472",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 18,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  list: {
    padding: 16,
    paddingBottom: 30,
  },
  count: {
    color: "#666666",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  jobTitle: {
    flex: 1,
    color: "#222222",
    fontSize: 17,
    fontWeight: "800",
  },
  status: {
    fontSize: 10,
    fontWeight: "800",
  },
  location: {
    color: "#666666",
    marginTop: 8,
  },
  detail: {
    color: "#444444",
    marginTop: 8,
  },
  salary: {
    color: "#16804A",
    fontWeight: "800",
    marginTop: 10,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  muted: {
    color: "#777777",
    marginTop: 6,
  },
  empty: {
    alignItems: "center",
    padding: 28,
  },
  emptyTitle: {
    color: "#222222",
    fontSize: 17,
    fontWeight: "800",
  },
});
