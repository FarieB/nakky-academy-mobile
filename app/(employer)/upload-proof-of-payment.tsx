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


export default function UploadProofOfPaymentScreen() {

  const router = useRouter();

  const {
    paymentId,
    subscriptionId,
    paymentReference,
    amount,
    planName,
  } = useLocalSearchParams();


  const [file, setFile] = useState<any>(null);

  const [uploading, setUploading] =
    useState(false);


  // ==========================================
  // SELECT FILE
  // ==========================================

  const selectProof = async () => {

    try {

      const result =
        await DocumentPicker.getDocumentAsync({

          type: [
            "application/pdf",
            "image/*",
          ],

          copyToCacheDirectory: true,

        });


      if (result.canceled) {
        return;
      }


      const selectedFile =
        result.assets?.[0];


      if (!selectedFile) {
        return;
      }


      console.log(
        "SELECTED PROOF:",
        selectedFile
      );


      setFile(selectedFile);

    }

    catch (error) {

      console.log(
        "DOCUMENT PICKER ERROR:",
        error
      );


      Alert.alert(
        "Error",
        "Unable to select proof of payment."
      );

    }

  };


  // ==========================================
  // UPLOAD PROOF
  // ==========================================

  const uploadProof = async () => {

    if (!file) {

      Alert.alert(
        "Proof Required",
        "Please select your proof of payment first."
      );

      return;

    }


    try {

      setUploading(true);


      const formData = new FormData();


      formData.append(
        "proof",
        {
          uri: file.uri,

          name:
            file.name ||
            "proof-of-payment",

          type:
            file.mimeType ||
            "application/octet-stream",

        } as any
      );


      formData.append(
        "paymentId",
        String(paymentId)
      );


      const response =
        await API.post(

          "/payments/upload-proof",

          formData,

          {

            headers: {

              "Content-Type":
                "multipart/form-data"

            }

          }

        );


      console.log(
        "UPLOAD RESPONSE:",
        response.data
      );


      Alert.alert(

        "Proof Submitted",

        "Your proof of payment has been submitted successfully. Nakky Academy will review and verify your payment before activating your subscription.",

        [

          {

            text: "OK",

            onPress: () =>
              router.replace(
                "/(employer)/employer-dashboard"
              )

          }

        ]

      );

    }

    catch (err: any) {

      console.log(
        "UPLOAD ERROR:",
        err?.response?.data || err.message
      );


      Alert.alert(

        "Upload Failed",

        err?.response?.data?.message ||
          "Failed to upload proof of payment."

      );

    }

    finally {

      setUploading(false);

    }

  };


  return (

    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >

      <Text style={styles.title}>
        Upload Proof of Payment
      </Text>


      <Text style={styles.subtitle}>

        Please upload the proof of your EFT payment.

      </Text>


      {/* PAYMENT SUMMARY */}

      <View style={styles.card}>

        <Text style={styles.sectionTitle}>
          Payment Summary
        </Text>


        <Text style={styles.label}>
          Subscription
        </Text>

        <Text style={styles.value}>
          {planName}
        </Text>


        <Text style={styles.label}>
          Amount
        </Text>

        <Text style={styles.value}>
          R{amount}
        </Text>


        <Text style={styles.label}>
          Payment Reference
        </Text>

        <Text style={styles.reference}>
          {paymentReference}
        </Text>

      </View>


      {/* FILE */}

      <View style={styles.card}>

        <Text style={styles.sectionTitle}>
          Proof of Payment
        </Text>


        <Text style={styles.info}>

          Upload a screenshot, image, or PDF showing
          your EFT payment.

        </Text>


        {file ? (

          <View style={styles.selectedFile}>

            <Text style={styles.fileName}>

              ✓ {file.name}

            </Text>

          </View>

        ) : null}


        <TouchableOpacity
          style={styles.selectButton}
          onPress={selectProof}
        >

          <Text style={styles.buttonText}>
            Select Proof of Payment
          </Text>

        </TouchableOpacity>

      </View>


      {/* UPLOAD */}

      <TouchableOpacity
        style={[
          styles.uploadButton,

          uploading &&
            styles.disabledButton

        ]}

        disabled={uploading}

        onPress={uploadProof}
      >

        {uploading ? (

          <ActivityIndicator color="#fff" />

        ) : (

          <Text style={styles.buttonText}>
            Submit Proof of Payment
          </Text>

        )}

      </TouchableOpacity>


      <Text style={styles.note}>

        Your subscription will remain pending until
        Nakky Academy verifies your payment.

      </Text>


    </ScrollView>

  );

}


const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    lineHeight: 22,
  },

  card: {
    backgroundColor: "#f5f5f5",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },

  sectionTitle: {
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
    fontSize: 17,
    fontWeight: "600",
    marginTop: 3,
  },

  reference: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 5,
  },

  info: {
    color: "#666",
    lineHeight: 21,
  },

  selectedFile: {
    marginTop: 15,
    padding: 15,
    backgroundColor: "#e8f5e9",
    borderRadius: 8,
  },

  fileName: {
    fontWeight: "600",
  },

  selectButton: {
    marginTop: 20,
    backgroundColor: "#555",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  uploadButton: {
    backgroundColor: "#d81b60",
    padding: 17,
    borderRadius: 10,
    alignItems: "center",
  },

  disabledButton: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  note: {
    textAlign: "center",
    color: "#777",
    marginTop: 20,
    lineHeight: 20,
  },

});