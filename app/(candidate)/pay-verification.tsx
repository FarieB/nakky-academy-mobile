import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import * as Clipboard from "expo-clipboard";

import API from "../../src/services/api";

// =====================================================
// TYPES
// =====================================================

interface PaymentDetails {
  paymentId: string;
  accountName: string;
  bankName: string;
  accountNumber: string;
  branchCode: string;
  accountType: string;
  paymentReference: string;
  amount: number;
}

// =====================================================
// SCREEN
// =====================================================

export default function PayVerificationScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [paymentDetails, setPaymentDetails] =
    useState<PaymentDetails | null>(null);

  // =====================================================
  // COPY TEXT
  // =====================================================

  const copyText = async (
    text: string,
    label: string
  ) => {
    try {
      await Clipboard.setStringAsync(text);

      Alert.alert(
        "Copied",
        `${label} copied successfully.`
      );
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to copy text."
      );
    }
  };

  // =====================================================
  // CREATE VERIFICATION + ANNUAL SUBSCRIPTION PAYMENT
  // =====================================================

  const createVerificationPayment = async () => {
    try {
      setLoading(true);
      setPaymentDetails(null);

      const res = await API.post(
        "/payments/verification"
      );

      console.log(
        "VERIFICATION PAYMENT RESPONSE:",
        res.data
      );

      // =================================================
      // EXTRACT RESPONSE
      // =================================================

      const payment =
        res.data?.payment;

      const bankingDetails =
        res.data?.bankingDetails;

      // =================================================
      // VALIDATE PAYMENT DETAILS
      // =================================================

      if (
        !payment?._id ||
        !payment?.paymentReference ||
        !payment?.amount ||
        !bankingDetails?.accountName ||
        !bankingDetails?.bankName ||
        !bankingDetails?.accountNumber ||
        !bankingDetails?.branchCode
      ) {
        console.log(
          "INVALID PAYMENT RESPONSE:",
          res.data
        );

        throw new Error(
          "The server did not generate valid payment details."
        );
      }

      // =================================================
      // SAVE CLEAN PAYMENT DETAILS
      // =================================================

      setPaymentDetails({
        paymentId: String(
          payment._id
        ),

        amount: Number(
          payment.amount
        ),

        paymentReference: String(
          payment.paymentReference
        ),

        accountName: String(
          bankingDetails.accountName
        ),

        bankName: String(
          bankingDetails.bankName
        ),

        accountNumber: String(
          bankingDetails.accountNumber
        ),

        branchCode: String(
          bankingDetails.branchCode
        ),

        accountType: String(
          bankingDetails.accountType || ""
        ),
      });
    } catch (err: any) {
      console.log(
        "VERIFICATION PAYMENT ERROR:",
        err?.response?.data ||
          err?.message
      );

      const status =
        err?.response?.status;

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "";

      // =================================================
      // ACTIVE SUBSCRIPTION
      // =================================================
      //
      // The backend prevents a candidate from creating
      // another R200 verification/subscription payment
      // while their current annual subscription is active.
      //
      // In that situation, send them back to the dashboard
      // instead of showing a generic payment error.
      // =================================================

      const activeSubscription =
        status === 400 &&
        (
          message
            .toLowerCase()
            .includes("active") ||
          message
            .toLowerCase()
            .includes("subscription") ||
          message
            .toLowerCase()
            .includes("verified")
        );

      if (activeSubscription) {
        Alert.alert(
          "Subscription Already Active",
          message ||
            "Your verification and annual marketplace subscription are already active.",
          [
            {
              text: "Go to Dashboard",
              onPress: () => {
                router.replace(
                  "/(candidate)/candidate-dashboard" as any
                );
              },
            },
          ]
        );

        return;
      }

      // =================================================
      // SESSION / AUTH ERROR
      // =================================================

      if (
        status === 401 ||
        status === 403
      ) {
        Alert.alert(
          "Session Expired",
          "Please login again.",
          [
            {
              text: "OK",
              onPress: () => {
                router.replace(
                  "/login" as any
                );
              },
            },
          ]
        );

        return;
      }

      // =================================================
      // NORMAL PAYMENT ERROR
      // =================================================

      Alert.alert(
        "Payment Error",
        message ||
          "Failed to generate EFT payment details."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD PAYMENT DETAILS
  // =====================================================

  useEffect(() => {
    createVerificationPayment();
  }, []);

  // =====================================================
  // GO TO PROOF UPLOAD
  // =====================================================

  const handlePaymentMade = () => {
    if (!paymentDetails) {
      Alert.alert(
        "Error",
        "Payment details are missing."
      );

      return;
    }

    router.push({
      pathname:
        "/(candidate)/upload-proof" as any,

      params: {
        paymentId:
          paymentDetails.paymentId,

        paymentReference:
          paymentDetails.paymentReference,

        amount:
          String(
            paymentDetails.amount
          ),
      },
    });
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#d81b60"
        />

        <Text style={styles.loadingText}>
          Generating your EFT payment details...
        </Text>
      </View>
    );
  }

  // =====================================================
  // FAILED
  // =====================================================

  if (!paymentDetails) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          Failed to load payment details.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={
            createVerificationPayment
          }
        >
          <Text style={styles.buttonText}>
            Try Again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // =====================================================
  // PAYMENT SCREEN
  // =====================================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
    >
      {/* =================================================
          TITLE
      ================================================= */}

      <Text style={styles.title}>
        Candidate Verification & Annual Subscription
      </Text>

      <Text style={styles.subtitle}>
        Please make an EFT payment using
        the banking details below.
      </Text>

      {/* =================================================
          PAYMENT AMOUNT
      ================================================= */}

      <View style={styles.amountCard}>
        <Text style={styles.amountLabel}>
          Verification & Annual Subscription
        </Text>

        <Text style={styles.amount}>
          R{paymentDetails.amount}
        </Text>

        <Text style={styles.amountInfo}>
          Valid for 12 months after approval
        </Text>
      </View>

      {/* =================================================
          PAYMENT REFERENCE
      ================================================= */}

      <View style={styles.referenceCard}>
        <Text style={styles.sectionTitle}>
          ⚠️ Important Payment Reference
        </Text>

        <Text style={styles.reference}>
          {paymentDetails.paymentReference}
        </Text>

        <Text style={styles.referenceInfo}>
          Please use this exact reference
          when making your EFT payment.
        </Text>

        <TouchableOpacity
          style={styles.copyButton}
          onPress={() =>
            copyText(
              paymentDetails.paymentReference,
              "Payment reference"
            )
          }
        >
          <Text style={styles.copyButtonText}>
            Copy Reference
          </Text>
        </TouchableOpacity>
      </View>

      {/* =================================================
          BANK DETAILS
      ================================================= */}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Banking Details
        </Text>

        <Text style={styles.label}>
          Account Name
        </Text>

        <Text style={styles.value}>
          {paymentDetails.accountName}
        </Text>

        <Text style={styles.label}>
          Bank
        </Text>

        <Text style={styles.value}>
          {paymentDetails.bankName}
        </Text>

        <Text style={styles.label}>
          Account Number
        </Text>

        <TouchableOpacity
          onPress={() =>
            copyText(
              paymentDetails.accountNumber,
              "Account number"
            )
          }
        >
          <Text style={styles.copyValue}>
            {paymentDetails.accountNumber}
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>
          Branch Code
        </Text>

        <Text style={styles.value}>
          {paymentDetails.branchCode}
        </Text>

        <Text style={styles.label}>
          Account Type
        </Text>

        <Text style={styles.value}>
          {paymentDetails.accountType}
        </Text>
      </View>

      {/* =================================================
          WHAT HAPPENS NEXT
      ================================================= */}

      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>
          What Happens Next?
        </Text>

        <Text style={styles.infoText}>
          1. Make an EFT payment of
          {" "}
          R{paymentDetails.amount}.
        </Text>

        <Text style={styles.infoText}>
          2. Use the payment reference
          shown above.
        </Text>

        <Text style={styles.infoText}>
          3. Upload your proof of payment.
        </Text>

        <Text style={styles.infoText}>
          4. Nakky Academy will review and
          verify your payment.
        </Text>

        <Text style={styles.infoText}>
          5. Once approved, your profile
          will receive a verified badge.
        </Text>

        <Text style={styles.infoText}>
          6. Your 12-month marketplace
          subscription will also be activated.
        </Text>

        <Text style={styles.infoText}>
          7. While your subscription is
          active, you can communicate directly
          with active employers.
        </Text>
      </View>

      {/* =================================================
          PAYMENT MADE
      ================================================= */}

      <TouchableOpacity
        style={styles.doneButton}
        onPress={
          handlePaymentMade
        }
      >
        <Text style={styles.doneButtonText}>
          I Have Made the Payment
        </Text>
      </TouchableOpacity>

      {/* =================================================
          NOTE
      ================================================= */}

      <Text style={styles.note}>
        Your candidate profile will only
        be verified and your 12-month
        marketplace subscription activated
        after Nakky Academy has approved
        your EFT payment.
      </Text>
    </ScrollView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },

  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },

  errorText: {
    fontSize: 16,
    color: "#d32f2f",
    marginBottom: 20,
    textAlign: "center",
  },

  title: {
    fontSize: 27,
    fontWeight: "bold",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 16,
    color: "#666",
    lineHeight: 23,
    marginBottom: 20,
  },

  amountCard: {
    backgroundColor: "#fdf1f7",
    padding: 25,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 20,
  },

  amountLabel: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },

  amount: {
    fontSize: 38,
    fontWeight: "bold",
    color: "#d81b60",
    marginTop: 8,
  },

  amountInfo: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },

  card: {
    backgroundColor: "#f5f5f5",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },

  referenceCard: {
    backgroundColor: "#fff8e1",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },

  infoCard: {
    backgroundColor: "#eef6ff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },

  reference: {
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 10,
  },

  referenceInfo: {
    color: "#666",
    lineHeight: 21,
  },

  copyButton: {
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    alignItems: "center",
  },

  copyButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  label: {
    fontSize: 13,
    color: "#777",
    marginTop: 12,
  },

  value: {
    fontSize: 17,
    fontWeight: "600",
    marginTop: 3,
  },

  copyValue: {
    fontSize: 17,
    fontWeight: "600",
    marginTop: 3,
    color: "#0066cc",
  },

  infoText: {
    fontSize: 15,
    marginBottom: 10,
    lineHeight: 22,
  },

  button: {
    backgroundColor: "#d81b60",
    padding: 17,
    borderRadius: 10,
    alignItems: "center",
    minWidth: 140,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  doneButton: {
    backgroundColor: "#d81b60",
    padding: 17,
    borderRadius: 12,
    alignItems: "center",
  },

  doneButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  note: {
    textAlign: "center",
    color: "#777",
    marginTop: 15,
    lineHeight: 20,
  },
});
