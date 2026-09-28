import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { File, Paths } from "expo-file-system";
import { VideoView, useVideoPlayer } from "expo-video";
import Pdf from "react-native-pdf";

const API_URL = "http://192.168.110.120:5000/api";

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

type ModuleProgression = {
  unlocked?: boolean;
  lessonsCompleted?: boolean;
  lessonsTotal?: number;
  assignmentEnabled?: boolean;
  assignmentStatus?:
    | "not_started"
    | "pending_review"
    | "passed"
    | "failed"
    | "not_required";
  assignmentAvailable?: boolean;
  moduleCompleted?: boolean;
  attempts?: number;
  percentage?: number;
};

type Module = {
  _id?: string;
  title?: string;
  description?: string;
  order?: number;
  lessons?: Lesson[];
  assignment?: Assignment;
  progression?: ModuleProgression;
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
    progression?: {
      unlocked?: boolean;
      status?:
        | "not_started"
        | "pending_review"
        | "passed"
        | "failed";
    };
  };
};

type LessonProgress = {
  lessonId?: string;
  materialsCompleted?: {
    materialId?: string;
    completedAt?: string;
  }[];
  uploadedVideoCompleted?: boolean;
  uploadedVideoCompletedAt?: string | null;
  externalVideoCompleted?: boolean;
  externalVideoCompletedAt?: string | null;
};

