import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../../src/services/api";

export default function SearchCandidates() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<any[]>([]);

  // ==========================================
  // FILTERS
  // ==========================================
  const [workerType, setWorkerType] = useState("");
  const [province, setProvince] = useState("");
  const [employment, setEmployment] = useState("");
  const [gender, setGender] = useState("");
  const [language, setLanguage] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // ==========================================
  // OPTIONS
  // ==========================================
  const workerTypes = [
    "Caregiver",
    "Nanny",
    "Babysitter",
    "Domestic Helper",
    "Gardener",
    "Housekeeper",
    "Cook",
    "Driver",
    "Au Pair",
    "Disability Care",
    "Elderly Care",
  ];

  const provinces = [
    "Eastern Cape",
    "Free State",
    "Gauteng",
    "KwaZulu-Natal",
    "Limpopo",
    "Mpumalanga",
    "Northern Cape",
    "North West",
    "Western Cape",
  ];

  const employmentOptions = [
    "Full Time",
    "Part Time",
    "Live In",
    "Live Out",
    "Day Shift",
    "Night Shift",
    "Temporary",
    "Weekends",
  ];

  const languages = [
    "English",
    "Zulu",
    "Xhosa",
    "Xitsonga",
    "Venda",
    "Tswana",
    "Sotho",
    "Sepedi",
    "Swati",
    "Ndebele",
    "Shona",
  ];

  // ==========================================
  // SEARCH
  // ==========================================
  const searchCandidates = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      API.defaults.headers.common.Authorization = `Bearer ${token}`;

      const params = new URLSearchParams();
      if (workerType) params.append("workerType", workerType);
      if (province) params.append("province", province);
      if (employment) params.append("employment", employment);
      if (gender) params.append("gender", gender);
      if (language) params.append("language", language);
      if (verifiedOnly) {
        params.append("verified", "true");
      }

      const res = await API.get(`/profiles/search?${params.toString()}`);
      setCandidates(res.data);
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

  // ==========================================================
  // UI
  // ==========================================================
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.heading}>Search Candidates</Text>
      <Text style={styles.subHeading}>
        Find the perfect candidate for your family or business.
      </Text>

      {/* ======================================= */}
      {/* WORKER TYPE */}
      {/* ======================================= */}
      <Text style={styles.label}>Worker Type</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={workerType}
          onValueChange={(itemValue) => setWorkerType(itemValue)}
        >
          <Picker.Item label="Any Worker Type" value="" />
          {workerTypes.map((item) => (
            <Picker.Item key={item} label={item} value={item} />
          ))}
        </Picker>
      </View>

      {/* ======================================= */}
      {/* PROVINCE */}
      {/* ======================================= */}
      <Text style={styles.label}>Province</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={province}
          onValueChange={(itemValue) => setProvince(itemValue)}
        >
          <Picker.Item label="Any Province" value="" />
          {provinces.map((item) => (
            <Picker.Item key={item} label={item} value={item} />
          ))}
        </Picker>
      </View>

      {/* ======================================= */}
      {/* EMPLOYMENT */}
      {/* ======================================= */}
      <Text style={styles.label}>Employment Preference</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={employment}
          onValueChange={(itemValue) => setEmployment(itemValue)}
        >
          <Picker.Item label="Any Employment" value="" />
          {employmentOptions.map((item) => (
            <Picker.Item key={item} label={item} value={item} />
          ))}
        </Picker>
      </View>

      {/* ======================================= */}
      {/* GENDER */}
      {/* ======================================= */}
      <Text style={styles.label}>Gender</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={gender}
          onValueChange={(itemValue) => setGender(itemValue)}
        >
          <Picker.Item label="Any Gender" value="" />
          <Picker.Item label="Male" value="Male" />
          <Picker.Item label="Female" value="Female" />
        </Picker>
      </View>

      {/* ======================================= */}
      {/* LANGUAGE */}
      {/* ======================================= */}
      <Text style={styles.label}>Language</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={language}
          onValueChange={(itemValue) => setLanguage(itemValue)}
        >
          <Picker.Item label="Any Language" value="" />
          {languages.map((item) => (
            <Picker.Item key={item} label={item} value={item} />
          ))}
        </Picker>
      </View>

      {/* ======================================= */}
      {/* VERIFIED */}
      {/* ======================================= */}
      <View style={styles.switchRow}>
        <Text style={styles.switchText}>Verified Candidates Only</Text>
        <Switch value={verifiedOnly} onValueChange={setVerifiedOnly} />
      </View>

      {/* ======================================= */}
      {/* SEARCH BUTTON */}
      {/* ======================================= */}
      <TouchableOpacity
        style={styles.searchButton}
        onPress={searchCandidates}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.searchButtonText}>Search Candidates</Text>
        )}
      </TouchableOpacity>

      {/* ======================================= */}
      {/* RESULTS */}
      {/* ======================================= */}
      {candidates.map((candidate: any) => (
        <View key={candidate._id} style={styles.card}>
          <Text style={styles.name}>
             {candidate.firstName || "Candidate"}
          </Text>
          <Text style={styles.detail}>
            💼 {candidate.workerTypes?.join(", ")}
          </Text>
          <Text style={styles.detail}>
            📍 {candidate.city}, {candidate.province}
          </Text>
          <Text style={styles.detail}>
            ⭐ {candidate.yearsExperience} Years Experience
          </Text>
          <Text style={styles.detail}>
            🌍 {candidate.languages?.join(", ")}
          </Text>
          <Text style={styles.detail}>
            💰 Expected Salary: R{candidate.expectedSalary}
          </Text>
          <Text style={styles.detail}>
            🟢 {candidate.availabilityStatus}
          </Text>
          {candidate.profileVerified && (
            <Text style={styles.verified}>✔ Verified Candidate</Text>
          )}
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
        </View>
      ))}

      {!loading && candidates.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No Candidates Found</Text>
          <Text style={styles.emptyText}>
            Try changing your search filters.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F8FA",
    padding: 18,
  },
  heading: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#2E7D32",
    marginTop: 10,
  },
  subHeading: {
    fontSize: 16,
    color: "#666",
    marginBottom: 25,
    marginTop: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
    marginTop: 12,
  },
  pickerContainer: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDD",
    marginBottom: 15,
    overflow: "hidden",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 20,
  },
  switchText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  searchButton: {
    backgroundColor: "#2E7D32",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 25,
    elevation: 3,
  },
  searchButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 17,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 12,
  },
  detail: {
    fontSize: 15,
    color: "#555",
    marginBottom: 7,
    lineHeight: 22,
  },
  verified: {
    color: "#2E7D32",
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 12,
    fontSize: 15,
  },
  profileButton: {
    backgroundColor: "#2E7D32",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  profileButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  emptyCard: {
    backgroundColor: "#FFF",
    padding: 35,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#444",
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 15,
    color: "#777",
    textAlign: "center",
  },
});