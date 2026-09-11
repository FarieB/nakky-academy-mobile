import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import * as Clipboard from "expo-clipboard";

import API from "../../src/services/api";


interface PaymentDetails {
  paymentId: string;
  courseId: string;
  courseTitle: string;

  amount: number;

  paymentReference: string;

  accountName: string;
  bankName: string;
  accountNumber: string;
  branchCode: string;
  accountType: string;
}


export default function PayCourseScreen() {

  const router = useRouter();

  const { courseId } =
    useLocalSearchParams();


  const [loading, setLoading] =
    useState(true);


  const [paymentDetails, setPaymentDetails] =
    useState<PaymentDetails | null>(null);


  // ==========================================
  // COPY TEXT
  // ==========================================

  const copyText = async (
    text: string,
    label: string
  ) => {

    try {

      await Clipboard.setStringAsync(text);

      Alert.alert(
        "Copied",
        `${label} copied successfully.`
      );

    }

    catch {

      Alert.alert(
        "Error",
        "Failed to copy text."
      );

    }

  };


  // ==========================================
  // CREATE COURSE PAYMENT
  // ==========================================

  const createCoursePayment =
    async () => {

      try {

        setLoading(true);


        const token =
          await AsyncStorage.getItem(
            "token"
          );


        if (!token) {

          Alert.alert(
            "Session Expired",
            "Please login again."
          );

          return;

        }


        if (!courseId) {

          Alert.alert(
            "Error",
            "Course information is missing."
          );

          router.back();

          return;

        }


        API.defaults.headers.common[
          "Authorization"
        ] =
          `Bearer ${token}`;


        const res =
          await API.post(
            "/payments/course",
            {
              courseId
            }
          );


        console.log(
          "COURSE PAYMENT RESPONSE:",
          res.data
        );


        const payment =
          res.data?.payment;


        const bankingDetails =
          res.data?.bankingDetails;


        const course =
          res.data?.course;


        // ======================================
        // VALIDATE RESPONSE
        // ======================================

        if (

          !payment?._id ||

          !payment?.paymentReference ||

          !payment?.amount ||

          !course?._id ||

          !bankingDetails?.accountName ||

          !bankingDetails?.bankName ||

          !bankingDetails?.accountNumber ||

          !bankingDetails?.branchCode

        ) {

          console.log(
            "INVALID COURSE PAYMENT RESPONSE:",
            res.data
          );


          throw new Error(
            "The server did not generate valid payment details."
          );

        }


        // ======================================
        // SAVE PAYMENT DETAILS
        // ======================================

        setPaymentDetails({

          paymentId:
            String(payment._id),

          courseId:
            String(course._id),

          courseTitle:
            String(course.title),

          amount:
            Number(payment.amount),

          paymentReference:
            String(
              payment.paymentReference
            ),

          accountName:
            String(
              bankingDetails.accountName
            ),

          bankName:
            String(
              bankingDetails.bankName
            ),

          accountNumber:
            String(
              bankingDetails.accountNumber
            ),

          branchCode:
            String(
              bankingDetails.branchCode
            ),

          accountType:
            String(
              bankingDetails.accountType || ""
            )

        });

      }

      catch (err: any) {

        console.log(
          "COURSE PAYMENT ERROR:",
          err?.response?.data ||
          err?.message
        );


        Alert.alert(

          "Payment Error",

          err?.response?.data?.message ||

          err?.message ||

          "Failed to generate course payment details."

        );

      }

      finally {

        setLoading(false);

      }

    };


  useEffect(() => {

    createCoursePayment();

  }, []);


  // ==========================================
  // GO TO PROOF UPLOAD
  // ==========================================

  const handlePaymentMade = () => {

    if (!paymentDetails) {

      Alert.alert(
        "Error",
        "Payment details are missing."
      );

      return;

    }


    router.push({

      pathname:
        "/(student)/upload-proof" as any,

      params: {

        paymentId:
          paymentDetails.paymentId,

        paymentReference:
          paymentDetails.paymentReference,

        amount:
          String(paymentDetails.amount),

        courseTitle:
          paymentDetails.courseTitle

      }

    });

  };


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {

    return (

      <View style={styles.center}>

        <ActivityIndicator
          size="large"
          color="#d81b60"
        />

        <Text style={styles.loadingText}>

          Preparing your course payment...

        </Text>

      </View>

    );

  }


  // ==========================================
  // ERROR
  // ==========================================

  if (!paymentDetails) {

    return (

      <View style={styles.center}>

        <Text style={styles.errorText}>

          Failed to load payment details.

        </Text>


        <TouchableOpacity
          style={styles.button}
          onPress={createCoursePayment}
        >

          <Text style={styles.buttonText}>

            Try Again

          </Text>

        </TouchableOpacity>

      </View>

    );

  }


  // ==========================================
  // PAYMENT SCREEN
  // ==========================================

  return (

    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >


      <Text style={styles.title}>

        Course Payment

      </Text>


      <Text style={styles.courseTitle}>

        {paymentDetails.courseTitle}

      </Text>


      {/* AMOUNT */}

      <View style={styles.amountCard}>

        <Text style={styles.amountLabel}>

          Course Fee

        </Text>


        <Text style={styles.amount}>

          R{paymentDetails.amount}

        </Text>


        <Text style={styles.fullPaymentText}>

          Full payment required before course access.

        </Text>

      </View>


      {/* REFERENCE */}

      <View style={styles.referenceCard}>

        <Text style={styles.sectionTitle}>

          ⚠️ Important Payment Reference

        </Text>


        <Text style={styles.reference}>

          {paymentDetails.paymentReference}

        </Text>


        <Text style={styles.referenceInfo}>

          Please use this exact reference when
          making your EFT payment.

        </Text>


        <TouchableOpacity
          style={styles.copyButton}
          onPress={() =>
            copyText(
              paymentDetails.paymentReference,
              "Payment reference"
            )
          }
        >

          <Text style={styles.copyButtonText}>

            Copy Reference

          </Text>

        </TouchableOpacity>

      </View>


      {/* BANK DETAILS */}

      <View style={styles.card}>

        <Text style={styles.sectionTitle}>

          Banking Details

        </Text>


        <Text style={styles.label}>

          Account Name

        </Text>

        <Text style={styles.value}>

          {paymentDetails.accountName}

        </Text>


        <Text style={styles.label}>

          Bank

        </Text>

        <Text style={styles.value}>

          {paymentDetails.bankName}

        </Text>


        <Text style={styles.label}>

          Account Number

        </Text>

        <TouchableOpacity
          onPress={() =>
            copyText(
              paymentDetails.accountNumber,
              "Account number"
            )
          }
        >

          <Text style={styles.copyValue}>

            {paymentDetails.accountNumber}

          </Text>

        </TouchableOpacity>


        <Text style={styles.label}>

          Branch Code

        </Text>

        <Text style={styles.value}>

          {paymentDetails.branchCode}

        </Text>


        <Text style={styles.label}>

          Account Type

        </Text>

        <Text style={styles.value}>

          {paymentDetails.accountType}

        </Text>

      </View>


      {/* NEXT STEPS */}

      <View style={styles.infoCard}>

        <Text style={styles.sectionTitle}>

          What Happens Next?

        </Text>


        <Text style={styles.infoText}>

          1. Pay the full course fee of R{paymentDetails.amount}.

        </Text>


        <Text style={styles.infoText}>

          2. Use the payment reference shown above.

        </Text>


        <Text style={styles.infoText}>

          3. Upload your proof of payment.

        </Text>


        <Text style={styles.infoText}>

          4. Nakky Academy will review your payment.

        </Text>


        <Text style={styles.infoText}>

          5. Your course will unlock once payment is approved.

        </Text>

      </View>


      {/* PAYMENT MADE */}

      <TouchableOpacity
        style={styles.doneButton}
        onPress={handlePaymentMade}
      >

        <Text style={styles.doneButtonText}>

          I Have Made the Payment

        </Text>

      </TouchableOpacity>


      <Text style={styles.note}>

        You will only receive access to the course
        after Nakky Academy has approved your EFT
        payment.

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

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },

  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
  },

  errorText: {
    fontSize: 16,
    color: "#d32f2f",
    marginBottom: 20,
  },

  title: {
    fontSize: 27,
    fontWeight: "bold",
    marginBottom: 8,
  },

  courseTitle: {
    fontSize: 17,
    color: "#666",
    marginBottom: 20,
  },

  amountCard: {
    backgroundColor: "#fdf1f7",
    padding: 25,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 20,
  },

  amountLabel: {
    fontSize: 16,
    color: "#666",
  },

  amount: {
    fontSize: 38,
    fontWeight: "bold",
    color: "#d81b60",
    marginTop: 8,
  },

  fullPaymentText: {
    marginTop: 8,
    color: "#666",
    textAlign: "center",
  },

  referenceCard: {
    backgroundColor: "#fff8e1",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },

  card: {
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

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },

  reference: {
    fontSize: 17,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 10,
  },

  referenceInfo: {
    color: "#666",
    lineHeight: 21,
  },

  copyButton: {
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    alignItems: "center",
  },

  copyButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  label: {
    fontSize: 13,
    color: "#777",
    marginTop: 12,
  },

  value: {
    fontSize: 17,
    fontWeight: "600",
    marginTop: 3,
  },

  copyValue: {
    fontSize: 17,
    fontWeight: "600",
    marginTop: 3,
    color: "#0066cc",
  },

  infoText: {
    fontSize: 15,
    marginBottom: 10,
    lineHeight: 22,
  },

  button: {
    backgroundColor: "#d81b60",
    padding: 17,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  doneButton: {
    backgroundColor: "#d81b60",
    padding: 17,
    borderRadius: 12,
    alignItems: "center",
  },

  doneButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  note: {
    textAlign: "center",
    color: "#777",
    marginTop: 15,
    lineHeight: 20,
  },

});