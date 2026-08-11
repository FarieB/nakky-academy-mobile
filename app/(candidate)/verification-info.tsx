import { useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function VerificationInfoScreen() {
  const router = useRouter();

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>
          Get Your Profile Verified
        </Text>

        <Text style={styles.subtitle}>
          Build trust with employers and stand out as a verified candidate.
        </Text>
      </View>

      {/* ============================== */}
      {/* PRICE */}
      {/* ============================== */}

      <View style={styles.priceCard}>
        <Text style={styles.priceLabel}>
          Once-off verification fee
        </Text>

        <Text style={styles.price}>
          R100
        </Text>

        <Text style={styles.priceDescription}>
          No monthly subscription. You pay once for candidate verification.
        </Text>
      </View>

      {/* ============================== */}
      {/* BENEFITS */}
      {/* ============================== */}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Benefits of Verification
        </Text>

        <View style={styles.benefit}>
          <Text style={styles.check}>✓</Text>
          <Text style={styles.benefitText}>
            A verified badge will be displayed on your profile.
          </Text>
        </View>

        <View style={styles.benefit}>
          <Text style={styles.check}>✓</Text>
          <Text style={styles.benefitText}>
            Helps employers identify trusted candidates.
          </Text>
        </View>

        <View style={styles.benefit}>
          <Text style={styles.check}>✓</Text>
          <Text style={styles.benefitText}>
            Makes your profile stand out when employers search for candidates.
          </Text>
        </View>

        <View style={styles.benefit}>
          <Text style={styles.check}>✓</Text>
          <Text style={styles.benefitText}>
            Shows that your submitted information and documents have been
            reviewed.
          </Text>
        </View>

        <View style={styles.benefit}>
          <Text style={styles.check}>✓</Text>
          <Text style={styles.benefitText}>
            Gives employers greater confidence when considering your profile.
          </Text>
        </View>
      </View>

      {/* ============================== */}
      {/* HOW IT WORKS */}
      {/* ============================== */}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          How Verification Works
        </Text>

        <Text style={styles.step}>
          1. Pay the once-off R100 verification fee.
        </Text>

        <Text style={styles.step}>
          2. Submit your required profile information and documents.
        </Text>

        <Text style={styles.step}>
          3. Nakky Academy reviews your submitted information.
        </Text>

        <Text style={styles.step}>
          4. Once approved, your profile receives a verified badge.
        </Text>
      </View>

      {/* ============================== */}
      {/* IMPORTANT INFORMATION */}
      {/* ============================== */}

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>
          Important
        </Text>

        <Text style={styles.noticeText}>
          Verification does not guarantee employment. It indicates that your
          submitted information has been reviewed by Nakky Academy.
        </Text>
      </View>

      {/* ============================== */}
      {/* PAYMENT BUTTON */}
      {/* ============================== */}

      <TouchableOpacity
        style={styles.paymentButton}
        onPress={() =>
          router.push("/(candidate)/pay-verification")
        }
      >
        <Text style={styles.paymentButtonText}>
          Pay R100 & Verify
        </Text>
      </TouchableOpacity>

      {/* ============================== */}
      {/* BACK BUTTON */}
      {/* ============================== */}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>
          Go Back
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
    paddingHorizontal: 18,
    paddingTop: 25,
  },

  header: {
    marginBottom: 20,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
  },

  priceCard: {
    backgroundColor: "#2E7D32",
    borderRadius: 18,
    padding: 25,
    alignItems: "center",
    marginBottom: 20,
  },

  priceLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 8,
  },

  price: {
    color: "#FFFFFF",
    fontSize: 42,
    fontWeight: "bold",
    marginBottom: 8,
  },

  priceDescription: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 14,
    lineHeight: 21,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 18,
  },

  benefit: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 15,
  },

  check: {
    fontSize: 20,
    color: "#2E7D32",
    fontWeight: "bold",
    marginRight: 10,
  },

  benefitText: {
    flex: 1,
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
  },

  step: {
    fontSize: 15,
    color: "#555",
    lineHeight: 23,
    marginBottom: 12,
  },

  notice: {
    backgroundColor: "#FFF3CD",
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
  },

  noticeTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#856404",
    marginBottom: 6,
  },

  noticeText: {
    fontSize: 14,
    color: "#856404",
    lineHeight: 21,
  },

  paymentButton: {
    backgroundColor: "#2E7D32",
    paddingVertical: 17,
    borderRadius: 13,
    alignItems: "center",
    marginBottom: 12,
  },

  paymentButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },

  backButton: {
    backgroundColor: "#E0E0E0",
    paddingVertical: 15,
    borderRadius: 13,
    alignItems: "center",
  },

  backButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
  },
});