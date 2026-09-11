import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";

import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";

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

import API from "../../src/services/api";


export default function UploadProofScreen() {

  const router = useRouter();

  const {
    paymentId,
    paymentReference,
    amount,
    paymentType,
  } = useLocalSearchParams();


  const [selectedFile, setSelectedFile] =
    useState<any>(null);

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

        });


      if (result.canceled) {

        return;

      }


      const file =
        result.assets?.[0];


      if (!file) {

        Alert.alert(
          "Error",
          "No file was selected."
        );

        return;

      }


      console.log(
        "SELECTED PROOF:",
        file
      );


      setSelectedFile(file);


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


  // =====================================================
  // UPLOAD PROOF
  // =====================================================

  const uploadProof = async () => {

    if (!paymentId) {

      Alert.alert(
        "Error",
        "Payment ID is missing."
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


      const token =
        await AsyncStorage.getItem(
          "token"
        );


      const formData =
        new FormData();


      formData.append(
        "paymentId",
        String(paymentId)
      );


      formData.append(
        "proof",
        {
          uri:
            selectedFile.uri,

          name:
            selectedFile.name ||
            "proof-of-payment.jpg",

          type:
            selectedFile.mimeType ||
            "image/jpeg",

        } as any
      );


      console.log(
        "UPLOADING PROOF FOR PAYMENT:",
        paymentId
      );


      const response =
        await API.post(

          "/payments/upload-proof",

          formData,

          {

            headers: {

              Authorization:
                `Bearer ${token}`,

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

              router.replace(
                "/(candidate)/candidate-dashboard" as any
              ),

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


  return (

    <ScrollView
      contentContainerStyle={
        styles.container
      }
    >

      <Text style={styles.title}>
        Upload Proof of Payment
      </Text>


      <Text style={styles.subtitle}>

        Please upload your EFT proof of payment so
        Nakky Academy can verify your payment.

      </Text>


      {/* PAYMENT SUMMARY */}

      <View style={styles.summaryCard}>

        <Text style={styles.summaryLabel}>
          Amount Paid
        </Text>

        <Text style={styles.amount}>
          R{amount}
        </Text>


        <Text style={styles.summaryLabel}>
          Payment Reference
        </Text>

        <Text style={styles.reference}>
          {paymentReference}
        </Text>


        <Text style={styles.typeText}>
          Payment Type: {paymentType}
        </Text>

      </View>


      {/* FILE SELECTION */}

      <View style={styles.uploadCard}>

        <Text style={styles.uploadTitle}>
          Proof of Payment
        </Text>


        <Text style={styles.uploadText}>

          Upload a screenshot, image, or PDF showing
          your EFT payment.

        </Text>


        <TouchableOpacity
          style={styles.selectButton}
          onPress={selectProof}
          disabled={uploading}
        >

          <Text style={styles.selectButtonText}>

            {selectedFile
              ? "Change Selected File"
              : "Select Proof of Payment"}

          </Text>

        </TouchableOpacity>


        {selectedFile && (

          <View style={styles.fileInfo}>

            <Text style={styles.fileLabel}>
              Selected File
            </Text>

            <Text style={styles.fileName}>
              {selectedFile.name}
            </Text>

          </View>

        )}

      </View>


      {/* SUBMIT */}

      <TouchableOpacity

        style={[
          styles.submitButton,

          uploading &&
          styles.disabledButton,

        ]}

        onPress={uploadProof}

        disabled={uploading}

      >

        {uploading ? (

          <ActivityIndicator
            color="#fff"
          />

        ) : (

          <Text style={styles.submitButtonText}>
            Submit Proof of Payment
          </Text>

        )}

      </TouchableOpacity>


      <Text style={styles.note}>

        Your candidate profile will remain unverified
        until your EFT payment has been reviewed and
        approved by Nakky Academy.

      </Text>


    </ScrollView>

  );

}


const styles = StyleSheet.create({

  container: {

    flexGrow: 1,

    padding: 20,

    backgroundColor: "#fff",

  },


  title: {

    fontSize: 26,

    fontWeight: "bold",

    marginBottom: 10,

  },


  subtitle: {

    fontSize: 16,

    color: "#666",

    lineHeight: 23,

    marginBottom: 25,

  },


  summaryCard: {

    backgroundColor: "#fdf1f7",

    padding: 20,

    borderRadius: 15,

    marginBottom: 25,

  },


  summaryLabel: {

    fontSize: 13,

    color: "#777",

    marginTop: 10,

  },


  amount: {

    fontSize: 28,

    fontWeight: "bold",

    color: "#d81b60",

    marginTop: 5,

  },


  reference: {

    fontSize: 16,

    fontWeight: "bold",

    color: "#333",

    marginTop: 5,

  },


  typeText: {

    marginTop: 20,

    color: "#666",

    textTransform: "capitalize",

  },


  uploadCard: {

    backgroundColor: "#f7f7f7",

    padding: 20,

    borderRadius: 15,

    marginBottom: 25,

  },


  uploadTitle: {

    fontSize: 18,

    fontWeight: "bold",

    marginBottom: 10,

  },


  uploadText: {

    color: "#666",

    lineHeight: 21,

    marginBottom: 20,

  },


  selectButton: {

    borderWidth: 1,

    borderColor: "#d81b60",

    padding: 15,

    borderRadius: 10,

    alignItems: "center",

  },


  selectButtonText: {

    color: "#d81b60",

    fontWeight: "bold",

  },


  fileInfo: {

    marginTop: 20,

    padding: 15,

    backgroundColor: "#fff",

    borderRadius: 10,

  },


  fileLabel: {

    fontSize: 12,

    color: "#777",

    marginBottom: 5,

  },


  fileName: {

    fontWeight: "600",

  },


  submitButton: {

    backgroundColor: "#d81b60",

    padding: 17,

    borderRadius: 12,

    alignItems: "center",

  },


  disabledButton: {

    opacity: 0.6,

  },


  submitButtonText: {

    color: "#fff",

    fontSize: 16,

    fontWeight: "bold",

  },


  note: {

    textAlign: "center",

    color: "#777",

    marginTop: 20,

    lineHeight: 21,

  },

});