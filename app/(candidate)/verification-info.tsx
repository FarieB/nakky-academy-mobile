import { useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function VerificationInfoScreen() {

  const router = useRouter();

  return (

    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >

      <Text style={styles.title}>
        Get Your Profile Verified
      </Text>

      <Text style={styles.subtitle}>
        Build trust and increase your chances of being
        noticed by employers on Nakky Academy.
      </Text>


      <View style={styles.priceCard}>

        <Text style={styles.priceTitle}>
          Verification Fee
        </Text>

        <Text style={styles.price}>
          R200
        </Text>

        <Text style={styles.duration}>
          Valid for 12 months
        </Text>

      </View>


      <Text style={styles.sectionTitle}>
        Benefits of Verification
      </Text>


      <View style={styles.benefitCard}>

        <Text style={styles.benefit}>
          ✓ Verified profile badge
        </Text>

        <Text style={styles.benefit}>
          ✓ Increased trust with employers
        </Text>

        <Text style={styles.benefit}>
          ✓ Profile and document verification
        </Text>

        <Text style={styles.benefit}>
          ✓ Improved visibility on Nakky Academy
        </Text>

        <Text style={styles.benefit}>
          ✓ 12 months of verified candidate access
        </Text>

      </View>


      <View style={styles.infoCard}>

        <Text style={styles.infoText}>

          After selecting verification, Nakky Academy
          will generate a unique EFT payment reference.

        </Text>

        <Text style={styles.infoText}>

          Once you have made the payment, upload your
          proof of payment for review.

        </Text>

        <Text style={styles.infoText}>

          Your profile will be verified once your payment
          has been approved.

        </Text>

      </View>


      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          router.push(
            "/(candidate)/pay-verification" as any
          )
        }
      >

        <Text style={styles.buttonText}>
          Continue to Payment
        </Text>

      </TouchableOpacity>


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
    fontSize: 27,
    fontWeight: "bold",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 16,
    color: "#666",
    lineHeight: 23,
    marginBottom: 25,
  },

  priceCard: {
    backgroundColor: "#fdf1f7",
    padding: 25,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 25,
  },

  priceTitle: {
    fontSize: 16,
    color: "#666",
  },

  price: {
    fontSize: 38,
    fontWeight: "bold",
    color: "#d81b60",
    marginTop: 8,
  },

  duration: {
    marginTop: 8,
    color: "#666",
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: "bold",
    marginBottom: 15,
  },

  benefitCard: {
    backgroundColor: "#f7f7f7",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },

  benefit: {
    fontSize: 16,
    marginBottom: 15,
  },

  infoCard: {
    backgroundColor: "#eef6ff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 25,
  },

  infoText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },

  button: {
    backgroundColor: "#d81b60",
    padding: 17,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

});