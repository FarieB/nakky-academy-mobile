import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function EFTPaymentScreen() {

  const router = useRouter();

  const {
    subscriptionId,
    paymentId,
    planName,
    amount,
    paymentReference,
    accountName,
    bankName,
    accountNumber,
    branchCode,
    accountType,
  } = useLocalSearchParams();

  const copyText = async (
    text: string,
    label: string
  ) => {

    await Clipboard.setStringAsync(text);

    Alert.alert(
      "Copied",
      `${label} copied successfully.`
    );

  };

  return (

    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >

      {/* HEADER */}

      <Text style={styles.title}>
        EFT Payment Instructions
      </Text>

      <Text style={styles.subtitle}>
        Your subscription request has been created.
        Please make an EFT payment using the banking
        details below.
      </Text>


      {/* PLAN */}

      <View style={styles.card}>

        <Text style={styles.sectionTitle}>
          Subscription Selected
        </Text>

        <Text style={styles.planName}>
          {planName}
        </Text>

        <Text style={styles.amount}>
          Amount: R{amount}
        </Text>

      </View>


      {/* IMPORTANT REFERENCE */}

      <View style={styles.referenceCard}>

        <Text style={styles.referenceTitle}>
          ⚠️ Important Payment Reference
        </Text>

        <Text style={styles.reference}>
          {paymentReference}
        </Text>

        <Text style={styles.referenceText}>
          Please use this exact reference when making
          your EFT payment. This helps Nakky Academy
          identify and verify your payment.
        </Text>

        <TouchableOpacity
          style={styles.copyButton}
          onPress={() =>
            copyText(
              String(paymentReference),
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
          {accountName}
        </Text>


        <Text style={styles.label}>
          Bank
        </Text>

        <Text style={styles.value}>
          {bankName}
        </Text>


        <Text style={styles.label}>
          Account Number
        </Text>

        <TouchableOpacity
          onPress={() =>
            copyText(
              String(accountNumber),
              "Account number"
            )
          }
        >

          <Text style={styles.copyValue}>
            {accountNumber}
          </Text>

        </TouchableOpacity>


        <Text style={styles.label}>
          Branch Code
        </Text>

        <Text style={styles.value}>
          {branchCode}
        </Text>


        <Text style={styles.label}>
          Account Type
        </Text>

        <Text style={styles.value}>
          {accountType}
        </Text>

      </View>


      {/* PROCESS */}

      <View style={styles.infoCard}>

        <Text style={styles.sectionTitle}>
          What Happens Next?
        </Text>

        <Text style={styles.infoText}>
          1. Make an EFT payment for R{amount}.
        </Text>

        <Text style={styles.infoText}>
          2. Use the payment reference shown above.
        </Text>

        <Text style={styles.infoText}>
          3. Your payment will be reviewed and verified
          by Nakky Academy.
        </Text>

        <Text style={styles.infoText}>
          4. Once verified, your subscription will be
          activated automatically.
        </Text>

      </View>


      {/* BUTTON */}

     <TouchableOpacity
  style={styles.doneButton}
  onPress={() =>
    router.push({
      pathname:
        "/(employer)/upload-proof-of-payment",

      params: {

        paymentId:
          String(paymentId),

        subscriptionId:
          String(subscriptionId),

        paymentReference:
          String(paymentReference),

        amount:
          String(amount),

        planName:
          String(planName),

      },
    })
  }
>
  <Text style={styles.doneButtonText}>
    I Have Made the Payment
  </Text>
</TouchableOpacity>


      <Text style={styles.note}>

        Please note: Your subscription will only become
        active once Nakky Academy has verified your EFT
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

  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 16,
    color: "#666",
    lineHeight: 23,
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#f5f5f5",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },

  referenceCard: {
    backgroundColor: "#fff8e1",
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

  planName: {
    fontSize: 20,
    fontWeight: "bold",
  },

  amount: {
    fontSize: 18,
    marginTop: 10,
  },

  referenceTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },

  reference: {
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 10,
  },

  referenceText: {
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

  doneButton: {
    backgroundColor: "#000",
    padding: 17,
    borderRadius: 10,
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