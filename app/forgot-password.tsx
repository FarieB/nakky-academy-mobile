
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import API from "../src/services/api";

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleForgotPassword = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    setMessage("");
    setError(false);
    setSubmitted(false);

    if (!normalizedEmail) {
      setMessage("Please enter your email address.");
      setError(true);
      return;
    }

    setLoading(true);

    try {
      const response = await API.post("/auth/forgot-password", {
        email: normalizedEmail,
      });

      setSubmitted(true);
      setMessage(
        response.data?.message ||
          "If an account exists for that email, password reset instructions will be sent."
      );
    } catch (err: any) {
      const serverMessage = err?.response?.data?.message;

      setError(true);
      setMessage(
        serverMessage ||
          "We could not process your request. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Forgot Password",
          headerShown: true,
          headerStyle: { backgroundColor: "#171717" },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontWeight: "700" },
        }}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Text style={styles.lockIcon}>🔐</Text>
            </View>

            <Text style={styles.brand}>
              NAKKY <Text style={styles.brandPink}>ACADEMY</Text>
            </Text>

            <Text style={styles.heading}>Forgot your password?</Text>

            <Text style={styles.description}>
              Enter the email address linked to your account. If an account
              exists, we will send you instructions to reset your password.
            </Text>

            {message ? (
              <View
                style={[
                  styles.messageBox,
                  error ? styles.errorBox : styles.successBox,
                ]}
                accessibilityRole="alert"
              >
                <Text
                  style={[
                    styles.messageText,
                    error ? styles.errorText : styles.successText,
                  ]}
                >
                  {message}
                </Text>
              </View>
            ) : null}

            {!submitted && (
              <>
                <Text style={styles.label}>Email address</Text>

                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your registered email"
                  placeholderTextColor="#888888"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  editable={!loading}
                  returnKeyType="send"
                  onSubmitEditing={handleForgotPassword}
                  accessibilityLabel="Email address"
                />

                <TouchableOpacity
                  style={[
                    styles.button,
                    loading && styles.buttonDisabled,
                  ]}
                  onPress={handleForgotPassword}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>
                      Send Reset Instructions
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {submitted && (
              <TouchableOpacity
                style={styles.button}
                onPress={() => router.replace("/login")}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>
                  Return to Login
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace("/login")}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.backButtonText}>
                Back to Login
              </Text>
            </TouchableOpacity>

            <Text style={styles.footer}>
              Nakky Academy · Secure account recovery
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7FA",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 25,
    elevation: 4,
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#FCE7F3",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 18,
  },
  lockIcon: {
    fontSize: 30,
  },
  brand: {
    textAlign: "center",
    fontSize: 19,
    fontWeight: "900",
    color: "#171717",
    letterSpacing: 0.5,
    marginBottom: 22,
  },
  brandPink: {
    color: "#D41475",
  },
  heading: {
    fontSize: 25,
    fontWeight: "800",
    color: "#171717",
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: "#666666",
    textAlign: "center",
    marginBottom: 25,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 8,
  },
  input: {
    width: "100%",
    height: 52,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 9,
    paddingHorizontal: 14,
    color: "#171717",
    backgroundColor: "#FFFFFF",
    fontSize: 15,
    marginBottom: 18,
  },
  button: {
    minHeight: 52,
    paddingHorizontal: 14,
    backgroundColor: "#D41475",
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  messageBox: {
    padding: 13,
    borderRadius: 9,
    marginBottom: 18,
  },
  errorBox: {
    backgroundColor: "#FEF3F2",
  },
  successBox: {
    backgroundColor: "#ECFDF3",
  },
  messageText: {
    fontSize: 13,
    lineHeight: 19,
  },
  errorText: {
    color: "#B42318",
  },
  successText: {
    color: "#18794E",
  },
  backButton: {
    alignItems: "center",
    paddingVertical: 17,
  },
  backButtonText: {
    color: "#D41475",
    fontSize: 14,
    fontWeight: "700",
  },
  footer: {
    marginTop: 8,
    fontSize: 11,
    textAlign: "center",
    color: "#888888",
  },
});
