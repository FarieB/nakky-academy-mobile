import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
} from "react-native";

import API from "../../src/services/api";

export default function LessonPlayer() {
  const router = useRouter();

  const { courseId, lessonIndex } =
    useLocalSearchParams<{
      courseId: string;
      lessonIndex: string;
    }>();

  const [loading, setLoading] = useState(true);

  const [course, setCourse] = useState<any>(null);

  const [lesson, setLesson] = useState<any>(null);

  // ===========================
  // LOAD LESSON
  // ===========================

  useEffect(() => {
    loadLesson();
  }, []);

  const loadLesson = async () => {
    try {
      const token =
        await AsyncStorage.getItem("token");

      API.defaults.headers.common.Authorization =
        `Bearer ${token}`;

      const res = await API.get(
        `/courses/${courseId}/content`
      );

      const courseData = res.data;

      setCourse(courseData);

      setLesson(
        courseData.content[
          Number(lessonIndex)
        ]
      );

    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.message ||
          "Unable to load lesson."
      );
    } finally {
      setLoading(false);
    }
  };

  // ===========================
  // VIDEO PLAYER
  // ===========================

  const player = useVideoPlayer(
    lesson?.videoUrl
      ? `${API.defaults.baseURL}/courses/${courseId}/video/${lesson.videoUrl}`
      : "",
    player => {
      player.loop = false;
    }
  );

  // ===========================
  // MARK LESSON COMPLETE
  // ===========================

  const markComplete = async () => {
  try {
    const token = await AsyncStorage.getItem("token");

    API.defaults.headers.common.Authorization = `Bearer ${token}`;

    await API.put(`/courses/${courseId}/progress`, {
      lessonId: lesson._id,
    }); // Fixed: Removed the extra closing parenthesis here
  } catch (error) {
    console.error(error); // Added: Essential to catch and log potential errors
  }
};


      Alert.alert(
        "Success",
        "Lesson completed!",
        [
          {
            text: "OK",
            onPress: () =>
              router.replace({
                pathname:
                  "/(student)/course-player",
                params: {
                  id: courseId,
                },
              } as any),
          },
        ]
      );

    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.message ||
          "Unable to update progress."
      );
    }
  };

  // ===========================
  // LOADING
  // ===========================

  if (loading || !lesson) {
    return (
      <ActivityIndicator
        size="large"
        color="#E91E63"
        style={{
          marginTop: 150,
        }}
      />
    );
  }


      return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.heading}>
        {lesson.title}
      </Text>

      <Text style={styles.subHeading}>
        Lesson {Number(lessonIndex) + 1} of {course.content.length}
      </Text>

      {/* ========================= */}
      {/* VIDEO PLAYER */}
      {/* ========================= */}

      <View style={styles.videoContainer}>
        <VideoView
          style={styles.video}
          player={player}
          allowsFullscreen
          allowsPictureInPicture
          nativeControls
        />
      </View>

      {/* ========================= */}
      {/* LESSON INFO */}
      {/* ========================= */}

      <View style={styles.card}>

        <Text style={styles.section}>
          Lesson Description
        </Text>

        <Text style={styles.description}>
          {lesson.description}
        </Text>

        <Text style={styles.duration}>
          ⏱ Duration: {lesson.duration} minutes
        </Text>

      </View>

      {/* ========================= */}
      {/* ACTIONS */}
      {/* ========================= */}

      <TouchableOpacity
        style={styles.completeButton}
        onPress={markComplete}
      >
        <Text style={styles.completeButtonText}>
          ✅ Mark Lesson Complete
        </Text>
      </TouchableOpacity>

      <View style={styles.navigationRow}>

        <TouchableOpacity
          disabled={Number(lessonIndex) === 0}
          style={[
            styles.navButton,
            Number(lessonIndex) === 0 && styles.disabledButton,
          ]}
          onPress={() =>
            router.replace({
              pathname: "/(student)/lesson-player",
              params: {
                courseId,
                lessonIndex: String(Number(lessonIndex) - 1),
              },
            } as any)
          }
        >
          <Text style={styles.navButtonText}>
            ◀ Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={
            Number(lessonIndex) >=
            course.content.length - 1
          }
          style={[
            styles.navButton,
            Number(lessonIndex) >=
              course.content.length - 1 &&
              styles.disabledButton,
          ]}
          onPress={() =>
            router.replace({
              pathname: "/(student)/lesson-player",
              params: {
                courseId,
                lessonIndex: String(Number(lessonIndex) + 1),
              },
            } as any)
          }
        >
          <Text style={styles.navButtonText}>
            Next ▶
          </Text>
        </TouchableOpacity>

      </View>

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
    marginBottom: 6,
  },

  subHeading: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },

  videoContainer: {
    backgroundColor: "#000",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 25,
  },

  video: {
    width: "100%",
    height: 220,
  },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
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

  section: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
    marginBottom: 12,
  },

  description: {
    fontSize: 16,
    color: "#555",
    lineHeight: 24,
    marginBottom: 15,
  },

  duration: {
    fontSize: 15,
    color: "#888",
    fontWeight: "600",
  },

  completeButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 20,
  },

  completeButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },

  navigationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
  },

  navButton: {
    backgroundColor: "#E91E63",
    width: "48%",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  disabledButton: {
    backgroundColor: "#CFCFCF",
  },

  navButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});


