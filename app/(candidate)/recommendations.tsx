import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../../src/services/api";

type EmployerDisplay = {
  contactPerson?: string;
  householdName?: string;
  employerType?: string;
  province?: string;
  city?: string;
  suburb?: string;
};

type RecommendedJob = {
  _id: string;
  title: string;
  jobTypes?: string[];
  description: string;
  province: string;
  city: string;
  suburb?: string;
  employmentType: string;
  workArrangement?: string;
  workingDays?: string[];
  startTime?: string;
  endTime?: string;
  salaryType?: string;
  salaryAmount?: number;
  salaryMin?: number;
  salaryMax?: number;
  salaryNegotiable?: boolean;
  requiredLanguages?: string[];
  requiredExperience?: number;
  matchScore?: number;
  matchReasons?: string[];
  employerProfile?: EmployerDisplay | string;
};

const money = (value?: number) =>
  `R${Number(value || 0).toLocaleString("en-ZA")}`;

function getSalaryLabel(job: RecommendedJob) {
  if (job.salaryNegotiable || job.salaryType === "Negotiable") {
    return "Salary negotiable";
  }
  if (job.salaryMin && job.salaryMax) {
    return `${money(job.salaryMin)} – ${money(job.salaryMax)}${job.salaryType ? ` / ${job.salaryType.toLowerCase()}` : ""}`;
  }
  if (job.salaryAmount) {
    return `${money(job.salaryAmount)}${job.salaryType ? ` / ${job.salaryType.toLowerCase()}` : ""}`;
  }
  if (job.salaryMin) return `From ${money(job.salaryMin)}`;
  if (job.salaryMax) return `Up to ${money(job.salaryMax)}`;
  return "Salary not specified";
}

function getEmployerLabel(job: RecommendedJob) {
  if (!job.employerProfile || typeof job.employerProfile === "string") {
    return "Nakky Academy employer";
  }
  return (
    job.employerProfile.householdName?.trim() ||
    job.employerProfile.contactPerson?.trim() ||
    job.employerProfile.employerType ||
    "Nakky Academy employer"
  );
}

