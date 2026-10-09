import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function EmployerDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    employerData?: string;
    matchPercentage?: string;
    matchReasons?: string;
  }>();

  const employer = useMemo(() => {
    try {
      return params.employerData ? JSON.parse(params.employerData) : null;
    } catch {
      return null;
    }
  }, [params.employerData]);

  const matchReasons = useMemo(() => {
    try {
      return params.matchReasons ? JSON.parse(params.matchReasons) : [];
    } catch {
      return [];
    }
  }, [params.matchReasons]);

  if (!employer) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Employer Not Found</Text>
        <Text style={styles.errorText}>
          The employer information could not be loaded.
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const employerUserId = employer.user?._id || employer.user;
  const displayName = employer.householdName || employer.employerType || "Private Household";

  const requestInterview = () => {
    if (!employerUserId) {
      Alert.alert("Unable to Continue", "The employer account could not be identified.");
      return;
    }

    router.push({
      pathname: "/request-interview",
      params: {
        recipientId: String(employerUserId),
        recipientName: String(displayName),
      },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{String(displayName).charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.type}>{employer.employerType || "Employer"}</Text>

        {params.matchPercentage ? (
          <View style={styles.matchBox}>
            <Text style={styles.matchNumber}>{params.matchPercentage}%</Text>
            <Text style={styles.matchLabel}>Match with your profile</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Location</Text>
        <Text style={styles.text}>{employer.suburb || "Not specified"}</Text>
        <Text style={styles.text}>{employer.city || "Not specified"}</Text>
        <Text style={styles.text}>{employer.province || "Not specified"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Looking For</Text>
        <Text style={styles.text}>
          {(employer.lookingFor || []).join(", ") || "Not specified"}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Employment Types</Text>
        <Text style={styles.text}>
          {(employer.employmentTypes || []).join(", ") || "Not specified"}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Candidate Preferences</Text>
        <Text style={styles.text}>
          Preferred gender: {employer.preferredGender || "Any"}
        </Text>
        <Text style={styles.text}>
          Preferred age: {employer.preferredAgeMin || 18} - {employer.preferredAgeMax || 65}
        </Text>
        <Text style={styles.text}>
          Experience required: {employer.preferredExperience || 0} years
        </Text>
        <Text style={styles.text}>
          Languages: {(employer.preferredLanguages || []).join(", ") || "Not specified"}
        </Text>
        <Text style={styles.text}>
          Nationalities: {(employer.preferredNationalities || []).join(", ") || "Not specified"}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Salary Offered</Text>
        <Text style={styles.salary}>
          {Number(employer.salaryOffered) > 0
            ? `R ${employer.salaryOffered} / month`
            : "Not specified"}
        </Text>
      </View>

      {matchReasons.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Why This May Be a Good Match</Text>
          {matchReasons.map((reason: string, index: number) => (
            <Text key={`${reason}-${index}`} style={styles.reason}>
              ✓ {reason}
            </Text>
          ))}
        </View>
      ) : null}

      <TouchableOpacity style={styles.interviewButton} onPress={requestInterview}>
        <Text style={styles.interviewButtonText}>📅 Request Interview</Text>
      </TouchableOpacity>

      <Text style={styles.subscriptionNote}>
        Interview requests require an active subscription for both you and the employer.
      </Text>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F7F7" },
  content: { padding: 18, paddingBottom: 45 },
  hero: { alignItems: "center", paddingVertical: 18 },
  avatar: { width: 82, height: 82, borderRadius: 41, backgroundColor: "#D90072", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFF", fontSize: 34, fontWeight: "900" },
  name: { marginTop: 12, fontSize: 25, fontWeight: "900", color: "#111", textAlign: "center" },
  type: { marginTop: 4, color: "#666", fontSize: 15 },
  matchBox: { marginTop: 14, backgroundColor: "#FFF0F7", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, alignItems: "center" },
  matchNumber: { color: "#D90072", fontSize: 22, fontWeight: "900" },
  matchLabel: { color: "#D90072", fontSize: 12, fontWeight: "700" },
  card: { backgroundColor: "#FFF", borderRadius: 14, padding: 17, marginTop: 14, borderWidth: 1, borderColor: "#EEE" },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#111", marginBottom: 9 },
  text: { color: "#555", fontSize: 15, lineHeight: 23 },
  salary: { fontSize: 18, fontWeight: "800", color: "#111" },
  reason: { color: "#444", lineHeight: 23, marginBottom: 4 },
  interviewButton: { backgroundColor: "#D90072", borderRadius: 14, minHeight: 54, alignItems: "center", justifyContent: "center", marginTop: 18 },
  interviewButtonText: { color: "#FFF", fontSize: 17, fontWeight: "900" },
  subscriptionNote: { textAlign: "center", color: "#777", fontSize: 12, lineHeight: 18, marginTop: 10 },
  backButton: { backgroundColor: "#EEE", borderRadius: 12, minHeight: 50, alignItems: "center", justifyContent: "center", marginTop: 10 },
  backButtonText: { color: "#333", fontWeight: "800" },
  errorContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 25, backgroundColor: "#F7F7F7" },
  errorTitle: { fontSize: 22, fontWeight: "900", color: "#111" },
  errorText: { color: "#666", marginTop: 8, textAlign: "center" },
});