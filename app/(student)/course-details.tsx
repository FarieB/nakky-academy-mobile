import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
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
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  const [enrolled, setEnrolled] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  // =====================================================
  // AUTH HEADER
  // =====================================================

  const setupAuth = async () => {
    const token = await AsyncStorage.getItem("token");

    if (!token) {
      throw new Error("SESSION_EXPIRED");
    }

    API.defaults.headers.common.Authorization = `Bearer ${token}`;

    return token;
  };

  // =====================================================
  // LOAD COURSE
  // =====================================================

  const loadCourse = useCallback(async () => {
    try {
      setLoading(true);

      await setupAuth();

      if (!id) {
        throw new Error("Course ID is missing.");
      }

      // -----------------------------------------
      // LOAD COURSE
      // -----------------------------------------

      const courseResponse = await API.get(`/courses/${id}`);

      const courseData = courseResponse.data;

      setCourse(courseData);

      setEnrolled(courseData?.isEnrolled === true);

      if (courseData?.paymentStatus) {
        setPaymentStatus(courseData.paymentStatus);
      }

      // -----------------------------------------
      // LOAD EXISTING PAYMENT
      // -----------------------------------------
      //
      // IMPORTANT:
      // This does NOT create a new payment.
      //
      // It retrieves the student's existing payment
      // for this course.
      // -----------------------------------------

      try {
        const paymentResponse = await API.get(
          `/payments/course/${id}`
        );

        console.log(
          "COURSE PAYMENT STATUS:",
          paymentResponse.data
        );

        setPaymentDetails(paymentResponse.data);

        if (paymentResponse.data?.payment) {
          setPaymentStatus(
            paymentResponse.data.payment.status
          );
        }

        if (paymentResponse.data?.enrollment?.paymentStatus) {
          setPaymentStatus(
            paymentResponse.data.enrollment.paymentStatus
          );
        }
      } catch (paymentError: any) {
        // A student who has never attempted payment
        // may legitimately have no payment yet.

        console.log(
          "NO EXISTING COURSE PAYMENT:",
          paymentError?.response?.data ||
            paymentError?.message
        );

        setPaymentDetails(null);
      }
    } catch (err: any) {
      console.log(
        "LOAD COURSE ERROR:",
        err?.response?.data || err?.message
      );

      if (err?.message === "SESSION_EXPIRED") {
        Alert.alert(
          "Login Required",
          "Please log in again."
        );

        return;
      }

      Alert.alert(
        "Error",
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load course."
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

      await setupAuth();

      if (!id) {
        Alert.alert(
          "Error",
          "Course information is missing."
        );

        return;
      }

      const res = await API.post("/payments/course", {
        courseId: id,
      });

      console.log(
        "COURSE PAYMENT CREATED:",
        res.data
      );

      setPaymentDetails(res.data);

      setPaymentStatus(
        res.data?.payment?.status || "pending"
      );

      Alert.alert(
        "Payment Details Ready",
        "Your EFT payment details are now available below. Please make the full payment using the exact payment reference shown."
      );
    } catch (err: any) {
      console.log(
        "COURSE PAYMENT ERROR:",
        err?.response?.data ||
          err?.message
      );

      Alert.alert(
        "Payment Error",
        err?.response?.data?.message ||
          err?.message ||
          "Unable to create course payment."
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  // =====================================================
  // COPY PAYMENT REFERENCE
  // =====================================================

  const copyReference = async () => {
    const reference =
      paymentDetails?.payment?.paymentReference;

    if (!reference) {
      Alert.alert(
        "Reference Unavailable",
        "The payment reference is not available."
      );

      return;
    }

    try {
      await Clipboard.setStringAsync(reference);

      Alert.alert(
        "Copied",
        "Payment reference copied successfully."
      );
    } catch (err) {
      Alert.alert(
        "Error",
        "Unable to copy the payment reference."
      );
    }
  };

  // =====================================================
  // UPLOAD PROOF
  // =====================================================

  const uploadProof = () => {
    const payment =
      paymentDetails?.payment;

    if (!payment?._id) {
      Alert.alert(
        "Payment Required",
        "Please create your EFT payment request first."
      );

      return;
    }

    router.push({
      pathname: "/(student)/upload-proof",
      params: {
        paymentId: String(payment._id),
        courseId: String(id),
        paymentReference:
          String(payment.paymentReference || ""),
        amount: String(payment.amount || ""),
        courseTitle:
          String(course?.title || ""),
      },
    } as any);
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#E91E63"
        />

        <Text style={styles.loadingText}>
          Loading course...
        </Text>
      </View>
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

  // =====================================================
  // PAYMENT DATA
  // =====================================================

  const payment =
    paymentDetails?.payment || null;

  const bankingDetails =
    paymentDetails?.bankingDetails || null;

  const enrollment =
    paymentDetails?.enrollment || null;

  const proofStatus =
    payment?.proofStatus ||
    paymentDetails?.proofStatus ||
    "not_submitted";

  const currentPaymentStatus =
    payment?.status ||
    paymentStatus ||
    enrollment?.paymentStatus ||
    null;

  const isPaid =
  currentPaymentStatus === "paid" ||
  enrollment?.paymentStatus === "paid" ||
  course?.paymentStatus === "paid";

  const hasPendingPayment =
    payment &&
    payment.status === "pending";

  const hasRejectedPayment =
    payment &&
    payment.status === "failed";

  const proofSubmitted =
    proofStatus === "submitted";

  const proofApproved =
    proofStatus === "approved";

  // =====================================================
  // MAIN SCREEN
  // =====================================================

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ========================================= */}
      {/* COURSE HEADER */}
      {/* ========================================= */}

      <View style={styles.banner}>
        <Text style={styles.bannerEmoji}>
          📚
        </Text>

        <Text style={styles.title}>
          {course.title}
        </Text>

        <Text style={styles.category}>
          {course.category}
        </Text>
      </View>

      {/* ========================================= */}
      {/* ABOUT COURSE */}
      {/* ========================================= */}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          About this course
        </Text>

        <Text style={styles.description}>
          {course.description}
        </Text>
      </View>

      {/* ========================================= */}
      {/* COURSE STATISTICS */}
      {/* ========================================= */}

      <View style={styles.statsCard}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>
            {course.content?.length || 0}
          </Text>

          <Text style={styles.statLabel}>
            Lessons
          </Text>
        </View>

        <View style={styles.stat}>
          <Text style={styles.statNumber}>
            {course.duration || 0}
          </Text>

          <Text style={styles.statLabel}>
            Hours
          </Text>
        </View>

        <View style={styles.stat}>
          <Text style={styles.statNumber}>
            {course.level || "All"}
          </Text>

          <Text style={styles.statLabel}>
            Level
          </Text>
        </View>
      </View>

      {/* ========================================= */}
      {/* PRICE */}
      {/* ========================================= */}

      <View style={styles.priceCard}>
        <Text style={styles.priceLabel}>
          Course Price
        </Text>

        <Text style={styles.price}>
          R
          {Number(
            course.price || 1200
          ).toLocaleString()}
        </Text>

        <Text style={styles.fullPaymentText}>
          Full payment is required before you
          can access this course.
        </Text>
      </View>

      {/* ========================================= */}
      {/* COURSE FEATURES */}
      {/* ========================================= */}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Course Includes
        </Text>

        <Text style={styles.feature}>
          🎥 Video Lessons
        </Text>

        <Text style={styles.feature}>
          📚 Learning Material
        </Text>

        <Text style={styles.feature}>
          📈 Progress Tracking
        </Text>

        <Text style={styles.feature}>
          📝 Module Assignments
        </Text>

        <Text style={styles.feature}>
          🏆 Certificate of Completion
        </Text>

        <Text style={styles.feature}>
          ♾ Lifetime Access
        </Text>
      </View>

      {/* ========================================= */}
      {/* EXISTING EFT PAYMENT */}
      {/* ========================================= */}

      {payment && bankingDetails && !isPaid && (
        <View style={styles.paymentCard}>
          <Text style={styles.paymentTitle}>
            🏦 EFT Payment Details
          </Text>

          <Text style={styles.paymentNotice}>
            Use the banking details below to
            make your full course payment.
          </Text>

          {/* ACCOUNT NAME */}

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>
              Account Name
            </Text>

            <Text style={styles.paymentValue}>
              {bankingDetails.accountName}
            </Text>
          </View>

          {/* BANK */}

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>
              Bank
            </Text>

            <Text style={styles.paymentValue}>
              {bankingDetails.bankName}
            </Text>
          </View>

          {/* ACCOUNT NUMBER */}

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>
              Account Number
            </Text>

            <Text style={styles.paymentValue}>
              {bankingDetails.accountNumber}
            </Text>
          </View>

          {/* BRANCH */}

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>
              Branch Code
            </Text>

            <Text style={styles.paymentValue}>
              {bankingDetails.branchCode}
            </Text>
          </View>

          {/* ACCOUNT TYPE */}

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>
              Account Type
            </Text>

            <Text style={styles.paymentValue}>
              {bankingDetails.accountType}
            </Text>
          </View>

          {/* AMOUNT */}

          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>
              Amount to Pay
            </Text>

            <Text style={styles.amount}>
              R
              {Number(
                payment.amount
              ).toLocaleString()}
            </Text>
          </View>

          {/* REFERENCE */}

          <View style={styles.referenceBox}>
            <Text style={styles.referenceLabel}>
              IMPORTANT: PAYMENT REFERENCE
            </Text>

            <Text style={styles.reference}>
              {payment.paymentReference}
            </Text>

            <TouchableOpacity
              style={styles.copyButton}
              onPress={copyReference}
            >
              <Text style={styles.copyButtonText}>
                📋 Copy Reference
              </Text>
            </TouchableOpacity>

            <Text style={styles.referenceNotice}>
              Use this exact reference when
              making your EFT payment.
            </Text>
          </View>

          {/* ===================================== */}
          {/* PAYMENT STATUS */}
          {/* ===================================== */}

          {hasPendingPayment && (
            <View style={styles.pendingBox}>
              <Text style={styles.pendingTitle}>
                ⏳ Payment Pending
              </Text>

              {proofSubmitted ? (
                <Text style={styles.pendingText}>
                  Your proof of payment has been
                  submitted and is awaiting
                  verification by Nakky Academy.
                </Text>
              ) : (
                <Text style={styles.pendingText}>
                  Make your EFT payment and then
                  upload your proof of payment
                  below.
                </Text>
              )}
            </View>
          )}

          {/* ===================================== */}
          {/* UPLOAD PROOF */}
          {/* ===================================== */}

          {hasPendingPayment && (
            <TouchableOpacity
              style={styles.proofButton}
              onPress={uploadProof}
            >
              <Text style={styles.proofButtonText}>
                {proofSubmitted
                  ? "📄 View / Replace Proof of Payment"
                  : "📤 Upload Proof of Payment"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ========================================= */}
      {/* REJECTED PAYMENT */}
      {/* ========================================= */}

      {hasRejectedPayment && (
        <View style={styles.rejectedCard}>
          <Text style={styles.rejectedTitle}>
            ❌ Payment Rejected
          </Text>

          <Text style={styles.rejectedText}>
            Your previous payment was rejected by
            Nakky Academy.
          </Text>

          {payment.adminNotes ? (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>
                Admin Note
              </Text>

              <Text style={styles.notesText}>
                {payment.adminNotes}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.buyButton}
            onPress={createPayment}
            disabled={processingPayment}
          >
            {processingPayment ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buyText}>
                💳 Create New EFT Payment
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* ========================================= */}
{/* PENDING EFT PAYMENT - RETURNING STUDENT */}
{/* ========================================= */}

{payment &&
  payment.status === "pending" &&
  !isPaid && (
    <View style={styles.paymentRequiredCard}>
      <Text style={styles.paymentRequiredTitle}>
        🏦 EFT Payment Pending
      </Text>

      <Text style={styles.paymentRequiredText}>
        You have already created an EFT payment
        request for this course.
      </Text>

      <Text style={styles.paymentRequiredText}>
        Complete the EFT using the payment reference
        shown below, then upload your proof of payment.
      </Text>

      <View style={styles.referenceBox}>
        <Text style={styles.referenceLabel}>
          PAYMENT REFERENCE
        </Text>

        <Text style={styles.reference}>
          {payment.paymentReference}
        </Text>

        <TouchableOpacity
          style={styles.copyButton}
          onPress={copyReference}
        >
          <Text style={styles.copyButtonText}>
            📋 Copy Reference
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.buyButton}
        onPress={() => {
          // EFT details are already loaded.
          // Scroll naturally to the payment section.
          Alert.alert(
            "EFT Payment Details",
            "Your EFT payment details are displayed on this page. Please use the banking details and exact payment reference shown above."
          );
        }}
      >
        <Text style={styles.buyText}>
          🏦 View EFT Payment Details
        </Text>
      </TouchableOpacity>

      {payment.proofStatus !== "submitted" && (
        <TouchableOpacity
          style={styles.proofButton}
          onPress={uploadProof}
        >
          <Text style={styles.proofButtonText}>
            📤 Upload Proof of Payment
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )}


      {/* ========================================= */}
      {/* NO PAYMENT YET */}
      {/* ========================================= */}

      {!payment && !isPaid && (
        <View style={styles.paymentRequiredCard}>
          <Text style={styles.paymentRequiredTitle}>
            💳 Payment Required
          </Text>

          <Text style={styles.paymentRequiredText}>
            You need to make full payment before
            you can access the course.
          </Text>

          <TouchableOpacity
            style={styles.buyButton}
            onPress={createPayment}
            disabled={processingPayment}
          >
            {processingPayment ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buyText}>
                💳 Pay R
                {Number(
                  course.price || 1200
                ).toLocaleString()}{" "}
                via EFT
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* ========================================= */}
      {/* PAID */}
      {/* ========================================= */}

      {isPaid && (
        <View style={styles.paidCard}>
          <Text style={styles.paidTitle}>
            ✅ Payment Approved
          </Text>

          <Text style={styles.paidText}>
            Your payment has been verified.
            You now have access to the course.
          </Text>

          <TouchableOpacity
            style={styles.learnButton}
            onPress={() =>
              router.push({
                pathname:
                  "/(student)/course-player",
                params: {
                  id: course._id,
                },
              } as any)
            }
          >
            <Text style={styles.learnText}>
              ▶ Start Learning
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ========================================= */}
      {/* BACK */}
      {/* ========================================= */}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backText}>
          Back
        </Text>
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

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },

  loadingText: {
    marginTop: 12,
    color: "#666666",
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
  // PAYMENT
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
    textAlign: "center",
  },

  reference: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222222",
    marginTop: 8,
    textAlign: "center",
  },

  copyButton: {
    backgroundColor: "#E91E63",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
  },

  copyButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
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

  proofButton: {
    backgroundColor: "#1976D2",
    marginTop: 15,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  proofButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },

  // =========================================
  // REJECTED
  // =========================================

  rejectedCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },

  rejectedTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#D32F2F",
    marginBottom: 10,
  },

  rejectedText: {
    fontSize: 15,
    color: "#666666",
    lineHeight: 22,
  },

  notesBox: {
    backgroundColor: "#FFF3E0",
    padding: 12,
    borderRadius: 10,
    marginTop: 15,
  },

  notesLabel: {
    fontWeight: "bold",
    color: "#E65100",
    marginBottom: 5,
  },

  notesText: {
    color: "#555555",
    lineHeight: 20,
  },

  // =========================================
  // PAYMENT REQUIRED
  // =========================================

  paymentRequiredCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 15,
    elevation: 3,
  },

  paymentRequiredTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#E91E63",
    marginBottom: 8,
  },

  paymentRequiredText: {
    fontSize: 15,
    color: "#666666",
    lineHeight: 22,
    marginBottom: 5,
  },

  // =========================================
  // PAID
  // =========================================

  paidCard: {
    backgroundColor: "#E8F5E9",
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 15,
    elevation: 3,
  },

  paidTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 8,
  },

  paidText: {
    fontSize: 15,
    color: "#555555",
    lineHeight: 22,
  },

  // =========================================
  // BUTTONS
  // =========================================

  buyButton: {
    backgroundColor: "#E91E63",
    marginTop: 20,
    paddingVertical: 17,
    borderRadius: 13,
    alignItems: "center",
    elevation: 3,
  },

  buyText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
    textAlign: "center",
  },

  learnButton: {
    backgroundColor: "#4CAF50",
    marginTop: 20,
    paddingVertical: 18,
    borderRadius: 13,
    alignItems: "center",
    elevation: 3,
  },

  learnText: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "bold",
  },

  backButton: {
    backgroundColor: "#757575",
    marginHorizontal: 20,
    marginTop: 20,
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