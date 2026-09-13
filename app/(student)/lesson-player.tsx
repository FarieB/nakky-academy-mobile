import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { VideoView, useVideoPlayer } from "expo-video";

const API_URL = "http://localhost:5000/api";

type Material = {
  _id?: string;
  filename?: string;
  originalName?: string;
  mimeType?: string;
  type?: "pdf" | "audio";
  size?: number;
  uploadedAt?: string;
};

type Video = {
  type?: "none" | "upload" | "external";
  url?: string;
  filename?: string;
  title?: string;
};

type Lesson = {
  _id?: string;
  title?: string;
  description?: string;
  duration?: number | string;
  order?: number;
  materials?: Material[];
  video?: Video;
  videoUrl?: string;
};

type Assignment = {
  enabled?: boolean;
  title?: string;
  instructions?: string;
  passMark?: number;
  questions?: any[];
};

type Module = {
  _id?: string;
  title?: string;
  description?: string;
  order?: number;
  lessons?: Lesson[];
  assignment?: Assignment;
};

type Course = {
  _id?: string;
  title?: string;
  description?: string;
  price?: number;
  modules?: Module[];
  content?: Lesson[];
  finalExam?: {
    enabled?: boolean;
    title?: string;
    instructions?: string;
    durationMinutes?: number;
    passMark?: number;
    questions?: any[];
  };
};

type Enrollment = {
  progress?: number;
  completed?: boolean;
  certificateIssued?: boolean;
  lessonsCompleted?: {
    lessonId?: string;
    completedAt?: string;
  }[];
  lastAccessed?: string;
};

