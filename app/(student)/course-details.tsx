import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import API from "../../src/services/api";

export default function CourseDetails() {
  const router = useRouter();

  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);

  const [course, setCourse] = useState<any>(null);

  const [enrolled, setEnrolled] = useState(false);

  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  // =====================================================
  // LOAD COURSE
  // =====================================================

  const loadCourse = useCallback(async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Login Required", "Please log in again.");

        return;
      }

      API.defaults.headers.common.Authorization = `Bearer ${token}`;

      const res = await API.get(`/courses/${id}`);

      setCourse(res.data);

      setEnrolled(res.data.isEnrolled === true);

      // NOTE: assumes GET /courses/:id returns isEnrolled and
      // paymentStatus — please confirm against courseController's
      // getCourseById implementation.
      if (res.data.paymentStatus) {
        setPaymentStatus(res.data.paymentStatus);
      }
    } catch (err: any) {
      console.log("LOAD COURSE ERROR:", err?.response?.data || err.message);

      Alert.alert(
        "Error",
        err?.response?.data?.message || "Unable to load course."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  // =====================================================
  // REFRESH WHEN SCREEN BECOMES ACTIVE
  // =====================================================

  useFocusEffect(
    useCallback(() => {
      loadCourse();
    }, [loadCourse])
  );

  // =====================================================
  // CREATE EFT PAYMENT
  // =====================================================

  const createPayment = async () => {
    try {
      setProcessingPayment(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Login Required", "Please log in again.");

        return;
      }

      API.defaults.headers.common.Authorization = `Bearer ${token}`;

      // ==========================================
      // CREATE EFT COURSE PAYMENT
      // matches POST /payments/course, { courseId }
      // (paymentController.createCoursePayment)
      // ==========================================

      const res = await API.post("/payments/course", {
        courseId: id,
      });

      console.log("COURSE PAYMENT RESPONSE:", res.data);

      setPaymentDetails(res.data);

      setPaymentStatus(res.data?.payment?.status || "pending");

      // ==========================================
      // SHOW EFT DETAILS
      // ==========================================

      Alert.alert(
        "Payment Request Created",
        "Please make your EFT payment using the banking details and unique payment reference shown below. Your course will unlock after payment has been approved by Nakky Academy."
      );
    } catch (err: any) {
      console.log(
        "COURSE PAYMENT ERROR:",
        err?.response?.data || err.message
      );

      Alert.alert(
        "Payment Error",
        err?.response?.data?.message || "Unable to create course payment."
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color="#E91E63"
        style={{
          marginTop: 150,
        }}
      />
    );
  }

  // =====================================================
  // COURSE NOT FOUND
  // =====================================================

  if (!course) {
    return (
      <View style={styles.center}>
        <Text>Course not found.</Text>
      </View>
    );
  }

  const payment = paymentDetails?.payment;

  const bankingDetails = paymentDetails?.bankingDetails;

  const hasPendingPayment = payment?.status === "pending";

  const isPaid = enrolled || paymentStatus === "paid";

  // =====================================================
  // MAIN SCREEN
  // =====================================================

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ========================================= */}
      {/* COURSE HEADER */}
      {/* ========================================= */}

      <View style={styles.banner}>
        <Text style={styles.bannerEmoji}>📚</Text>

        <Text style={styles.title}>{course.title}</Text>

        <Text style={styles.category}>{course.category}</Text>
      </View>

      {/* ========================================= */}
      {/* ABOUT COURSE */}
      {/* ========================================= */}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>About this course</Text>

        <Text style={styles.description}>{course.description}</Text>
      </View>

      {/* ========================================= */}
      {/* COURSE STATISTICS */}
      {/* ========================================= */}

      <View style={styles.statsCard}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{course.content?.length || 0}</Text>

          <Text style={styles.statLabel}>Lessons</Text>
        </View>

        <View style={styles.stat}>
          <Text style={styles.statNumber}>{course.duration || 0}</Text>

          <Text style={styles.statLabel}>Hours</Text>
        </View>

        <View style={styles.stat}>
          <Text style={styles.statNumber}>{course.level}</Text>

          <Text style={styles.statLabel}>Level</Text>
        </View>
      </View>

      {/* ========================================= */}
      {/* PRICE */}
      {/* ========================================= */}

      <View style={styles.priceCard}>
        <Text style={styles.priceLabel}>Course Price</Text>

        <Text style={styles.price}>
          R{Number(course.price || 1200).toLocaleString()}
        </Text>

        <Text style={styles.fullPaymentText}>
          Full payment is required before you can access this course.
        </Text>
      </View>

      {/* ========================================= */}
      {/* COURSE FEATURES */}
      {/* ========================================= */}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Course Includes</Text>

        <Text style={styles.feature}>🎥 Video Lessons</Text>

        <Text style={styles.feature}>📚 Learning Material</Text>

        <Text style={styles.feature}>📈 Progress Tracking</Text>

        <Text style={styles.feature}>🏆 Certificate of Completion</Text>

        <Text style={styles.feature}>♾ Lifetime Access</Text>
      </View>

      {/* ========================================= */}
      {/* EFT PAYMENT DETAILS */}
      {/* ========================================= */}

      {hasPendingPayment && bankingDetails && (
        <View style={styles.paymentCard}>
          <Text style={styles.paymentTitle}>🏦 EFT Payment Details</Text>

          <Text style={styles.paymentNotice}>
            Please make the full payment using the banking details below.
          </Text>

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Account Name</Text>

            <Text style={styles.paymentValue}>
              {bankingDetails.accountName}
            </Text>
          </View>

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Bank</Text>

            <Text style={styles.paymentValue}>{bankingDetails.bankName}</Text>
          </View>

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Account Number</Text>

            <Text style={styles.paymentValue}>
              {bankingDetails.accountNumber}
            </Text>
          </View>

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Branch Code</Text>

            <Text style={styles.paymentValue}>
              {bankingDetails.branchCode}
            </Text>
          </View>

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Account Type</Text>

            <Text style={styles.paymentValue}>
              {bankingDetails.accountType}
            </Text>
          </View>

          {/* ===================================== */}
          {/* AMOUNT */}
          {/* ===================================== */}

          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Amount to Pay</Text>

            <Text style={styles.amount}>
              R{Number(payment.amount).toLocaleString()}
            </Text>
          </View>

          {/* ===================================== */}
          {/* UNIQUE REFERENCE */}
          {/* ===================================== */}

          <View style={styles.referenceBox}>
            <Text style={styles.referenceLabel}>
              IMPORTANT: Payment Reference
            </Text>

            <Text style={styles.reference}>{payment.paymentReference}</Text>

            <Text style={styles.referenceNotice}>
              Please use this reference exactly as shown when making your
              EFT payment.
            </Text>
          </View>

          {/* ===================================== */}
          {/* PAYMENT STATUS */}
          {/* ===================================== */}

          <View style={styles.pendingBox}>
            <Text style={styles.pendingTitle}>⏳ Payment Pending</Text>

            <Text style={styles.pendingText}>
              Your course will become available once Nakky Academy
              verifies and approves your payment.
            </Text>
          </View>
        </View>
      )}

      {/* ========================================= */}
      {/* PAID - START LEARNING */}
      {/* ========================================= */}

      {isPaid ? (
        <TouchableOpacity
          style={styles.learnButton}
          onPress={() =>
            // NOTE: guessed route — update if your course-player
            // screen lives somewhere else.
            router.push({
              pathname: "/student/course-player",
              params: {
                id: course._id,
              },
            } as any)
          }
        >
          <Text style={styles.learnText}>▶ Start Learning</Text>
        </TouchableOpacity>
      ) : hasPendingPayment ? (
        <TouchableOpacity style={styles.pendingButton} disabled>
          <Text style={styles.pendingButtonText}>
            ⏳ Payment Pending Approval
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.buyButton}
          onPress={createPayment}
          disabled={processingPayment}
        >
          {processingPayment ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buyText}>
              💳 Pay R{Number(course.price || 1200).toLocaleString()} via
              EFT
            </Text>
          )}
        </TouchableOpacity>
      )}

      {/* ========================================= */}
      {/* BACK */}
      {/* ========================================= */}

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  banner: {
    backgroundColor: "#E91E63",
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },

  bannerEmoji: {
    fontSize: 60,
    marginBottom: 10,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },

  category: {
    marginTop: 10,
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.9,
  },

  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 15,
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#222222",
  },

  description: {
    fontSize: 16,
    color: "#666666",
    lineHeight: 24,
  },

  statsCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 20,
    borderRadius: 15,
    flexDirection: "row",
    justifyContent: "space-around",
    elevation: 2,
  },

  stat: {
    alignItems: "center",
    flex: 1,
  },

  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#E91E63",
    textAlign: "center",
  },

  statLabel: {
    marginTop: 5,
    color: "#777777",
    fontSize: 13,
    textAlign: "center",
  },

  priceCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    elevation: 2,
  },

  priceLabel: {
    fontSize: 16,
    color: "#777777",
  },

  price: {
    marginTop: 8,
    fontSize: 34,
    fontWeight: "bold",
    color: "#4CAF50",
  },

  fullPaymentText: {
    marginTop: 10,
    textAlign: "center",
    color: "#777777",
    fontSize: 14,
  },

  feature: {
    fontSize: 16,
    marginBottom: 12,
    color: "#444444",
  },

  // =========================================
  // EFT PAYMENT
  // =========================================

  paymentCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 15,
    elevation: 3,
  },

  paymentTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#E91E63",
    marginBottom: 10,
  },

  paymentNotice: {
    fontSize: 15,
    color: "#666666",
    lineHeight: 22,
    marginBottom: 15,
  },

  paymentRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },

  paymentLabel: {
    fontSize: 13,
    color: "#888888",
  },

  paymentValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222222",
    marginTop: 3,
  },

  amountBox: {
    backgroundColor: "#E8F5E9",
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
    alignItems: "center",
  },

  amountLabel: {
    fontSize: 14,
    color: "#388E3C",
  },

  amount: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2E7D32",
    marginTop: 5,
  },

  referenceBox: {
    backgroundColor: "#FFF3F7",
    padding: 15,
    borderRadius: 12,
    marginTop: 15,
    alignItems: "center",
  },

  referenceLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#E91E63",
  },

  reference: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222222",
    marginTop: 8,
    textAlign: "center",
  },

  referenceNotice: {
    fontSize: 13,
    color: "#777777",
    marginTop: 10,
    textAlign: "center",
    lineHeight: 19,
  },

  pendingBox: {
    backgroundColor: "#FFF8E1",
    padding: 15,
    borderRadius: 12,
    marginTop: 15,
  },

  pendingTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#F57C00",
    marginBottom: 5,
  },

  pendingText: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 20,
  },

  // =========================================
  // BUTTONS
  // =========================================

  buyButton: {
    backgroundColor: "#E91E63",
    marginHorizontal: 20,
    marginTop: 30,
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: "center",
    elevation: 3,
  },

  buyText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },

  pendingButton: {
    backgroundColor: "#F57C00",
    marginHorizontal: 20,
    marginTop: 30,
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: "center",
    opacity: 0.8,
  },

  pendingButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
  },

  learnButton: {
    backgroundColor: "#4CAF50",
    marginHorizontal: 20,
    marginTop: 30,
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: "center",
    elevation: 3,
  },

  learnText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },

  backButton: {
    backgroundColor: "#757575",
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 40,
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: "center",
  },

  backText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});