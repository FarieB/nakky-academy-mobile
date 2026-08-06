import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// 1. Add the admin guard hook import
import useAdminGuard from "../../src/hooks/useAdminGuard";
import API from "../../src/services/api";

export default function EditCourse() {
  // 2. Initialize the guard at the very start of the component
  const isAdminLoading = useAdminGuard();

  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ===========================
  // COURSE DETAILS
  // ===========================

  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");

  const [category, setCategory] =
    useState("Caregiving");

  const [level, setLevel] =
    useState("Beginner");

  const [duration, setDuration] =
    useState("");

  const [price, setPrice] =
    useState("");

  const [passMark, setPassMark] =
    useState("80");

  const [published, setPublished] =
    useState(false);

  const [certificate, setCertificate] =
    useState(true);

  // ===========================
  // LESSONs
  // ===========================

  const [lessons, setLessons] = useState<any[]>([]);

  // ===========================
  // LOAD COURSE
  // ===========================

  useEffect(() => {
    // Prevent loading data from your backend if user isn't authenticated yet
    if (isAdminLoading) return;

    loadCourse();
  }, [isAdminLoading]); // Added security dependency here

  const loadCourse = async () => {
    try {
      const token =
        await AsyncStorage.getItem("token");

      API.defaults.headers.common.Authorization =
        `Bearer ${token}`;

      const res = await API.get(
        `/courses/${id}`
      );

      const course = res.data;

      setTitle(course.title || "");

      setShortDescription(
        course.shortDescription || ""
      );

      setDescription(
        course.description || ""
      );

      setCategory(
        course.category || "Caregiving"
      );

      setLevel(
        course.level || "Beginner"
      );

      setDuration(
        course.duration?.toString() || ""
      );

      setPrice(
        course.price?.toString() || ""
      );

      setPassMark(
        course.passMark?.toString() || "80"
      );

      setPublished(
        course.published || false
      );

      setCertificate(
        course.certificate ?? true
      );

      setLessons(
        course.content || []
      );

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

  // ===========================
  // LESSON HELPERS
  // ===========================

  const addLesson = () => {
    setLessons([
      ...lessons,
      {
        title: "",
        description: "",
        duration: "",
        videoUrl: "",
      },
    ]);
  };

  const removeLesson = (
    index: number
  ) => {
    const copy = [...lessons];

    copy.splice(index, 1);

    setLessons(copy);
  };

  const updateLesson = (
    index: number,
    field: string,
    value: string
  ) => {
    const copy: any = [...lessons];

    copy[index][field] = value;

    setLessons(copy);
  };

 const uploadVideo = async (lessonIndex: number) => {
    try {
        // Halt media operations if authentication is not validated
        if (isAdminLoading) return;

        const result =
            await DocumentPicker.getDocumentAsync({
                type: "video/*",
                copyToCacheDirectory: true,
            });

        if (result.canceled) return;

        const file = result.assets[0]; 

        const token =
            await AsyncStorage.getItem("token");

        const form = new FormData();

        form.append("video", {
            uri: file.uri,
            name: file.name,
            type: "video/mp4",
        } as any);

        form.append(
            "title",
            lessons[lessonIndex].title
        );

        form.append(
            "description",
            lessons[lessonIndex].description
        );

       const courseId = id;

        const response = await API.post(
          `/courses/${courseId}/upload-video`,
          form,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        ); 

       updateLesson(
        lessonIndex,
        "videoUrl",
        response.data.lesson.videoUrl
    ); 

        Alert.alert(
            "Success",
            "Video uploaded."
        );

    } catch (err: any) {
        Alert.alert(
            "Upload Failed",
            err.response?.data?.message ||
            err.message
        );
    }
};


  // ===========================
  // SAVE COURSE
  // ===========================

  const updateCourse = async () => {
    if (!title.trim()) {
      Alert.alert(
        "Validation",
        "Course title is required."
      );
      return;
    }

    setSaving(true);

    try {
      const token =
        await AsyncStorage.getItem("token");

      API.defaults.headers.common.Authorization =
        `Bearer ${token}`;

      await API.put(
        `/courses/${id}`,
        {
          title,
          shortDescription,
          description,
          category,
          level,
          duration: Number(duration),
          price: Number(price),
          passMark: Number(passMark),
          published,
          certificate,

          content: lessons.map(
            (lesson, index) => ({
              title: lesson.title,
              description:
                lesson.description,
              duration:
                Number(
                  lesson.duration
                ),
              videoUrl:
                lesson.videoUrl,
              order: index + 1,
            })
          ),
        }
      );

      Alert.alert(
        "Success",
        "Course updated successfully."
      );

      router.back();

    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.message ||
          "Unable to update course."
      );
    } finally {
      setSaving(false);
    }
  };

  // ===========================
  // LOADING & SECURITY INTERCEPT
  // ===========================

  // 3. Halt compilation and return null immediately if security guard is evaluating
  if (isAdminLoading) {
    return null;
  }

  if (loading || saving) {
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
        ✏️ Edit Course
      </Text>

      <Text style={styles.subHeading}>
        Update your course information and lessons.
      </Text>

      {/* ========================= */}
      {/* BASIC INFORMATION */}
      {/* ========================= */}

      <Text style={styles.section}>
        Basic Information
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Course Title"
        value={title}
        onChangeText={setTitle}
      />

      <TextInput
        style={styles.input}
        placeholder="Short Description"
        value={shortDescription}
        onChangeText={setShortDescription}
      />

      <TextInput
        style={[
          styles.input,
          {
            height: 120,
            textAlignVertical: "top",
          },
        ]}
        multiline
        placeholder="Full Description"
        value={description}
        onChangeText={setDescription}
      />

      <TextInput
        style={styles.input}
        placeholder="Category"
        value={category}
        onChangeText={setCategory}
      />

      <TextInput
        style={styles.input}
        placeholder="Level"
        value={level}
        onChangeText={setLevel}
      />

      <TextInput
        style={styles.input}
        placeholder="Duration (Hours)"
        keyboardType="numeric"
        value={duration}
        onChangeText={setDuration}
      />

      <TextInput
        style={styles.input}
        placeholder="Price"
        keyboardType="numeric"
        value={price}
        onChangeText={setPrice}
      />

      {/* ========================= */}
      {/* COURSE SETTINGS */}
      {/* ========================= */}

      <Text style={styles.section}>
        Course Settings
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Pass Mark (%)"
        keyboardType="numeric"
        value={passMark}
        onChangeText={setPassMark}
      />

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>
          Published
        </Text>

        <Switch
          value={published}
          onValueChange={setPublished}
          trackColor={{
            false: "#ccc",
            true: "#4CAF50",
          }}
        />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>
          Certificate
        </Text>

        <Switch
          value={certificate}
          onValueChange={setCertificate}
          trackColor={{
            false: "#ccc",
            true: "#4CAF50",
          }}
        />
      </View>

      {/* ========================= */}
      {/* LESSONS */}
      {/* ========================= */}

      <Text style={styles.section}>
        Lessons
      </Text>

      {lessons.map((lesson, index) => (
        <View
          key={index}
          style={styles.lessonCard}
        >
          <Text style={styles.lessonTitle}>
            Lesson {index + 1}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Lesson Title"
            value={lesson.title}
            onChangeText={(text) =>
              updateLesson(
                index,
                "title",
                text
              )
            }
          />

          <TextInput
            style={[
              styles.input,
              {
                height: 90,
                textAlignVertical: "top",
              },
            ]}
            multiline
            placeholder="Lesson Description"
            value={lesson.description}
            onChangeText={(text) =>
              updateLesson(
                index,
                "description",
                text
              )
            }
          />

          <TextInput
            style={styles.input}
            placeholder="Lesson Duration (Minutes)"
            keyboardType="numeric"
            value={lesson.duration?.toString()}
            onChangeText={(text) =>
              updateLesson(
                index,
                "duration",
                text
              )
            }
          />

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => uploadVideo(index)}
        >
            <Text style={styles.uploadButtonText}>
                {lesson.videoUrl
                    ? "✅ Video Uploaded"
                    : "🎥 Upload Lesson Video"}
            </Text>
        </TouchableOpacity>

        {lesson.videoUrl ? (
            <Text style={styles.videoName}>
                {lesson.videoUrl}
            </Text>
        ) : null}

          <TouchableOpacity
            style={styles.removeButton}
            onPress={() =>
              removeLesson(index)
            }
          >
            <Text
              style={styles.removeButtonText}
            >
              Remove Lesson
            </Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity
        style={styles.addButton}
        onPress={addLesson}
      >
        <Text style={styles.addButtonText}>
          + Add Lesson
        </Text>
      </TouchableOpacity>

      {/* ========================= */}
      {/* ACTION BUTTONS */}
      {/* ========================= */}

      <TouchableOpacity
        style={styles.saveButton}
        onPress={updateCourse}
      >
        <Text style={styles.saveButtonText}>
          💾 Save Changes
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.saveButton,
          {
            backgroundColor: published
              ? "#FF9800"
              : "#4CAF50",
          },
        ]}
        onPress={() =>
          setPublished(!published)
        }
      >
        <Text style={styles.saveButtonText}>
          {published
            ? "📥 Unpublish Course"
            : "🚀 Publish Course"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => router.back()}
      >
        <Text
          style={styles.cancelButtonText}
        >
          Cancel
        </Text>
      </TouchableOpacity>

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
    marginBottom: 30,
  },

  section: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
    marginBottom: 15,
    marginTop: 10,
  },

  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    marginBottom: 15,
    fontSize: 16,
  },

  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    marginBottom: 15,
  },

  switchLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },

  lessonCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
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
    fontSize: 18,
    fontWeight: "700",
    color: "#E91E63",
    marginBottom: 15,
  },

  addButton: {
    backgroundColor: "#E91E63",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 25,
  },

  addButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },

  removeButton: {
    backgroundColor: "#D32F2F",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },

  removeButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 15,
  },

  saveButton: {
    backgroundColor: "#E91E63",
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 15,
  },

  saveButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },

  cancelButton: {
    backgroundColor: "#757575",
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 40,
  },

  cancelButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  uploadButton: {
  backgroundColor: "#E91E63",
  paddingVertical: 14,
  borderRadius: 12,
  alignItems: "center",
  marginTop: 12,
  },

  uploadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  videoName: {
    marginTop: 10,
    color: "#666",
    fontSize: 14,
    fontStyle: "italic",
  },
});