type Enrollment = {
  progress?: number;
  completed?: boolean;
  certificateIssued?: boolean;
  lessonsCompleted?: {
    lessonId?: string;
    completedAt?: string;
  }[];
  lessonProgress?: LessonProgress[];
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
  const [authToken, setAuthToken] = useState<string | null>(null);

  const [audioSource, setAudioSource] = useState<{
      uri: string;
      headers: Record<string, string>;
    } | null>(null);

  const [currentModuleIndex, setCurrentModuleIndex] =
    useState(moduleIndexParam);

  const [currentLessonIndex, setCurrentLessonIndex] =
    useState(lessonIndexParam);

  const [pdfUri, setPdfUri] =
  useState<string | null>(null);

  const [pdfTitle, setPdfTitle] =
    useState("Course Material");

  const [pdfVisible, setPdfVisible] =
    useState(false);

  const [pdfMaterialId, setPdfMaterialId] =
  useState<string | null>(null);

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

      setAuthToken(token);

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

      if (response.status === 403) {
        Alert.alert(
          "Payment Verification in Progress",
          "Your payment has been submitted successfully and is currently awaiting approval by Nakky Academy administration. Access to this course will be granted as soon as your payment is approved.",
          [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ]
        );

        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Unable to load course."
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

      const loadedCourseData =
        data?.course ||
        data?.data?.course ||
        data;

      const loadedEnrollment: Enrollment | null =
        data?.enrollment ||
        data?.data?.enrollment ||
        data?.enrollmentData ||
        null;

      // IMPORTANT:
      // The backend returns modules separately from `course`.
      // Put them back onto the course object so the lesson player
      // can access the actual lesson content.
      const loadedCourse: Course = {
        ...loadedCourseData,
        modules:
          data?.modules ||
          data?.data?.modules ||
          loadedCourseData?.modules ||
          [],
      };

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

  const currentLessonProgress = useMemo(() => {
    if (!lessonId) {
      return null;
    }

    return (
      enrollment?.lessonProgress?.find(
        (item) =>
          String(item.lessonId) ===
          String(lessonId)
      ) || null
    );
  }, [enrollment, lessonId]);

  const requiredMaterials =
    currentLesson?.materials || [];

  const completedMaterialIds = new Set(
    (
      currentLessonProgress?.materialsCompleted ||
      []
    )
      .map((item) => item?.materialId)
      .filter(Boolean)
      .map((id) => String(id))
  );

  const uploadedVideoRequired =
    currentLesson?.video?.type === "upload" ||
    (
      !!currentLesson?.videoUrl &&
      !currentLesson.videoUrl.startsWith("http")
    );

  const externalVideoRequired =
    currentLesson?.video?.type === "external" ||
    (
      !!currentLesson?.videoUrl &&
      (
        currentLesson.videoUrl.startsWith("http://") ||
        currentLesson.videoUrl.startsWith("https://")
      )
    );

  const allMaterialsCompleted =
    requiredMaterials.every(
      (material) =>
        material._id &&
        completedMaterialIds.has(
          String(material._id)
        )
    );

  const allLearningItemsCompleted =
    allMaterialsCompleted &&
    (
      !uploadedVideoRequired ||
      currentLessonProgress?.uploadedVideoCompleted === true
    ) &&
    (
      !externalVideoRequired ||
      currentLessonProgress?.externalVideoCompleted === true
    );

  /*
   * =========================================================
   * MODULE / ASSIGNMENT PROGRESSION HELPERS
   * =========================================================
   */

  const getModuleProgression = (
    module?: Module
  ): ModuleProgression => {
    return (
      module?.progression || {
        unlocked: false,
        lessonsCompleted: false,
        lessonsTotal: module?.lessons?.length || 0,
        assignmentEnabled:
          module?.assignment?.enabled === true,
        assignmentStatus:
          module?.assignment?.enabled === true
            ? "not_started"
            : "not_required",
        assignmentAvailable: false,
        moduleCompleted: false,
        attempts: 0,
        percentage: 0,
      }
    );
  };

  const getAssignmentStatusText = (
    module?: Module
  ) => {
    const progression = getModuleProgression(module);

    if (!progression.assignmentEnabled) {
      return "No assignment required";
    }

    switch (progression.assignmentStatus) {
      case "passed":
        return "Assignment Passed";

      case "failed":
        return "Assignment Failed";

      case "pending_review":
        return "Under Review";

      case "not_started":
      default:
        return progression.assignmentAvailable
          ? "Assignment Available"
          : "Assignment Locked";
    }
  };

  /*
   * =========================================================
   * VIDEO
   * =========================================================
   */

  const videoSource = useMemo(() => {
    if (!currentLesson) return null;

    /*
     * EXTERNAL VIDEO
     */
    if (currentLesson.video?.type === "external") {
      return currentLesson.video.url || null;
    }

    /*
     * LEGACY EXTERNAL VIDEO
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
     * UPLOADED VIDEO
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

    if (!filename || !authToken) {
      return null;
    }

    return {
      uri: `${API_URL}/courses/${courseId}/video/${encodeURIComponent(
        filename
      )}`,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    };
  }, [
    currentLesson,
    courseId,
    authToken,
  ]);

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
 * AUDIO PLAYER
 * =========================================================
 */

const audioPlayer = useAudioPlayer(
  audioSource,
  {
    updateInterval: 500,
  }
);

const audioStatus =
  useAudioPlayerStatus(audioPlayer);

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
      Alert.alert(
        "Video unavailable",
        "No video link is available."
      );
      return;
    }

    try {
      const supported =
        await Linking.canOpenURL(url);

      if (!supported) {
        Alert.alert(
          "Unable to Open Video",
          "This video link cannot be opened on your device."
        );
        return;
      }

      await Linking.openURL(url);

      Alert.alert(
        "Video Lesson",
        "After watching the video, select OK to record this video as completed.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Mark as Watched",
            onPress: async () => {
              await markVideoCompleted(
                "external"
              );
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        "Unable to Open Video",
        "The video link could not be opened."
      );
    }
  };

  /*
   * =========================================================
   * RECORD UPLOADED VIDEO COMPLETION ON PLAYBACK END
   * =========================================================
   */

  useEffect(() => {
    if (
      !player ||
      !currentLesson ||
      !uploadedVideoRequired
    ) {
      return;
    }

    const subscription =
      player.addListener(
        "playToEnd",
        async () => {
          await markVideoCompleted(
            "uploaded"
          );
        }
      );

    return () => {
      subscription.remove();
    };
  }, [
    player,
    currentLesson,
    uploadedVideoRequired,
    lessonId,
  ]);

  /*
   * =========================================================
   * MARK MATERIAL COMPLETE
   * =========================================================
   */

  const markMaterialCompleted = async (
    materialId: string
  ) => {
    if (!courseId || !lessonId) return;

    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) return;

      const response = await fetch(
        `${API_URL}/courses/${courseId}/material-progress`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lessonId,
            materialId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to save material progress."
        );
      }

      setEnrollment((previous) => {
        if (!previous) return previous;

        const existingProgress =
          previous.lessonProgress || [];

        const existingLessonProgress =
          existingProgress.find(
            (item) =>
              String(item.lessonId) ===
              String(lessonId)
          );

        if (!existingLessonProgress) {
          return {
            ...previous,
            lessonProgress: [
              ...existingProgress,
              {
                lessonId,
                materialsCompleted: [
                  {
                    materialId,
                    completedAt:
                      new Date().toISOString(),
                  },
                ],
                uploadedVideoCompleted: false,
                externalVideoCompleted: false,
              },
            ],
          };
        }

        const existingMaterials =
          existingLessonProgress.materialsCompleted ||
          [];

        if (
          existingMaterials.some(
            (item) =>
              String(item.materialId) ===
              String(materialId)
          )
        ) {
          return previous;
        }

        return {
          ...previous,
          lessonProgress:
            existingProgress.map((item) =>
              String(item.lessonId) ===
              String(lessonId)
                ? {
                    ...item,
                    materialsCompleted: [
                      ...existingMaterials,
                      {
                        materialId,
                        completedAt:
                          new Date().toISOString(),
                      },
                    ],
                  }
                : item
            ),
        };
      });

      return data;
    } catch (error) {
      console.error(
        "Material progress error:",
        error
      );
    }
  };

  /*
   * =========================================================
   * MARK VIDEO COMPLETE
   * =========================================================
   */

  const markVideoCompleted = async (
    videoType: "uploaded" | "external"
  ) => {
    if (!courseId || !lessonId) return;

    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) return;

      const response = await fetch(
        `${API_URL}/courses/${courseId}/video-progress`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lessonId,
            videoType,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to save video progress."
        );
      }

      setEnrollment((previous) => {
        if (!previous) return previous;

        const existingProgress =
          previous.lessonProgress || [];

        const existingLessonProgress =
          existingProgress.find(
            (item) =>
              String(item.lessonId) ===
              String(lessonId)
          );

        const now =
          new Date().toISOString();

        if (!existingLessonProgress) {
          return {
            ...previous,
            lessonProgress: [
              ...existingProgress,
              {
                lessonId,
                materialsCompleted: [],
                uploadedVideoCompleted:
                  videoType === "uploaded",
                uploadedVideoCompletedAt:
                  videoType === "uploaded"
                    ? now
                    : null,
                externalVideoCompleted:
                  videoType === "external",
                externalVideoCompletedAt:
                  videoType === "external"
                    ? now
                    : null,
              },
            ],
          };
        }

        return {
          ...previous,
          lessonProgress:
            existingProgress.map((item) =>
              String(item.lessonId) ===
              String(lessonId)
                ? {
                    ...item,
                    uploadedVideoCompleted:
                      videoType === "uploaded"
                        ? true
                        : item.uploadedVideoCompleted,
                    uploadedVideoCompletedAt:
                      videoType === "uploaded"
                        ? now
                        : item.uploadedVideoCompletedAt,
                    externalVideoCompleted:
                      videoType === "external"
                        ? true
                        : item.externalVideoCompleted,
                    externalVideoCompletedAt:
                      videoType === "external"
                        ? now
                        : item.externalVideoCompletedAt,
                  }
                : item
            ),
        };
      });

      return data;
    } catch (error) {
      console.error(
        "Video progress error:",
        error
      );
    }
  };

  /*
   * =========================================================
   * OPEN PROTECTED MATERIAL
   * =========================================================
   *
   * PDF/audio files are protected by the backend.
   *
   * The file is downloaded using the authenticated
   * Bearer token, saved temporarily, then opened through
   * the device's native file-sharing/opening system.
   */

  const openMaterial = async (
  material: Material
) => {
  if (!material?.filename || !courseId) {
    Alert.alert(
      "Material Unavailable",
      "This material does not have a valid file."
    );
    return;
  }

  try {
    const token =
      await AsyncStorage.getItem("token");

    if (!token) {
      Alert.alert(
        "Session Expired",
        "Please log in again."
      );

      router.replace("/login");
      return;
    }

    const safeFilename =
      material.filename.split("/").pop();

    if (!safeFilename) {
      throw new Error(
        "Invalid material filename."
      );
    }

    const materialUrl =
      `${API_URL}/courses/${courseId}/material/${encodeURIComponent(
        safeFilename
      )}`;

    /*
     * =====================================================
     * AUDIO
     * =====================================================
     *
     * Audio stays inside Nakky Academy.
     */

    const isAudio =
      material.type === "audio" ||
      !!material.mimeType?.startsWith(
        "audio/"
      );

    if (isAudio) {
      setAudioSource({
        uri: materialUrl,
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      });

      audioPlayer.play();

      await markMaterialCompleted(
        String(material._id)
      );

      return;
    }

    /*
     * =====================================================
     * PDF
     * =====================================================
     *
     * Download the protected PDF locally.
     * The PDF viewer will display the local file
     * inside Nakky Academy.
     */

    const extension =
      safeFilename.includes(".")
        ? safeFilename
            .split(".")
            .pop()
            ?.toLowerCase()
        : "pdf";

    const fileName =
      `nakky-${courseId}-${material._id || Date.now()}.${extension}`;

    const destination =
      new File(
        Paths.cache,
        fileName
      );

    const downloadedFile =
      await File.downloadFileAsync(
        materialUrl,
        destination,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },

          idempotent: true,
        }
      );

    if (!downloadedFile.exists) {
      throw new Error(
        "The PDF could not be downloaded."
      );
    }

    /*
     * Save the local PDF URI in state.
     *
     * We will use this with the in-app PDF viewer.
     */

    setPdfUri(downloadedFile.uri);

      setPdfTitle(
        material.originalName ||
          "Course Material"
      );

      setPdfMaterialId(
        String(material._id)
      );

      setPdfVisible(true);

  } catch (error: any) {
    console.error(
      "Material access error:",
      error
    );

    Alert.alert(
      "Unable to Open Material",
      error?.message ||
        "The course material could not be opened."
    );
  }
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

    if (!allLearningItemsCompleted) {
      Alert.alert(
        "Lesson Not Complete",
        "Please open and complete all required learning materials and watch the required video before completing this lesson."
      );
      return;
    }

    try {
      setMarkingComplete(true);

      const token =
        await AsyncStorage.getItem("token");

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

      setEnrollment((previous) => {
        if (!previous) {
          return {
            progress: data?.progress || 0,
            completed:
              data?.completed || false,
            lessonsCompleted: [
              {
                lessonId,
                completedAt:
                  new Date().toISOString(),
              },
            ],
            lessonProgress: [],
          };
        }

        const existing =
          previous.lessonsCompleted || [];

        if (
          existing.some(
            (item) =>
              String(item.lessonId) ===
              String(lessonId)
          )
        ) {
          return previous;
        }

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
              completedAt:
                new Date().toISOString(),
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
      console.error(
        "Progress update error:",
        error
      );

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
     * A lesson cannot be bypassed.
     *
     * The learner must first complete:
     * - all required PDFs/audio
     * - uploaded video
     * - external video
     * - the lesson itself
     */

    if (!lessonCompleted) {
      return null;
    }

    /*
     * ---------------------------------------------------------
     * NEXT LESSON IN SAME MODULE
     * ---------------------------------------------------------
     */

    if (currentLessonIndex < lessons.length - 1) {
      return {
        moduleIndex: currentModuleIndex,
        lessonIndex: currentLessonIndex + 1,
      };
    }

    /*
     * ---------------------------------------------------------
     * LAST LESSON OF CURRENT MODULE
     * ---------------------------------------------------------
     *
     * Do NOT automatically move to the next module.
     *
     * The module assignment must be passed first.
     */

    const progression =
      getModuleProgression(currentModule);

    if (progression.assignmentEnabled) {
      /*
       * Assignment is required.
       *
       * We return null here so the lesson player does
       * not bypass the assignment.
       */

      return null;
    }

    /*
     * ---------------------------------------------------------
     * NO ASSIGNMENT
     * ---------------------------------------------------------
     *
     * If there is no assignment, the next module can
     * be reached after all lessons are complete.
     */

    if (currentModuleIndex < modules.length - 1) {
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
   * OPEN MODULE ASSIGNMENT
   * =========================================================
   */

  const openAssignment = () => {
    if (!currentModule?.assignment?.enabled) {
      Alert.alert(
        "No Assignment",
        "This module does not have an assignment."
      );
      return;
    }

    const progression =
      getModuleProgression(currentModule);

    if (progression.assignmentStatus === "passed") {
      Alert.alert(
        "Assignment Passed",
        "You have already passed this assignment."
      );
      return;
    }

    if (
      progression.assignmentStatus ===
      "pending_review"
    ) {
      Alert.alert(
        "Assignment Under Review",
        "Your assignment has been submitted and is awaiting review."
      );
      return;
    }

    if (!progression.assignmentAvailable) {
      Alert.alert(
        "Assignment Locked",
        "Please complete all lessons in this module before attempting the assignment."
      );
      return;
    }

    router.push({
      pathname: "/(student)/assignment",
      params: {
        courseId,
        moduleId: String(
          currentModule._id || ""
        ),
        moduleIndex: String(
          currentModuleIndex
        ),
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
   * NEXT LESSON
   * =========================================================
   */

  const goToNextLesson = () => {
    if (!currentModule) return;

    if (!lessonCompleted) {
      Alert.alert(
        "Lesson Locked",
        "Please complete this lesson before continuing."
      );
      return;
    }

    /*
     * ---------------------------------------------------------
     * THERE IS ANOTHER LESSON IN THIS MODULE
     * ---------------------------------------------------------
     */

    if (currentLessonIndex < lessons.length - 1) {
      router.replace({
        pathname:
          "/(student)/lesson-player",
        params: {
          courseId,
          moduleIndex: String(
            currentModuleIndex
          ),
          lessonIndex: String(
            currentLessonIndex + 1
          ),
        },
      });

      return;
    }

    /*
     * ---------------------------------------------------------
     * LAST LESSON OF MODULE
     * ---------------------------------------------------------
     */

    const progression =
      getModuleProgression(currentModule);

    /*
     * Assignment required.
     */

    if (progression.assignmentEnabled) {
      if (
        progression.assignmentStatus ===
        "passed"
      ) {
        /*
         * Assignment has already been passed.
         * The backend should now have unlocked the
         * next module.
         */

        const nextModule =
          modules[currentModuleIndex + 1];

        if (
          nextModule?.lessons &&
          nextModule.lessons.length > 0
        ) {
          router.replace({
            pathname:
              "/(student)/lesson-player",
            params: {
              courseId,
              moduleIndex: String(
                currentModuleIndex + 1
              ),
              lessonIndex: "0",
            },
          });

          return;
        }

        /*
         * No more modules.
         * Final exam may now be available.
         */

        if (
          course?.finalExam?.enabled &&
          course.finalExam.progression
            ?.unlocked
        ) {
          router.push({
            pathname:
              "/(student)/final-exam",
            params: {
              courseId,
            },
          } as any);

          return;
        }

        return;
      }

      /*
       * Assignment has not been passed.
       * Send learner to assignment if available.
       */

      if (progression.assignmentAvailable) {
        openAssignment();
        return;
      }

      if (
        progression.assignmentStatus ===
        "pending_review"
      ) {
        Alert.alert(
          "Assignment Under Review",
          "Your assignment is currently being reviewed. You can continue once it has been passed."
        );
        return;
      }

      Alert.alert(
        "Assignment Required",
        "Please complete and pass the assignment before continuing to the next module."
      );

      return;
    }

    /*
     * ---------------------------------------------------------
     * NO ASSIGNMENT — MOVE TO NEXT MODULE
     * ---------------------------------------------------------
     */

    const nextModule =
      modules[currentModuleIndex + 1];

    if (
      nextModule?.lessons &&
      nextModule.lessons.length > 0
    ) {
      const nextProgression =
        getModuleProgression(nextModule);

      if (!nextProgression.unlocked) {
        Alert.alert(
          "Module Locked",
          "Complete the required activities in the previous module before continuing."
        );
        return;
      }

      router.replace({
        pathname:
          "/(student)/lesson-player",
        params: {
          courseId,
          moduleIndex: String(
            currentModuleIndex + 1
          ),
          lessonIndex: "0",
        },
      });

      return;
    }

    /*
     * ---------------------------------------------------------
     * END OF COURSE
     * ---------------------------------------------------------
     */

    if (
      course?.finalExam?.enabled &&
      course.finalExam.progression?.unlocked
    ) {
      router.push({
        pathname:
          "/(student)/final-exam",
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

  const finalExamProgression =
    course.finalExam?.progression;

  const finalExamUnlocked =
    finalExamEnabled &&
    finalExamProgression?.unlocked === true;

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
        {audioSource ? (
        <View style={styles.audioPlayerCard}>
          <Text style={styles.audioPlayerTitle}>
            Audio Lesson
          </Text>

          <Text
            style={styles.audioPlayerName}
            numberOfLines={2}
          >
            {currentLesson.title ||
              "Course Audio"}
          </Text>

          <View style={styles.audioControlsRow}>
            <TouchableOpacity
              style={styles.audioPlayButton}
              onPress={() => {
                if (audioStatus.playing) {
                  audioPlayer.pause();
                } else {
                  audioPlayer.play();
                }
              }}
            >
              <Text style={styles.audioPlayButtonText}>
                {audioStatus.playing
                  ? "❚❚ Pause"
                  : "▶ Play"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.audioStopButton}
              onPress={() => {
                audioPlayer.pause();
                audioPlayer.seekTo(0);
              }}
            >
              <Text style={styles.audioStopButtonText}>
                ↺ Restart
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.audioTimeText}>
            {Math.floor(
              audioStatus.currentTime || 0
            )}s /{" "}
            {Math.floor(
              audioStatus.duration || 0
            )}s
          </Text>
        </View>
      ) : null}


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

              <Text
                style={
                  styles.assignmentStatusText
                }
              >
                {getAssignmentStatusText(
                  currentModule
                )}
              </Text>
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
                {getModuleProgression(currentModule)
                  .assignmentStatus === "passed"
                  ? "Passed"
                  : getModuleProgression(currentModule)
                      .assignmentStatus === "pending_review"
                  ? "Under Review"
                  : getModuleProgression(currentModule)
                      .assignmentStatus === "failed"
                  ? "Retry Assignment"
                  : getModuleProgression(currentModule)
                      .assignmentAvailable
                  ? "Start Assignment"
                  : "Locked"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ============================
            FINAL EXAM
        ============================ */}

        {finalExamEnabled &&
        finalExamUnlocked ? (
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
                {finalExamProgression?.status ===
                "passed"
                  ? "Exam Passed"
                  : finalExamProgression?.status ===
                    "pending_review"
                  ? "Under Review"
                  : "Start Final Examination"}
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
            !lessonCompleted &&
              !allLearningItemsCompleted &&
              styles.lockedCompleteButton,
          ]}
          onPress={markLessonComplete}
          disabled={markingComplete}
        >
          {markingComplete ? (
            <ActivityIndicator
              color="#FFFFFF"
            />
          ) : (
            <Text style={styles.completeButtonText}>
              {lessonCompleted
                ? "✓ Lesson Completed — Continue"
                : allLearningItemsCompleted
                ? "✓ Mark Lesson as Complete"
                : "🔒 Complete Learning Materials First"}
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

    <Modal
      visible={pdfVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => {
        setPdfVisible(false);
        setPdfUri(null);
        setPdfMaterialId(null);
      }}
    >
      <View style={styles.pdfViewerContainer}>
        <View style={styles.pdfViewerHeader}>
          <TouchableOpacity
            style={styles.pdfCloseButton}
            onPress={() => {
              setPdfVisible(false);
              setPdfUri(null);
              setPdfMaterialId(null);
            }}
          >
            <Text style={styles.pdfCloseButtonText}>
              ← Back
            </Text>
          </TouchableOpacity>

          <Text
            style={styles.pdfViewerTitle}
            numberOfLines={1}
          >
            {pdfTitle}
          </Text>
        </View>

        {pdfUri ? (
          <Pdf
            source={{
              uri: pdfUri,
              cache: false,
            }}
            style={styles.pdfViewer}
            onLoadComplete={() => {
              if (pdfMaterialId) {
                markMaterialCompleted(pdfMaterialId);
              }
            }}
            onError={(error) => {
              console.error(
                "PDF viewer error:",
                error
              );

              Alert.alert(
                "Unable to Display PDF",
                "The PDF was downloaded but could not be displayed."
              );
            }}
          />
        ) : (
          <View style={styles.pdfLoadingContainer}>
            <ActivityIndicator
              size="large"
              color="#1D4ED8"
            />

            <Text style={styles.pdfLoadingText}>
              Loading PDF...
            </Text>
          </View>
        )}
      </View>
    </Modal>
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

  assignmentStatusText: {
    fontSize: 12,
    fontWeight: "700",
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

  lockedCompleteButton: {
    backgroundColor: "#94A3B8",
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

  audioPlayerCard: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 17,
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },

  audioPlayerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },

  audioPlayerName: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 15,
  },

  audioControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  audioPlayButton: {
    flex: 1,
    backgroundColor: "#1D4ED8",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  audioPlayButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  audioStopButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#EDE9FE",
  },

  audioStopButtonText: {
    color: "#5B21B6",
    fontSize: 14,
    fontWeight: "700",
  },

  audioTimeText: {
    marginTop: 12,
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
  },

    /* PDF VIEWER */

  pdfViewerContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  pdfViewerHeader: {
    height: 60,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },

  pdfCloseButton: {
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },

  pdfCloseButtonText: {
    color: "#1D4ED8",
    fontSize: 14,
    fontWeight: "700",
  },

  pdfViewerTitle: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },

  pdfViewer: {
    flex: 1,
    width: "100%",
    backgroundColor: "#FFFFFF",
  },

  pdfLoadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  pdfLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
  },

});