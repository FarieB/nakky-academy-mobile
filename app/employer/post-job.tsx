import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import API from "../../src/services/api";

export default function PostJob() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [subActive, setSubActive] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [jobType, setJobType] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [requiredExperience, setRequiredExperience] = useState("");

  // ==========================
  // CHECK SUBSCRIPTION
  // ==========================
  const checkSubscription = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      API.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      const res = await API.get("/dashboard");

      setSubActive(res.data.subscriptionStatus === "active");
    } catch (err: any) {
      console.log("SUB CHECK ERROR:", err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSubscription();
  }, []);

  // ==========================
  // CREATE JOB
  // ==========================
  const createJob = async () => {
    if (!title || !description || !jobType) {
      Alert.alert("Error", "Title, description and job type are required");
      return;
    }

    try {
      await API.post("/jobs", {
        title,
        description,
        jobType,
        province,
        city,
        requiredExperience: Number(requiredExperience) || 0,
      });

      Alert.alert("Success", "Job posted successfully ✅");

      router.replace("/employer/dashboard" as any);
    } catch (err: any) {
      console.log("CREATE JOB ERROR:", err?.response?.data || err.message);

      // 👇 handle subscription error cleanly
      if (err?.response?.data?.message === "Subscription required") {
        Alert.alert("Subscription Required", "Please subscribe first");

        router.push("/employer/subscribe" as any);
        return;
      }

      Alert.alert(
        "Error",
        err?.response?.data?.message || "Failed to create job"
      );
    }
  };

  // ==========================
  // LOADING SCREEN
  // ==========================
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // ==========================
  // BLOCK IF NO SUBSCRIPTION
  // ==========================
  if (!subActive) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 20, fontWeight: "bold" }}>
          Subscription Required
        </Text>

        <Text style={{ marginTop: 10 }}>
          You need an active subscription to post jobs.
        </Text>

        <View style={{ marginTop: 20 }}>
          <Button
            title="Subscribe Now"
            onPress={() => router.push("/employer/subscribe" as any)}
          />
        </View>
      </View>
    );
  }

  // ==========================
  // FORM UI
  // ==========================
  return (
    <ScrollView style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>
        Post a Job
      </Text>

      <TextInput
        placeholder="Job Title"
        value={title}
        onChangeText={setTitle}
        style={{ borderWidth: 1, marginTop: 20, padding: 10 }}
      />

      <TextInput
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        multiline
        style={{ borderWidth: 1, marginTop: 10, padding: 10 }}
      />

      <TextInput
        placeholder="Job Type (caregiver, nanny, etc)"
        value={jobType}
        onChangeText={setJobType}
        style={{ borderWidth: 1, marginTop: 10, padding: 10 }}
      />

      <TextInput
        placeholder="Province"
        value={province}
        onChangeText={setProvince}
        style={{ borderWidth: 1, marginTop: 10, padding: 10 }}
      />

      <TextInput
        placeholder="City"
        value={city}
        onChangeText={setCity}
        style={{ borderWidth: 1, marginTop: 10, padding: 10 }}
      />

      <TextInput
        placeholder="Required Experience (years)"
        value={requiredExperience}
        onChangeText={setRequiredExperience}
        keyboardType="numeric"
        style={{ borderWidth: 1, marginTop: 10, padding: 10 }}
      />

      <View style={{ marginTop: 20 }}>
        <Button title="Post Job" onPress={createJob} />
      </View>
    </ScrollView>
  );
}