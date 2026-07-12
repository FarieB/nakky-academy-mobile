import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Text,
  TextInput,
  View,
} from "react-native";
import API from "../src/services/api";

export default function LoginScreen() {
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
  router.replace("/employer/dashboard");
} else if (role === "employee") {
  router.replace("/employee/dashboard");
} else if (role === "student") {
  router.replace("/student/dashboard");
} else if (role === "admin") {
  router.replace("/admin/dashboard");
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
    <View style={{ padding: 20, marginTop: 100 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>
        Nakky Academy Login
      </Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{
          borderWidth: 1,
          marginTop: 20,
          padding: 10,
          borderRadius: 5,
        }}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          borderWidth: 1,
          marginTop: 10,
          padding: 10,
          borderRadius: 5,
        }}
      />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <View style={{ marginTop: 20 }}>
          <Button title="Login" onPress={login} />

          <View style={{ marginTop: 10 }}>
            <Button
              title="Create Account"
              onPress={() => router.push("/register")}
            />
          </View>
        </View>
      )}
    </View>
  );
}