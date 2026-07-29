import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";
import API from "../src/services/api";

export default function RegisterScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Changed employee -> candidate
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

      Alert.alert("Success", "Account created. Please login.");

      router.replace("/login");
    } catch (err: any) {
      console.log(
        "REGISTER ERROR:",
        err?.response?.data || err.message
      );

      Alert.alert(
        "Registration failed",
        err?.response?.data?.message ||
          "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20, marginTop: 80 }}>
      <Text
        style={{
          fontSize: 24,
          fontWeight: "bold",
        }}
      >
        Create Account
      </Text>

      <TextInput
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
        style={{
          borderWidth: 1,
          marginTop: 20,
          padding: 10,
        }}
      />

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{
          borderWidth: 1,
          marginTop: 10,
          padding: 10,
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
        }}
      />

      <Text
        style={{
          marginTop: 20,
          fontWeight: "bold",
        }}
      >
        Select Role:
      </Text>

      <View style={{ marginTop: 10 }}>
        <Button
          title={`Candidate ${role === "candidate" ? "✔" : ""}`}
          onPress={() => setRole("candidate")}
        />
      </View>

      <View style={{ marginTop: 10 }}>
        <Button
          title={`Employer ${role === "employer" ? "✔" : ""}`}
          onPress={() => setRole("employer")}
        />
      </View>

      <View style={{ marginTop: 10 }}>
        <Button
          title={`Student ${role === "student" ? "✔" : ""}`}
          onPress={() => setRole("student")}
        />
      </View>

      <View style={{ marginTop: 10 }}>
        <Button
          title={`Admin ${role === "admin" ? "✔" : ""}`}
          onPress={() => setRole("admin")}
        />
      </View>

      <View style={{ marginTop: 20 }}>
        <Button
          title={
            loading
              ? "Creating account..."
              : "Register"
          }
          onPress={register}
        />
      </View>

      <View style={{ marginTop: 10 }}>
        <Button
          title="Back to Login"
          onPress={() =>
            router.replace("/login")
          }
        />
      </View>
    </View>
  );
}