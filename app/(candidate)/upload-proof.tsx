import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import * as DocumentPicker from "expo-document-picker";

import API from "../../src/services/api";

// =====================================================
// TYPES
// =====================================================

interface SelectedFile {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
}

// =====================================================
// SCREEN
// =====================================================

export default function UploadProofScreen() {
  const router = useRouter();

  const {
    paymentId,
    paymentReference,
    amount,
  } = useLocalSearchParams<{
    paymentId?: string;
    paymentReference?: string;
    amount?: string;
  }>();

  const [selectedFile, setSelectedFile] =
    useState<SelectedFile | null>(null);

  const [uploading, setUploading] =
    useState(false);

  // =====================================================
  // SELECT PROOF OF PAYMENT
  // =====================================================

  const selectProof = async () => {
    try {
      const result =
        await DocumentPicker.getDocumentAsync({
          type: [
            "image/jpeg",
            "image/png",
            "application/pdf",
          ],
          copyToCacheDirectory: true,
          multiple: false,
        });

      if (result.canceled) {
        return;
      }

      const file =
        result.assets?.[0];

      if (!file?.uri) {
        Alert.alert(
          "Error",
          "The selected file could not be read."
        );

        return;
      }

      const fileName =
        file.name ||
        "payment-proof";

      const mimeType =
        file.mimeType ||
        "application/octet-stream";

      // =================================================
      // VALIDATE FILE TYPE
      // =================================================

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "application/pdf",
      ];

      if (
        !allowedTypes.includes(
          mimeType
        )
      ) {
        Alert.alert(
          "Invalid File",
          "Please select a JPG, PNG, or PDF file."
        );

        return;
      }

      // =================================================
      // VALIDATE FILE SIZE
      // =================================================
      //
      // Keep this validation reasonable for mobile
      // uploads. The backend can still enforce its
      // own upload limits.
      // =================================================

      if (
        file.size &&
        file.size > 10 * 1024 * 1024
      ) {
        Alert.alert(
          "File Too Large",
          "Please select a file smaller than 10 MB."
        );

        return;
      }

      setSelectedFile({
        uri: file.uri,
        name: fileName,
        mimeType,
        size: file.size,
      });
    } catch (error) {
      console.error(
        "DOCUMENT PICKER ERROR:",
        error
      );

      Alert.alert(
        "Error",
        "Failed to select the proof of payment."
      );
    }
  };

  // =====================================================
  // UPLOAD PROOF OF PAYMENT
  // =====================================================

  const uploadProof = async () => {
    if (!paymentId) {
      Alert.alert(
        "Payment Error",
        "The payment ID is missing. Please return to the payment screen and try again."
      );

      return;
    }

    if (!selectedFile) {
      Alert.alert(
        "Proof Required",
        "Please select your proof of payment first."
      );

      return;
    }

    try {
      setUploading(true);

      // =================================================
      // CREATE FORM DATA
      // =================================================

      const formData =
        new FormData();

      formData.append(
        "paymentId",
        String(paymentId)
      );

      formData.append(
        "proof",
        {
          uri: selectedFile.uri,
          name: selectedFile.name,
          type: selectedFile.mimeType,
        } as any
      );

      // =================================================
      // UPLOAD
      // =================================================
      //
      // Authentication is handled centrally by the
      // Axios interceptor in src/services/api.ts.
      //
      // Do NOT manually retrieve AsyncStorage token here.
      // =================================================

      const response =
        await API.post(
          "/payments/upload-proof",
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );

      console.log(
        "PROOF UPLOAD RESPONSE:",
        response.data
      );

      // =================================================
      // SUCCESS
      // =================================================

      Alert.alert(
        "Proof Submitted",
        "Your proof of payment has been submitted successfully. Nakky Academy will review your payment. Once approved, your candidate profile will be verified and your 12-month marketplace subscription will be activated.",
        [
          {
            text: "Go to Dashboard",
            onPress: () => {
              router.replace(
                "/(candidate)/candidate-dashboard" as any
              );
            },
          },
        ]
      );
    } catch (error: any) {
      console.error(
        "PROOF UPLOAD ERROR:",
        error?.response?.data ||
          error?.message ||
          error
      );

      const status =
        error?.response?.status;

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "";

      // =================================================
      // AUTHENTICATION ERROR
      // =================================================

      if (
        status === 401 ||
        status === 403
      ) {
        Alert.alert(
          "Session Expired",
          "Your session has expired. Please login again.",
          [
            {
              text: "OK",
              onPress: () => {
                router.replace(
                  "/login" as any
                );
              },
            },
          ]
        );

        return;
      }

      // =================================================
      // PAYMENT NO LONGER VALID
      // =================================================

      if (
        message
          .toLowerCase()
          .includes("payment")
      ) {
        Alert.alert(
          "Payment Error",
          message ||
            "This payment could not be processed. Please return to the payment screen and try again."
        );

        return;
      }

      // =================================================
      // NORMAL ERROR
      // =================================================

      Alert.alert(
        "Upload Failed",
        message ||
          "Failed to upload your proof of payment. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  // =====================================================
  // PAYMENT INFORMATION
  // =====================================================

  const displayAmount =
    amount
      ? `R${amount}`
      : "R200";

  const displayReference =
    paymentReference ||
    "Payment reference unavailable";

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
    >
      {/* =================================================
          TITLE
      ================================================= */}

      <Text style={styles.title}>
        Upload Proof of Payment
      </Text>

      <Text style={styles.subtitle}>
        Upload your EFT proof so that
        Nakky Academy can verify your
        payment.
      </Text>

      {/* =================================================
          PAYMENT DETAILS
      ================================================= */}

      <View style={styles.paymentCard}>
        <Text style={styles.cardTitle}>
          Payment Details
        </Text>

        <Text style={styles.label}>
          Amount
        </Text>

        <Text style={styles.value}>
          {displayAmount}
        </Text>

        <Text style={styles.label}>
          Payment Reference
        </Text>

        <Text style={styles.reference}>
          {displayReference}
        </Text>
      </View>

      {/* =================================================
          IMPORTANT INFORMATION
      ================================================= */}

      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>
          Important
        </Text>

        <Text style={styles.infoText}>
          Your R200 payment is for both
          candidate verification and your
          annual marketplace subscription.
        </Text>

        <Text style={styles.infoText}>
          Once your payment has been
          approved, your profile will receive
          a verified badge and your
          12-month marketplace subscription
          will become active.
        </Text>

        <Text style={styles.infoText}>
          An active subscription allows you
          to communicate directly with
          active employers.
        </Text>
      </View>

      {/* =================================================
          FILE REQUIREMENTS
      ================================================= */}

      <View style={styles.requirementsCard}>
        <Text style={styles.cardTitle}>
          Proof Requirements
        </Text>

        <Text style={styles.requirement}>
          • JPG or JPEG image
        </Text>

        <Text style={styles.requirement}>
          • PNG image
        </Text>

        <Text style={styles.requirement}>
          • PDF document
        </Text>

        <Text style={styles.requirement}>
          • Maximum file size: 10 MB
        </Text>

        <Text style={styles.requirement}>
          • The proof should clearly show
          the payment reference and amount
        </Text>
      </View>

      {/* =================================================
          SELECT FILE
      ================================================= */}

      <TouchableOpacity
        style={styles.selectButton}
        onPress={selectProof}
        disabled={uploading}
      >
        <Text style={styles.selectButtonText}>
          {selectedFile
            ? "Choose Different File"
            : "Select Proof of Payment"}
        </Text>
      </TouchableOpacity>

      {/* =================================================
          SELECTED FILE
      ================================================= */}

      {selectedFile && (
        <View style={styles.fileCard}>
          <Text style={styles.fileTitle}>
            Selected File
          </Text>

          <Text
            style={styles.fileName}
            numberOfLines={2}
          >
            {selectedFile.name}
          </Text>

          <Text style={styles.fileType}>
            {selectedFile.mimeType}
          </Text>

          {selectedFile.size && (
            <Text style={styles.fileSize}>
              {(
                selectedFile.size /
                (1024 * 1024)
              ).toFixed(2)}{" "}
              MB
            </Text>
          )}
        </View>
      )}

      {/* =================================================
          UPLOAD BUTTON
      ================================================= */}

      <TouchableOpacity
        style={[
          styles.uploadButton,
          (!selectedFile ||
            uploading) &&
            styles.disabledButton,
        ]}
        onPress={uploadProof}
        disabled={
          !selectedFile ||
          uploading
        }
      >
        {uploading ? (
          <>
            <ActivityIndicator
              color="#fff"
              size="small"
            />

            <Text
              style={
                styles.uploadButtonText
              }
            >
              Uploading...
            </Text>
          </>
        ) : (
          <Text
            style={
              styles.uploadButtonText
            }
          >
            Submit Proof of Payment
          </Text>
        )}
      </TouchableOpacity>

      {/* =================================================
          FOOTER NOTE
      ================================================= */}

      <Text style={styles.note}>
        Do not submit the same proof multiple
        times. Once submitted, Nakky Academy
        will review your payment and update
        your verification and subscription
        status.
      </Text>
    </ScrollView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  content: {
    padding: 20,
    paddingBottom: 50,
  },

  title: {
    fontSize: 27,
    fontWeight: "bold",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 16,
    color: "#666",
    lineHeight: 23,
    marginBottom: 20,
  },

  paymentCard: {
    backgroundColor: "#f5f5f5",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },

  infoCard: {
    backgroundColor: "#eef6ff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },

  requirementsCard: {
    backgroundColor: "#fff8e1",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },

  label: {
    fontSize: 13,
    color: "#777",
    marginTop: 10,
  },

  value: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 4,
  },

  reference: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 4,
    letterSpacing: 1,
  },

  infoText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 10,
  },

  requirement: {
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 6,
  },

  selectButton: {
    backgroundColor: "#000",
    padding: 17,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
  },

  selectButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  fileCard: {
    backgroundColor: "#fdf1f7",
    padding: 18,
    borderRadius: 12,
    marginBottom: 20,
  },

  fileTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },

  fileName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    lineHeight: 21,
  },

  fileType: {
    fontSize: 13,
    color: "#666",
    marginTop: 6,
  },

  fileSize: {
    fontSize: 13,
    color: "#666",
    marginTop: 3,
  },

  uploadButton: {
    backgroundColor: "#d81b60",
    padding: 17,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    minHeight: 55,
  },

  disabledButton: {
    backgroundColor: "#bbb",
  },

  uploadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },

  note: {
    textAlign: "center",
    color: "#777",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 18,
  },
});