import AsyncStorage from "@react-native-async-storage/async-storage";
import { File, Paths } from "expo-file-system";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Pdf from "react-native-pdf";

import API from "../../src/services/api";

export default function CertificateScreen() {
  const { id } =
    useLocalSearchParams<{ id?: string }>();

  const [pdfUri, setPdfUri] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadCertificate();
  }, [id]);

  const loadCertificate = async () => {
    try {
      if (!id) {
        throw new Error("Course ID is missing.");
      }

      const token =
        await AsyncStorage.getItem("token");

      if (!token) {
        throw new Error(
          "You are not logged in."
        );
      }

      const baseURL =
        API.defaults.baseURL;

      if (!baseURL) {
        throw new Error(
          "API base URL is not configured."
        );
      }

      const certificateUrl =
        `${baseURL}/courses/${id}/download-certificate`;

      /*
       * IMPORTANT:
       * Create a unique file for every download.
       * This prevents:
       * "Destination already exists"
       */
      const certificateFile =
        new File(
          Paths.cache,
          `certificate-${id}-${Date.now()}.pdf`
        );

      const file =
        await File.downloadFileAsync(
          certificateUrl,
          certificateFile,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      setPdfUri(file.uri);
    } catch (error: any) {
      console.error(
        "Certificate loading error:",
        error
      );

      Alert.alert(
        "Certificate",
        error?.message ||
          error?.response?.data?.message ||
          "Unable to load your certificate."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Preparing your certificate...
        </Text>
      </View>
    );
  }

  if (!pdfUri) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          Unable to display the certificate.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pdf
        source={{
          uri: pdfUri,
          cache: false,
        }}
        style={styles.pdf}
        trustAllCerts={false}
        onError={(error) => {
          console.error(
            "Certificate PDF error:",
            error
          );

          Alert.alert(
            "Certificate",
            "Unable to display the certificate."
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  pdf: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: "center",
  },

  errorText: {
    fontSize: 16,
    textAlign: "center",
  },
});