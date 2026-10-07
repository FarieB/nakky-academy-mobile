import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import API from "../../src/services/api";

type CertificateData = {
  certificateNumber: string;
  studentName: string;
  course: string;
  issueDate: string;
  status: string;
};

export default function VerifyCertificateScreen() {
  const { certificateNumber } =
    useLocalSearchParams<{
      certificateNumber?: string;
    }>();

  const [loading, setLoading] =
    useState(true);

  const [certificate, setCertificate] =
    useState<CertificateData | null>(null);

  const [error, setError] =
    useState("");

  useEffect(() => {
    verifyCertificate();
  }, [certificateNumber]);

  const verifyCertificate = async () => {
    try {
      setLoading(true);
      setError("");
      setCertificate(null);

      if (!certificateNumber) {
        setError(
          "No certificate number was provided."
        );
        return;
      }

      console.log(
        "VERIFYING CERTIFICATE:",
        certificateNumber
      );

      const response =
        await API.get(
          `/courses/verify-certificate/${encodeURIComponent(
            String(certificateNumber)
          )}`
        );

      console.log(
        "CERTIFICATE VERIFICATION RESPONSE:",
        response.data
      );

      if (
        response.data?.valid &&
        response.data?.certificate
      ) {
        setCertificate(
          response.data.certificate
        );
      } else {
        setError(
          response.data?.message ||
            "Certificate could not be verified."
        );
      }

    } catch (err: any) {
      console.log(
        "CERTIFICATE VERIFICATION ERROR:",
        err?.response?.data ||
          err.message
      );

      setError(
        err?.response?.data?.message ||
          "This certificate could not be verified."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (
    value: string
  ) => {
    try {
      return new Date(
        value
      ).toLocaleDateString(
        "en-ZA",
        {
          day: "numeric",
          month: "long",
          year: "numeric",
        }
      );
    } catch {
      return value;
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#F04FA8"
        />

        <Text style={styles.loadingText}>
          Verifying certificate...
        </Text>

        <Text style={styles.subText}>
          Please wait while we confirm this
          certificate with Nakky Academy.
        </Text>
      </View>
    );
  }

  if (error || !certificate) {
    return (
      <View style={styles.center}>
        <View style={styles.invalidIcon}>
          <Text style={styles.invalidIconText}>
            !
          </Text>
        </View>

        <Text style={styles.invalidTitle}>
          Certificate Not Verified
        </Text>

        <Text style={styles.errorText}>
          {error ||
            "This certificate could not be verified."}
        </Text>

        {certificateNumber ? (
          <View style={styles.numberBox}>
            <Text style={styles.numberLabel}>
              Certificate Number
            </Text>

            <Text style={styles.numberText}>
              {String(
                certificateNumber
              )}
            </Text>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
    >
      {/* ================================= */}
      {/* HEADER */}
      {/* ================================= */}

      <View style={styles.header}>
        <Image
          source={require(
            "../../assets/images/logo.png"
          )}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.brand}>
          NAKKY ACADEMY
        </Text>

        <Text style={styles.tagline}>
          SKILLS TODAY • BRIGHTER TOMORROWS
        </Text>
      </View>

      {/* ================================= */}
      {/* VERIFIED */}
      {/* ================================= */}

      <View style={styles.verifiedCircle}>
        <Text style={styles.checkmark}>
          ✓
        </Text>
      </View>

      <Text style={styles.verifiedTitle}>
        CERTIFICATE VERIFIED
      </Text>

      <Text style={styles.verifiedSubtitle}>
        This certificate has been successfully
        verified against Nakky Academy records.
      </Text>

      {/* ================================= */}
      {/* CERTIFICATE INFORMATION */}
      {/* ================================= */}

      <View style={styles.card}>
        <Text style={styles.cardHeading}>
          Certificate Details
        </Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>
            Certificate No.
          </Text>

          <Text style={styles.detailValue}>
            {certificate.certificateNumber}
          </Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>
            Student
          </Text>

          <Text style={styles.detailValue}>
            {certificate.studentName}
          </Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>
            Course
          </Text>

          <Text style={styles.detailValue}>
            {certificate.course}
          </Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>
            Date Issued
          </Text>

          <Text style={styles.detailValue}>
            {formatDate(
              certificate.issueDate
            )}
          </Text>
        </View>
      </View>

      {/* ================================= */}
      {/* VALID BADGE */}
      {/* ================================= */}

      <View style={styles.validBox}>
        <Text style={styles.validCheck}>
          ✓
        </Text>

        <View>
          <Text style={styles.validTitle}>
            VALID CERTIFICATE
          </Text>

          <Text style={styles.validText}>
            Issued by Nakky Academy (Pty) Ltd
          </Text>
        </View>
      </View>

      {/* ================================= */}
      {/* FOOTER */}
      {/* ================================= */}

      <Text style={styles.footer}>
        Nakky Academy • Care • Train • Empower •
        Transform
      </Text>

      <Text style={styles.footerSmall}>
        Certificate verification service
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFDF8",
  },

  content: {
    padding: 20,
    paddingBottom: 50,
  },

  center: {
    flex: 1,
    backgroundColor: "#FFFDF8",
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },

  loadingText: {
    marginTop: 18,
    fontSize: 20,
    fontWeight: "700",
    color: "#25263F",
    textAlign: "center",
  },

  subText: {
    marginTop: 10,
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    lineHeight: 21,
  },

  header: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 20,
  },

  logo: {
    width: 130,
    height: 85,
  },

  brand: {
    fontSize: 25,
    fontWeight: "900",
    color: "#F04FA8",
    letterSpacing: 1,
    marginTop: 3,
  },

  tagline: {
    marginTop: 4,
    fontSize: 10,
    letterSpacing: 2,
    color: "#25263F",
  },

  verifiedCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "#2E7D32",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  checkmark: {
    color: "#FFFFFF",
    fontSize: 50,
    fontWeight: "900",
  },

  verifiedTitle: {
    textAlign: "center",
    fontSize: 25,
    fontWeight: "900",
    color: "#2E7D32",
    marginTop: 18,
  },

  verifiedSubtitle: {
    textAlign: "center",
    fontSize: 14,
    color: "#666",
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 22,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F0D5E5",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  cardHeading: {
    fontSize: 19,
    fontWeight: "800",
    color: "#4E4787",
    marginBottom: 18,
  },

  detailRow: {
    paddingVertical: 8,
  },

  detailLabel: {
    fontSize: 13,
    color: "#777",
    fontWeight: "600",
    marginBottom: 4,
  },

  detailValue: {
    fontSize: 16,
    color: "#222",
    fontWeight: "700",
    lineHeight: 22,
  },

  separator: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginVertical: 5,
  },

  validBox: {
    marginTop: 20,
    backgroundColor: "#E8F5E9",
    borderRadius: 15,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#A5D6A7",
  },

  validCheck: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#2E7D32",
    color: "#FFFFFF",
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 27,
    fontWeight: "900",
    marginRight: 14,
    overflow: "hidden",
  },

  validTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#2E7D32",
  },

  validText: {
    marginTop: 3,
    fontSize: 13,
    color: "#555",
  },

  footer: {
    textAlign: "center",
    marginTop: 30,
    fontSize: 12,
    fontWeight: "700",
    color: "#4E4787",
  },

  footerSmall: {
    textAlign: "center",
    marginTop: 6,
    fontSize: 11,
    color: "#999",
  },

  invalidIcon: {
    width: 75,
    height: 75,
    borderRadius: 38,
    backgroundColor: "#C62828",
    alignItems: "center",
    justifyContent: "center",
  },

  invalidIconText: {
    color: "#FFFFFF",
    fontSize: 45,
    fontWeight: "900",
  },

  invalidTitle: {
    marginTop: 20,
    fontSize: 24,
    fontWeight: "900",
    color: "#C62828",
    textAlign: "center",
  },

  errorText: {
    marginTop: 10,
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
    textAlign: "center",
  },

  numberBox: {
    marginTop: 25,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDD",
    alignItems: "center",
  },

  numberLabel: {
    fontSize: 12,
    color: "#777",
    marginBottom: 5,
  },

  numberText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#25263F",
  },
});