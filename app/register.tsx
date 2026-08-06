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

  const [role, setRole] = useState("candidate");

  const [loading, setLoading] = useState(false);

  const register = async () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "Please fill all fields");
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
        err?.response?.data || err.message
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
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <Image
        source={require("../assets/images/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>Create Account</Text>

      <Text style={styles.subtitle}>
        Join thousands of caregivers, employers and students building better careers.
      </Text>

      <View style={styles.carouselSpacer}>
          <ImageCarousel />
      </View> 

      <TextInput
        placeholder="Full Name"
        placeholderTextColor="#999"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      <TextInput
        placeholder="Email Address"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <Text style={styles.roleTitle}>
        I want to join as:
      </Text>

      <View style={styles.roleContainer}>
        <TouchableOpacity
          style={[
            styles.roleButton,
            role === "candidate" && styles.selectedRole,
          ]}
          onPress={() => setRole("candidate")}
        >
          <Text
            style={[
              styles.roleText,
              role === "candidate" && styles.selectedRoleText,
            ]}
          >
            👩‍⚕️ Candidate
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.roleButton,
            role === "employer" && styles.selectedRole,
          ]}
          onPress={() => setRole("employer")}
        >
          <Text
            style={[
              styles.roleText,
              role === "employer" && styles.selectedRoleText,
            ]}
          >
            🏠 Employer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.roleButton,
            role === "student" && styles.selectedRole,
          ]}
          onPress={() => setRole("student")}
        >
          <Text
            style={[
              styles.roleText,
              role === "student" && styles.selectedRoleText,
            ]}
          >
            🎓 Student
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#E91E63"
          style={{ marginTop: 25 }}
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
            onPress={() => router.replace("/login")}
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
    backgroundColor: "#fff",
    paddingHorizontal: 24,
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
    color: "#666",
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
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },

  roleTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },

  roleContainer: {
    marginBottom: 25,
  },

  roleButton: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DDD",
    marginBottom: 12,
  },

  selectedRole: {
    backgroundColor: "#E91E63",
    borderColor: "#E91E63",
  },

  roleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },

  selectedRoleText: {
    color: "#fff",
  },

  registerButton: {
    backgroundColor: "#E91E63",
    padding: 18,
    borderRadius: 15,
    marginTop: 10,
  },

  registerText: {
    color: "#fff",
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