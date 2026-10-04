import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import ImageCarousel from "../components/ImageCarousel";
import API from "../src/services/api";

export default function LoginScreen() {
  console.log("LOGIN SCREEN LOADED");

  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!email || !password) {
      Alert.alert(
        "Error",
        "Please enter email and password"
      );
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

      // 2. Save token
      await AsyncStorage.setItem(
        "token",
        token
      );

      // Save logged-in user
      await AsyncStorage.setItem(
        "user",
        JSON.stringify(res.data.user)
      );

      // 3. Attach token to future requests
      API.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;

      // 4. Get dashboard to detect role
      const dashboardRes =
        await API.get("/dashboard");

      const role =
        dashboardRes.data.role;

      console.log("USER ROLE:", role);

      Alert.alert(
        "Success",
        `Logged in as ${role}`
      );

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
        Alert.alert(
          "Error",
          "Unknown user role."
        );
      }

    } catch (err: any) {

      console.log(
        "LOGIN ERROR:",
        err?.response?.data ||
          err.message
      );

      Alert.alert(
        "Login failed",
        err?.response?.data?.message ||
          "Invalid credentials"
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : "height"
      }
      keyboardVerticalOffset={20}
    >

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={
          styles.scrollContent
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        <ImageCarousel />

        <View style={styles.formContainer}>

          <Image
            source={require(
              "../assets/images/logo.png"
            )}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>
            Welcome Back
          </Text>

          <Text style={styles.subtitle}>
            Login to continue your Nakky
            Academy journey
          </Text>

          {/* EMAIL */}

          <TextInput
            placeholder="Email Address"
            placeholderTextColor="#777777"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            style={styles.input}
          />

          {/* PASSWORD */}

          <TextInput
            placeholder="Password"
            placeholderTextColor="#777777"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={true}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            style={styles.input}
          />

          <TouchableOpacity
            style={styles.forgotButton}
          >
            <Text style={styles.forgotText}>
              Forgot Password?
            </Text>
          </TouchableOpacity>

          {loading ? (

            <ActivityIndicator
              size="large"
              color="#E91E63"
              style={styles.loader}
            />

          ) : (

            <TouchableOpacity
              onPress={login}
              style={styles.loginButton}
            >
              <Text style={styles.loginButtonText}>
                LOGIN
              </Text>
            </TouchableOpacity>

          )}

          <TouchableOpacity
            onPress={() =>
              router.push("/register")
            }
            style={styles.createAccountButton}
          >
            <Text style={styles.createAccountText}>
              Don't have an account?{" "}
              <Text
                style={
                  styles.createAccountLink
                }
              >
                Create Account
              </Text>
            </Text>
          </TouchableOpacity>

        </View>

      </ScrollView>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({

  scrollView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  scrollContent: {
    paddingBottom: 60,
  },

  formContainer: {
    marginTop: -35,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: 25,
  },

  logo: {
    width: 90,
    height: 90,
    alignSelf: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: "#E91E63",
    marginTop: 10,
  },

  subtitle: {
    textAlign: "center",
    color: "#777777",
    marginTop: 8,
    marginBottom: 30,
    fontSize: 15,
  },

  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 15,
    padding: 16,
    marginBottom: 15,
    fontSize: 16,

    // IMPORTANT:
    // Makes typed text clearly visible
    color: "#222222",

    borderWidth: 1,
    borderColor: "#E2E2E2",
  },

  forgotButton: {
    alignSelf: "flex-end",
    marginTop: -5,
  },

  forgotText: {
    color: "#E91E63",
    fontWeight: "600",
  },

  loader: {
    marginTop: 30,
  },

  loginButton: {
    backgroundColor: "#E91E63",
    padding: 18,
    borderRadius: 15,
    marginTop: 25,
  },

  loginButtonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },

  createAccountButton: {
    marginTop: 25,
  },

  createAccountText: {
    textAlign: "center",
    color: "#666666",
    fontSize: 16,
  },

  createAccountLink: {
    color: "#E91E63",
    fontWeight: "bold",
  },

});