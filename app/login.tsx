import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../src/services/api";

export default function LoginScreen() {
  console.log("LOGIN SCREEN LOADED");
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      // 1. Login
      const res = await API.post("/auth/login", {
        email,
        password,
      });

     const token = res.data.token;

        // Save token
        await AsyncStorage.setItem("token", token);

        // ✅ Save logged-in user
        await AsyncStorage.setItem(
          "user",
          JSON.stringify(res.data.user)
        ); 

      // 3. Attach token to future requests
      API.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // 4. Get dashboard (to detect role)
      const dashboardRes = await API.get("/dashboard");
      const role = dashboardRes.data.role;

      console.log("USER ROLE:", role);

      Alert.alert("Success", `Logged in as ${role}`);

// 5. Role-based redirect
    if (role === "employer") {
      router.replace("/employer-dashboard");
    } else if (role === "candidate") {
      router.replace("/candidate-dashboard");
    } else if (role === "student") {
      router.replace("/student/dashboard");
    } else if (role === "admin") {
      router.replace("/admin/dashboard");
    } else {
      Alert.alert("Error", "Unknown user role.");
    }
    } catch (err: any) {
      console.log("LOGIN ERROR:", err?.response?.data || err.message);

      Alert.alert(
        "Login failed",
        err?.response?.data?.message || "Invalid credentials"
      );
    } finally {
      setLoading(false);
    }
  };


 return (
  <ScrollView
    style={{ flex: 1, backgroundColor: "#fff" }}
    contentContainerStyle={{ paddingBottom: 40 }}
    keyboardShouldPersistTaps="handled"
  >
    <Image
      source={require("../assets/images/caregiver.jpg")}
      style={{
        width: "100%",
        height: 260,
      }}
      resizeMode="cover"
    />

    <View
      style={{
        marginTop: -35,
        backgroundColor: "#fff",
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        padding: 25,
      }}
    >
      <Image
        source={require("../assets/images/logo.png")}
        style={{
          width: 90,
          height: 90,
          alignSelf: "center",
        }}
        resizeMode="contain"
      />

      <Text
        style={{
          fontSize: 28,
          fontWeight: "bold",
          textAlign: "center",
          color: "#E91E63",
          marginTop: 10,
        }}
      >
        Welcome Back
      </Text>

      <Text
        style={{
          textAlign: "center",
          color: "#777",
          marginTop: 8,
          marginBottom: 30,
        }}
      >
        Login to continue your Nakky Academy journey
      </Text>

      <TextInput
        placeholder="Email Address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{
          backgroundColor: "#F5F5F5",
          borderRadius: 15,
          padding: 16,
          marginBottom: 15,
          fontSize: 16,
        }}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          backgroundColor: "#F5F5F5",
          borderRadius: 15,
          padding: 16,
          fontSize: 16,
        }}
      />

      <TouchableOpacity
        style={{
          alignSelf: "flex-end",
          marginTop: 10,
        }}
      >
        <Text
          style={{
            color: "#E91E63",
            fontWeight: "600",
          }}
        >
          Forgot Password?
        </Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#E91E63"
          style={{ marginTop: 30 }}
        />
      ) : (
        <TouchableOpacity
          onPress={login}
          style={{
            backgroundColor: "#E91E63",
            padding: 18,
            borderRadius: 15,
            marginTop: 25,
          }}
        >
          <Text
            style={{
              color: "#fff",
              textAlign: "center",
              fontSize: 18,
              fontWeight: "bold",
            }}
          >
            LOGIN
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={() => router.push("/register")}
        style={{
          marginTop: 25,
        }}
      >
        <Text
          style={{
            textAlign: "center",
            color: "#666",
            fontSize: 16,
          }}
        >
          Don't have an account?{" "}
          <Text
            style={{
              color: "#E91E63",
              fontWeight: "bold",
            }}
          >
            Create Account
          </Text>
        </Text>
      </TouchableOpacity>
    </View>
  </ScrollView>
); 
}