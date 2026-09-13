import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import API from "../../src/services/api";

export default function CoursesScreen() {
  const router = useRouter();

  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  // ======================================
  // LOAD COURSES FROM DATABASE
  // ======================================

  const loadCourses = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Session Expired", "Please log in again.");

        return;
      }

      API.defaults.headers.common.Authorization = `Bearer ${token}`;

      const response = await API.get("/courses");

      console.log("COURSES FROM DATABASE:", response.data);

      // Only show published courses
      const publishedCourses = response.data.filter(
        (course: any) => course.published === true
      );

      setCourses(publishedCourses);
    } catch (error: any) {
      console.log(
        "LOAD COURSES ERROR:",
        error?.response?.data || error.message
      );

      Alert.alert(
        "Unable to Load Courses",
        error?.response?.data?.message || "Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ======================================
  // REFRESH COURSES
  // ======================================

  const onRefresh = async () => {
    setRefreshing(true);

    await loadCourses();
  };

  // ======================================
  // COURSE CARD
  // ======================================

  const renderCourse = ({ item }: any) => (
    <TouchableOpacity
      style={styles.courseCard}
      activeOpacity={0.85}
      onPress={() =>
        router.push({
          pathname: "/student/course-details",
          params: {
            id: item._id,
          },
        } as any)
      }
    >
      {/* COURSE ICON */}

      <View style={styles.iconContainer}>
        <Text style={styles.courseIcon}>
          {item.category?.toLowerCase().includes("child") ? "👶" : "❤️"}
        </Text>
      </View>

      {/* COURSE INFORMATION */}

      <View style={styles.courseInfo}>
        <Text style={styles.courseTitle}>{item.title}</Text>

        <Text style={styles.category}>
          {item.category || "Professional Training"}
        </Text>

        <Text style={styles.description} numberOfLines={3}>
          {item.shortDescription ||
            item.description ||
            "Professional training course."}
        </Text>

        <View style={styles.detailsRow}>
          <Text style={styles.detail}>📚 {item.level || "Beginner"}</Text>

          <Text style={styles.detail}>⏱ {item.duration || 0} Hours</Text>
        </View>

        <View style={styles.bottomRow}>
          <View>
            <Text style={styles.priceLabel}>Full Course Price</Text>

            <Text style={styles.price}>
              R{Number(item.price || 1200).toLocaleString()}
            </Text>
          </View>

          <View style={styles.viewButton}>
            <Text style={styles.viewButtonText}>View Course →</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // ======================================
  // LOADING SCREEN
  // ======================================

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E91E63" />

        <Text style={styles.loadingText}>Loading courses...</Text>
      </View>
    );
  }

  // ======================================
  // MAIN SCREEN
  // ======================================

  return (
    <View style={styles.container}>
      {/* HEADER */}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore Courses 🎓</Text>

        <Text style={styles.headerSubtitle}>
          Build your professional skills with Nakky Academy.
        </Text>
      </View>

      {/* COURSE LIST */}

      <FlatList
        data={courses}
        keyExtractor={(item) => item._id}
        renderItem={renderCourse}
        contentContainerStyle={
          courses.length === 0 ? styles.emptyContainer : styles.listContainer
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#E91E63"]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>📚</Text>

            <Text style={styles.emptyTitle}>No Courses Available</Text>

            <Text style={styles.emptyText}>
              New courses will appear here once they are published by
              Nakky Academy.
            </Text>

            <TouchableOpacity
              style={styles.refreshButton}
              onPress={loadCourses}
            >
              <Text style={styles.refreshButtonText}>Refresh Courses</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

// ======================================
// STYLES
// ======================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F7F7F7",
  },

  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
  },

  header: {
    backgroundColor: "#E91E63",
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFF",
  },

  headerSubtitle: {
    marginTop: 8,
    fontSize: 16,
    color: "#FFF",
    opacity: 0.9,
    lineHeight: 22,
  },

  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },

  courseCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    marginBottom: 20,
    overflow: "hidden",
    elevation: 3,
  },

  iconContainer: {
    height: 130,
    backgroundColor: "#FCE4EC",
    justifyContent: "center",
    alignItems: "center",
  },

  courseIcon: {
    fontSize: 60,
  },

  courseInfo: {
    padding: 20,
  },

  courseTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#222",
  },

  category: {
    marginTop: 5,
    fontSize: 14,
    color: "#E91E63",
    fontWeight: "600",
  },

  description: {
    marginTop: 12,
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
  },

  detailsRow: {
    flexDirection: "row",
    marginTop: 15,
    gap: 15,
  },

  detail: {
    fontSize: 14,
    color: "#555",
  },

  bottomRow: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  priceLabel: {
    fontSize: 12,
    color: "#777",
  },

  price: {
    marginTop: 3,
    fontSize: 22,
    fontWeight: "bold",
    color: "#4CAF50",
  },

  viewButton: {
    backgroundColor: "#E91E63",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
  },

  viewButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },

  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 30,
  },

  emptyBox: {
    alignItems: "center",
  },

  emptyEmoji: {
    fontSize: 60,
  },

  emptyTitle: {
    marginTop: 20,
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },

  emptyText: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 15,
    color: "#777",
    lineHeight: 22,
  },

  refreshButton: {
    marginTop: 25,
    backgroundColor: "#E91E63",
    paddingHorizontal: 25,
    paddingVertical: 14,
    borderRadius: 12,
  },

  refreshButtonText: {
    color: "#FFF",
    fontWeight: "bold",
  },
});