import AsyncStorage from "@react-native-async-storage/async-storage";
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

import API from "../../src/services/api";

export default function SubscribeScreen() {
  const router = useRouter();

  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // FETCH SUBSCRIPTION PLANS
  // ==========================================

  const fetchPlans = async () => {
    try {
      const res = await API.get("/subscriptions/plans");

      console.log("SUBSCRIPTION PLANS:", res.data);

      setPlans(res.data);
    } catch (err: any) {
      console.log(
        "FETCH PLANS ERROR:",
        err?.response?.data || err.message
      );

      Alert.alert(
        "Error",
        "Failed to load subscription plans."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // CREATE EFT PAYMENT
  // ==========================================

  const subscribe = async (planId: string) => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert(
          "Session Expired",
          "Please login again."
        );

        return;
      }

      API.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;

      const res = await API.post(
        "/payments/subscription",
        {
          planId,
        }
      );

      console.log(
        "EFT SUBSCRIPTION RESPONSE:",
        JSON.stringify(res.data, null, 2)
      );

      const data = res.data;

      // ======================================
      // VALIDATE RESPONSE
      // ======================================

      if (!data.plan) {
        Alert.alert(
          "Error",
          "Subscription plan information was not returned."
        );

        return;
      }

      if (!data.payment) {
        Alert.alert(
          "Error",
          "Payment information was not returned."
        );

        return;
      }

      if (!data.bankingDetails) {
        Alert.alert(
          "Error",
          "Banking details were not returned."
        );

        return;
      }

      // ======================================
      // NAVIGATE TO EFT PAYMENT SCREEN
      // ======================================

      router.push({
        pathname: "/(employer)/eft-payment",
        params: {
          subscriptionId: String(data.subscription?._id || ""),

          paymentId: String(data.payment?._id || ""),

          planName: String(data.plan.name || ""),

          amount: String(data.plan.price || ""),

          durationDays: String(
            data.plan.durationDays || ""
          ),

          paymentReference: String(
            data.payment.paymentReference || ""
          ),

          accountName: String(
            data.bankingDetails.accountName || ""
          ),

          bankName: String(
            data.bankingDetails.bankName || ""
          ),

          accountNumber: String(
            data.bankingDetails.accountNumber || ""
          ),

          branchCode: String(
            data.bankingDetails.branchCode || ""
          ),

          accountType: String(
            data.bankingDetails.accountType || ""
          ),
        },
      });

    } catch (err: any) {
      console.log(
        "SUBSCRIPTION ERROR:",
        err?.response?.data || err.message
      );

      Alert.alert(
        "Error",
        err?.response?.data?.message ||
          "Failed to create subscription payment."
      );
    }
  };

  // ==========================================
  // LOAD PLANS
  // ==========================================

  useEffect(() => {
    fetchPlans();
  }, []);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // ==========================================
  // SCREEN
  // ==========================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >

      <Text style={styles.title}>
        Employer Subscription
      </Text>

      <Text style={styles.subtitle}>
        Choose a subscription plan to access candidate
        contact details and communicate with candidates.
      </Text>

      {plans.length === 0 ? (

        <Text>No subscription plans available.</Text>

      ) : (

        plans.map((plan) => (

          <View
            key={plan._id}
            style={styles.card}
          >

            <Text style={styles.planName}>
              {plan.name}
            </Text>

            <Text style={styles.price}>
              R{plan.price}
            </Text>

            <Text style={styles.duration}>
              Valid for {plan.durationDays} days
            </Text>

            {plan.description ? (
              <Text style={styles.description}>
                {plan.description}
              </Text>
            ) : null}

            {/* FEATURES */}

            {plan.features?.map(
              (
                feature: string,
                index: number
              ) => (

                <Text
                  key={index}
                  style={styles.feature}
                >
                  ✓ {feature}
                </Text>

              )
            )}

            <TouchableOpacity
              style={styles.button}
              onPress={() =>
                subscribe(plan._id)
              }
            >

              <Text style={styles.buttonText}>
                Select This Plan
              </Text>

            </TouchableOpacity>

          </View>

        ))

      )}

    </ScrollView>
  );
}

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
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 16,
    color: "#666",
    lineHeight: 23,
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#f7f7f7",
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },

  planName: {
    fontSize: 22,
    fontWeight: "bold",
  },

  price: {
    fontSize: 26,
    fontWeight: "bold",
    marginTop: 10,
  },

  duration: {
    fontSize: 15,
    color: "#666",
    marginTop: 5,
  },

  description: {
    marginTop: 12,
    color: "#666",
    lineHeight: 21,
  },

  feature: {
    marginTop: 8,
    fontSize: 15,
  },

  button: {
    marginTop: 20,
    backgroundColor: "#d81b60",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

});