export default function LessonPlayer() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    courseId?: string;
    id?: string;
    moduleIndex?: string;
    lessonIndex?: string;
  }>();

  const courseId = params.courseId || params.id || "";

  const moduleIndexParam = Number(params.moduleIndex ?? 0);
  const lessonIndexParam = Number(params.lessonIndex ?? 0);

  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);

  const [loading, setLoading] = useState(true);
  const [markingComplete, setMarkingComplete] = useState(false);

  const [currentModuleIndex, setCurrentModuleIndex] =
    useState(moduleIndexParam);

  const [currentLessonIndex, setCurrentLessonIndex] =
    useState(lessonIndexParam);

  /*
   * =========================================================
   * NORMALISE COURSE STRUCTURE
   * =========================================================
   *
   * New courses:
   *
   * modules[]
   *   └── lessons[]
   *
   * Old courses:
   *
   * content[]
   *
   * We convert legacy content into one temporary module so
   * the Lesson Player can handle both structures.
   */

  const modules = useMemo<Module[]>(() => {
    if (!course) return [];

    if (course.modules && course.modules.length > 0) {
      return course.modules;
    }

    if (course.content && course.content.length > 0) {
      return [
        {
          _id: "legacy-module-1",
          title: "Module 1",
          description: "Course Lessons",
          lessons: course.content,
        },
      ];
    }

    return [];
  }, [course]);

  /*
   * =========================================================
   * LOAD COURSE CONTENT
   * =========================================================
   */

  const loadCourse = async () => {
    try {
      if (!courseId) {
        Alert.alert("Error", "Course ID is missing.");
        router.back();
        return;
      }

      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert(
          "Session Expired",
          "Please log in again to access your course."
        );

        router.replace("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/courses/${courseId}/content`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || data?.error || "Unable to load course."
        );
      }

      /*
       * Different versions of the backend may return:
       *
       * {
       *   course,
       *   enrollment
       * }
       *
       * or simply the course object.
       */

      const loadedCourse: Course =
        data?.course ||
        data?.data?.course ||
        data;

      const loadedEnrollment: Enrollment | null =
        data?.enrollment ||
        data?.data?.enrollment ||
        data?.enrollmentData ||
        null;

      setCourse(loadedCourse);
      setEnrollment(loadedEnrollment);
    } catch (error: any) {
      console.error("Lesson player error:", error);

      Alert.alert(
        "Unable to Load Lesson",
        error?.message || "Something went wrong while loading the course."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  /*
   * =========================================================
   * KEEP PARAMETER POSITION
   * =========================================================
   */

  useEffect(() => {
    if (!course) return;

    if (
      moduleIndexParam >= 0 &&
      moduleIndexParam < modules.length
    ) {
      setCurrentModuleIndex(moduleIndexParam);
    }

    const selectedModule = modules[moduleIndexParam];

    if (
      selectedModule?.lessons &&
      lessonIndexParam >= 0 &&
      lessonIndexParam < selectedModule.lessons.length
    ) {
      setCurrentLessonIndex(lessonIndexParam);
    }
  }, [course, modules]);

  /*
   * =========================================================
   * CURRENT MODULE / LESSON
   * =========================================================
   */

  const currentModule = modules[currentModuleIndex];

  const lessons = currentModule?.lessons || [];

  const currentLesson = lessons[currentLessonIndex];

  /*
   * =========================================================
   * COMPLETED LESSONS
   * =========================================================
   */

  const completedLessonIds = useMemo(() => {
    return new Set(
      (enrollment?.lessonsCompleted || [])
        .map((item) => item?.lessonId)
        .filter(Boolean)
        .map((id) => String(id))
    );
  }, [enrollment]);

  const lessonId = currentLesson?._id
    ? String(currentLesson._id)
    : null;

  const lessonCompleted = lessonId
    ? completedLessonIds.has(lessonId)
    : false;

  /*
   * =========================================================
   * VIDEO
   * =========================================================
   */

  const videoSource = useMemo(() => {
    if (!currentLesson) return null;

    /*
     * New structure:
     *
     * lesson.video.type
     * lesson.video.url
     * lesson.video.filename
     */

    if (currentLesson.video?.type === "external") {
      return currentLesson.video.url || null;
    }

    /*
     * Legacy structure:
     *
     * lesson.videoUrl
     */

    if (
      currentLesson.videoUrl &&
      (
        currentLesson.videoUrl.startsWith("http://") ||
        currentLesson.videoUrl.startsWith("https://")
      )
    ) {
      return currentLesson.videoUrl;
    }

    /*
     * Uploaded video.
     *
     * The backend protects this endpoint using the student's
     * authenticated enrollment.
     */

    const filename =
      currentLesson.video?.filename ||
      (
        currentLesson.video?.type === "upload"
          ? currentLesson.video.url
          : null
      ) ||
      (
        currentLesson.videoUrl &&
        !currentLesson.videoUrl.startsWith("http")
          ? currentLesson.videoUrl
          : null
      );

    if (!filename) return null;

    return `${API_URL}/courses/${courseId}/video/${encodeURIComponent(
      filename
    )}`;
  }, [currentLesson, courseId]);

  /*
   * expo-video player
   *
   * Only create a player when there is a video source.
   */

  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = false;
  });

  /*
   * =========================================================
   * VIDEO TYPE HELPERS
   * =========================================================
   */

  const hasVideo =
    currentLesson?.video?.type === "upload" ||
    currentLesson?.video?.type === "external" ||
    !!currentLesson?.videoUrl;

  const isExternalVideo =
    currentLesson?.video?.type === "external" ||
    (
      !!currentLesson?.videoUrl &&
      (
        currentLesson.videoUrl.startsWith("http://") ||
        currentLesson.videoUrl.startsWith("https://")
      )
    );

  /*
   * =========================================================
   * FORMAT FILE SIZE
   * =========================================================
   */

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return "";

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  /*
   * =========================================================
   * OPEN EXTERNAL VIDEO
   * =========================================================
   */

  const openExternalVideo = async () => {
    const url =
      currentLesson?.video?.url ||
      currentLesson?.videoUrl;

    if (!url) {
      Alert.alert("Video unavailable", "No video link is available.");
      return;
    }

    try {
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        Alert.alert(
          "Unable to Open Video",
          "This video link cannot be opened on your device."
        );
        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      Alert.alert(
        "Unable to Open Video",
        "The video link could not be opened."
      );
    }
  };

  /*
   * =========================================================
   * OPEN MATERIAL
   * =========================================================
   *
   * IMPORTANT:
   *
   * Material endpoints are protected by authentication.
   *
   * We therefore do not pretend that Linking.openURL()
   * will automatically attach the Bearer token.
   *
   * For now, the user gets a clear message instead of a
   * broken PDF/audio link.
   *
   * The secure material viewer/download flow can be added
   * once the material endpoint is finalised.
   */

  const openMaterial = async (material: Material) => {
    if (!material) return;

    /*
     * If a future backend supplies a public URL, allow it.
     */

    const publicUrl =
      (material as any).url ||
      (material as any).fileUrl;

    if (
      publicUrl &&
      (
        publicUrl.startsWith("http://") ||
        publicUrl.startsWith("https://")
      )
    ) {
      try {
        await Linking.openURL(publicUrl);
      } catch {
        Alert.alert(
          "Unable to Open",
          "The material could not be opened."
        );
      }

      return;
    }

    Alert.alert(
      material.type === "audio"
        ? "Audio Material"
        : "PDF Material",
      "This course material is protected and requires authenticated access. The secure material viewer will open it once the material endpoint is connected."
    );
  };

  /*
   * =========================================================
   * MARK LESSON COMPLETE
   * =========================================================
   */

  const markLessonComplete = async () => {
    if (!courseId || !lessonId) {
      Alert.alert(
        "Unable to Complete",
        "This lesson does not have a valid lesson ID."
      );
      return;
    }

    if (lessonCompleted) {
      goToNextLesson();
      return;
    }

    try {
      setMarkingComplete(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert(
          "Session Expired",
          "Please log in again."
        );

        router.replace("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/courses/${courseId}/progress`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lessonId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
          data?.error ||
          "Unable to update lesson progress."
        );
      }

      /*
       * Update local enrollment immediately.
       */

      setEnrollment((previous) => {
        if (!previous) {
          return {
            progress: data?.progress || 0,
            completed: data?.completed || false,
            lessonsCompleted: [
              {
                lessonId,
                completedAt: new Date().toISOString(),
              },
            ],
          };
        }

        const existing =
          previous.lessonsCompleted || [];

        return {
          ...previous,
          progress:
            typeof data?.progress === "number"
              ? data.progress
              : previous.progress,
          completed:
            typeof data?.completed === "boolean"
              ? data.completed
              : previous.completed,
          lessonsCompleted: [
            ...existing,
            {
              lessonId,
              completedAt: new Date().toISOString(),
            },
          ],
        };
      });

      Alert.alert(
        "Lesson Completed ✓",
        "Your progress has been saved.",
        [
          {
            text: "Continue",
            onPress: goToNextLesson,
          },
        ]
      );
    } catch (error: any) {
      console.error("Progress update error:", error);

      Alert.alert(
        "Unable to Save Progress",
        error?.message ||
          "Your lesson could not be marked as complete."
      );
    } finally {
      setMarkingComplete(false);
    }
  };

  /*
   * =========================================================
   * FIND NEXT LESSON
   * =========================================================
   */

  const getNextPosition = () => {
    if (!currentModule) return null;

    /*
     * Next lesson within the same module.
     */

    if (
      currentLessonIndex <
      lessons.length - 1
    ) {
      return {
        moduleIndex: currentModuleIndex,
        lessonIndex: currentLessonIndex + 1,
      };
    }

    /*
     * First lesson of the next module.
     */

    if (
      currentModuleIndex <
      modules.length - 1
    ) {
      const nextModule =
        modules[currentModuleIndex + 1];

      if (
        nextModule?.lessons &&
        nextModule.lessons.length > 0
      ) {
        return {
          moduleIndex: currentModuleIndex + 1,
          lessonIndex: 0,
        };
      }
    }

    return null;
  };

  /*
   * =========================================================
   * FIND PREVIOUS LESSON
   * =========================================================
   */

  const getPreviousPosition = () => {
    /*
     * Previous lesson within module.
     */

    if (currentLessonIndex > 0) {
      return {
        moduleIndex: currentModuleIndex,
        lessonIndex: currentLessonIndex - 1,
      };
    }

    /*
     * Last lesson of previous module.
     */

    if (currentModuleIndex > 0) {
      const previousModule =
        modules[currentModuleIndex - 1];

      const previousLessons =
        previousModule?.lessons || [];

      if (previousLessons.length > 0) {
        return {
          moduleIndex: currentModuleIndex - 1,
          lessonIndex:
            previousLessons.length - 1,
        };
      }
    }

    return null;
  };

  /*
   * =========================================================
   * NEXT LESSON
   * =========================================================
   */

  const goToNextLesson = () => {
    const next = getNextPosition();

    if (!next) {
      /*
       * There are no more lessons.
       *
       * If a final exam exists, take the student there.
       */

      if (course?.finalExam?.enabled) {
        router.push({
          pathname: "/(student)/final-exam",
          params: {
            courseId,
          },
        } as any);

        return;
      }

      Alert.alert(
        "Course Lessons Complete",
        "You have completed all available lessons."
      );

      return;
    }

    router.replace({
      pathname: "/(student)/lesson-player",
      params: {
        courseId,
        moduleIndex: String(next.moduleIndex),
        lessonIndex: String(next.lessonIndex),
      },
    });
  };

  /*
   * =========================================================
   * PREVIOUS LESSON
   * =========================================================
   */

  const goToPreviousLesson = () => {
    const previous = getPreviousPosition();

    if (!previous) {
      return;
    }

    router.replace({
      pathname: "/(student)/lesson-player",
      params: {
        courseId,
        moduleIndex: String(previous.moduleIndex),
        lessonIndex: String(previous.lessonIndex),
      },
    });
  };

  /*
   * =========================================================
   * OPEN MODULE ASSIGNMENT
   * =========================================================
   */

  const openAssignment = () => {
    if (!currentModule?.assignment?.enabled) {
      return;
    }

    router.push({
      pathname: "/(student)/assignment",
      params: {
        courseId,
        moduleId: String(
          currentModule._id || ""
        ),
        moduleIndex: String(currentModuleIndex),
      },
    } as any);
  };

  /*
   * =========================================================
   * OPEN FINAL EXAM
   * =========================================================
   */

  const openFinalExam = () => {
    if (!course?.finalExam?.enabled) {
      return;
    }

    router.push({
      pathname: "/(student)/final-exam",
      params: {
        courseId,
      },
    } as any);
  };

  /*
   * =========================================================
   * COURSE PROGRESS
   * =========================================================
   */

  const calculatedProgress = useMemo(() => {
    const allLessons = modules.flatMap(
      (module) => module.lessons || []
    );

    if (allLessons.length === 0) {
      return 0;
    }

    const completed = allLessons.filter((lesson) => {
      if (!lesson._id) return false;

      return completedLessonIds.has(
        String(lesson._id)
      );
    }).length;

    return Math.round(
      (completed / allLessons.length) * 100
    );
  }, [modules, completedLessonIds]);

  const progress =
    typeof enrollment?.progress === "number"
      ? enrollment.progress
      : calculatedProgress;

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#1D4ED8"
        />

        <Text style={styles.loadingText}>
          Loading lesson...
        </Text>
      </View>
    );
  }

  /*
   * =========================================================
   * COURSE ERROR
   * =========================================================
   */

  if (!course || !currentLesson) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>

        <Text style={styles.errorTitle}>
          Lesson Not Found
        </Text>

        <Text style={styles.errorText}>
          We could not find the lesson you are trying
          to access.
        </Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const previousPosition =
    getPreviousPosition();

  const nextPosition =
    getNextPosition();

  const materials =
    currentLesson.materials || [];

  const assignmentEnabled =
    currentModule?.assignment?.enabled === true;

  const finalExamEnabled =
    course.finalExam?.enabled === true;

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ============================
            HEADER
        ============================ */}

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBack}
            onPress={() => router.back()}
          >
            <Text style={styles.headerBackText}>
              ←
            </Text>
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text
              style={styles.courseTitle}
              numberOfLines={1}
            >
              {course.title || "Course"}
            </Text>

            <Text style={styles.moduleTitle}>
              {currentModule?.title ||
                `Module ${currentModuleIndex + 1}`}
            </Text>
          </View>
        </View>

        {/* ============================
            PROGRESS
        ============================ */}

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              Course Progress
            </Text>

            <Text style={styles.progressValue}>
              {progress}%
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(
                    Math.max(progress, 0),
                    100
                  )}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* ============================
            MODULE / LESSON POSITION
        ============================ */}

        <View style={styles.positionRow}>
          <Text style={styles.positionText}>
            Module {currentModuleIndex + 1} of{" "}
            {modules.length}
          </Text>

          <Text style={styles.positionText}>
            Lesson {currentLessonIndex + 1} of{" "}
            {lessons.length}
          </Text>
        </View>

        {/* ============================
            LESSON HEADER
        ============================ */}

        <View style={styles.lessonHeader}>
          <View style={styles.lessonNumber}>
            <Text style={styles.lessonNumberText}>
              {currentLessonIndex + 1}
            </Text>
          </View>

          <View style={styles.lessonHeading}>
            <Text style={styles.lessonTitle}>
              {currentLesson.title ||
                `Lesson ${currentLessonIndex + 1}`}
            </Text>

            {currentLesson.duration ? (
              <Text style={styles.duration}>
                ⏱ {currentLesson.duration}
              </Text>
            ) : null}
          </View>

          {lessonCompleted ? (
            <View style={styles.completedBadge}>
              <Text
                style={styles.completedBadgeText}
              >
                ✓
              </Text>
            </View>
          ) : null}
        </View>

        {/* ============================
            DESCRIPTION
        ============================ */}

        {currentLesson.description ? (
          <View style={styles.descriptionCard}>
            <Text style={styles.sectionTitle}>
              About this lesson
            </Text>

            <Text style={styles.description}>
              {currentLesson.description}
            </Text>
          </View>
        ) : null}

        {/* ============================
            VIDEO
        ============================ */}

        {hasVideo ? (
          <View style={styles.videoSection}>
            <Text style={styles.sectionTitle}>
              Lesson Video
            </Text>

            {isExternalVideo ? (
              <TouchableOpacity
                style={styles.externalVideoButton}
                onPress={openExternalVideo}
              >
                <Text style={styles.videoIcon}>
                  ▶
                </Text>

                <View style={styles.videoTextContainer}>
                  <Text
                    style={
                      styles.externalVideoTitle
                    }
                  >
                    Watch Video
                  </Text>

                  <Text
                    style={
                      styles.externalVideoSubtitle
                    }
                  >
                    Open video lesson
                  </Text>
                </View>

                <Text style={styles.arrow}>
                  →
                </Text>
              </TouchableOpacity>
            ) : videoSource ? (
              <View style={styles.videoContainer}>
               <VideoView
                  player={player}
                  style={styles.video}
                /> 
              </View>
            ) : (
              <View style={styles.unavailableCard}>
                <Text style={styles.unavailableIcon}>
                  🎥
                </Text>

                <Text
                  style={styles.unavailableText}
                >
                  Video is currently unavailable.
                </Text>
              </View>
            )}
          </View>
        ) : null}

        {/* ============================
            MATERIALS
        ============================ */}

        {materials.length > 0 ? (
          <View style={styles.materialsSection}>
            <Text style={styles.sectionTitle}>
              Learning Materials
            </Text>

            {materials.map(
              (material, index) => {
                const isPdf =
                  material.type === "pdf" ||
                  material.mimeType ===
                    "application/pdf";

                const isAudio =
                  material.type === "audio" ||
                  !!material.mimeType?.startsWith(
                    "audio/"
                  );

                return (
                  <TouchableOpacity
                    key={
                      material._id ||
                      material.filename ||
                      `material-${index}`
                    }
                    style={styles.materialCard}
                    onPress={() =>
                      openMaterial(material)
                    }
                  >
                    <View
                      style={[
                        styles.materialIcon,
                        isAudio
                          ? styles.audioIcon
                          : styles.pdfIcon,
                      ]}
                    >
                      <Text
                        style={
                          styles.materialIconText
                        }
                      >
                        {isAudio ? "🎧" : "📄"}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.materialInfo
                      }
                    >
                      <Text
                        style={
                          styles.materialName
                        }
                        numberOfLines={2}
                      >
                        {material.originalName ||
                          material.filename ||
                          `Material ${index + 1}`}
                      </Text>

                      <Text
                        style={
                          styles.materialMeta
                        }
                      >
                        {isAudio
                          ? "Audio"
                          : isPdf
                          ? "PDF"
                          : "Material"}

                        {material.size
                          ? ` • ${formatFileSize(
                              material.size
                            )}`
                          : ""}
                      </Text>
                    </View>

                    <Text style={styles.materialArrow}>
                      →
                    </Text>
                  </TouchableOpacity>
                );
              }
            )}
          </View>
        ) : null}

        {/* ============================
            MODULE ASSIGNMENT
        ============================ */}

        {assignmentEnabled ? (
          <View style={styles.assignmentCard}>
            <View style={styles.assignmentIcon}>
              <Text style={styles.assignmentIconText}>
                📝
              </Text>
            </View>

            <View
              style={styles.assignmentInfo}
            >
              <Text
                style={styles.assignmentTitle}
              >
                {currentModule.assignment
                  ?.title ||
                  "Module Assignment"}
              </Text>

              <Text
                style={styles.assignmentDescription}
              >
                Complete the assignment for this
                module.
              </Text>

              {typeof currentModule.assignment
                ?.passMark === "number" ? (
                <Text
                  style={styles.passMark}
                >
                  Pass mark:{" "}
                  {
                    currentModule.assignment
                      .passMark
                  }%
                </Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={styles.assignmentButton}
              onPress={openAssignment}
            >
              <Text
                style={
                  styles.assignmentButtonText
                }
              >
                Open
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ============================
            FINAL EXAM
        ============================ */}

        {finalExamEnabled &&
        !nextPosition ? (
          <View style={styles.examCard}>
            <View style={styles.examIcon}>
              <Text style={styles.examIconText}>
                🎓
              </Text>
            </View>

            <Text style={styles.examTitle}>
              Final Examination
            </Text>

            <Text style={styles.examDescription}>
              You have reached the end of the course
              lessons. Complete the final examination
              to finish the course.
            </Text>

            {typeof course.finalExam
              ?.passMark === "number" ? (
              <Text style={styles.examPassMark}>
                Pass mark:{" "}
                {course.finalExam.passMark}%
              </Text>
            ) : null}

            {course.finalExam
              ?.durationMinutes ? (
              <Text
                style={styles.examDuration}
              >
                Duration:{" "}
                {
                  course.finalExam
                    .durationMinutes
                }{" "}
                minutes
              </Text>
            ) : null}

            <TouchableOpacity
              style={styles.examButton}
              onPress={openFinalExam}
            >
              <Text style={styles.examButtonText}>
                Start Final Examination
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ============================
            COMPLETE LESSON
        ============================ */}

        <TouchableOpacity
          style={[
            styles.completeButton,
            lessonCompleted &&
              styles.completedButton,
          ]}
          onPress={markLessonComplete}
          disabled={markingComplete}
        >
          {markingComplete ? (
            <ActivityIndicator
              color="#FFFFFF"
            />
          ) : (
            <Text
              style={styles.completeButtonText}
            >
              {lessonCompleted
                ? "✓ Lesson Completed — Continue"
                : "✓ Mark Lesson as Complete"}
            </Text>
          )}
        </TouchableOpacity>

        {/* ============================
            NAVIGATION
        ============================ */}

        <View style={styles.navigationRow}>
          <TouchableOpacity
            style={[
              styles.navigationButton,
              !previousPosition &&
                styles.disabledNavigationButton,
            ]}
            onPress={goToPreviousLesson}
            disabled={!previousPosition}
          >
            <Text
              style={[
                styles.navigationButtonText,
                !previousPosition &&
                  styles.disabledNavigationText,
              ]}
            >
              ← Previous
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navigationButton,
              styles.nextButton,
              !nextPosition &&
                styles.disabledNavigationButton,
            ]}
            onPress={goToNextLesson}
            disabled={!nextPosition}
          >
            <Text
              style={[
                styles.navigationButtonText,
                styles.nextButtonText,
                !nextPosition &&
                  styles.disabledNavigationText,
              ]}
            >
              Next →
            </Text>
          </TouchableOpacity>
        </View>

        {/* ============================
            BACK TO COURSE
        ============================ */}

        <TouchableOpacity
          style={styles.courseButton}
          onPress={() =>
            router.push({
              pathname:
                "/(student)/course-player",
              params: {
                id: courseId,
              },
            } as any)
          }
        >
          <Text style={styles.courseButtonText}>
            ☰ Back to Course
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

/*
 * ============================================================
 * STYLES
 * ============================================================
 */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  scrollContent: {
    paddingBottom: 30,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F7FB",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#555",
  },

  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    backgroundColor: "#F5F7FB",
  },

  errorIcon: {
    fontSize: 48,
    marginBottom: 15,
  },

  errorTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222",
    marginBottom: 8,
  },

  errorText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 25,
  },

  backButton: {
    backgroundColor: "#1D4ED8",
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 10,
  },

  backButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  /* HEADER */

  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  headerBack: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  headerBackText: {
    fontSize: 24,
    color: "#1F2937",
  },

  headerTitleContainer: {
    flex: 1,
  },

  courseTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },

  moduleTitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 3,
  },

  /* PROGRESS */

  progressCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  progressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },

  progressValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1D4ED8",
  },

  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#1D4ED8",
    borderRadius: 4,
  },

  positionRow: {
    paddingHorizontal: 18,
    paddingTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  positionText: {
    fontSize: 13,
    color: "#64748B",
  },

  /* LESSON HEADER */

  lessonHeader: {
    marginHorizontal: 16,
    marginTop: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  lessonNumber: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  lessonNumberText: {
    color: "#1D4ED8",
    fontSize: 18,
    fontWeight: "800",
  },

  lessonHeading: {
    flex: 1,
  },

  lessonTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#111827",
  },

  duration: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
  },

  completedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },

  completedBadgeText: {
    color: "#16A34A",
    fontSize: 18,
    fontWeight: "800",
  },

  /* DESCRIPTION */

  descriptionCard: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 17,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },

  description: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 23,
  },

  /* VIDEO */

  videoSection: {
    marginHorizontal: 16,
    marginTop: 14,
  },

  videoContainer: {
    width: "100%",
    height: 220,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#000000",
  },

  video: {
    width: "100%",
    height: "100%",
  },

  externalVideoButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },

  videoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#DBEAFE",
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 20,
    color: "#1D4ED8",
    overflow: "hidden",
    paddingTop: 13,
  },

  videoTextContainer: {
    flex: 1,
    marginLeft: 12,
  },

  externalVideoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },

  externalVideoSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 3,
  },

  arrow: {
    fontSize: 22,
    color: "#1D4ED8",
  },

  unavailableCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 25,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  unavailableIcon: {
    fontSize: 34,
    marginBottom: 8,
  },

  unavailableText: {
    color: "#64748B",
    fontSize: 14,
  },

  /* MATERIALS */

  materialsSection: {
    marginHorizontal: 16,
    marginTop: 20,
  },

  materialCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
    padding: 13,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  materialIcon: {
    width: 45,
    height: 45,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  pdfIcon: {
    backgroundColor: "#FEE2E2",
  },

  audioIcon: {
    backgroundColor: "#EDE9FE",
  },

  materialIconText: {
    fontSize: 21,
  },

  materialInfo: {
    flex: 1,
    marginLeft: 12,
  },

  materialName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },

  materialMeta: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },

  materialArrow: {
    fontSize: 20,
    color: "#64748B",
    marginLeft: 8,
  },

  /* ASSIGNMENT */

  assignmentCard: {
    marginHorizontal: 16,
    marginTop: 18,
    backgroundColor: "#EFF6FF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    flexDirection: "row",
    alignItems: "center",
  },

  assignmentIcon: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },

  assignmentIconText: {
    fontSize: 22,
  },

  assignmentInfo: {
    flex: 1,
    marginLeft: 12,
  },

  assignmentTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E3A8A",
  },

  assignmentDescription: {
    fontSize: 12,
    color: "#475569",
    marginTop: 4,
    lineHeight: 17,
  },

  passMark: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1D4ED8",
    marginTop: 5,
  },

  assignmentButton: {
    backgroundColor: "#1D4ED8",
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 8,
    marginLeft: 8,
  },

  assignmentButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
  },

  /* FINAL EXAM */

  examCard: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
    alignItems: "center",
  },

  examIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFEDD5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  examIconText: {
    fontSize: 28,
  },

  examTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#9A3412",
  },

  examDescription: {
    textAlign: "center",
    color: "#7C2D12",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },

  examPassMark: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "700",
    color: "#9A3412",
  },

  examDuration: {
    marginTop: 4,
    fontSize: 13,
    color: "#9A3412",
  },

  examButton: {
    backgroundColor: "#EA580C",
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },

  examButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  /* COMPLETE */

  completeButton: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: "#16A34A",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },

  completedButton: {
    backgroundColor: "#15803D",
  },

  completeButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  /* NAVIGATION */

  navigationRow: {
    marginHorizontal: 16,
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
  },

  navigationButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 11,
    paddingVertical: 13,
    alignItems: "center",
  },

  nextButton: {
    backgroundColor: "#1D4ED8",
    borderColor: "#1D4ED8",
  },

  navigationButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
  },

  nextButtonText: {
    color: "#FFFFFF",
  },

  disabledNavigationButton: {
    backgroundColor: "#F1F5F9",
    borderColor: "#E2E8F0",
  },

  disabledNavigationText: {
    color: "#94A3B8",
  },

  /* COURSE BUTTON */

  courseButton: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 13,
    alignItems: "center",
  },

  courseButtonText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "600",
  },

  bottomSpace: {
    height: 30,
  },
});


