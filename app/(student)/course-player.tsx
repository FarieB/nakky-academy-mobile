import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import API from "../../src/services/api";

export default function CoursePlayer() {
  const router = useRouter();

  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);

  const [course, setCourse] = useState<any>(null);

  const [progress, setProgress] = useState(0);

  const [completedLessons, setCompletedLessons] =
  useState<string[]>([]);

  const [certificateIssued, setCertificateIssued] =
  useState(false);

  useEffect(() => {
    loadCourse();
  }, []);

const loadCourse = async () => {
    try {
      const token =
        await AsyncStorage.getItem("token");

      API.defaults.headers.common.Authorization =
        `Bearer ${token}`;

      const res = await API.get(
        `/courses/${id}/content`
      );

      const course = res.data;
      setCourse(course);
      
      // Highlight: New state updates added here
      setCompletedLessons(
        course.completedLessons || []
      );
      
      setCertificateIssued(
        course.certificateIssued || false
      );

      setProgress(res.data.progress || 0);

    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.message ||
          "Unable to load course."
      );
    } finally {
      setLoading(false);
    }
  };

  const isCompleted = (lesson: any) => {
  return completedLessons.includes(
    lesson._id
  );
};

const isUnlocked = (
  lesson: any,
  index: number
) => {
  // First lesson is always unlocked
  if (index === 0) return true;

  const previousLesson =
    course.content[index - 1];

  return completedLessons.includes(
    previousLesson._id
  );
};


const downloadCertificate = async () => {
  try {
    const token = await AsyncStorage.getItem("token");

    API.defaults.headers.common.Authorization =
      `Bearer ${token}`;

    const response = await API.get(
      `/courses/${course._id}/download-certificate`
    );

    Alert.alert(
      "Certificate Ready",
      response.data.message ||
        "Certificate downloaded successfully."
    );

  } catch (err: any) {
    Alert.alert(
      "Certificate",
      err.response?.data?.message ||
        "Unable to download certificate."
    );
  }
};


  if (loading) {
   return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.heading}>
        📚 {course.title}
      </Text>

      <Text style={styles.description}>
        {course.description}
      </Text>

      {/* ====================== */}
      {/* PROGRESS */}
      {/* ====================== */}

      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>
          Course Progress
        </Text>

        <View style={styles.progressBackground}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress}%`,
              },
            ]}
          />
        </View>

        <Text style={styles.progressText}>
          {progress}% Completed
        </Text>
      </View>

      {/* ====================== */}
      {/* COURSE INFO */}
      {/* ====================== */}

      <View style={styles.infoCard}>

        <Text style={styles.info}>
          📂 Category: {course.category}
        </Text>

        <Text style={styles.info}>
          🎓 Level: {course.level}
        </Text>

        <Text style={styles.info}>
          ⏱ Duration: {course.duration} Hours
        </Text>

        <Text style={styles.info}>
          📖 Lessons: {course.content?.length || 0}
        </Text>

      </View>

      {/* ====================== */}
      {/* LESSONS */}
      {/* ====================== */}

      <Text style={styles.section}>
        Lessons
      </Text>

      {/* Fix 1 & 2: Added starting curly brace and an optional chaining '?' for safety */}
      {course?.content?.map((lesson, index) => {

        const completed =
          isCompleted(lesson);

        const unlocked =
          isUnlocked(lesson, index);

        return (
          <TouchableOpacity
            key={lesson._id}
            disabled={!unlocked}
            style={[
              styles.lessonCard,

              !unlocked && {
                opacity: 0.4,
              },
            ]}

            onPress={() =>
              router.push({
                pathname:
                  "/(student)/lesson-player",

                params: {
                  courseId: course._id,
                  lessonIndex: index,
                },
              })
            }
          >

            <Text style={styles.lessonTitle}>

              {completed
                ? "✅"
                : unlocked
                ? "🔓"
                : "🔒"}{" "}

              {lesson.title}

            </Text>

            <Text style={styles.lessonDuration}>
              {lesson.duration} min
            </Text>

            {!unlocked && (
              <Text
                style={styles.lockedText}
              >
                Complete the previous lesson
                first.
              </Text>
            )}

          </TouchableOpacity>
        );
      })} {/* Fix 3: Added closing curly brace here */}


      {/* ====================== */}
      {/* CERTIFICATE */}
      {/* ====================== */}

      {progress >= 100 && (
        <TouchableOpacity
          style={styles.certificateButton}
          onPress={() =>
            router.push({
              pathname:
                "/(student)/certificate",
              params: {
                id: course._id,
              },
            } as any)
          }
        >
          <Text
            style={styles.certificateText}
          >
            🏆 Download Certificate
          </Text>
        </TouchableOpacity>
      )}

      {course.completed && (
        <TouchableOpacity
          style={styles.certificateButton}
          onPress={downloadCertificate}
        >
          <Text style={styles.certificateButtonText}>
            🏆 Download Certificate
          </Text>
        </TouchableOpacity>
      )}

    </ScrollView>
  );
} 
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
    marginBottom: 10,
  },

  description: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
    marginBottom: 25,
  },

  progressCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 2,
  },

  progressTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
    marginBottom: 12,
  },

  progressBackground: {
    width: "100%",
    height: 14,
    backgroundColor: "#E5E5E5",
    borderRadius: 20,
    overflow: "hidden",
  },

  progressFill: {
    height: 14,
    backgroundColor: "#4CAF50",
    borderRadius: 20,
  },

  progressText: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "600",
    color: "#555",
  },

  infoCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 25,

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 2,
  },

  info: {
    fontSize: 16,
    color: "#444",
    marginBottom: 10,
  },

  section: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 18,
  },

  lessonCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,

    borderWidth: 1,
    borderColor: "#ECECEC",

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 2,
  },

  lessonTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E91E63",
    marginBottom: 6,
  },

  lessonName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 8,
  },

  lessonDescription: {
    color: "#666",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 10,
  },

  lessonDuration: {
    fontSize: 15,
    color: "#888",
    marginBottom: 15,
  },

  completedBadge: {
    backgroundColor: "#E8F5E9",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginBottom: 15,
  },

  completedText: {
    color: "#2E7D32",
    fontWeight: "700",
  },

  lockedBadge: {
    backgroundColor: "#FFF3E0",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginBottom: 15,
  },

  watchButton: {
    backgroundColor: "#E91E63",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  watchButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },

  certificateText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },

  lockedText: {
  color: "#F44336",
  marginTop: 6,
  fontWeight: "600",
},

certificateButton: {
  backgroundColor: "#4CAF50",
  padding: 18,
  borderRadius: 12,
  alignItems: "center",
  marginTop: 25,
  marginBottom: 40,
},

certificateButtonText: {
  color: "#FFF",
  fontSize: 18,
  fontWeight: "bold",
},
});