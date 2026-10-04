import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import API from "../../src/services/api";

type VerificationStatus =
  | "verified"
  | "pending"
  | "unverified"
  | "rejected";

export default function VerifyScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState("");

  const loadVerificationStatus = async () => {
    try {
      setLoading(true);
      setError("");

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        setError("Your login session has expired.");
        return;
      }

      API.defaults.headers.common.Authorization =
        `Bearer ${token}`;

      const response = await API.get("/profiles/candidate");

      console.log(
        "CANDIDATE VERIFICATION DATA:",
        response.data
      );

      setProfile(response.data);
    } catch (err: any) {
      console.log(
        "VERIFICATION STATUS ERROR:",
        err?.response?.data || err?.message
      );

      setError(
        err?.response?.data?.message ||
          "Unable to load your verification status."
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadVerificationStatus();
    }, [])
  );

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#2E7D32"
        />

        <Text style={styles.loadingText}>
          Checking your verification status...
        </Text>
      </View>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>
          Unable to Load Verification
        </Text>

        <Text style={styles.errorText}>
          {error}
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={loadVerificationStatus}
        >
          <Text style={styles.primaryButtonText}>
            Try Again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ==========================================
  // VERIFICATION STATUS
  // ==========================================

  const isVerified =
    profile?.profileVerified === true;

  const status: VerificationStatus =
    isVerified
      ? "verified"
      : "unverified";

  const statusTitle =
    status === "verified"
      ? "Verified"
      : "Not Verified";

  const statusDescription =
    status === "verified"
      ? "Your candidate profile has been verified by Nakky Academy."
      : "Your candidate profile has not yet been verified.";

  // ==========================================
  // SCREEN
  // ==========================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>
        Verification Status
      </Text>

      <Text style={styles.subtitle}>
        Check the verification status of your
        Nakky Academy candidate profile.
      </Text>

      {/* STATUS CARD */}

      <View
        style={[
          styles.statusCard,
          isVerified
            ? styles.verifiedCard
            : styles.pendingCard,
        ]}
      >
        <Text style={styles.statusIcon}>
          {isVerified ? "✓" : "!"}
        </Text>

        <Text
          style={[
            styles.statusTitle,
            isVerified
              ? styles.verifiedText
              : styles.pendingText,
          ]}
        >
          {statusTitle}
        </Text>

        <Text style={styles.statusDescription}>
          {statusDescription}
        </Text>
      </View>

      {/* VERIFIED */}

      {isVerified ? (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            ✓ Your Profile Is Verified
          </Text>

          <Text style={styles.infoText}>
            Your verified badge can now be displayed
            on your candidate profile.
          </Text>

          <Text style={styles.infoText}>
            Employers can see that your profile has
            been verified by Nakky Academy.
          </Text>
        </View>
      ) : (
        <>
          {/* NOT VERIFIED */}

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>
              Complete Your Verification
            </Text>

            <Text style={styles.infoText}>
              To request verification, make sure your
              candidate profile and required documents
              are complete.
            </Text>

            <Text style={styles.infoText}>
              You will also need to complete the
              verification payment process.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() =>
              router.push(
                "/(candidate)/verification-info"
              )
            }
          >
            <Text style={styles.primaryButtonText}>
              Start Verification
            </Text>
          </TouchableOpacity>
        </>
      )}

      {/* PROFILE BUILDER */}

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() =>
          router.push("/profile-builder")
        }
      >
        <Text style={styles.secondaryButtonText}>
          Edit Candidate Profile
        </Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    padding: 25,
  },

  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },

  errorTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: "#D32F2F",
    marginBottom: 10,
    textAlign: "center",
  },

  errorText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: "#666",
    lineHeight: 23,
    marginBottom: 25,
  },

  statusCard: {
    borderRadius: 18,
    padding: 25,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
  },

  verifiedCard: {
    backgroundColor: "#E8F5E9",
    borderColor: "#81C784",
  },

  pendingCard: {
    backgroundColor: "#FFF8E1",
    borderColor: "#FFD54F",
  },

  statusIcon: {
    width: 65,
    height: 65,
    borderRadius: 33,
    backgroundColor: "#FFFFFF",
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 38,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#2E7D32",
  },

  statusTitle: {
    fontSize: 27,
    fontWeight: "bold",
    marginBottom: 10,
  },

  verifiedText: {
    color: "#2E7D32",
  },

  pendingText: {
    color: "#F57C00",
  },

  statusDescription: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    lineHeight: 23,
  },

  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },

  infoTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#2E7D32",
    marginBottom: 12,
  },

  infoText: {
    fontSize: 15,
    color: "#555",
    lineHeight: 23,
    marginBottom: 10,
  },

  primaryButton: {
    backgroundColor: "#2E7D32",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  secondaryButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2E7D32",
  },

  secondaryButtonText: {
    color: "#2E7D32",
    fontSize: 16,
    fontWeight: "700",
  },
});