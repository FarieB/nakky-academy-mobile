import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import API from "../../src/services/api";

export default function CandidateDetails() {
  const router = useRouter();

  const { id } =
    useLocalSearchParams<{
      id: string;
    }>();

  const [loading, setLoading] =
    useState(true);

  const [candidate, setCandidate] =
    useState<any>(null);

  // Step 1 — Add a new state
  const [subscriptionActive, setSubscriptionActive] =
    useState(false);

  const loadCandidate = async () => {
    try {
      const token =
        await AsyncStorage.getItem(
          "token"
        );

      API.defaults.headers.common.Authorization =
        `Bearer ${token}`;

      const response = await API.get(
        `/profile/candidate/${id}`
      );

      setCandidate(response.data);

    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.message ||
          "Unable to load candidate."
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — Check the employer's subscription
  const checkSubscription = async () => {
    try {
      const token =
        await AsyncStorage.getItem("token");

      API.defaults.headers.common.Authorization =
        `Bearer ${token}`;

      const response = await API.get(
        "/subscription/my-subscription"
      );

      setSubscriptionActive(
        response.data.subscriptionStatus === "active"
      );

    } catch (err) {
      setSubscriptionActive(false);
    }
  };

  // Step 3 — Load it when the screen opens
  useEffect(() => {
    loadCandidate();
    checkSubscription();
  }, []);


  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator
          size="large"
          color="#2E7D32"
        />
      </View>
    );
  }

  // FIXED: Changed from !candidate to candidate so details show when loaded
  if (candidate) {
   return (
  <ScrollView
    style={styles.container}
    showsVerticalScrollIndicator={false}
  >
    {/* ========================= */}
    {/* PROFILE PHOTO */}
    {/* ========================= */}

    <Image
      source={{
        uri:
          candidate.profilePhoto ||
          candidate.user?.profilePhoto,
      }}
      style={styles.profileImage}
    />

    {/* ========================= */}
    {/* NAME */}
    {/* ========================= */}

    <Text style={styles.name}>
      {candidate.firstName}
    </Text>

    {candidate.user?.verifiedBadge && (
      <Text style={styles.verified}>
        ✅ Verified Candidate
      </Text>
    )}

    {/* ========================= */}
    {/* WORKER TYPES */}
    {/* ========================= */}

    <View style={styles.card}>
      <Text style={styles.title}>
        Worker Types
      </Text>

      <Text style={styles.text}>
        {candidate.workerTypes?.join(", ")}
      </Text>
    </View>

    {/* ========================= */}
    {/* LOCATION */}
    {/* ========================= */}

    <View style={styles.card}>
      <Text style={styles.title}>
        Location
      </Text>

      <Text style={styles.text}>
        {candidate.suburb}
      </Text>

      <Text style={styles.text}>
        {candidate.city}
      </Text>

      <Text style={styles.text}>
        {candidate.province}
      </Text>
    </View>

    {/* ========================= */}
    {/* EXPERIENCE */}
    {/* ========================= */}

    <View style={styles.card}>
      <Text style={styles.title}>
        Experience
      </Text>

      <Text style={styles.text}>
        {candidate.yearsExperience} Years
      </Text>
    </View>

    {/* ========================= */}
    {/* WORK PREFERENCE */}
    {/* ========================= */}

    <View style={styles.card}>
      <Text style={styles.title}>
        Work Preference
      </Text>

      <Text style={styles.text}>
        {candidate.workPreference}
      </Text>

      <Text style={styles.text}>
        {candidate.availabilityStatus}
      </Text>
    </View>

    {/* ========================= */}
    {/* PERSONAL DETAILS */}
    {/* ========================= */}

    <View style={styles.card}>
      <Text style={styles.title}>
        Personal Details
      </Text>

      <Text style={styles.text}>
        Gender: {candidate.gender}
      </Text>

      <Text style={styles.text}>
        Age: {candidate.age}
      </Text>

      <Text style={styles.text}>
        Nationality: {candidate.nationality}
      </Text>
    </View>

    {/* ========================= */}
    {/* LANGUAGES */}
    {/* ========================= */}

    <View style={styles.card}>
      <Text style={styles.title}>
        Languages
      </Text>

      <Text style={styles.text}>
        {candidate.languages?.join(", ")}
      </Text>
    </View>

    {/* ========================= */}
    {/* SKILLS */}
    {/* ========================= */}

    <View style={styles.card}>
      <Text style={styles.title}>
        Skills
      </Text>

      <Text style={styles.text}>
        {candidate.skills?.join(", ")}
      </Text>
    </View>

    {/* ========================= */}
    {/* QUALIFICATIONS */}
    {/* ========================= */}

    <View style={styles.card}>
      <Text style={styles.title}>
        Qualifications
      </Text>

      {candidate.qualifications?.length ? (
        candidate.qualifications.map(
          (item: string, index: number) => (
            <Text
              key={index}
              style={styles.text}
            >
              • {item}
            </Text>
          )
        )
      ) : (
        <Text style={styles.text}>
          None supplied
        </Text>
      )}
    </View>

    {/* ========================= */}
    {/* SALARY */}
    {/* ========================= */}

    <View style={styles.card}>
      <Text style={styles.title}>
        Expected Salary
      </Text>

      <Text style={styles.salary}>
        R {candidate.expectedSalary} / month
      </Text>
    </View>

    {/* ========================= */}
    {/* BIO */}
    {/* ========================= */}

    <View style={styles.card}>
      <Text style={styles.title}>
        About Me
      </Text>

      <Text style={styles.bio}>
        {candidate.bio ||
          "No biography provided."}
      </Text>
    </View>

    {/* ========================= */}
    {/* RATING */}
    {/* ========================= */}

    <View style={styles.card}>
      <Text style={styles.title}>
        Employer Rating
      </Text>

      <Text style={styles.rating}>
        ⭐ {candidate.averageRating} / 5
      </Text>

      <Text style={styles.text}>
        {candidate.totalReviews} Reviews
      </Text>
    </View>

    {/* ========================= */}
    {/* ACTION BUTTONS */}
    {/* ========================= */}

    {/* Step 4 — Replace the Contact Button */}
    {subscriptionActive ? (
      <TouchableOpacity
        style={styles.contactButton}
        onPress={() =>
          router.push({
            pathname: "/(employer)/contact-candidate",
            params: {
              id: candidate._id,
            },
          })
        }
      >
        <Text style={styles.contactButtonText}>
          📞 Contact Candidate
        </Text>
      </TouchableOpacity>
    ) : (
      <TouchableOpacity
        style={styles.subscribeButton}
        onPress={() =>
          router.push(
            "/(employer)/subscription"
          )
        }
      >
        <Text
          style={styles.subscribeButtonText}
        >
          🔒 Subscribe to Contact Candidate
        </Text>
      </TouchableOpacity>
    )}

    <TouchableOpacity
      style={styles.saveButton}
    >
      <Text style={styles.saveButtonText}>
        ❤ Save Candidate
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.reportButton}
    >
      <Text
        style={styles.reportButtonText}
      >
        Report Profile
      </Text>
    </TouchableOpacity>

    <View style={{ height: 40 }} />
  </ScrollView>
  );
 }

 return null;
}

