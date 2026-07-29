import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { WebView } from "react-native-webview";

import API from "../../src/services/api";

export default function PayVerificationScreen() {
  const router = useRouter();

  const [paymentUrl, setPaymentUrl] = useState("");
  const [loading, setLoading] = useState(true);

  // ==========================
  // INITIATE PAYMENT
  // ==========================
  const initiatePayment = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Error", "No authentication token");
        return;
      }

      API.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;

      // ==========================
      // UPDATED ENDPOINT
      // ==========================
      const res = await API.post(
        "payment/verification"
      );

      setPaymentUrl(res.data.paymentUrl);
    } catch (err: any) {
      console.log(
        "PAYMENT ERROR:",
        err?.response?.data || err.message
      );

      Alert.alert(
        "Error",
        err?.response?.data?.message ||
          "Failed to initiate payment"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initiatePayment();
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
  // FAILED
  // ==========================
  if (!paymentUrl) {
    return (
      <View style={styles.center}>
        <Text>Failed to load payment</Text>

        <View style={{ marginTop: 20 }}>
          <Button
            title="Go Back"
            onPress={() => router.back()}
          />
        </View>
      </View>
    );
  }

  // ==========================
  // PAYFAST WEBVIEW
  // ==========================
  return (
    <WebView
      source={{ uri: paymentUrl }}
      startInLoadingState={true}

      onNavigationStateChange={(navState) => {
        const url = navState.url;

        console.log("PAYFAST URL:", url);

        // ======================
        // SUCCESS
        // ======================
        if (url.includes("payment-success")) {
          Alert.alert(
            "Success",
            "Verification payment successful"
          );

         router.replace("/candidate/dashboard" as any); 
        }

        // ======================
        // CANCELLED
        // ======================
        if (url.includes("payment-cancel")) {
          Alert.alert(
            "Cancelled",
            "Payment cancelled"
          );

          router.back();
        }
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});