import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../../src/services/api";

export default function SearchCandidates() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // ===========================
  // SEARCH RESULTS
  // ===========================
  const [candidates, setCandidates] = useState<any[]>([]);

  // ===========================
  // BASIC FILTERS
  // ===========================
  const [workerType, setWorkerType] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");

  // ===========================
  // EMPLOYMENT
  // ===========================
  const [workPreference, setWorkPreference] = useState("");
  const [availabilityStatus, setAvailabilityStatus] = useState("");

  // ===========================
  // EXPERIENCE
  // ===========================
  const [minExperience, setMinExperience] = useState("");
  const [maxExperience, setMaxExperience] = useState("");

  // ===========================
  // PERSONAL
  // ===========================
  const [gender, setGender] = useState("");
  const [nationality, setNationality] = useState("");
  const [language, setLanguage] = useState("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");

  // ===========================
  // OTHER
  // ===========================
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [keyword, setKeyword] = useState("");

  // ===========================
  // SEARCH CANDIDATES
  // ===========================
  const searchCandidates = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      API.defaults.headers.common.Authorization = `Bearer ${token}`;

      const params = new URLSearchParams();
      if (workerType) params.append("workerType", workerType);
      if (province) params.append("province", province);
      if (city) params.append("city", city);
      if (workPreference)
        params.append("workPreference", workPreference);
      if (availabilityStatus)
        params.append("availabilityStatus", availabilityStatus);
      if (minExperience)
        params.append("minExperience", minExperience);
      if (maxExperience)
        params.append("maxExperience", maxExperience);
      if (gender) params.append("gender", gender);
      if (nationality) params.append("nationality", nationality);
      if (language) params.append("language", language);
      if (minAge) params.append("minAge", minAge);
      if (maxAge) params.append("maxAge", maxAge);
      if (verifiedOnly) params.append("verified", "true");
      if (keyword) params.append("keyword", keyword);

      const response = await API.get(
        `/profile/search?${params.toString()}`
      );
      setCandidates(response.data);
    } catch (err: any) {
      console.log(err?.response?.data);
      Alert.alert(
        "Search Failed",
        err?.response?.data?.message || "Unable to search candidates."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.heading}>Find Your Perfect Candidate</Text>
      <Text style={styles.subHeading}>
        Search verified candidates using multiple filters.
      </Text>

      {/* ========================= */}
      {/* KEYWORD */}
      {/* ========================= */}
      <Text style={styles.section}>Search</Text>
      <TextInput
        style={styles.input}
        placeholder="Name, skill or keyword"
        value={keyword}
        onChangeText={setKeyword}
      />

      {/* ========================= */}
      {/* WORKER TYPE */}
      {/* ========================= */}
      <Text style={styles.section}>Worker Type</Text>
      <TextInput
        style={styles.input}
        placeholder="Caregiver, Nanny, Helper..."
        value={workerType}
        onChangeText={setWorkerType}
      />

      {/* ========================= */}
      {/* LOCATION */}
      {/* ========================= */}
      <Text style={styles.section}>Location</Text>
      <TextInput
        style={styles.input}
        placeholder="Province"
        value={province}
        onChangeText={setProvince}
      />
      <TextInput
        style={styles.input}
        placeholder="City / Town"
        value={city}
        onChangeText={setCity}
      />

      {/* ========================= */}
      {/* EMPLOYMENT */}
      {/* ========================= */}
      <Text style={styles.section}>Employment</Text>
      <TextInput
        style={styles.input}
        placeholder="Full-time / Part-time / Live-in / Live-out"
        value={workPreference}
        onChangeText={setWorkPreference}
      />
      <TextInput
        style={styles.input}
        placeholder="Day Shift / Night Shift / Available Now"
        value={availabilityStatus}
        onChangeText={setAvailabilityStatus}
      />

      {/* ========================= */}
      {/* EXPERIENCE */}
      {/* ========================= */}
      <Text style={styles.section}>Experience</Text>
      <TextInput
        style={styles.input}
        placeholder="Minimum Years"
        keyboardType="numeric"
        value={minExperience}
        onChangeText={setMinExperience}
      />
      <TextInput
        style={styles.input}
        placeholder="Maximum Years"
        keyboardType="numeric"
        value={maxExperience}
        onChangeText={setMaxExperience}
      />

      {/* ========================= */}
      {/* PERSONAL */}
      {/* ========================= */}
      <Text style={styles.section}>Personal Details</Text>
      <TextInput
        style={styles.input}
        placeholder="Gender"
        value={gender}
        onChangeText={setGender}
      />
      <TextInput
        style={styles.input}
        placeholder="Nationality"
        value={nationality}
        onChangeText={setNationality}
      />
      <TextInput
        style={styles.input}
        placeholder="Language"
        value={language}
        onChangeText={setLanguage}
      />

      {/* ========================= */}
      {/* AGE */}
      {/* ========================= */}
      <Text style={styles.section}>Age</Text>
      <TextInput
        style={styles.input}
        placeholder="Minimum Age"
        keyboardType="numeric"
        value={minAge}
        onChangeText={setMinAge}
      />
      <TextInput
        style={styles.input}
        placeholder="Maximum Age"
        keyboardType="numeric"
        value={maxAge}
        onChangeText={setMaxAge}
      />

      {/* ========================= */}
      {/* VERIFIED */}
      {/* ========================= */}
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Verified Candidates Only</Text>
        <Switch
          value={verifiedOnly}
          onValueChange={setVerifiedOnly}
          trackColor={{
            false: "#CCC",
            true: "#4CAF50",
          }}
        />
      </View>

      {/* ========================= */}
      {/* SEARCH BUTTON */}
      {/* ========================= */}
      <TouchableOpacity
        style={styles.searchButton}
        onPress={searchCandidates}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.searchButtonText}>🔍 Search Candidates</Text>
        )}
      </TouchableOpacity>

      {/* ========================= */}
      {/* SEARCH RESULTS */}
      {/* ========================= */}
      {candidates.length > 0 && (
        <>
          <Text style={styles.section}>
            Candidates Found ({candidates.length})
          </Text>
          {candidates.map((candidate: any) => (
            <View key={candidate._id} style={styles.candidateCard}>
              {/* Photo */}
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {candidate.firstName ? candidate.firstName.charAt(0) : "?"}
                </Text>
              </View>

              {/* Candidate Name */}
              <Text style={styles.candidateName}>{candidate.firstName}</Text>

              {/* Verification */}
              {candidate.verifiedBadge && (
                <Text style={styles.verified}>✅ Verified Candidate</Text>
              )}

              {/* Worker Type */}
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

              {/* Employment */}
              <Text style={styles.detail}>
                🏠 {candidate.workPreference}
              </Text>

              {/* Availability */}
              <Text style={styles.detail}>
                🕒 {candidate.availabilityStatus}
              </Text>

              {/* Languages */}
              <Text style={styles.detail}>
                🌍 {candidate.languages?.join(", ")}
              </Text>

              {/* Salary */}
              <Text style={styles.detail}>
                💰 R{candidate.expectedSalary}/month
              </Text>

              {/* Buttons */}
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
                <Text style={styles.profileButtonText}>View Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => {
                  // We'll implement Saved Candidates later
                }}
              >
                <Text style={styles.saveButtonText}>❤ Save Candidate</Text>
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}

      {candidates.length === 0 && !loading && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Candidates Yet</Text>
          <Text style={styles.emptyText}>
            Adjust your filters and search again.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    padding: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 6,
  },
  subHeading: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
  },
  section: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
    marginTop: 12,
    marginBottom: 15,
  },
  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    marginBottom: 15,
    fontSize: 16,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    marginBottom: 20,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  searchButton: {
    backgroundColor: "#2E7D32",
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 30,
    elevation: 3,
  },
  searchButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 18,
  },
  candidateCard: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 3,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E8F5E9",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignSelf: "center",
    marginBottom: 15,
  },
  candidateName: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    color: "#222",
    marginBottom: 8,
  },
  verified: {
    textAlign: "center",
    color: "#2E7D32",
    fontWeight: "700",
    marginBottom: 14,
  },
  detail: {
    fontSize: 15,
    color: "#555",
    marginBottom: 8,
  },
  profileButton: {
    backgroundColor: "#2E7D32",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 15,
  },
  profileButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#43A047",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  saveButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  emptyContainer: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 35,
    alignItems: "center",
    marginTop: 25,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#444",
    marginBottom: 10,
  },
  emptyText: {
    color: "#777",
    textAlign: "center",
    fontSize: 15,
  },
});