import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";

import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
    courseId,
    paymentReference,
    amount,
    courseTitle,
  } = useLocalSearchParams<{
    paymentId?: string;
    courseId?: string;
    paymentReference?: string;
    amount?: string;
    courseTitle?: string;
  }>();


  const [selectedFile, setSelectedFile] =
    useState<SelectedFile | null>(null);

  const [uploading, setUploading] =
    useState(false);

  const [loadingPayment, setLoadingPayment] =
    useState(false);

  const [paymentInfo, setPaymentInfo] =
    useState<any>(null);


  // ===================================================
  // LOAD PAYMENT INFORMATION
  // ===================================================

  useEffect(() => {

    if (paymentId) {
      loadPayment();
    }

  }, [paymentId]);


  const loadPayment = async () => {

    try {

      setLoadingPayment(true);

      const token =
        await AsyncStorage.getItem("token");

      if (!token) {
        throw new Error(
          "Authentication token not found."
        );
      }


      const response =
        await API.get("/payments/my", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });


      const payments = Array.isArray(response.data)
        ? response.data
        : response.data?.payments || [];


      const payment = payments.find(
        (item: any) =>
          item._id === paymentId
      );


      if (payment) {

        setPaymentInfo(payment);

      }

    } catch (error: any) {

      console.error(
        "LOAD PAYMENT ERROR:",
        error?.response?.data || error
      );

    } finally {

      setLoadingPayment(false);

    }

  };


  // ===================================================
  // PICK PROOF OF PAYMENT
  // ===================================================

  const pickProof = async () => {

    try {

      const result =
        await DocumentPicker.getDocumentAsync({
          type: [
            "image/jpeg",
            "image/png",
            "application/pdf",
          ],
          copyToCacheDirectory: true,
        });


      if (result.canceled) {
        return;
      }


      const asset = result.assets?.[0];


      if (!asset) {

        Alert.alert(
          "Error",
          "No file was selected."
        );

        return;

      }


      // Basic size protection.
      // 10 MB maximum.
      if (
        asset.size &&
        asset.size > 10 * 1024 * 1024
      ) {

        Alert.alert(
          "File Too Large",
          "Please select a proof of payment smaller than 10 MB."
        );

        return;

      }


      console.log(
        "SELECTED PROOF:",
        asset
      );


      setSelectedFile({
        uri: asset.uri,
        name:
          asset.name ||
          `proof-${Date.now()}`,
        mimeType:
          asset.mimeType ||
          "application/octet-stream",
        size: asset.size,
      });


    } catch (error) {

      console.log(
        "FILE PICKER ERROR:",
        error
      );

      Alert.alert(
        "Error",
        "Failed to select proof of payment."
      );

    }

  };


  // ===================================================
  // REMOVE SELECTED FILE
  // ===================================================

  const removeFile = () => {

    setSelectedFile(null);

  };


  // ===================================================
  // UPLOAD PROOF
  // ===================================================

  const uploadProof = async () => {

    if (!paymentId) {

      Alert.alert(
        "Payment Error",
        "No payment ID was found. Please return to the course payment page and try again."
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


    if (!canUploadProof) {

      Alert.alert(
        "Payment Unavailable",
        paymentStatus === "paid"
          ? "This payment has already been approved."
          : "This payment is no longer available for proof submission."
      );

      return;

    }


    try {

      setUploading(true);

      const token =
        await AsyncStorage.getItem("token");

      if (!token) {

        Alert.alert(
          "Session Expired",
          "Please log in again before uploading your proof."
        );

        return;

      }


      const formData = new FormData();


      formData.append(
        "paymentId",
        String(paymentId)
      );


      formData.append(
        "proof",
        {
          uri: selectedFile.uri,

          name:
            selectedFile.name ||
            "proof-of-payment.pdf",

          type:
            selectedFile.mimeType ||
            "application/pdf",

        } as any
      );


      console.log(
        "UPLOADING STUDENT PROOF FOR PAYMENT:",
        paymentId
      );

      console.log(
        "SELECTED FILE:",
        {
          uri: selectedFile.uri,
          name: selectedFile.name,
          mimeType: selectedFile.mimeType,
          size: selectedFile.size,
        }
      );


      const response = await API.post(
        "/payments/upload-proof",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,

            "Content-Type":
              "multipart/form-data",
          },
        }
      );


      console.log(
        "UPLOAD RESPONSE:",
        response.data
      );


      Alert.alert(
        "Proof Submitted Successfully",
        "Your proof of payment has been submitted successfully. Nakky Academy will review and verify your payment.",
        [
          {
            text: "OK",
            onPress: () =>
              router.replace({
                pathname:
                  "/(student)/course-details",
                params: {
                  id: String(courseId),
                },
              }),
          },
        ]
      );


    } catch (err: any) {

      console.log(
        "UPLOAD ERROR:",
        err?.response?.data ||
        err?.message
      );

      Alert.alert(
        "Upload Failed",
        err?.response?.data?.message ||
        "Failed to upload proof of payment. Please try again."
      );

    } finally {

      setUploading(false);

    }

  };


  // ===================================================
  // PAYMENT DETAILS
  // ===================================================

  const displayedReference =
    paymentInfo?.paymentReference ||
    paymentReference ||
    "Not available";


  const displayedAmount =
    paymentInfo?.amount ??
    (amount
      ? Number(amount)
      : null);


  const proofStatus =
    paymentInfo?.proofStatus ||
    "not_submitted";


  const paymentStatus =
    paymentInfo?.status || "pending";

  const canUploadProof =
    paymentStatus === "pending";

  const proofAlreadySubmitted =
    proofStatus === "submitted";


  // ===================================================
  // RENDER
  // ===================================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
    >

      {/* HEADER */}

      <Text style={styles.title}>
        Upload Proof of Payment
      </Text>

      <Text style={styles.subtitle}>
        Submit your EFT proof of payment for verification.
      </Text>


      {/* PAYMENT DETAILS */}

      <View style={styles.card}>

        <Text style={styles.sectionTitle}>
          Payment Details
        </Text>


        {courseTitle ? (
          <View style={styles.detailRow}>

            <Text style={styles.label}>
              Course
            </Text>

            <Text style={styles.value}>
              {courseTitle}
            </Text>

          </View>
        ) : null}


        <View style={styles.detailRow}>

          <Text style={styles.label}>
            Payment Reference
          </Text>

          <Text style={styles.reference}>
            {displayedReference}
          </Text>

        </View>


        {displayedAmount !== null && (
          <View style={styles.detailRow}>

            <Text style={styles.label}>
              Amount
            </Text>

            <Text style={styles.amount}>
              R {Number(displayedAmount).toFixed(2)}
            </Text>

          </View>
        )}


        <View style={styles.detailRow}>

          <Text style={styles.label}>
            Payment Method
          </Text>

          <Text style={styles.value}>
            EFT
          </Text>

        </View>


        <View style={styles.detailRow}>

          <Text style={styles.label}>
            Proof Status
          </Text>

          <Text style={styles.value}>
            {proofStatus
              .replace("_", " ")
              .toUpperCase()}
          </Text>

        </View>

      </View>


      {/* INSTRUCTIONS */}

      <View style={styles.instructionCard}>

        <Text style={styles.sectionTitle}>
          Before Uploading
        </Text>

        <Text style={styles.instruction}>
          • Make sure the payment reference on your bank confirmation matches the reference shown above.
        </Text>

        <Text style={styles.instruction}>
          • Make sure the payment amount is correct.
        </Text>

        <Text style={styles.instruction}>
          • The proof must clearly show the transaction details.
        </Text>

        <Text style={styles.instruction}>
          • Accepted formats: JPG, PNG and PDF.
        </Text>

        <Text style={styles.instruction}>
          • Maximum file size: 10 MB.
        </Text>

      </View>


      {/* SELECT FILE */}

      {!selectedFile ? (

        <TouchableOpacity
          style={styles.selectButton}
          onPress={pickProof}
          disabled={uploading}
        >

          <Text style={styles.selectButtonText}>
            Select Proof of Payment
          </Text>

        </TouchableOpacity>

      ) : (

        <View style={styles.fileCard}>

          {/* IMAGE PREVIEW */}

          {selectedFile.mimeType.startsWith(
            "image/"
          ) && (

            <Image
              source={{
                uri: selectedFile.uri,
              }}
              style={styles.preview}
              resizeMode="contain"
            />

          )}


          <Text
            style={styles.fileName}
            numberOfLines={2}
          >
            {selectedFile.name}
          </Text>


          {selectedFile.size && (
            <Text style={styles.fileSize}>
              {(selectedFile.size / 1024 / 1024).toFixed(2)}
              {" MB"}
            </Text>
          )}


          <View style={styles.fileActions}>

            <TouchableOpacity
              style={styles.changeButton}
              onPress={pickProof}
              disabled={uploading}
            >

              <Text style={styles.changeText}>
                Change File
              </Text>

            </TouchableOpacity>


            <TouchableOpacity
              style={styles.removeButton}
              onPress={removeFile}
              disabled={uploading}
            >

              <Text style={styles.removeText}>
                Remove
              </Text>

            </TouchableOpacity>

          </View>

        </View>

      )}


      {/* UPLOAD BUTTON */}

      {selectedFile && (

        <TouchableOpacity
          style={[
            styles.uploadButton,
            uploading &&
              styles.disabledButton,
          ]}
          onPress={uploadProof}
          disabled={uploading}
        >

          {uploading ? (

            <View style={styles.loadingRow}>

              <ActivityIndicator
                size="small"
                color="#fff"
              />

              <Text style={styles.uploadText}>
                Uploading...
              </Text>

            </View>

          ) : (

            <Text style={styles.uploadText}>
              Submit Proof of Payment
            </Text>

          )}

        </TouchableOpacity>

      )}


      {/* WAITING MESSAGE */}

      <View style={styles.warningCard}>

        <Text style={styles.warningTitle}>
          Important
        </Text>

        <Text style={styles.warningText}>
          Uploading your proof does not automatically unlock the course. An administrator must verify and approve the payment first.
        </Text>

      </View>


      {/* BACK */}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() =>
          courseId
            ? router.replace({
                pathname:
                  "/(student)/course-details",
                params: {
                  id: String(courseId),
                },
              })
            : router.back()
        }
        disabled={uploading}
      >

        <Text style={styles.backText}>
          Back
        </Text>

      </TouchableOpacity>


      {loadingPayment && (
        <Text style={styles.loadingPayment}>
          Loading payment information...
        </Text>
      )}

    </ScrollView>
  );

}


// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#f5f6f8",
  },

  content: {
    padding: 20,
    paddingBottom: 50,
  },

  title: {
    fontSize: 27,
    fontWeight: "700",
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 14,
    color: "#666",
    lineHeight: 21,
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    elevation: 2,
  },

  instructionCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 8,
    gap: 12,
  },

  label: {
    flex: 1,
    fontSize: 13,
    color: "#777",
  },

  value: {
    flex: 1.2,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
  },

  reference: {
    flex: 1.2,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
  },

  amount: {
    flex: 1.2,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "right",
  },

  instruction: {
    fontSize: 14,
    color: "#555",
    lineHeight: 21,
    marginBottom: 8,
  },

  selectButton: {
    backgroundColor: "#eef3ff",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 14,
  },

  selectButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },

  fileCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
  },

  preview: {
    width: "100%",
    height: 220,
    marginBottom: 12,
    borderRadius: 8,
  },

  fileName: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },

  fileSize: {
    textAlign: "center",
    marginTop: 4,
    color: "#777",
    fontSize: 12,
  },

  fileActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  changeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 9,
    backgroundColor: "#eef3ff",
    alignItems: "center",
  },

  changeText: {
    fontWeight: "700",
  },

  removeButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 9,
    backgroundColor: "#f8dddd",
    alignItems: "center",
    justifyContent: "center",
  },

  removeText: {
    fontWeight: "700",
  },

  uploadButton: {
    backgroundColor: "#1f7a45",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 14,
  },

  uploadText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  disabledButton: {
    opacity: 0.6,
  },

  warningCard: {
    backgroundColor: "#fff8e1",
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
    marginBottom: 14,
  },

  warningTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
  },

  warningText: {
    fontSize: 13,
    color: "#665500",
    lineHeight: 20,
  },

  backButton: {
    paddingVertical: 13,
    alignItems: "center",
  },

  backText: {
    fontSize: 14,
    fontWeight: "600",
  },

  loadingPayment: {
    textAlign: "center",
    marginTop: 10,
    color: "#777",
  },

});