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

interface User {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
}

interface Payment {
  _id: string;
  user?: User;
  type: "subscription";
  referenceId?: string;
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

export default function EmployerSubscriptionsScreen() {
  const isAdminLoading = useAdminGuard();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

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

      const subscriptionPayments = allPayments.filter(
        (payment) => payment.type === "subscription"
      );

      subscriptionPayments.sort((a, b) => {
        const dateA = a.createdAt
          ? new Date(a.createdAt).getTime()
          : 0;

        const dateB = b.createdAt
          ? new Date(b.createdAt).getTime()
          : 0;

        return dateB - dateA;
      });

      setPayments(subscriptionPayments);
    } catch (error: any) {
      console.error(
        "EMPLOYER SUBSCRIPTIONS ERROR:",
        error?.response?.data || error
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load employer subscription payments."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isAdminLoading) {
      loadPayments();
    }
  }, [isAdminLoading]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPayments();
  };

  const handleApprove = (payment: Payment) => {
    Alert.alert(
      "Approve Subscription",
      `Approve the EFT payment of ${
        payment.currency || "ZAR"
      } ${Number(payment.amount || 0).toFixed(
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
                "Subscription Approved",
                "The employer subscription payment has been approved and the subscription has been activated."
              );

              await loadPayments();
            } catch (error: any) {
              console.error(
                "APPROVE SUBSCRIPTION ERROR:",
                error?.response?.data || error
              );

              Alert.alert(
                "Approval Failed",
                error?.response?.data?.message ||
                  error?.message ||
                  "Unable to approve the subscription payment."
              );
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const handleReject = (payment: Payment) => {
    Alert.alert(
      "Reject Subscription",
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
                  adminNotes:
                    "Subscription payment rejected by administrator.",
                },
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              Alert.alert(
                "Payment Rejected",
                "The employer subscription payment has been rejected."
              );

              await loadPayments();
            } catch (error: any) {
              console.error(
                "REJECT SUBSCRIPTION ERROR:",
                error?.response?.data || error
              );

              Alert.alert(
                "Rejection Failed",
                error?.response?.data?.message ||
                  error?.message ||
                  "Unable to reject the subscription payment."
              );
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const handleViewProof = async (payment: Payment) => {
    if (!payment.proofOfPayment) {
      Alert.alert(
        "No Proof Available",
        "The employer has not uploaded proof of payment yet."
      );
      return;
    }

    try {
      let proofUrl = payment.proofOfPayment;

      if (proofUrl.startsWith("/")) {
        const apiBaseUrl = API.defaults.baseURL || "";
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
      console.error("VIEW SUBSCRIPTION PROOF ERROR:", error);

      Alert.alert(
        "Error",
        "Unable to open the proof of payment."
      );
    }
  };

  const formatDate = (date?: string | null) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleString();
  };

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

  const renderPayment = ({ item }: { item: Payment }) => {
    const employerName =
      item.user?.name || "Unknown employer";

    const employerEmail =
      item.user?.email || "No email available";

    const isProcessing = processingId === item._id;
    const canApprove = item.status === "pending";
    const hasProof = Boolean(item.proofOfPayment);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerText}>
            <Text style={styles.name}>
              {employerName}
            </Text>

            <Text style={styles.email}>
              {employerEmail}
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
                  Approve Subscription
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

  if (isAdminLoading || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Loading employer subscriptions...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Employer Subscriptions
        </Text>

        <Text style={styles.subtitle}>
          Review and approve employer subscription payments
        </Text>
      </View>

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
            : styles.list
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No employer subscription payments found.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7fb",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#555",
  },

  header: {
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 18,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#222",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#666",
  },

  list: {
    padding: 16,
    paddingBottom: 40,
  },

  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },

  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e7e7e7",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  headerText: {
    flex: 1,
    paddingRight: 10,
  },

  name: {
    fontSize: 18,
    fontWeight: "800",
    color: "#222",
  },

  email: {
    marginTop: 4,
    fontSize: 13,
    color: "#666",
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  paidBadge: {
    backgroundColor: "#dff5e5",
  },

  pendingBadge: {
    backgroundColor: "#fff0c2",
  },

  rejectedBadge: {
    backgroundColor: "#f8d7da",
  },

  statusText: {
    fontSize: 11,
    fontWeight: "800",
  },

  detailsContainer: {
    marginTop: 16,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
  },

  detailLabel: {
    fontSize: 13,
    color: "#777",
    flex: 1,
  },

  detailValue: {
    fontSize: 13,
    color: "#222",
    fontWeight: "600",
    textAlign: "right",
    flex: 1.5,
  },

  amount: {
    fontSize: 16,
    fontWeight: "800",
    color: "#222",
  },

  reference: {
    fontSize: 12,
    color: "#333",
    fontWeight: "700",
    textAlign: "right",
    flex: 1.5,
  },

  proofButton: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#eee",
    alignItems: "center",
  },

  proofButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#333",
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },

  approveButton: {
    flex: 1,
    backgroundColor: "#2e7d32",
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
  },

  approveText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },

  rejectButton: {
    flex: 1,
    backgroundColor: "#c62828",
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
  },

  rejectText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },

  disabledButton: {
    opacity: 0.5,
  },
});