// Temporary empty stylesheet wrapper to prevent execution crash
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
  },

  profileImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignSelf: "center",
    marginTop: 30,
    marginBottom: 20,
    borderWidth: 4,
    borderColor: "#2E7D32",
  },

  name: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: "#222",
  },

  verified: {
    textAlign: "center",
    color: "#2E7D32",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 25,
  },

  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 18,
    marginBottom: 18,
    borderRadius: 16,
    padding: 18,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 3,
  },

  title: {
    fontSize: 19,
    fontWeight: "700",
    color: "#2E7D32",
    marginBottom: 12,
  },

  text: {
    fontSize: 16,
    color: "#555",
    marginBottom: 8,
    lineHeight: 24,
  },

  bio: {
    fontSize: 16,
    color: "#555",
    lineHeight: 26,
  },

  salary: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E7D32",
  },

  rating: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#F9A825",
    marginBottom: 6,
  },

  contactButton: {
    backgroundColor: "#2E7D32",
    marginHorizontal: 18,
    marginTop: 10,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
  },

  contactButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },

  subscribeButton: {
    backgroundColor: "#FF9800",
    marginHorizontal: 18,
    marginTop: 10,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
  },

  subscribeButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },

  saveButton: {
    backgroundColor: "#43A047",
    marginHorizontal: 18,
    marginTop: 15,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },

  reportButton: {
    backgroundColor: "#D32F2F",
    marginHorizontal: 18,
    marginTop: 15,
    marginBottom: 40,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
  },

  reportButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});
