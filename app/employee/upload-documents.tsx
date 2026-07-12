import { useState } from "react";
import {
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";

import API from "../../src/services/api";

export default function UploadDocuments() {
  const [idDocument, setIdDocument] = useState("");
  const [policeClearance, setPoliceClearance] =
    useState("");

  const [references, setReferences] = useState("");
  const [qualifications, setQualifications] =
    useState("");

  const uploadDocuments = async () => {
    try {
      await API.post(
        "/employee/upload-documents",
        {
          idDocument,
          policeClearance,
          references,
          qualifications,
        }
      );

      Alert.alert(
        "Success",
        "Documents uploaded successfully"
      );

    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.message ||
          "Upload failed"
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        Upload Verification Documents
      </Text>

      <TextInput
        placeholder="ID Document URL"
        value={idDocument}
        onChangeText={setIdDocument}
        style={styles.input}
      />

      <TextInput
        placeholder="Police Clearance URL"
        value={policeClearance}
        onChangeText={setPoliceClearance}
        style={styles.input}
      />

      <TextInput
        placeholder="References"
        value={references}
        onChangeText={setReferences}
        style={styles.input}
      />

      <TextInput
        placeholder="Qualifications"
        value={qualifications}
        onChangeText={setQualifications}
        style={styles.input}
      />

      <Button
        title="Upload Documents"
        onPress={uploadDocuments}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
  },
});