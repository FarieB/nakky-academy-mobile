import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native"; // Added Focus Hook
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react"; // Replaced useEffect with useCallback
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import * as WebBrowser from "expo-web-browser";

import API from "../../src/services/api";

export default function CourseDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [enrolled, setEnrolled] = useState(false);

  // Automatically refresh when the user returns to this screen from PayFast browser
  useFocusEffect(
    useCallback(() => {
      loadCourse();
    }, [id])
  );

  const loadCourse = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      API.defaults.headers.common.Authorization = `Bearer ${token}`;

      const res = await API.get(`/courses/${id}`);
      setCourse(res.data);
      
      // UPGRADE: Evaluates enrollment cleanly using Step 3's dedicated boolean
      setEnrolled(res.data.isEnrolled);
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.message || "Unable to load course."
      );
    } finally {
      setLoading(false);
    }
  };

  const buyCourse = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      API.defaults.headers.common.Authorization = `Bearer ${token}`;

      const res = await API.get(`/courses/${id}/purchase`);

      await WebBrowser.openBrowserAsync(res.data.paymentUrl);

      // Instantly poll the backend for any state updates right after browser dismissal
      await loadCourse();

      Alert.alert(
        "Payment Processed",
        "Once payment updates complete via PayFast, this course layout unlocks automatically."
      );
    } catch (err: any) {
      Alert.alert(
        "Purchase Failed",
        err.response?.data?.message || err.message
      );
    }
  };

  // ======================================
  // CONDITIONAL RENDER LAYERS & MAIN UI
  // ======================================
  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color="#E91E63"
        style={{ marginTop: 150 }}
      />
    );
  }

  if (!course) {
    return (
      <View style={styles.center}>
        <Text>Course not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.banner}>
        <Text style={styles.bannerEmoji}>📚</Text>
        <Text style={styles.title}>{course.title}</Text>
        <Text style={styles.category}>{course.category}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>About this course</Text>
        <Text style={styles.description}>{course.description}</Text>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>
            {course.content?.length || 0}
          </Text>
          <Text style={styles.statLabel}>Lessons</Text>
        </View>

        <View style={styles.stat}>
          <Text style={styles.statNumber}>{course.duration}</Text>
          <Text style={styles.statLabel}>Hours</Text>
        </View>

        <View style={styles.stat}>
          <Text style={styles.statNumber}>{course.level}</Text>
          <Text style={styles.statLabel}>Level</Text>
        </View>
      </View>

      <View style={styles.priceCard}>
        <Text style={styles.priceLabel}>Course Price</Text>
        <Text style={styles.price}>R{course.price}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Course Includes</Text>
        <Text style={styles.feature}>🎥 Video Lessons</Text>
        <Text style={styles.feature}>📚 Downloadable Material</Text>
        <Text style={styles.feature}>📈 Progress Tracking</Text>
        <Text style={styles.feature}>🏆 Certificate of Completion</Text>
        <Text style={styles.feature}>♾ Lifetime Access</Text>
      </View>

      {enrolled ? (
        <TouchableOpacity
          style={styles.learnButton}
          onPress={() =>
            router.push({
              pathname: "/(student)/course-player",
              params: { id: course._id },
            } as any)
          }
        >
          <Text style={styles.learnText}>▶ Start Learning</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.buyButton}
          onPress={buyCourse}
        >
          <Text style={styles.buyText}>💳 Buy Course</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ======================================
// STYLESHEET
// ======================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  banner: {
    backgroundColor: "#E91E63",
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },

  bannerEmoji: {
    fontSize: 60,
    marginBottom: 10,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "center",
  },

  category: {
    marginTop: 10,
    fontSize: 16,
    color: "#FFF",
    opacity: 0.9,
  },

  card: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 15,
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#222",
  },

  description: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
  },

  statsCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 20,
    borderRadius: 15,
    flexDirection: "row",
    justifyContent: "space-around",
    elevation: 2,
  },

  stat: {
    alignItems: "center",
  },

  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#E91E63",
  },

  statLabel: {
    marginTop: 5,
    color: "#777",
    fontSize: 14,
  },

  priceCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    elevation: 2,
  },

  priceLabel: {
    fontSize: 16,
    color: "#777",
  },

  price: {
    marginTop: 8,
    fontSize: 34,
    fontWeight: "bold",
    color: "#4CAF50",
  },

  feature: {
    fontSize: 16,
    marginBottom: 12,
    color: "#444",
  },

  buyButton: {
    backgroundColor: "#E91E63",
    marginHorizontal: 20,
    marginTop: 30,
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: "center",
    elevation: 3,
  },

  buyText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
  },

  learnButton: {
    backgroundColor: "#4CAF50",
    marginHorizontal: 20,
    marginTop: 30,
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: "center",
    elevation: 3,
  },

  learnText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
  },

  backButton: {
    backgroundColor: "#757575",
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 40,
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: "center",
  },

  backText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});