export default function CandidateRecommendationsScreen() {
  const router = useRouter();
  const [jobs, setJobs] = useState<RecommendedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRecommendations = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const response = await API.get("/jobs/matches/recommended");
      const data = response.data;
      const matches = Array.isArray(data?.matches)
        ? data.matches
        : Array.isArray(data?.jobs)
          ? data.jobs
          : [];
      setJobs(matches);
    } catch (error: any) {
      Alert.alert(
        "Unable to load recommendations",
        error?.response?.data?.message ||
          "Please check your connection and try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadRecommendations(true)}
            tintColor="#D41472"
          />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.eyebrow}>NAKKY MARKETPLACE</Text>
          <Text style={styles.title}>Recommended Jobs</Text>
          <Text style={styles.subtitle}>
            Jobs matched to your work types, location, preferences and experience.
          </Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#D41472" />
            <Text style={styles.muted}>Finding jobs that match your profile...</Text>
          </View>
        ) : jobs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No matches yet</Text>
            <Text style={styles.muted}>
              There are no active job posts matching your profile right now. Complete your candidate profile and check again later.
            </Text>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push("/(candidate)/jobs")}
            >
              <Text style={styles.secondaryButtonText}>Browse all jobs</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.count}>
              {jobs.length} recommended job{jobs.length === 1 ? "" : "s"}
            </Text>
            {jobs.map((job) => (
              <View key={job._id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.cardTitleWrap}>
                    <Text style={styles.jobTitle}>{job.title}</Text>
                    <Text style={styles.employer}>{getEmployerLabel(job)}</Text>
                    <Text style={styles.location}>
                      {[job.suburb, job.city, job.province].filter(Boolean).join(", ")}
                    </Text>
                  </View>
                  <View style={styles.scoreBadge}>
                    <Text style={styles.score}>{Math.max(0, Math.min(100, job.matchScore || 0))}%</Text>
                    <Text style={styles.scoreCaption}>match</Text>
                  </View>
                </View>

                <View style={styles.tagRow}>
                  {(job.jobTypes || []).map((type) => (
                    <Text key={type} style={styles.tag}>{type}</Text>
                  ))}
                  <Text style={styles.tag}>{job.employmentType}</Text>
                  {job.workArrangement ? <Text style={styles.tag}>{job.workArrangement}</Text> : null}
                </View>

                <Text style={styles.salary}>{getSalaryLabel(job)}</Text>
                <Text style={styles.description} numberOfLines={4}>{job.description}</Text>

                {job.matchReasons && job.matchReasons.length > 0 ? (
                  <View style={styles.reasons}>
                    <Text style={styles.reasonsTitle}>Why this matches</Text>
                    {job.matchReasons.slice(0, 3).map((reason, index) => (
                      <Text key={`${job._id}-reason-${index}`} style={styles.reason}>• {reason}</Text>
                    ))}
                  </View>
                ) : null}
              </View>
            ))}
          </>
        )}

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/(candidate)/jobs")}
        >
          <Text style={styles.primaryButtonText}>Browse All Jobs</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F7FA" },
  content: { paddingBottom: 32 },
  header: { backgroundColor: "#171717", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
  backButton: { marginBottom: 18 },
  backText: { color: "#D41472", fontSize: 16, fontWeight: "700" },
  eyebrow: { color: "#FFD84D", fontSize: 11, fontWeight: "900", letterSpacing: 1.5 },
  title: { color: "#FFFFFF", fontSize: 27, fontWeight: "900", marginTop: 7 },
  subtitle: { color: "#E5E5E5", fontSize: 14, lineHeight: 21, marginTop: 8 },
  count: { color: "#666666", fontSize: 13, marginHorizontal: 16, marginTop: 18, marginBottom: 10 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 13, borderWidth: 1, borderColor: "#ECECF0" },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  cardTitleWrap: { flex: 1 },
  jobTitle: { color: "#202020", fontSize: 18, fontWeight: "900" },
  employer: { color: "#444444", fontSize: 13, fontWeight: "700", marginTop: 5 },
  location: { color: "#777777", fontSize: 12, marginTop: 4 },
  scoreBadge: { backgroundColor: "#FCE8F2", borderRadius: 12, minWidth: 58, paddingVertical: 8, paddingHorizontal: 7, alignItems: "center" },
  score: { color: "#A20D56", fontSize: 16, fontWeight: "900" },
  scoreCaption: { color: "#A20D56", fontSize: 10, fontWeight: "700" },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  tag: { backgroundColor: "#F4F4F6", color: "#444444", paddingHorizontal: 8, paddingVertical: 6, borderRadius: 7, overflow: "hidden", fontSize: 11, fontWeight: "700" },
  salary: { color: "#16804A", fontWeight: "900", fontSize: 15, marginTop: 12 },
  description: { color: "#555555", fontSize: 13, lineHeight: 20, marginTop: 8 },
  reasons: { backgroundColor: "#FAFAFC", borderRadius: 10, padding: 11, marginTop: 12 },
  reasonsTitle: { color: "#333333", fontSize: 12, fontWeight: "900", marginBottom: 5 },
  reason: { color: "#555555", fontSize: 12, lineHeight: 18, marginTop: 3 },
  center: { padding: 36, alignItems: "center", gap: 12 },
  muted: { color: "#777777", fontSize: 13, lineHeight: 20, textAlign: "center" },
  emptyCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 24, margin: 16, alignItems: "center", gap: 10 },
  emptyTitle: { color: "#222222", fontSize: 19, fontWeight: "900" },
  primaryButton: { backgroundColor: "#D41472", borderRadius: 12, padding: 15, alignItems: "center", marginHorizontal: 16, marginTop: 8 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  secondaryButton: { borderWidth: 1, borderColor: "#D41472", borderRadius: 10, paddingVertical: 11, paddingHorizontal: 15, marginTop: 8 },
  secondaryButtonText: { color: "#D41472", fontWeight: "800" },
});