import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// 1. Add the admin guard hook import
import useAdminGuard from "../../src/hooks/useAdminGuard";
import API from "../../src/services/api";

// Define TypeScript interfaces for better type safety
interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  price: number;
  duration: number;
  content?: any[];
  published: boolean;
  certificate: boolean;
}

export default function ManageCourses() {
  // 2. Initialize the guard at the very start of the component
  const isAdminLoading = useAdminGuard();

  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    // Prevent fetching courses from your backend if user isn't verified yet
    if (isAdminLoading) return;

    loadCourses();
  }, [isAdminLoading]); // Re-run hook once authorization completes

  const loadCourses = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      API.defaults.headers.common.Authorization = `Bearer ${token}`;
      const res = await API.get("/courses");
      setCourses(res.data);
    } catch (err: any) {
      console.log(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteCourse = (courseId: string) => {
    Alert.alert(
      "Delete Course",
      "Are you sure?",
      [
        {
          text: "Cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              API.defaults.headers.common.Authorization = `Bearer ${token}`;
              await API.delete(`/courses/${courseId}`);
              loadCourses();
            } catch (err: any) {
              Alert.alert(
                "Error",
                err.response?.data?.message || "Unable to delete course"
              );
            }
          },
        },
      ]
    );
  };

  const publishCourse = async (courseId: string) => {
    try {
      const token = await AsyncStorage.getItem("token");
      API.defaults.headers.common.Authorization = `Bearer ${token}`;
      await API.put(`/courses/${courseId}/publish`);
      loadCourses();
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.message || "Unable to publish course."
      );
    }
  };

  const unpublishCourse = async (courseId: string) => {
    try {
      const token = await AsyncStorage.getItem("token");
      API.defaults.headers.common.Authorization = `Bearer ${token}`;
      await API.put(`/courses/${courseId}/unpublish`);
      loadCourses();
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.message || "Unable to unpublish course."
      );
    }
  };

  const filteredCourses = courses.filter((course) =>
    course.title?.toLowerCase().includes(search.toLowerCase())
  );

  // 3. Halt layout compilation completely if guard is verifying authorization
  if (isAdminLoading) {
    return null;
  }

  // 4. Regular data loading fallback layout
  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color="#E91E63"
        style={{ marginTop: 100 }}
      />
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Manage Courses</Text>

      <TextInput
        placeholder="Search courses..."
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />

      {filteredCourses.map((course) => (
        <View key={course._id} style={styles.card}>
          <Text style={styles.title}>📚 {course.title}</Text>

          <Text style={styles.description}>{course.description}</Text>

          <Text style={styles.description}>Category: {course.category}</Text>

          <Text style={styles.description}>Level: {course.level}</Text>

          <Text style={styles.price}>Price: R{course.price}</Text>

          <Text style={styles.description}>Duration: {course.duration} hrs</Text>

          <Text style={styles.description}>
            Lessons: {course.content?.length || 0}
          </Text>

          <Text
            style={{
              color: course.published ? "green" : "orange",
              fontWeight: "bold",
              marginTop: 6,
            }}
          >
            {course.published ? "✅ Published" : "📝 Draft"}
          </Text>

          <Text style={styles.description}>
            Certificate: {course.certificate ? "Yes" : "No"}
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() =>
                router.push({
                  pathname: "/admin/edit-course",
                  params: { id: course._id },
                } as any)
              }
            >
              <Text style={styles.buttonText}>✏ Edit</Text>
            </TouchableOpacity>

            {course.published ? (
              <TouchableOpacity
                style={styles.unpublishButton}
                onPress={() => unpublishCourse(course._id)}
              >
                <Text style={styles.buttonText}>📥 Unpublish</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.publishButton}
                onPress={() => publishCourse(course._id)}
              >
                <Text style={styles.buttonText}>🚀 Publish</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteCourse(course._id)}
            >
              <Text style={styles.buttonText}>🗑 Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    padding: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#E91E63",
    marginBottom: 20,
  },
  search: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  card: {
    backgroundColor: "white",
    padding: 18,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 6,
  },
  description: {
    color: "#666",
    marginBottom: 8,
  },
  price: {
    color: "#E91E63",
    fontWeight: "bold",
    marginBottom: 6,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  editButton: {
    backgroundColor: "#E91E63",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "#F44336",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  publishButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: "center",
  },
  unpublishButton: {
    backgroundColor: "#FF9800",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: "center",
  },
});

