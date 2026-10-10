import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../../src/services/api";

const EMPLOYER_TYPES = [
  "Private Household",
  "Business",
  "Agency",
  "Organisation",
];

const PROVINCES = [
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

type EmployerProfileData = {
  contactPerson?: string;
  employerType?: string;
  householdName?: string;
  contactPhone?: string;
  contactEmail?: string;
  province?: string;
  city?: string;
  suburb?: string;
};

export default function EmployerProfileScreen() {
  const router = useRouter();
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileExists, setProfileExists] = useState(false);

  const [contactPerson, setContactPerson] = useState("");
  const [employerType, setEmployerType] = useState("Private Household");
  const [householdName, setHouseholdName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [suburb, setSuburb] = useState("");

  useEffect(() => {
    loadEmployerProfile();
  }, []);

  const ensureAuth = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      Alert.alert("Session expired", "Please log in again.");
      router.replace("/login");
      return false;
    }
    API.defaults.headers.common.Authorization = `Bearer ${token}`;
    return true;
  };

  const loadEmployerProfile = async () => {
    try {
      if (!(await ensureAuth())) return;
      const response = await API.get("/profiles/employer");
      const profile: EmployerProfileData = response.data?.profile || response.data;
      if (!profile || typeof profile !== "object") {
        setProfileExists(false);
        return;
      }
      setProfileExists(true);
      setContactPerson(profile.contactPerson || "");
      setEmployerType(profile.employerType || "Private Household");
      setHouseholdName(profile.householdName || "");
      setContactPhone(profile.contactPhone || "");
      setContactEmail(profile.contactEmail || "");
      setProvince(profile.province || "");
      setCity(profile.city || "");
      setSuburb(profile.suburb || "");
    } catch (error: any) {
      if (error?.response?.status === 404) {
        setProfileExists(false);
      } else {
        Alert.alert(
          "Unable to load profile",
          error?.response?.data?.message || error?.response?.data?.error || "Please try again."
        );
      }
    } finally {
      setLoadingProfile(false);
    }
  };

  const saveProfile = async () => {
    if (!contactPerson.trim() || !province.trim() || !city.trim()) {
      Alert.alert("Missing information", "Enter the contact person's name, province and city.");
      return;
    }
    if (contactEmail.trim() && !/^\S+@\S+\.\S+$/.test(contactEmail.trim())) {
      Alert.alert("Invalid email", "Enter a valid contact email address.");
      return;
    }
    if (contactPhone.trim() && contactPhone.trim().replace(/\D/g, "").length < 9) {
      Alert.alert("Invalid phone number", "Enter a valid contact phone number.");
      return;
    }

    try {
      setSaving(true);
      if (!(await ensureAuth())) return;
      const payload = {
        contactPerson: contactPerson.trim(),
        employerType,
        householdName: householdName.trim(),
        contactPhone: contactPhone.trim(),
        contactEmail: contactEmail.trim().toLowerCase(),
        province: province.trim(),
        city: city.trim(),
        suburb: suburb.trim(),
      };
      if (profileExists) {
        await API.put("/profiles/employer", payload);
      } else {
        await API.post("/profiles/employer", payload);
        setProfileExists(true);
      }
      Alert.alert("Profile saved", "Your employer profile has been updated.");
    } catch (error: any) {
      Alert.alert(
        "Unable to save profile",
        error?.response?.data?.message || error?.response?.data?.error || "Please check your details and try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loadingProfile) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#D41472" />
        <Text style={styles.muted}>Loading employer profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.eyebrow}>NAKKY ACADEMY</Text>
          <Text style={styles.title}>Employer Profile</Text>
          <Text style={styles.subtitle}>Set up your identity and contact information for the marketplace.</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Your profile is separate from your job posts</Text>
          <Text style={styles.infoText}>
            Keep your contact and general location here. Add salary, duties, working hours and vacancy requirements when you create each job post.
          </Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Employer details</Text>
          <Text style={styles.label}>Contact person's full name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Full name"
            placeholderTextColor="#888"
            value={contactPerson}
            onChangeText={setContactPerson}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Employer type *</Text>
          <View style={styles.chipRow}>
            {EMPLOYER_TYPES.map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => setEmployerType(item)}
                style={[styles.chip, employerType === item && styles.chipActive]}
              >
                <Text style={[styles.chipText, employerType === item && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Household or organisation name</Text>
          <TextInput
            style={styles.input}
            placeholder="Optional"
            placeholderTextColor="#888"
            value={householdName}
            onChangeText={setHouseholdName}
          />

          <Text style={styles.sectionTitle}>Contact details</Text>
          <Text style={styles.label}>Contact phone number *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 082 123 4567"
            placeholderTextColor="#888"
            value={contactPhone}
            onChangeText={setContactPhone}
            keyboardType="phone-pad"
          />
          <Text style={styles.label}>Contact email address *</Text>
          <TextInput
            style={styles.input}
            placeholder="name@example.co.za"
            placeholderTextColor="#888"
            value={contactEmail}
            onChangeText={setContactEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.privateNote}>
            Contact details are intended for authorised marketplace contact and must be protected by the backend subscription checks.
          </Text>

          <Text style={styles.sectionTitle}>General location</Text>
          <Text style={styles.label}>Province *</Text>
          <View style={styles.chipRow}>
            {PROVINCES.map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => setProvince(item)}
                style={[styles.chip, province === item && styles.chipActive]}
              >
                <Text style={[styles.chipText, province === item && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>City or town *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Johannesburg"
            placeholderTextColor="#888"
            value={city}
            onChangeText={setCity}
            autoCapitalize="words"
          />
          <Text style={styles.label}>Suburb or area</Text>
          <TextInput
            style={styles.input}
            placeholder="Optional"
            placeholderTextColor="#888"
            value={suburb}
            onChangeText={setSuburb}
            autoCapitalize="words"
          />

          <TouchableOpacity style={[styles.saveButton, saving && styles.disabled]} onPress={saveProfile} disabled={saving}>
            {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>{profileExists ? "Save Changes" : "Create Employer Profile"}</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F7FA" },
  content: { paddingBottom: 32 },
  loadingScreen: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: "#F7F7FA" },
  header: { backgroundColor: "#171717", padding: 20, paddingTop: 12, paddingBottom: 24 },
  backButton: { marginBottom: 16 },
  backText: { color: "#D41472", fontSize: 16, fontWeight: "800" },
  eyebrow: { color: "#FFD84D", fontSize: 11, fontWeight: "900", letterSpacing: 1.5 },
  title: { color: "#FFFFFF", fontSize: 27, fontWeight: "900", marginTop: 7 },
  subtitle: { color: "#E5E5E5", fontSize: 14, lineHeight: 21, marginTop: 8 },
  infoCard: { margin: 16, marginBottom: 0, padding: 15, backgroundColor: "#FCE8F2", borderRadius: 13, borderWidth: 1, borderColor: "#F4C3DA" },
  infoTitle: { color: "#8D104E", fontSize: 14, fontWeight: "900" },
  infoText: { color: "#5E3A4B", fontSize: 13, lineHeight: 20, marginTop: 6 },
  formCard: { backgroundColor: "#FFFFFF", borderRadius: 16, margin: 16, padding: 18, borderWidth: 1, borderColor: "#ECECF0" },
  sectionTitle: { color: "#202020", fontSize: 17, fontWeight: "900", marginTop: 8, marginBottom: 7 },
  label: { color: "#333333", fontSize: 13, fontWeight: "800", marginTop: 14, marginBottom: 7 },
  input: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DDDDDD", borderRadius: 11, paddingHorizontal: 13, paddingVertical: 12, color: "#222222", fontSize: 14 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: { borderWidth: 1, borderColor: "#DDDDDD", borderRadius: 20, paddingHorizontal: 11, paddingVertical: 9, backgroundColor: "#FFFFFF" },
  chipActive: { backgroundColor: "#D41472", borderColor: "#D41472" },
  chipText: { color: "#444444", fontSize: 12, fontWeight: "700" },
  chipTextActive: { color: "#FFFFFF" },
  privateNote: { color: "#777777", fontSize: 12, lineHeight: 18, marginTop: 8 },
  saveButton: { backgroundColor: "#D41472", borderRadius: 12, padding: 15, alignItems: "center", marginTop: 25 },
  saveButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  disabled: { opacity: 0.6 },
  muted: { color: "#777777", fontSize: 13 },
});