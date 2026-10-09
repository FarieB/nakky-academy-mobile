import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import API from "../../src/services/api";

export default function EmployersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ recommended?: string }>();
  const recommendedOnly = params.recommended === "true";

  const [employers, setEmployers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [workType, setWorkType] = useState("");
  const [employmentType, setEmploymentType] = useState("");

  const loadEmployers = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        router.replace("/login");
        return;
      }

      API.defaults.headers.common.Authorization = `Bearer ${token}`;

      const query: Record<string, string> = {
        page: "1",
        limit: "100",
      };

      if (workType.trim()) query.workType = workType.trim();
      if (province.trim()) query.province = province.trim();
      if (city.trim()) query.city = city.trim();
      if (employmentType.trim()) query.employmentType = employmentType.trim();

      const response = await API.get("/recommendations/employers", { params: query });
      const results = Array.isArray(response.data?.employers)
        ? response.data.employers
        : [];

      const filtered = keyword.trim()
        ? results.filter((item: any) => {
            const employer = item.employer || {};
            const haystack = [
              employer.householdName,
              employer.employerType,
              employer.city,
              employer.suburb,
              ...(employer.lookingFor || []),
              ...(employer.employmentTypes || []),
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            return haystack.includes(keyword.trim().toLowerCase());
          })
        : results;

      setEmployers(filtered);
    } catch (error: any) {
      console.error("LOAD EMPLOYERS ERROR:", error?.response?.data || error);
      Alert.alert(
        "Unable to Load Employers",
        error?.response?.data?.message || "Employers could not be loaded."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [city, employmentType, keyword, province, router, workType]);

  useEffect(() => {
    loadEmployers();
  }, [loadEmployers]);

  const refresh = () => {
    setRefreshing(true);
    loadEmployers();
  };

  const openEmployer = (item: any) => {
    const employer = item?.employer;
    if (!employer) return;

    router.push({
      pathname: "/(candidate)/employer-details",
      params: {
        employerData: JSON.stringify(employer),
        matchPercentage: String(item.matchPercentage ?? ""),
        matchReasons: JSON.stringify(item.matchReasons || []),
      },
    });
  };

  const clearFilters = () => {
    setKeyword("");
    setProvince("");
    setCity("");
    setWorkType("");
    setEmploymentType("");
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#D90072" />
        <Text style={styles.loadingText}>Finding employers...</Text>
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
      <Text style={styles.title}>
        {recommendedOnly ? "Recommended Employers" : "Find Employers"}
      </Text>
      <Text style={styles.subtitle}>
        Browse employers who are actively looking for candidates.
      </Text>

      <View style={styles.filterCard}>
        <Text style={styles.filterTitle}>Search & Filters</Text>

        <TextInput
          value={keyword}
          onChangeText={setKeyword}
          placeholder="Search household, worker type..."
          placeholderTextColor="#999"
          style={styles.input}
        />
        <TextInput
          value={province}
          onChangeText={setProvince}
          placeholder="Province"
          placeholderTextColor="#999"
          style={styles.input}
        />
        <TextInput
          value={city}
          onChangeText={setCity}
          placeholder="City"
          placeholderTextColor="#999"
          style={styles.input}
        />
        <TextInput
          value={workType}
          onChangeText={setWorkType}
          placeholder="Worker type e.g. Caregiver"
          placeholderTextColor="#999"
          style={styles.input}
        />
        <TextInput
          value={employmentType}
          onChangeText={setEmploymentType}
          placeholder="Employment type e.g. Full Time"
          placeholderTextColor="#999"
          style={styles.input}
        />

        <View style={styles.filterButtons}>
          <TouchableOpacity style={styles.searchButton} onPress={loadEmployers}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.resultCount}>{employers.length} employer(s) found</Text>

      {employers.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No Employers Found</Text>
          <Text style={styles.emptyText}>
            Try changing your search or filters.
          </Text>
        </View>
      ) : (
        employers.map((item: any, index: number) => {
          const employer = item.employer || {};
          const user = employer.user || {};
          const displayName =
            employer.householdName ||
            employer.employerType ||
            "Private Household";

          return (
            <TouchableOpacity
              key={String(employer._id || index)}
              style={styles.card}
              onPress={() => openEmployer(item)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {String(displayName).charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.headerText}>
                  <Text style={styles.cardTitle}>{displayName}</Text>
                  <Text style={styles.cardSubtitle}>
                    {employer.employerType || "Employer"}
                  </Text>
                </View>

                {item.matchPercentage !== undefined ? (
                  <View style={styles.matchBadge}>
                    <Text style={styles.matchText}>
                      {item.matchPercentage}%
                    </Text>
                    <Text style={styles.matchLabel}>Match</Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.detail}>
                📍 {employer.suburb || employer.city || "Location not specified"}
                {employer.province ? `, ${employer.province}` : ""}
              </Text>

              <Text style={styles.detail}>
                👤 Looking for: {(employer.lookingFor || []).join(", ") || "Not specified"}
              </Text>

              <Text style={styles.detail}>
                🕒 Employment: {(employer.employmentTypes || []).join(", ") || "Not specified"}
              </Text>

              {employer.salaryOffered ? (
                <Text style={styles.salary}>
                  💰 Offered salary: R {employer.salaryOffered} / month
                </Text>
              ) : null}

              {user.verifiedBadge ? (
                <Text style={styles.verified}>✓ Verified Account</Text>
              ) : null}

              <Text style={styles.viewText}>View Employer →</Text>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F7F7" },
  content: { padding: 18, paddingBottom: 40 },
  loader: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F7F7F7" },
  loadingText: { marginTop: 10, color: "#666" },
  title: { fontSize: 28, fontWeight: "800", color: "#111" },
  subtitle: { marginTop: 6, color: "#666", lineHeight: 21 },
  filterCard: { backgroundColor: "#FFF", padding: 16, borderRadius: 14, marginTop: 18, borderWidth: 1, borderColor: "#EEE" },
  filterTitle: { fontSize: 17, fontWeight: "800", marginBottom: 10, color: "#111" },
  input: { height: 46, borderWidth: 1, borderColor: "#DDD", borderRadius: 10, paddingHorizontal: 12, color: "#111", marginBottom: 10, backgroundColor: "#FFF" },
  filterButtons: { flexDirection: "row", gap: 10, marginTop: 2 },
  searchButton: { flex: 1, backgroundColor: "#D90072", paddingVertical: 13, borderRadius: 10, alignItems: "center" },
  searchButtonText: { color: "#FFF", fontWeight: "800" },
  clearButton: { flex: 1, backgroundColor: "#EEE", paddingVertical: 13, borderRadius: 10, alignItems: "center" },
  clearButtonText: { color: "#333", fontWeight: "700" },
  resultCount: { marginTop: 18, marginBottom: 10, color: "#666", fontWeight: "600" },
  card: { backgroundColor: "#FFF", borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "#EEE" },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#D90072", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFF", fontSize: 21, fontWeight: "800" },
  headerText: { flex: 1, marginLeft: 12 },
  cardTitle: { fontSize: 17, fontWeight: "800", color: "#111" },
  cardSubtitle: { marginTop: 3, color: "#777" },
  matchBadge: { minWidth: 58, padding: 7, borderRadius: 10, backgroundColor: "#FFF0F7", alignItems: "center" },
  matchText: { color: "#D90072", fontWeight: "900" },
  matchLabel: { color: "#D90072", fontSize: 10 },
  detail: { color: "#555", lineHeight: 22, marginTop: 4 },
  salary: { color: "#111", fontWeight: "700", marginTop: 7 },
  verified: { color: "#2E7D32", fontWeight: "700", marginTop: 8 },
  viewText: { color: "#D90072", fontWeight: "800", marginTop: 13 },
  emptyCard: { backgroundColor: "#FFF", padding: 25, borderRadius: 14, alignItems: "center" },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#111" },
  emptyText: { marginTop: 6, color: "#777", textAlign: "center" },
});