import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import ImageCarousel from "../components/ImageCarousel";
import API from "../src/services/api";

export default function RegisterScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [role, setRole] = useState("candidate");

  const [loading, setLoading] = useState(false);

  const register = async () => {

    // ==============================
    // REQUIRED FIELDS
    // ==============================

    if (
      !name ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert(
        "Error",
        "Please fill all fields"
      );
      return;
    }

    // ==============================
    // PASSWORD MATCH
    // ==============================

    if (password !== confirmPassword) {
      Alert.alert(
        "Password Mismatch",
        "The passwords do not match. Please check both password fields."
      );
      return;
    }

    // ==============================
    // PASSWORD LENGTH
    // ==============================

    if (password.length < 6) {
      Alert.alert(
        "Password Too Short",
        "Your password must be at least 6 characters long."
      );
      return;
    }

    try {
      setLoading(true);

      await API.post("/auth/register", {
        name,
        email,
        password,
        role,
      });

      Alert.alert(
        "Success",
        "Your account has been created successfully."
      );

      router.replace("/login");

    } catch (err: any) {

      console.log(
        "REGISTER ERROR:",
        err?.response?.data ||
          err.message
      );

      Alert.alert(
        "Registration failed",
        err?.response?.data?.message ||
          "Something went wrong."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.scrollContent
      }
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >

      {/* LOGO */}

      <Image
        source={require(
          "../assets/images/logo.png"
        )}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>
        Create Account
      </Text>

      <Text style={styles.subtitle}>
        Join thousands of caregivers,
        employers and students building
        better careers.
      </Text>

      <View style={styles.carouselSpacer}>
        <ImageCarousel />
      </View>

      {/* FULL NAME */}

      <TextInput
        placeholder="Full Name"
        placeholderTextColor="#777777"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        autoCorrect={false}
        style={styles.input}
      />

      {/* EMAIL */}

      <TextInput
        placeholder="Email Address"
        placeholderTextColor="#777777"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
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
        textContentType="newPassword"
        style={styles.input}
      />

      {/* CONFIRM PASSWORD */}

      <TextInput
        placeholder="Confirm Password"
        placeholderTextColor="#777777"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry={true}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="newPassword"
        style={[
          styles.input,
          password &&
            confirmPassword &&
            password !== confirmPassword &&
            styles.passwordMismatch,
        ]}
      />

      {/* PASSWORD MATCH MESSAGE */}

      {password &&
        confirmPassword &&
        password !== confirmPassword && (
          <Text style={styles.passwordError}>
            Passwords do not match.
          </Text>
        )}

      {password &&
        confirmPassword &&
        password === confirmPassword && (
          <Text style={styles.passwordSuccess}>
            ✓ Passwords match.
          </Text>
        )}

      {/* ROLE */}

      <Text style={styles.roleTitle}>
        I want to join as:
      </Text>

      <View style={styles.roleContainer}>

        {/* CANDIDATE */}

        <TouchableOpacity
          style={[
            styles.roleButton,
            role === "candidate" &&
              styles.selectedRole,
          ]}
          onPress={() =>
            setRole("candidate")
          }
        >
          <Text
            style={[
              styles.roleText,
              role === "candidate" &&
                styles.selectedRoleText,
            ]}
          >
            👩‍⚕️ Candidate
          </Text>
        </TouchableOpacity>

        {/* EMPLOYER */}

        <TouchableOpacity
          style={[
            styles.roleButton,
            role === "employer" &&
              styles.selectedRole,
          ]}
          onPress={() =>
            setRole("employer")
          }
        >
          <Text
            style={[
              styles.roleText,
              role === "employer" &&
                styles.selectedRoleText,
            ]}
          >
            🏠 Employer
          </Text>
        </TouchableOpacity>

        {/* STUDENT */}

        <TouchableOpacity
          style={[
            styles.roleButton,
            role === "student" &&
              styles.selectedRole,
          ]}
          onPress={() =>
            setRole("student")
          }
        >
          <Text
            style={[
              styles.roleText,
              role === "student" &&
                styles.selectedRoleText,
            ]}
          >
            🎓 Student
          </Text>
        </TouchableOpacity>

      </View>

      {/* REGISTER */}

      {loading ? (

        <ActivityIndicator
          size="large"
          color="#E91E63"
          style={styles.loader}
        />

      ) : (

        <>
          <TouchableOpacity
            style={styles.registerButton}
            onPress={register}
          >
            <Text style={styles.registerText}>
              CREATE ACCOUNT
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() =>
              router.replace("/login")
            }
          >
            <Text style={styles.loginText}>
              Already have an account? Login
            </Text>
          </TouchableOpacity>
        </>

      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
  },

  scrollContent: {
    paddingBottom: 40,
  },

  logo: {
    width: 120,
    height: 120,
    alignSelf: "center",
    marginTop: 40,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    color: "#E91E63",
  },

  subtitle: {
    textAlign: "center",
    color: "#666666",
    fontSize: 16,
    marginTop: 10,
    marginBottom: 25,
    lineHeight: 22,
  },

  carouselSpacer: {
    marginBottom: 25,
  },

  input: {
    backgroundColor: "#F7F7F7",
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    marginBottom: 15,

    // IMPORTANT:
    // Makes typed text clearly visible
    color: "#222222",

    borderWidth: 1,
    borderColor: "#E5E5E5",
  },

  passwordMismatch: {
    borderColor: "#D32F2F",
  },

  passwordError: {
    color: "#D32F2F",
    fontSize: 13,
    marginTop: -8,
    marginBottom: 12,
  },

  passwordSuccess: {
    color: "#2E7D32",
    fontSize: 13,
    marginTop: -8,
    marginBottom: 12,
  },

  roleTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333333",
  },

  roleContainer: {
    marginBottom: 25,
  },

  roleButton: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    marginBottom: 12,
  },

  selectedRole: {
    backgroundColor: "#E91E63",
    borderColor: "#E91E63",
  },

  roleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    textAlign: "center",
  },

  selectedRoleText: {
    color: "#FFFFFF",
  },

  loader: {
    marginTop: 25,
  },

  registerButton: {
    backgroundColor: "#E91E63",
    padding: 18,
    borderRadius: 15,
    marginTop: 10,
  },

  registerText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },

  loginButton: {
    marginTop: 15,
    marginBottom: 30,
  },

  loginText: {
    textAlign: "center",
    color: "#E91E63",
    fontWeight: "bold",
    fontSize: 16,
  },

});