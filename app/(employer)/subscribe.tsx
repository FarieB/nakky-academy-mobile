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

import { WebView } from "react-native-webview";

import API from "../../src/services/api";

export default function SubscribeScreen() {
  const router = useRouter();

  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [paymentUrl, setPaymentUrl] = useState("");
  const [showPayment, setShowPayment] = useState(false);

  // ==========================
  // FETCH PLANS
  // ==========================
  const fetchPlans = async () => {
    try {
      const res = await API.get("/subscriptions/plans");

      setPlans(res.data);
    } catch (err: any) {
      console.log(
        "FETCH PLANS ERROR:",
        err?.response?.data || err.message
      );

      Alert.alert(
        "Error",
        "Failed to load subscription plans"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // START PAYMENT
  // ==========================
  const subscribe = async (planId: string) => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Error", "Please login again");
        return;
      }

      API.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;

      // ======================
      // PAYFAST ENDPOINT
      // ======================
     const res = await API.post(
        "/payments/subscription",
        {
          planId,
        }
      );

      setPaymentUrl(res.data.paymentUrl);

      setShowPayment(true);
    } catch (err: any) {
      console.log(
        "SUBSCRIPTION ERROR:",
        err?.response?.data || err.message
      );

      Alert.alert(
        "Error",
        err?.response?.data?.message ||
          "Subscription failed"
      );
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // ==========================
  // LOADING
  // ==========================
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // ==========================
  // PAYFAST WEBVIEW
  // ==========================
  if (showPayment && paymentUrl) {
    return (
      <WebView
        source={{ uri: paymentUrl }}
        startInLoadingState={true}

        onNavigationStateChange={(navState) => {
          const url = navState.url;

          console.log("PAYFAST URL:", url);

          // ====================
          // SUCCESS
          // ====================
          if (url.includes("payment-success")) {
            Alert.alert(
              "Success",
              "Subscription activated successfully"
            );

            router.replace(
              "/employer/dashboard" as any
            );
          }

          // ====================
          // CANCELLED
          // ====================
          if (url.includes("payment-cancel")) {
            Alert.alert(
              "Cancelled",
              "Subscription cancelled"
            );

            setShowPayment(false);
          }
        }}
      />
    );
  }

  // ==========================
  // SCREEN
  // ==========================
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        Employer Subscription
      </Text>

      <Text style={styles.subtitle}>
        Subscribe to post jobs and hire workers.
      </Text>

      {plans.length === 0 ? (
        <Text>No plans available</Text>
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

            <Text style={styles.subtitle}>
              Subscribe for R100 per month to contact candidates
              and access candidate contact details.
            </Text>

            {plan.description ? (
              <Text style={styles.description}>
                {plan.description}
              </Text>
            ) : null}

            <TouchableOpacity
              style={styles.button}
              onPress={() => subscribe(plan._id)}
            >
              <Text style={styles.buttonText}>
                Subscribe Now
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
    padding: 20,
    backgroundColor: "#fff",
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
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#f4f4f4",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },

  planName: {
    fontSize: 22,
    fontWeight: "bold",
  },

  price: {
    fontSize: 20,
    marginTop: 10,
    fontWeight: "600",
  },

  duration: {
    marginTop: 5,
    color: "#555",
  },

  description: {
    marginTop: 10,
    color: "#666",
  },

  button: {
    marginTop: 20,
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});