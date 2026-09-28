import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import useAdminGuard from "../../src/hooks/useAdminGuard";
import API from "../../src/services/api";


// =====================================================
// TYPES
// =====================================================

interface User {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
}

interface Payment {
  _id: string;
  user?: User;
  type: string;
  referenceId?: string | {
    _id: string;
    student?: string;
    course?: string;
  };
  amount: number;
  currency?: string;
  status: "pending" | "paid" | "failed" | "cancelled" | "refunded";
  paymentMethod?: string;
  paymentReference: string;
  transactionReference?: string | null;
  paymentDate?: string | null;
  proofOfPayment?: string | null;
  proofSubmittedAt?: string | null;
  proofStatus?:
    | "not_submitted"
    | "submitted"
    | "approved"
    | "rejected";
  verifiedBy?: User | null;
  verifiedAt?: string | null;
  adminNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}


// =====================================================
// SCREEN
// =====================================================

export default function CoursePaymentsScreen() {

  const isAdminLoading = useAdminGuard();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);


  // ===================================================
  // LOAD PAYMENTS
  // ===================================================

  const loadPayments = async () => {
    try {

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await API.get("/payments/all", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const allPayments: Payment[] = Array.isArray(response.data)
        ? response.data
        : response.data?.payments || [];

      // Only show COURSE payments on this screen.
      const coursePayments = allPayments.filter(
        (payment) => payment.type === "course"
      );

      // Newest payments first.
      coursePayments.sort((a, b) => {
        const dateA = a.createdAt
          ? new Date(a.createdAt).getTime()
          : 0;

        const dateB = b.createdAt
          ? new Date(b.createdAt).getTime()
          : 0;

        return dateB - dateA;
      });

      setPayments(coursePayments);

    } catch (error: any) {

      console.error(
        "COURSE PAYMENTS ERROR:",
        error?.response?.data || error
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load course payments."
      );

    } finally {

      setLoading(false);
      setRefreshing(false);

    }
  };


  // ===================================================
  // INITIAL / FOCUS LOAD
  // ===================================================

useEffect(() => {
  if (!isAdminLoading) {
    loadPayments();
  }
}, [isAdminLoading]);


  // ===================================================
  // REFRESH
  // ===================================================

  const handleRefresh = async () => {

    setRefreshing(true);

    await loadPayments();

  };


  // ===================================================
  // APPROVE PAYMENT
  // ===================================================

  const handleApprove = (payment: Payment) => {

    Alert.alert(
      "Approve Payment",
      `Approve the EFT payment of ${payment.currency || "ZAR"} ${payment.amount.toFixed(
        2
      )}?\n\nReference:\n${payment.paymentReference}`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Approve",
          onPress: async () => {

            try {

              setProcessingId(payment._id);

              const token = await AsyncStorage.getItem("token");

              if (!token) {
                throw new Error("Authentication token not found.");
              }

              await API.post(
                `/payments/${payment._id}/approve`,
                {},
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              Alert.alert(
                "Payment Approved",
                "The payment has been approved and the student's course access has been activated."
              );

              await loadPayments();

            } catch (error: any) {

              console.error(
                "APPROVE PAYMENT ERROR:",
                error?.response?.data || error
              );

              Alert.alert(
                "Approval Failed",
                error?.response?.data?.message ||
                  error?.message ||
                  "Unable to approve payment."
              );

            } finally {

              setProcessingId(null);

            }

          },
        },
      ]
    );

  };


  // ===================================================
  // REJECT PAYMENT
  // ===================================================

  const handleReject = (payment: Payment) => {

    Alert.alert(
      "Reject Payment",
      `Reject this EFT payment?\n\nReference:\n${payment.paymentReference}`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reject",
          style: "destructive",

          onPress: async () => {

            try {

              setProcessingId(payment._id);

              const token = await AsyncStorage.getItem("token");

              if (!token) {
                throw new Error("Authentication token not found.");
              }

              await API.post(
                `/payments/${payment._id}/reject`,
                {
                  adminNotes: "Payment rejected by administrator.",
                },
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              Alert.alert(
                "Payment Rejected",
                "The payment has been rejected."
              );

              await loadPayments();

            } catch (error: any) {

              console.error(
                "REJECT PAYMENT ERROR:",
                error?.response?.data || error
              );

              Alert.alert(
                "Rejection Failed",
                error?.response?.data?.message ||
                  error?.message ||
                  "Unable to reject payment."
              );

            } finally {

              setProcessingId(null);

            }

          },
        },
      ]
    );

  };


  // ===================================================
  // OPEN PROOF OF PAYMENT
  // ===================================================

  const handleViewProof = async (payment: Payment) => {

    if (!payment.proofOfPayment) {

      Alert.alert(
        "No Proof Available",
        "The student has not uploaded proof of payment yet."
      );

      return;
    }

    try {

      let proofUrl = payment.proofOfPayment;

      // If backend stores a relative path such as:
      // /uploads/proofs/file.jpg
      // convert it to the backend URL.

      if (proofUrl.startsWith("/")) {

        const apiBaseUrl = API.defaults.baseURL || "";

        // Remove /api from the axios base URL.
        const serverBaseUrl = apiBaseUrl.replace(/\/api\/?$/, "");

        proofUrl = `${serverBaseUrl}${proofUrl}`;

      }

      const supported = await Linking.canOpenURL(proofUrl);

      if (!supported) {

        Alert.alert(
          "Unable to Open",
          "This proof of payment cannot be opened on this device."
        );

        return;
      }

      await Linking.openURL(proofUrl);

    } catch (error) {

      console.error("VIEW PROOF ERROR:", error);

      Alert.alert(
        "Error",
        "Unable to open the proof of payment."
      );

    }

  };


  // ===================================================
  // FORMAT DATE
  // ===================================================

  const formatDate = (date?: string | null) => {

    if (!date) {
      return "—";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleString();

  };


  // ===================================================
  // STATUS
  // ===================================================

 const getStatusLabel = (status: Payment["status"]) => {
  switch (status) {
    case "paid":
      return "PAID";

    case "pending":
      return "PENDING";

    case "failed":
      return "REJECTED";

    case "cancelled":
      return "CANCELLED";

    case "refunded":
      return "REFUNDED";

    default:
      return "UNKNOWN";
  }
};


  // ===================================================
  // PAYMENT CARD
  // ===================================================

  const renderPayment = ({ item }: { item: Payment }) => {

    const studentName =
      item.user?.name ||
      "Unknown student";

    const studentEmail =
      item.user?.email ||
      "No email available";

    const isProcessing =
      processingId === item._id;

    const canApprove =
      item.status === "pending";

    const hasProof =
      Boolean(item.proofOfPayment);


    return (
      <View style={styles.card}>

        {/* HEADER */}

        <View style={styles.cardHeader}>

          <View style={styles.headerText}>

            <Text style={styles.studentName}>
              {studentName}
            </Text>

            <Text style={styles.email}>
              {studentEmail}
            </Text>

          </View>

          <View
            style={[
              styles.statusBadge,
              item.status === "paid"
                ? styles.paidBadge
                : item.status === "pending"
                ? styles.pendingBadge
                : styles.rejectedBadge,
            ]}
          >
            <Text style={styles.statusText}>
              {getStatusLabel(item.status)}
            </Text>
          </View>

        </View>


        {/* PAYMENT DETAILS */}

        <View style={styles.detailsContainer}>

          <View style={styles.detailRow}>

            <Text style={styles.detailLabel}>
              Amount
            </Text>

            <Text style={styles.amount}>
              {item.currency || "ZAR"}{" "}
              {Number(item.amount || 0).toFixed(2)}
            </Text>

          </View>


          <View style={styles.detailRow}>

            <Text style={styles.detailLabel}>
              Payment Reference
            </Text>

            <Text style={styles.reference}>
              {item.paymentReference}
            </Text>

          </View>


          <View style={styles.detailRow}>

            <Text style={styles.detailLabel}>
              Method
            </Text>

            <Text style={styles.detailValue}>
              {(item.paymentMethod || "EFT").toUpperCase()}
            </Text>

          </View>


          <View style={styles.detailRow}>

            <Text style={styles.detailLabel}>
              Proof Status
            </Text>

            <Text style={styles.detailValue}>
              {(item.proofStatus || "not_submitted")
                .replace("_", " ")
                .toUpperCase()}
            </Text>

          </View>


          <View style={styles.detailRow}>

            <Text style={styles.detailLabel}>
              Created
            </Text>

            <Text style={styles.detailValue}>
              {formatDate(item.createdAt)}
            </Text>

          </View>


          {item.proofSubmittedAt && (
            <View style={styles.detailRow}>

              <Text style={styles.detailLabel}>
                Proof Submitted
              </Text>

              <Text style={styles.detailValue}>
                {formatDate(item.proofSubmittedAt)}
              </Text>

            </View>
          )}

        </View>


        {/* PROOF BUTTON */}

        <TouchableOpacity
          style={[
            styles.proofButton,
            !hasProof && styles.disabledButton,
          ]}
          onPress={() => handleViewProof(item)}
          disabled={!hasProof}
        >

          <Text style={styles.proofButtonText}>
            {hasProof
              ? "View Proof of Payment"
              : "Proof Not Uploaded"}
          </Text>

        </TouchableOpacity>


        {/* ADMIN ACTIONS */}

        {canApprove && (

          <View style={styles.actions}>

            <TouchableOpacity
              style={[
                styles.approveButton,
                isProcessing && styles.disabledButton,
              ]}
              onPress={() => handleApprove(item)}
              disabled={isProcessing}
            >

              {isProcessing ? (
                <ActivityIndicator size="small" />
              ) : (
                <Text style={styles.approveText}>
                  Approve Payment
                </Text>
              )}

            </TouchableOpacity>


            <TouchableOpacity
              style={[
                styles.rejectButton,
                isProcessing && styles.disabledButton,
              ]}
              onPress={() => handleReject(item)}
              disabled={isProcessing}
            >

              <Text style={styles.rejectText}>
                Reject
              </Text>

            </TouchableOpacity>

          </View>

        )}

      </View>
    );

  };


  // ===================================================
  // LOADING
  // ===================================================

  if (isAdminLoading || loading) {

    return (
      <View style={styles.center}>

        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Loading course payments...
        </Text>

      </View>
    );

  }


  // ===================================================
  // MAIN UI
  // ===================================================

  return (
    <View style={styles.container}>

      <View style={styles.pageHeader}>

        <Text style={styles.title}>
          Course Payments
        </Text>

        <Text style={styles.subtitle}>
          Review and approve student EFT payments
        </Text>

      </View>


      {/* SUMMARY */}

      <View style={styles.summaryCard}>

        <View style={styles.summaryItem}>

          <Text style={styles.summaryNumber}>
            {payments.length}
          </Text>

          <Text style={styles.summaryLabel}>
            Total
          </Text>

        </View>


        <View style={styles.summaryItem}>

          <Text style={styles.summaryNumber}>
            {
              payments.filter(
                (payment) => payment.status === "pending"
              ).length
            }
          </Text>

          <Text style={styles.summaryLabel}>
            Pending
          </Text>

        </View>


        <View style={styles.summaryItem}>

          <Text style={styles.summaryNumber}>
            {
              payments.filter(
                (payment) => payment.status === "paid"
              ).length
            }
          </Text>

          <Text style={styles.summaryLabel}>
            Paid
          </Text>

        </View>

      </View>


      {/* PAYMENTS */}

      <FlatList
        data={payments}
        keyExtractor={(item) => item._id}
        renderItem={renderPayment}

        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }

        contentContainerStyle={
          payments.length === 0
            ? styles.emptyContainer
            : styles.listContainer
        }

        ListEmptyComponent={
          <View style={styles.empty}>

            <Text style={styles.emptyTitle}>
              No Course Payments
            </Text>

            <Text style={styles.emptyText}>
              There are currently no student course
              payments to display.
            </Text>

          </View>
        }

      />

    </View>
  );

}


// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#f5f6f8",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f6f8",
    padding: 20,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
  },

  pageHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
  },

  subtitle: {
    marginTop: 5,
    fontSize: 14,
    color: "#666",
  },

  summaryCard: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 16,
    elevation: 2,
  },

  summaryItem: {
    flex: 1,
    alignItems: "center",
  },

  summaryNumber: {
    fontSize: 22,
    fontWeight: "700",
  },

  summaryLabel: {
    marginTop: 4,
    fontSize: 12,
    color: "#777",
  },

  listContainer: {
    padding: 16,
    paddingTop: 6,
    paddingBottom: 40,
  },

  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },

  empty: {
    alignItems: "center",
    paddingHorizontal: 30,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },

  emptyText: {
    textAlign: "center",
    color: "#777",
    lineHeight: 21,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },

  headerText: {
    flex: 1,
    paddingRight: 10,
  },

  studentName: {
    fontSize: 18,
    fontWeight: "700",
  },

  email: {
    marginTop: 3,
    fontSize: 13,
    color: "#777",
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },

  paidBadge: {
    backgroundColor: "#dff5e5",
  },

  pendingBadge: {
    backgroundColor: "#fff1cc",
  },

  rejectedBadge: {
    backgroundColor: "#f8dddd",
  },

  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },

  detailsContainer: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#eee",
    paddingVertical: 10,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    gap: 12,
  },

  detailLabel: {
    fontSize: 13,
    color: "#777",
    flex: 0.9,
  },

  detailValue: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "right",
    flex: 1.2,
  },

  amount: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "right",
    flex: 1.2,
  },

  reference: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "right",
    flex: 1.2,
  },

  proofButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 9,
    alignItems: "center",
    backgroundColor: "#eef3ff",
  },

  proofButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },

  approveButton: {
    flex: 1,
    backgroundColor: "#dff5e5",
    borderRadius: 9,
    paddingVertical: 13,
    alignItems: "center",
  },

  approveText: {
    fontWeight: "700",
  },

  rejectButton: {
    paddingHorizontal: 20,
    backgroundColor: "#f8dddd",
    borderRadius: 9,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  rejectText: {
    fontWeight: "700",
  },

  disabledButton: {
    opacity: 0.5,
  },

});