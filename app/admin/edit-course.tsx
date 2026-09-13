import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import API from "../../src/services/api";

/* =========================================================
   CONFIG
========================================================= */

const COURSE_PRICE = 1200;

/* =========================================================
   TYPES
========================================================= */

type QuestionType =
  | "multiple_choice"
  | "true_false"
  | "short_answer"
  | "long_answer";

type Material = {
  _id?: string;
  filename: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  uploadedAt?: string;
};

type Video = {
  type?: "none" | "upload" | "external";
  url?: string;
  filename?: string;
  title?: string;
};

type Question = {
  _id?: string;
  question: string;
  type: QuestionType;
  options?: string[];
  correctAnswer?: string;
  marks?: number;
};

type Assignment = {
  enabled: boolean;
  title: string;
  instructions: string;
  passMark: number;
  questions: Question[];
};

type Lesson = {
  _id?: string;
  title: string;
  description: string;
  duration: number;
  order: number;
  materials: Material[];
  video: Video;
};

type Module = {
  _id?: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
  assignment: Assignment;
};

type FinalExam = {
  enabled: boolean;
  title: string;
  instructions: string;
  durationMinutes: number;
  passMark: number;
  questions: Question[];
};

type Course = {
  _id?: string;
  title: string;
  shortDescription: string;
  description: string;
  category: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  duration: number;
  price: number;
  image?: string;
  published: boolean;
  certificate: boolean;
  passMark: number;
  modules: Module[];
  finalExam: FinalExam;
  content?: any[];
};

/* =========================================================
   DEFAULT FACTORIES
========================================================= */

const createQuestion = (): Question => ({
  question: "",
  type: "multiple_choice",
  options: ["", "", "", ""],
  correctAnswer: "",
  marks: 1,
});

const createAssignment = (): Assignment => ({
  enabled: false,
  title: "",
  instructions: "",
  passMark: 80,
  questions: [],
});

const createLesson = (order = 1): Lesson => ({
  title: "",
  description: "",
  duration: 0,
  order,
  materials: [],
  video: {
    type: "none",
    url: "",
    filename: "",
    title: "",
  },
});

const createModule = (order = 1): Module => ({
  title: "",
  description: "",
  order,
  lessons: [createLesson(1)],
  assignment: createAssignment(),
});

const createFinalExam = (): FinalExam => ({
  enabled: false,
  title: "",
  instructions: "",
  durationMinutes: 60,
  passMark: 80,
  questions: [],
});

/* =========================================================
   HELPERS
========================================================= */

const normalizeQuestion = (question: any): Question => ({
  _id: question?._id,
  question: question?.question || "",
  type: question?.type || "multiple_choice",
  options:
    Array.isArray(question?.options) && question.options.length > 0
      ? question.options
      : ["", "", "", ""],
  correctAnswer: question?.correctAnswer || "",
  marks: Number(question?.marks || 1),
});

const normalizeAssignment = (assignment: any): Assignment => ({
  enabled: Boolean(assignment?.enabled),
  title: assignment?.title || "",
  instructions: assignment?.instructions || "",
  passMark: Number(assignment?.passMark ?? 80),
  questions: Array.isArray(assignment?.questions)
    ? assignment.questions.map(normalizeQuestion)
    : [],
});

const normalizeLesson = (lesson: any, order: number): Lesson => ({
  _id: lesson?._id,
  title: lesson?.title || "",
  description: lesson?.description || "",
  duration: Number(lesson?.duration || 0),
  order: Number(lesson?.order || order),
  materials: Array.isArray(lesson?.materials) ? lesson.materials : [],
  video: {
    type: lesson?.video?.type || "none",
    url: lesson?.video?.url || "",
    filename: lesson?.video?.filename || "",
    title: lesson?.video?.title || "",
  },
});

const normalizeModule = (module: any, order: number): Module => ({
  _id: module?._id,
  title: module?.title || "",
  description: module?.description || "",
  order: Number(module?.order || order),
  lessons:
    Array.isArray(module?.lessons) && module.lessons.length > 0
      ? module.lessons.map((lesson: any, index: number) =>
          normalizeLesson(lesson, index + 1)
        )
      : [createLesson(1)],
  assignment: normalizeAssignment(module?.assignment),
});

const legacyContentToModules = (content: any[] = []): Module[] => {
  if (!Array.isArray(content) || content.length === 0) {
    return [];
  }

  return [
    {
      title: "Module 1",
      description: "Converted from the previous course structure.",
      order: 1,
      lessons: content.map((lesson: any, index: number) =>
        normalizeLesson(lesson, index + 1)
      ),
      assignment: createAssignment(),
    },
  ];
};

const normalizeCourse = (data: any): Course => {
  const hasModules =
    Array.isArray(data?.modules) && data.modules.length > 0;

  const modules = hasModules
    ? data.modules.map((module: any, index: number) =>
        normalizeModule(module, index + 1)
      )
    : legacyContentToModules(data?.content || []);

  return {
    _id: data?._id,
    title: data?.title || "",
    shortDescription: data?.shortDescription || "",
    description: data?.description || "",
    category: data?.category || "",
    level: data?.level || "Beginner",
    duration: Number(data?.duration || 0),
    price: COURSE_PRICE,
    image: data?.image || "",
    published: Boolean(data?.published),
    certificate:
      data?.certificate === undefined ? true : Boolean(data.certificate),
    passMark: Number(data?.passMark ?? 80),
    modules,
    finalExam: {
      enabled: Boolean(data?.finalExam?.enabled),
      title: data?.finalExam?.title || "",
      instructions: data?.finalExam?.instructions || "",
      durationMinutes: Number(
        data?.finalExam?.durationMinutes || 60
      ),
      passMark: Number(data?.finalExam?.passMark ?? 80),
      questions: Array.isArray(data?.finalExam?.questions)
        ? data.finalExam.questions.map(normalizeQuestion)
        : [],
    },
    content: data?.content || [],
  };
};

const getFileSize = (size?: number) => {
  if (!size) return "";

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function EditCourseScreen() {
  const router = useRouter();

  const params = useLocalSearchParams();

  const courseId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [course, setCourse] = useState<Course | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [uploadingKey, setUploadingKey] = useState<string | null>(
    null
  );

  const [legacyNeedsSave, setLegacyNeedsSave] =
    useState(false);

  /* =======================================================
     LOAD COURSE
  ======================================================= */

  const loadCourse = async () => {
    if (!courseId) {
      Alert.alert("Error", "Course ID is missing.");
      router.back();
      return;
    }

    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token is missing.");
      }

      const response = await API.get(
        `/courses/${courseId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;

      const convertedFromLegacy =
        (!data?.modules ||
          !Array.isArray(data.modules) ||
          data.modules.length === 0) &&
        Array.isArray(data?.content) &&
        data.content.length > 0;

      setLegacyNeedsSave(convertedFromLegacy);

      setCourse(normalizeCourse(data));
    } catch (error: any) {
      console.error("LOAD COURSE ERROR:", error);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to load course.";

      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  /* =======================================================
     COURSE FIELD UPDATE
  ======================================================= */

  const updateCourseField = (
    field: keyof Course,
    value: any
  ) => {
    setCourse((previous) =>
      previous
        ? {
            ...previous,
            [field]: value,
          }
        : previous
    );
  };

  /* =======================================================
     MODULE HELPERS
  ======================================================= */

  const addModule = () => {
    if (!course) return;

    const nextOrder = course.modules.length + 1;

    setCourse({
      ...course,
      modules: [
        ...course.modules,
        createModule(nextOrder),
      ],
    });
  };

  const removeModule = (moduleIndex: number) => {
    if (!course) return;

    if (course.modules.length === 1) {
      Alert.alert(
        "Cannot remove",
        "A course must have at least one module."
      );
      return;
    }

    Alert.alert(
      "Remove module?",
      "This will remove the module and all its lessons from the course structure. Save the course to apply the change.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            const modules = course.modules
              .filter((_, index) => index !== moduleIndex)
              .map((module, index) => ({
                ...module,
                order: index + 1,
              }));

            setCourse({
              ...course,
              modules,
            });
          },
        },
      ]
    );
  };

  const updateModule = (
    moduleIndex: number,
    field: keyof Module,
    value: any
  ) => {
    if (!course) return;

    const modules = [...course.modules];

    modules[moduleIndex] = {
      ...modules[moduleIndex],
      [field]: value,
    };

    setCourse({
      ...course,
      modules,
    });
  };

  /* =======================================================
     LESSON HELPERS
  ======================================================= */

  const addLesson = (moduleIndex: number) => {
    if (!course) return;

    const modules = [...course.modules];

    const module = modules[moduleIndex];

    const lesson = createLesson(
      module.lessons.length + 1
    );

    modules[moduleIndex] = {
      ...module,
      lessons: [
        ...module.lessons,
        lesson,
      ],
    };

    setCourse({
      ...course,
      modules,
    });
  };

  const removeLesson = (
    moduleIndex: number,
    lessonIndex: number
  ) => {
    if (!course) return;

    const module = course.modules[moduleIndex];

    if (module.lessons.length === 1) {
      Alert.alert(
        "Cannot remove",
        "Each module must contain at least one lesson."
      );
      return;
    }

    Alert.alert(
      "Remove lesson?",
      "This will remove the lesson from the course structure.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            const modules = [...course.modules];

            modules[moduleIndex] = {
              ...module,
              lessons: module.lessons
                .filter(
                  (_, index) => index !== lessonIndex
                )
                .map((lesson, index) => ({
                  ...lesson,
                  order: index + 1,
                })),
            };

            setCourse({
              ...course,
              modules,
            });
          },
        },
      ]
    );
  };

  const updateLesson = (
    moduleIndex: number,
    lessonIndex: number,
    field: keyof Lesson,
    value: any
  ) => {
    if (!course) return;

    const modules = [...course.modules];

    const lessons = [
      ...modules[moduleIndex].lessons,
    ];

    lessons[lessonIndex] = {
      ...lessons[lessonIndex],
      [field]: value,
    };

    modules[moduleIndex] = {
      ...modules[moduleIndex],
      lessons,
    };

    setCourse({
      ...course,
      modules,
    });
  };

  /* =======================================================
     VIDEO
  ======================================================= */

  const updateVideo = (
    moduleIndex: number,
    lessonIndex: number,
    field: keyof Video,
    value: any
  ) => {
    if (!course) return;

    const modules = [...course.modules];

    const lessons = [
      ...modules[moduleIndex].lessons,
    ];

    lessons[lessonIndex] = {
      ...lessons[lessonIndex],
      video: {
        ...lessons[lessonIndex].video,
        [field]: value,
      },
    };

    modules[moduleIndex] = {
      ...modules[moduleIndex],
      lessons,
    };

    setCourse({
      ...course,
      modules,
    });
  };

  /* =======================================================
     ASSIGNMENT
  ======================================================= */

  const updateAssignment = (
    moduleIndex: number,
    field: keyof Assignment,
    value: any
  ) => {
    if (!course) return;

    const modules = [...course.modules];

    modules[moduleIndex] = {
      ...modules[moduleIndex],
      assignment: {
        ...modules[moduleIndex].assignment,
        [field]: value,
      },
    };

    setCourse({
      ...course,
      modules,
    });
  };

  const addAssignmentQuestion = (
    moduleIndex: number
  ) => {
    if (!course) return;

    const modules = [...course.modules];

    modules[moduleIndex] = {
      ...modules[moduleIndex],
      assignment: {
        ...modules[moduleIndex].assignment,
        questions: [
          ...modules[moduleIndex].assignment.questions,
          createQuestion(),
        ],
      },
    };

    setCourse({
      ...course,
      modules,
    });
  };

  const removeAssignmentQuestion = (
    moduleIndex: number,
    questionIndex: number
  ) => {
    if (!course) return;

    const modules = [...course.modules];

    modules[moduleIndex] = {
      ...modules[moduleIndex],
      assignment: {
        ...modules[moduleIndex].assignment,
        questions: modules[
          moduleIndex
        ].assignment.questions.filter(
          (_, index) => index !== questionIndex
        ),
      },
    };

    setCourse({
      ...course,
      modules,
    });
  };

  const updateAssignmentQuestion = (
    moduleIndex: number,
    questionIndex: number,
    field: keyof Question,
    value: any
  ) => {
    if (!course) return;

    const modules = [...course.modules];

    const questions = [
      ...modules[moduleIndex].assignment.questions,
    ];

    questions[questionIndex] = {
      ...questions[questionIndex],
      [field]: value,
    };

    modules[moduleIndex] = {
      ...modules[moduleIndex],
      assignment: {
        ...modules[moduleIndex].assignment,
        questions,
      },
    };

    setCourse({
      ...course,
      modules,
    });
  };

  /* =======================================================
     FINAL EXAM
  ======================================================= */

  const updateFinalExam = (
    field: keyof FinalExam,
    value: any
  ) => {
    if (!course) return;

    setCourse({
      ...course,
      finalExam: {
        ...course.finalExam,
        [field]: value,
      },
    });
  };

  const addFinalExamQuestion = () => {
    if (!course) return;

    setCourse({
      ...course,
      finalExam: {
        ...course.finalExam,
        questions: [
          ...course.finalExam.questions,
          createQuestion(),
        ],
      },
    });
  };

  const removeFinalExamQuestion = (
    questionIndex: number
  ) => {
    if (!course) return;

    setCourse({
      ...course,
      finalExam: {
        ...course.finalExam,
        questions: course.finalExam.questions.filter(
          (_, index) => index !== questionIndex
        ),
      },
    });
  };

  const updateFinalExamQuestion = (
    questionIndex: number,
    field: keyof Question,
    value: any
  ) => {
    if (!course) return;

    const questions = [
      ...course.finalExam.questions,
    ];

    questions[questionIndex] = {
      ...questions[questionIndex],
      [field]: value,
    };

    setCourse({
      ...course,
      finalExam: {
        ...course.finalExam,
        questions,
      },
    });
  };

  /* =======================================================
     SAVE COURSE
  ======================================================= */

  const validateCourse = () => {
    if (!course) return false;

    if (!course.title.trim()) {
      Alert.alert(
        "Validation",
        "Please enter a course title."
      );
      return false;
    }

    if (
      !course.modules ||
      course.modules.length === 0
    ) {
      Alert.alert(
        "Validation",
        "The course must have at least one module."
      );
      return false;
    }

    for (
      let moduleIndex = 0;
      moduleIndex < course.modules.length;
      moduleIndex++
    ) {
      const module = course.modules[moduleIndex];

      if (!module.title.trim()) {
        Alert.alert(
          "Validation",
          `Please enter a title for Module ${
            moduleIndex + 1
          }.`
        );
        return false;
      }

      if (
        !module.lessons ||
        module.lessons.length === 0
      ) {
        Alert.alert(
          "Validation",
          `Module ${
            moduleIndex + 1
          } must contain at least one lesson.`
        );
        return false;
      }

      for (
        let lessonIndex = 0;
        lessonIndex < module.lessons.length;
        lessonIndex++
      ) {
        const lesson =
          module.lessons[lessonIndex];

        if (!lesson.title.trim()) {
          Alert.alert(
            "Validation",
            `Please enter a title for Module ${
              moduleIndex + 1
            }, Lesson ${lessonIndex + 1}.`
          );
          return false;
        }
      }
    }

    if (
      course.finalExam.enabled &&
      !course.finalExam.title.trim()
    ) {
      Alert.alert(
        "Validation",
        "Please enter a title for the final examination."
      );
      return false;
    }

    return true;
  };

  const saveCourse = async () => {
    if (!course || !courseId) return;

    if (!validateCourse()) return;

    try {
      setSaving(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token is missing.");
      }

      const payload = {
        title: course.title.trim(),

        shortDescription:
          course.shortDescription?.trim() || "",

        description:
          course.description?.trim() || "",

        category:
          course.category?.trim() || "General",

        level: course.level,

        duration: Number(course.duration || 0),

        price: COURSE_PRICE,

        image: course.image || "",

        published: Boolean(course.published),

        certificate: Boolean(course.certificate),

        passMark: Number(course.passMark || 80),

        modules: course.modules.map(
          (module, moduleIndex) => ({
            ...(module._id
              ? { _id: module._id }
              : {}),

            title: module.title.trim(),

            description:
              module.description?.trim() || "",

            order: moduleIndex + 1,

            lessons: module.lessons.map(
              (lesson, lessonIndex) => ({
                ...(lesson._id
                  ? { _id: lesson._id }
                  : {}),

                title: lesson.title.trim(),

                description:
                  lesson.description?.trim() || "",

                duration: Number(
                  lesson.duration || 0
                ),

                order: lessonIndex + 1,

                materials:
                  lesson.materials || [],

                video: {
                  type:
                    lesson.video?.type || "none",

                  url:
                    lesson.video?.url || "",

                  filename:
                    lesson.video?.filename || "",

                  title:
                    lesson.video?.title || "",
                },
              })
            ),

            assignment: {
              enabled: Boolean(
                module.assignment?.enabled
              ),

              title:
                module.assignment?.title || "",

              instructions:
                module.assignment?.instructions || "",

              passMark: Number(
                module.assignment?.passMark || 80
              ),

              questions:
                module.assignment?.questions || [],
            },
          })
        ),

        finalExam: {
          enabled: Boolean(
            course.finalExam?.enabled
          ),

          title:
            course.finalExam?.title || "",

          instructions:
            course.finalExam?.instructions || "",

          durationMinutes: Number(
            course.finalExam?.durationMinutes || 60
          ),

          passMark: Number(
            course.finalExam?.passMark || 80
          ),

          questions:
            course.finalExam?.questions || [],
        },
      };

      const response = await API.put(
        `/courses/${courseId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;

      const updatedCourse = normalizeCourse(
        data.course || data
      );

      setCourse(updatedCourse);

      setLegacyNeedsSave(false);

      Alert.alert(
        "Course Saved",
        "The course structure has been successfully updated."
      );
    } catch (error: any) {
      console.error("SAVE COURSE ERROR:", error);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to save the course.";

      Alert.alert(
        "Save Error",
        message
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     UPLOAD VALIDATION
  ======================================================= */

  const ensureSavedBeforeUpload = (
    moduleIndex: number,
    lessonIndex: number
  ) => {
    if (!course) return false;

    const module = course.modules[moduleIndex];

    const lesson = module.lessons[lessonIndex];

    if (!courseId) {
      Alert.alert(
        "Error",
        "Course ID is missing."
      );
      return false;
    }

    if (!module._id || !lesson._id) {
      Alert.alert(
        "Save Course First",
        "This module or lesson has not been saved to the database yet. Please save the course first, then upload files."
      );

      return false;
    }

    if (legacyNeedsSave) {
      Alert.alert(
        "Save Course First",
        "This course was converted from the old lesson structure. Please save the course once before uploading materials."
      );

      return false;
    }

    return true;
  };

  /* =======================================================
     UPLOAD MATERIAL
  ======================================================= */

  const uploadMaterial = async (
    moduleIndex: number,
    lessonIndex: number,
    materialKind: "pdf" | "audio"
  ) => {
    if (
      !ensureSavedBeforeUpload(
        moduleIndex,
        lessonIndex
      )
    ) {
      return;
    }

    const module =
      course!.modules[moduleIndex];

    const lesson =
      module.lessons[lessonIndex];

    try {
      const result =
        await DocumentPicker.getDocumentAsync({
          type:
            materialKind === "pdf"
              ? "application/pdf"
              : [
                  "audio/mpeg",
                  "audio/mp3",
                  "audio/wav",
                  "audio/x-wav",
                  "audio/mp4",
                  "audio/aac",
                  "audio/ogg",
                  "audio/webm",
                  "audio/flac",
                ],
          multiple: true,
          copyToCacheDirectory: true,
        });

      if (result.canceled) {
        return;
      }

      const assets = result.assets || [];

      if (assets.length === 0) {
        return;
      }

      const key =
        `${module._id}-${lesson._id}-${materialKind}`;

      setUploadingKey(key);

      const token =
        await AsyncStorage.getItem("token");

      if (!token) {
        throw new Error(
          "Authentication token is missing."
        );
      }

      let latestCourse: any = null;

      for (const asset of assets) {
        const formData = new FormData();

        formData.append(
          "material",
          {
            uri: asset.uri,
            name:
              asset.name ||
              `material-${Date.now()}`,
            type:
              asset.mimeType ||
              (materialKind === "pdf"
                ? "application/pdf"
                : "audio/mpeg"),
          } as any
        );

        formData.append(
          "title",
          asset.name || ""
        );

        /*
         * IMPORTANT:
         * Do NOT manually set Content-Type here.
         * Axios/React Native will generate the correct
         * multipart boundary automatically.
         */

        const response = await API.post(
          `/courses/${courseId}/modules/${module._id}/lessons/${lesson._id}/material`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = response.data;

        latestCourse =
          data.course || data;
      }

      if (latestCourse) {
        setCourse(
          normalizeCourse(latestCourse)
        );
      } else {
        await loadCourse();
      }

      Alert.alert(
        "Upload Complete",
        `${assets.length} ${materialKind}${
          assets.length === 1 ? "" : "s"
        } uploaded successfully.`
      );
    } catch (error: any) {
      console.error(
        "UPLOAD MATERIAL ERROR:",
        error
      );

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to upload the material.";

      Alert.alert(
        "Upload Error",
        message
      );
    } finally {
      setUploadingKey(null);
    }
  };

  /* =======================================================
     DELETE MATERIAL
  ======================================================= */

  const deleteMaterial = (
    moduleIndex: number,
    lessonIndex: number,
    material: Material
  ) => {
    if (!course) return;

    const module =
      course.modules[moduleIndex];

    const lesson =
      module.lessons[lessonIndex];

    if (
      !module._id ||
      !lesson._id ||
      !material._id
    ) {
      Alert.alert(
        "Error",
        "This material does not have a valid database ID."
      );
      return;
    }

    Alert.alert(
      "Delete Material?",
      `Remove "${
        material.originalName ||
        material.filename
      }" from this lesson?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token =
                await AsyncStorage.getItem("token");

              if (!token) {
                throw new Error(
                  "Authentication token is missing."
                );
              }

              const response =
                await API.delete(
                  `/courses/${courseId}/modules/${module._id}/lessons/${lesson._id}/materials/${material._id}`,
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );

              const data =
                response.data;

              setCourse(
                normalizeCourse(
                  data.course || data
                )
              );

              Alert.alert(
                "Deleted",
                "The material has been removed."
              );
            } catch (error: any) {
              console.error(
                "DELETE MATERIAL ERROR:",
                error
              );

              const message =
                error?.response?.data?.message ||
                error?.message ||
                "Unable to delete material.";

              Alert.alert(
                "Delete Error",
                message
              );
            }
          },
        },
      ]
    );
  };

  /* =======================================================
     UPLOAD VIDEO
  ======================================================= */

  const uploadVideo = async (
    moduleIndex: number,
    lessonIndex: number
  ) => {
    if (
      !ensureSavedBeforeUpload(
        moduleIndex,
        lessonIndex
      )
    ) {
      return;
    }

    const module =
      course!.modules[moduleIndex];

    const lesson =
      module.lessons[lessonIndex];

    try {
      const result =
        await DocumentPicker.getDocumentAsync({
          type: [
            "video/mp4",
            "video/mpeg",
            "video/quicktime",
            "video/x-msvideo",
            "video/x-matroska",
            "video/webm",
          ],
          multiple: false,
          copyToCacheDirectory: true,
        });

      if (result.canceled) {
        return;
      }

      const asset = result.assets?.[0];

      if (!asset) {
        return;
      }

      const key =
        `${module._id}-${lesson._id}-video`;

      setUploadingKey(key);

      const token =
        await AsyncStorage.getItem("token");

      if (!token) {
        throw new Error(
          "Authentication token is missing."
        );
      }

      const formData = new FormData();

      formData.append(
        "video",
        {
          uri: asset.uri,
          name:
            asset.name ||
            `video-${Date.now()}.mp4`,
          type:
            asset.mimeType ||
            "video/mp4",
        } as any
      );

      formData.append(
        "title",
        asset.name || lesson.title
      );

      /*
       * IMPORTANT:
       * Do NOT manually set Content-Type here.
       */

      const response = await API.post(
        `/courses/${courseId}/modules/${module._id}/lessons/${lesson._id}/video`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;

      setCourse(
        normalizeCourse(
          data.course || data
        )
      );

      Alert.alert(
        "Video Uploaded",
        "The lesson video has been uploaded successfully."
      );
    } catch (error: any) {
      console.error(
        "UPLOAD VIDEO ERROR:",
        error
      );

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to upload the video.";

      Alert.alert(
        "Video Upload Error",
        message
      );
    } finally {
      setUploadingKey(null);
    }
  };

  /* =======================================================
     COURSE STATISTICS
  ======================================================= */

  const statistics = useMemo(() => {
    if (!course) {
      return {
        modules: 0,
        lessons: 0,
        materials: 0,
        videos: 0,
        assignments: 0,
      };
    }

    let lessons = 0;
    let materials = 0;
    let videos = 0;
    let assignments = 0;

    course.modules.forEach((module) => {
      lessons += module.lessons.length;

      if (module.assignment.enabled) {
        assignments++;
      }

      module.lessons.forEach((lesson) => {
        materials += lesson.materials?.length || 0;

        if (
          lesson.video?.type === "upload" ||
          lesson.video?.type === "external"
        ) {
          videos++;
        }
      });
    });

    return {
      modules: course.modules.length,
      lessons,
      materials,
      videos,
      assignments,
    };
  }, [course]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading || !course) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Loading course...
        </Text>
      </View>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.contentContainer
        }
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>
              ← Back
            </Text>
          </TouchableOpacity>

          <Text style={styles.pageTitle}>
            Edit Course
          </Text>

          <Text style={styles.pageSubtitle}>
            Build the complete learning structure,
            upload materials and manage assessments.
          </Text>
        </View>

        {/* =================================================
            LEGACY WARNING
        ================================================= */}

        {legacyNeedsSave && (
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>
              Course structure needs to be saved
            </Text>

            <Text style={styles.warningText}>
              This course was created using the previous
              lesson-only structure. It has been converted
              into Module 1. Save the course before uploading
              new PDFs, audio or videos.
            </Text>
          </View>
        )}

        {/* =================================================
            STATISTICS
        ================================================= */}

        <View style={styles.statsGrid}>
          <StatCard
            label="Modules"
            value={statistics.modules}
          />

          <StatCard
            label="Lessons"
            value={statistics.lessons}
          />

          <StatCard
            label="Materials"
            value={statistics.materials}
          />

          <StatCard
            label="Videos"
            value={statistics.videos}
          />

          <StatCard
            label="Assignments"
            value={statistics.assignments}
          />
        </View>

        {/* =================================================
            COURSE DETAILS
        ================================================= */}

        <SectionCard
          title="Course Details"
          subtitle="Basic information about the course."
        >
          <Label text="Course Title *" />

          <TextInput
            style={styles.input}
            value={course.title}
            onChangeText={(value) =>
              updateCourseField(
                "title",
                value
              )
            }
            placeholder="e.g. Professional Caregiving"
          />

          <Label text="Short Description" />

          <TextInput
            style={styles.input}
            value={course.shortDescription}
            onChangeText={(value) =>
              updateCourseField(
                "shortDescription",
                value
              )
            }
            placeholder="Short course summary"
          />

          <Label text="Full Description" />

          <TextInput
            style={[
              styles.input,
              styles.textArea,
            ]}
            value={course.description}
            onChangeText={(value) =>
              updateCourseField(
                "description",
                value
              )
            }
            multiline
            textAlignVertical="top"
            placeholder="Full course description"
          />

          <Label text="Category" />

          <TextInput
            style={styles.input}
            value={course.category}
            onChangeText={(value) =>
              updateCourseField(
                "category",
                value
              )
            }
            placeholder="Childcare, Caregiving, etc."
          />

          <Label text="Level" />

          <View style={styles.optionRow}>
            {(
              [
                "Beginner",
                "Intermediate",
                "Advanced",
              ] as const
            ).map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.optionButton,
                  course.level === level &&
                    styles.optionButtonActive,
                ]}
                onPress={() =>
                  updateCourseField(
                    "level",
                    level
                  )
                }
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    course.level === level &&
                      styles.optionButtonTextActive,
                  ]}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Label text="Duration (hours)" />

          <TextInput
            style={styles.input}
            value={String(
              course.duration || ""
            )}
            onChangeText={(value) =>
              updateCourseField(
                "duration",
                Number(
                  value.replace(
                    /[^0-9]/g,
                    ""
                  )
                )
              )
            }
            keyboardType="numeric"
            placeholder="e.g. 40"
          />

          <Label text="Course Price" />

          <View style={styles.fixedPriceBox}>
            <Text style={styles.fixedPriceText}>
              R{COURSE_PRICE.toFixed(2)}
            </Text>

            <Text style={styles.fixedPriceNote}>
              Fixed course price
            </Text>
          </View>

          <Label text="Certificate Pass Mark (%)" />

          <TextInput
            style={styles.input}
            value={String(
              course.passMark || 80
            )}
            onChangeText={(value) =>
              updateCourseField(
                "passMark",
                Number(
                  value.replace(
                    /[^0-9]/g,
                    ""
                  )
                )
              )
            }
            keyboardType="numeric"
          />

          <View style={styles.switchRow}>
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchTitle}>
                Published
              </Text>

              <Text style={styles.switchSubtitle}>
                Make this course visible to students.
              </Text>
            </View>

            <Switch
              value={course.published}
              onValueChange={(value) =>
                updateCourseField(
                  "published",
                  value
                )
              }
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchTitle}>
                Certificate
              </Text>

              <Text style={styles.switchSubtitle}>
                Allow certificates to be issued after completion.
              </Text>
            </View>

            <Switch
              value={course.certificate}
              onValueChange={(value) =>
                updateCourseField(
                  "certificate",
                  value
                )
              }
            />
          </View>
        </SectionCard>

        {/* =================================================
            MODULES
        ================================================= */}

        <View style={styles.sectionHeadingRow}>
          <View style={styles.sectionHeadingText}>
            <Text style={styles.mainSectionTitle}>
              Course Modules
            </Text>

            <Text style={styles.mainSectionSubtitle}>
              Organise the course into modules,
              lessons and learning materials.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={addModule}
          >
            <Text style={styles.addButtonText}>
              + Add Module
            </Text>
          </TouchableOpacity>
        </View>

        {course.modules.map(
          (module, moduleIndex) => (
            <View
              key={
                module._id ||
                `module-${moduleIndex}`
              }
              style={styles.moduleCard}
            >
              {/* MODULE HEADER */}

              <View style={styles.moduleHeader}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={styles.moduleNumber}
                  >
                    MODULE {moduleIndex + 1}
                  </Text>

                  <Text
                    style={styles.moduleHeading}
                  >
                    {module.title ||
                      "Untitled Module"}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() =>
                    removeModule(
                      moduleIndex
                    )
                  }
                >
                  <Text
                    style={styles.deleteButtonText}
                  >
                    Remove
                  </Text>
                </TouchableOpacity>
              </View>

              {/* MODULE DETAILS */}

              <Label text="Module Title *" />

              <TextInput
                style={styles.input}
                value={module.title}
                onChangeText={(value) =>
                  updateModule(
                    moduleIndex,
                    "title",
                    value
                  )
                }
                placeholder={`Module ${
                  moduleIndex + 1
                } title`}
              />

              <Label text="Module Description" />

              <TextInput
                style={[
                  styles.input,
                  styles.textAreaSmall,
                ]}
                value={module.description}
                onChangeText={(value) =>
                  updateModule(
                    moduleIndex,
                    "description",
                    value
                  )
                }
                multiline
                textAlignVertical="top"
                placeholder="Describe what students will learn in this module."
              />

              {/* =================================================
                  LESSONS
              ================================================= */}

              <View style={styles.subsectionHeader}>
                <View>
                  <Text
                    style={styles.subsectionTitle}
                  >
                    Lessons / Sections
                  </Text>

                  <Text
                    style={styles.subsectionSubtitle}
                  >
                    Add PDFs, audio and video to each lesson.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.smallAddButton}
                  onPress={() =>
                    addLesson(moduleIndex)
                  }
                >
                  <Text
                    style={
                      styles.smallAddButtonText
                    }
                  >
                    + Lesson
                  </Text>
                </TouchableOpacity>
              </View>

              {module.lessons.map(
                (lesson, lessonIndex) => {
                  const pdfUploadKey =
                    `${module._id}-${lesson._id}-pdf`;

                  const audioUploadKey =
                    `${module._id}-${lesson._id}-audio`;

                  const videoUploadKey =
                    `${module._id}-${lesson._id}-video`;

                  return (
                    <View
                      key={
                        lesson._id ||
                        `lesson-${moduleIndex}-${lessonIndex}`
                      }
                      style={styles.lessonCard}
                    >
                      <View
                        style={
                          styles.lessonHeader
                        }
                      >
                        <View
                          style={{ flex: 1 }}
                        >
                          <Text
                            style={
                              styles.lessonNumber
                            }
                          >
                            SECTION / LESSON{" "}
                            {lessonIndex + 1}
                          </Text>

                          <Text
                            style={
                              styles.lessonHeading
                            }
                          >
                            {lesson.title ||
                              "Untitled Lesson"}
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={
                            styles.removeSmallButton
                          }
                          onPress={() =>
                            removeLesson(
                              moduleIndex,
                              lessonIndex
                            )
                          }
                        >
                          <Text
                            style={
                              styles.removeSmallButtonText
                            }
                          >
                            Remove
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <Label text="Lesson Title *" />

                      <TextInput
                        style={styles.input}
                        value={lesson.title}
                        onChangeText={(
                          value
                        ) =>
                          updateLesson(
                            moduleIndex,
                            lessonIndex,
                            "title",
                            value
                          )
                        }
                        placeholder="e.g. Introduction to Personal Care"
                      />

                      <Label text="Lesson Description" />

                      <TextInput
                        style={[
                          styles.input,
                          styles.textAreaSmall,
                        ]}
                        value={
                          lesson.description
                        }
                        onChangeText={(
                          value
                        ) =>
                          updateLesson(
                            moduleIndex,
                            lessonIndex,
                            "description",
                            value
                          )
                        }
                        multiline
                        textAlignVertical="top"
                        placeholder="Describe this lesson."
                      />

                      <Label text="Duration (minutes)" />

                      <TextInput
                        style={styles.input}
                        value={String(
                          lesson.duration || ""
                        )}
                        onChangeText={(
                          value
                        ) =>
                          updateLesson(
                            moduleIndex,
                            lessonIndex,
                            "duration",
                            Number(
                              value.replace(
                                /[^0-9]/g,
                                ""
                              )
                            )
                          )
                        }
                        keyboardType="numeric"
                        placeholder="e.g. 30"
                      />

                      {/* =========================================
                          MATERIALS
                      ========================================= */}

                      <View
                        style={
                          styles.materialSection
                        }
                      >
                        <Text
                          style={
                            styles.materialTitle
                          }
                        >
                          Learning Materials
                        </Text>

                        <Text
                          style={
                            styles.materialSubtitle
                          }
                        >
                          Upload multiple PDFs and audio files directly
                          from your device.
                        </Text>

                        {!module._id ||
                        !lesson._id ||
                        legacyNeedsSave ? (
                          <View
                            style={
                              styles.uploadDisabledBox
                            }
                          >
                            <Text
                              style={
                                styles.uploadDisabledText
                              }
                            >
                              Save the course first before
                              uploading materials to this lesson.
                            </Text>
                          </View>
                        ) : null}

                        <View
                          style={
                            styles.uploadRow
                          }
                        >
                          <TouchableOpacity
                            style={[
                              styles.uploadButton,
                              uploadingKey ===
                                pdfUploadKey &&
                                styles.buttonDisabled,
                            ]}
                            disabled={
                              uploadingKey ===
                              pdfUploadKey
                            }
                            onPress={() =>
                              uploadMaterial(
                                moduleIndex,
                                lessonIndex,
                                "pdf"
                              )
                            }
                          >
                            {uploadingKey ===
                            pdfUploadKey ? (
                              <ActivityIndicator
                                size="small"
                              />
                            ) : (
                              <Text
                                style={
                                  styles.uploadButtonText
                                }
                              >
                                + Add PDF
                              </Text>
                            )}
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.uploadButton,
                              uploadingKey ===
                                audioUploadKey &&
                                styles.buttonDisabled,
                            ]}
                            disabled={
                              uploadingKey ===
                              audioUploadKey
                            }
                            onPress={() =>
                              uploadMaterial(
                                moduleIndex,
                                lessonIndex,
                                "audio"
                              )
                            }
                          >
                            {uploadingKey ===
                            audioUploadKey ? (
                              <ActivityIndicator
                                size="small"
                              />
                            ) : (
                              <Text
                                style={
                                  styles.uploadButtonText
                                }
                              >
                                + Add Audio
                              </Text>
                            )}
                          </TouchableOpacity>
                        </View>

                        {/* EXISTING MATERIALS */}

                        {lesson.materials &&
                        lesson.materials.length >
                          0 ? (
                          <View
                            style={
                              styles.existingMaterials
                            }
                          >
                            <Text
                              style={
                                styles.existingMaterialsTitle
                              }
                            >
                              Existing Materials (
                              {
                                lesson.materials
                                  .length
                              }
                              )
                            </Text>

                            {lesson.materials.map(
                              (
                                material,
                                materialIndex
                              ) => (
                                <View
                                  key={
                                    material._id ||
                                    `${material.filename}-${materialIndex}`
                                  }
                                  style={
                                    styles.materialItem
                                  }
                                >
                                  <View
                                    style={{
                                      flex: 1,
                                    }}
                                  >
                                    <Text
                                      style={
                                        styles.materialFileName
                                      }
                                      numberOfLines={
                                        2
                                      }
                                    >
                                      {material.originalName ||
                                        material.filename}
                                    </Text>

                                    <Text
                                      style={
                                        styles.materialMeta
                                      }
                                    >
                                      {material.mimeType?.includes(
                                        "pdf"
                                      )
                                        ? "PDF"
                                        : "Audio"}

                                      {material.size
                                        ? ` • ${getFileSize(
                                            material.size
                                          )}`
                                        : ""}
                                    </Text>
                                  </View>

                                  <TouchableOpacity
                                    style={
                                      styles.materialDeleteButton
                                    }
                                    onPress={() =>
                                      deleteMaterial(
                                        moduleIndex,
                                        lessonIndex,
                                        material
                                      )
                                    }
                                  >
                                    <Text
                                      style={
                                        styles.materialDeleteText
                                      }
                                    >
                                      Delete
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                              )
                            )}
                          </View>
                        ) : (
                          <Text
                            style={
                              styles.noMaterialsText
                            }
                          >
                            No PDF or audio materials
                            uploaded yet.
                          </Text>
                        )}
                      </View>

                      {/* =========================================
                          VIDEO
                      ========================================= */}

                      <View
                        style={
                          styles.videoSection
                        }
                      >
                        <Text
                          style={
                            styles.materialTitle
                          }
                        >
                          Video
                        </Text>

                        <View
                          style={
                            styles.videoTypeRow
                          }
                        >
                          {[
                            {
                              value: "none",
                              label: "No Video",
                            },
                            {
                              value: "upload",
                              label: "Upload Video",
                            },
                            {
                              value: "external",
                              label: "Video Link",
                            },
                          ].map((item) => (
                            <TouchableOpacity
                              key={
                                item.value
                              }
                              style={[
                                styles.videoTypeButton,
                                lesson.video
                                  ?.type ===
                                  item.value &&
                                  styles.videoTypeButtonActive,
                              ]}
                              onPress={() =>
                                updateVideo(
                                  moduleIndex,
                                  lessonIndex,
                                  "type",
                                  item.value
                                )
                              }
                            >
                              <Text
                                style={[
                                  styles.videoTypeText,
                                  lesson.video
                                    ?.type ===
                                    item.value &&
                                    styles.videoTypeTextActive,
                                ]}
                              >
                                {item.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        {lesson.video
                          ?.type ===
                          "upload" && (
                          <View>
                            <TouchableOpacity
                              style={[
                                styles.fullUploadButton,
                                uploadingKey ===
                                  videoUploadKey &&
                                  styles.buttonDisabled,
                              ]}
                              disabled={
                                uploadingKey ===
                                videoUploadKey
                              }
                              onPress={() =>
                                uploadVideo(
                                  moduleIndex,
                                  lessonIndex
                                )
                              }
                            >
                              {uploadingKey ===
                              videoUploadKey ? (
                                <ActivityIndicator
                                  size="small"
                                />
                              ) : (
                                <Text
                                  style={
                                    styles.fullUploadButtonText
                                  }
                                >
                                  Upload Lesson Video
                                </Text>
                              )}
                            </TouchableOpacity>

                            {lesson.video
                              ?.filename ? (
                              <View
                                style={
                                  styles.currentVideoBox
                                }
                              >
                                <Text
                                  style={
                                    styles.currentVideoLabel
                                  }
                                >
                                  Current Video
                                </Text>

                                <Text
                                  style={
                                    styles.currentVideoName
                                  }
                                >
                                  {
                                    lesson
                                      .video
                                      .filename
                                  }
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        )}

                        {lesson.video
                          ?.type ===
                          "external" && (
                          <View>
                            <Label text="Video URL" />

                            <TextInput
                              style={
                                styles.input
                              }
                              value={
                                lesson.video
                                  ?.url || ""
                              }
                              onChangeText={(
                                value
                              ) =>
                                updateVideo(
                                  moduleIndex,
                                  lessonIndex,
                                  "url",
                                  value
                                )
                              }
                              autoCapitalize="none"
                              keyboardType="url"
                              placeholder="https://www.youtube.com/watch?v=..."
                            />

                            <Label text="Video Title" />

                            <TextInput
                              style={
                                styles.input
                              }
                              value={
                                lesson.video
                                  ?.title || ""
                              }
                              onChangeText={(
                                value
                              ) =>
                                updateVideo(
                                  moduleIndex,
                                  lessonIndex,
                                  "title",
                                  value
                                )
                              }
                              placeholder="Video title"
                            />
                          </View>
                        )}
                      </View>
                    </View>
                  );
                }
              )}

              {/* =================================================
                  MODULE ASSIGNMENT
              ================================================= */}

              <View
                style={
                  styles.assignmentSection
                }
              >
                <View
                  style={
                    styles.switchRow
                  }
                >
                  <View
                    style={
                      styles.switchTextContainer
                    }
                  >
                    <Text
                      style={
                        styles.assignmentTitle
                      }
                    >
                      Module Assignment
                    </Text>

                    <Text
                      style={
                        styles.switchSubtitle
                      }
                    >
                      Add an assessment at the end of this module.
                    </Text>
                  </View>

                  <Switch
                    value={
                      module.assignment
                        .enabled
                    }
                    onValueChange={(
                      value
                    ) =>
                      updateAssignment(
                        moduleIndex,
                        "enabled",
                        value
                      )
                    }
                  />
                </View>

                {module.assignment
                  .enabled && (
                  <View>
                    <Label text="Assignment Title" />

                    <TextInput
                      style={
                        styles.input
                      }
                      value={
                        module.assignment
                          .title
                      }
                      onChangeText={(
                        value
                      ) =>
                        updateAssignment(
                          moduleIndex,
                          "title",
                          value
                        )
                      }
                      placeholder="Module Assignment"
                    />

                    <Label text="Instructions" />

                    <TextInput
                      style={[
                        styles.input,
                        styles.textAreaSmall,
                      ]}
                      value={
                        module.assignment
                          .instructions
                      }
                      onChangeText={(
                        value
                      ) =>
                        updateAssignment(
                          moduleIndex,
                          "instructions",
                          value
                        )
                      }
                      multiline
                      textAlignVertical="top"
                      placeholder="Assignment instructions"
                    />

                    <Label text="Pass Mark (%)" />

                    <TextInput
                      style={
                        styles.input
                      }
                      value={String(
                        module.assignment
                          .passMark
                      )}
                      onChangeText={(
                        value
                      ) =>
                        updateAssignment(
                          moduleIndex,
                          "passMark",
                          Number(
                            value.replace(
                              /[^0-9]/g,
                              ""
                            )
                          )
                        )
                      }
                      keyboardType="numeric"
                    />

                    <View
                      style={
                        styles.questionHeader
                      }
                    >
                      <Text
                        style={
                          styles.questionHeaderTitle
                        }
                      >
                        Questions
                      </Text>

                      <TouchableOpacity
                        style={
                          styles.smallAddButton
                        }
                        onPress={() =>
                          addAssignmentQuestion(
                            moduleIndex
                          )
                        }
                      >
                        <Text
                          style={
                            styles.smallAddButtonText
                          }
                        >
                          + Question
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {module.assignment.questions.map(
                      (
                        question,
                        questionIndex
                      ) => (
                        <QuestionEditor
                          key={
                            question._id ||
                            `assignment-question-${moduleIndex}-${questionIndex}`
                          }
                          question={
                            question
                          }
                          index={
                            questionIndex
                          }
                          onChange={(
                            field,
                            value
                          ) =>
                            updateAssignmentQuestion(
                              moduleIndex,
                              questionIndex,
                              field,
                              value
                            )
                          }
                          onRemove={() =>
                            removeAssignmentQuestion(
                              moduleIndex,
                              questionIndex
                            )
                          }
                        />
                      )
                    )}

                    {module.assignment
                      .questions.length ===
                      0 && (
                      <Text
                        style={
                          styles.emptyQuestionsText
                        }
                      >
                        No questions added yet.
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>
          )
        )}

        {/* =================================================
            FINAL EXAMINATION
        ================================================= */}

        <View style={styles.mainSectionBlock}>
          <Text
            style={styles.mainSectionTitle}
          >
            Final Examination
          </Text>

          <Text
            style={styles.mainSectionSubtitle}
          >
            The final assessment for the entire course.
          </Text>

          <View
            style={styles.finalExamCard}
          >
            <View
              style={styles.switchRow}
            >
              <View
                style={
                  styles.switchTextContainer
                }
              >
                <Text
                  style={
                    styles.assignmentTitle
                  }
                >
                  Enable Final Examination
                </Text>

                <Text
                  style={
                    styles.switchSubtitle
                  }
                >
                  Students must complete this examination at the end of the course.
                </Text>
              </View>

              <Switch
                value={
                  course.finalExam.enabled
                }
                onValueChange={(
                  value
                ) =>
                  updateFinalExam(
                    "enabled",
                    value
                  )
                }
              />
            </View>

            {course.finalExam.enabled && (
              <View>
                <Label text="Examination Title" />

                <TextInput
                  style={
                    styles.input
                  }
                  value={
                    course.finalExam
                      .title
                  }
                  onChangeText={(
                    value
                  ) =>
                    updateFinalExam(
                      "title",
                      value
                    )
                  }
                  placeholder="Final Examination"
                />

                <Label text="Instructions" />

                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                  ]}
                  value={
                    course.finalExam
                      .instructions
                  }
                  onChangeText={(
                    value
                  ) =>
                    updateFinalExam(
                      "instructions",
                      value
                    )
                  }
                  multiline
                  textAlignVertical="top"
                  placeholder="Final examination instructions"
                />

                <Label text="Duration (minutes)" />

                <TextInput
                  style={
                    styles.input
                  }
                  value={String(
                    course.finalExam
                      .durationMinutes
                  )}
                  onChangeText={(
                    value
                  ) =>
                    updateFinalExam(
                      "durationMinutes",
                      Number(
                        value.replace(
                          /[^0-9]/g,
                          ""
                        )
                      )
                    )
                  }
                  keyboardType="numeric"
                />

                <Label text="Pass Mark (%)" />

                <TextInput
                  style={
                    styles.input
                  }
                  value={String(
                    course.finalExam
                      .passMark
                  )}
                  onChangeText={(
                    value
                  ) =>
                    updateFinalExam(
                      "passMark",
                      Number(
                        value.replace(
                          /[^0-9]/g,
                          ""
                        )
                      )
                    )
                  }
                  keyboardType="numeric"
                />

                <View
                  style={
                    styles.questionHeader
                  }
                >
                  <Text
                    style={
                      styles.questionHeaderTitle
                    }
                  >
                    Examination Questions
                  </Text>

                  <TouchableOpacity
                    style={
                      styles.smallAddButton
                    }
                    onPress={
                      addFinalExamQuestion
                    }
                  >
                    <Text
                      style={
                        styles.smallAddButtonText
                      }
                    >
                      + Question
                    </Text>
                  </TouchableOpacity>
                </View>

                {course.finalExam.questions.map(
                  (
                    question,
                    questionIndex
                  ) => (
                    <QuestionEditor
                      key={
                        question._id ||
                        `final-question-${questionIndex}`
                      }
                      question={
                        question
                      }
                      index={
                        questionIndex
                      }
                      onChange={(
                        field,
                        value
                      ) =>
                        updateFinalExamQuestion(
                          questionIndex,
                          field,
                          value
                        )
                      }
                      onRemove={() =>
                        removeFinalExamQuestion(
                          questionIndex
                        )
                      }
                    />
                  )
                )}

                {course.finalExam
                  .questions.length ===
                  0 && (
                  <Text
                    style={
                      styles.emptyQuestionsText
                    }
                  >
                    No final examination questions
                    added yet.
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>

        {/* =================================================
            SAVE
        ================================================= */}

        <View
          style={styles.bottomActions}
        >
          <TouchableOpacity
            style={styles.saveButton}
            disabled={saving}
            onPress={saveCourse}
          >
            {saving ? (
              <ActivityIndicator
                size="small"
              />
            ) : (
              <Text
                style={styles.saveButtonText}
              >
                Save Course
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text
              style={styles.cancelButtonText}
            >
              Back
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>
        {value}
      </Text>

      <Text style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}

/* =========================================================
   SECTION CARD
========================================================= */

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>
        {title}
      </Text>

      {subtitle ? (
        <Text style={styles.sectionSubtitle}>
          {subtitle}
        </Text>
      ) : null}

      {children}
    </View>
  );
}

/* =========================================================
   LABEL
========================================================= */

function Label({
  text,
}: {
  text: string;
}) {
  return (
    <Text style={styles.label}>
      {text}
    </Text>
  );
}

/* =========================================================
   QUESTION EDITOR
========================================================= */

function QuestionEditor({
  question,
  index,
  onChange,
  onRemove,
}: {
  question: Question;
  index: number;
  onChange: (
    field: keyof Question,
    value: any
  ) => void;
  onRemove: () => void;
}) {
  const type = question.type;

  return (
    <View style={styles.questionCard}>
      <View
        style={styles.questionTopRow}
      >
        <Text
          style={styles.questionNumber}
        >
          Question {index + 1}
        </Text>

        <TouchableOpacity
          onPress={onRemove}
          style={
            styles.removeQuestionButton
          }
        >
          <Text
            style={
              styles.removeQuestionText
            }
          >
            Remove
          </Text>
        </TouchableOpacity>
      </View>

      <Label text="Question" />

      <TextInput
        style={[
          styles.input,
          styles.textAreaSmall,
        ]}
        value={question.question}
        onChangeText={(value) =>
          onChange(
            "question",
            value
          )
        }
        multiline
        textAlignVertical="top"
        placeholder="Enter question"
      />

      <Label text="Question Type" />

      <View
        style={styles.questionTypeRow}
      >
        {[
          {
            value:
              "multiple_choice" as QuestionType,
            label: "Multiple Choice",
          },
          {
            value:
              "true_false" as QuestionType,
            label: "True / False",
          },
          {
            value:
              "short_answer" as QuestionType,
            label: "Short Answer",
          },
          {
            value:
              "long_answer" as QuestionType,
            label: "Long Answer",
          },
        ].map((item) => (
          <TouchableOpacity
            key={item.value}
            style={[
              styles.questionTypeButton,
              type === item.value &&
                styles.questionTypeButtonActive,
            ]}
            onPress={() =>
              onChange(
                "type",
                item.value
              )
            }
          >
            <Text
              style={[
                styles.questionTypeText,
                type ===
                  item.value &&
                  styles.questionTypeTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {type ===
        "multiple_choice" && (
        <View>
          <Label text="Answer Options" />

          {(
            question.options || [
              "",
              "",
              "",
              "",
            ]
          ).map(
            (
              option,
              optionIndex
            ) => (
              <TextInput
                key={
                  `option-${optionIndex}`
                }
                style={
                  styles.input
                }
                value={option}
                onChangeText={(
                  value
                ) => {
                  const options = [
                    ...(question.options ||
                      []),
                  ];

                  options[
                    optionIndex
                  ] = value;

                  onChange(
                    "options",
                    options
                  );
                }}
                placeholder={`Option ${
                  optionIndex + 1
                }`}
              />
            )
          )}

          <Label text="Correct Answer" />

          <TextInput
            style={
              styles.input
            }
            value={
              question.correctAnswer ||
              ""
            }
            onChangeText={(
              value
            ) =>
              onChange(
                "correctAnswer",
                value
              )
            }
            placeholder="Enter the correct answer"
          />
        </View>
      )}

{type === "true_false" && (
  <View>
    <Label text="Correct Answer" />

    <View style={styles.optionRow}>
      {["true", "false"].map((answer) => (
        <TouchableOpacity
          key={answer}
          style={[
            styles.optionButton,
            question.correctAnswer === answer &&
              styles.optionButtonActive,
          ]}
          onPress={() =>
            onChange(
              "correctAnswer",
              answer
            )
          }
        >
          <Text
            style={[
              styles.optionButtonText,
              question.correctAnswer === answer &&
                styles.optionButtonTextActive,
            ]}
          >
            {answer === "true" ? "True" : "False"}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
)}

      {(type ===
        "short_answer" ||
        type ===
          "long_answer") && (
        <View>
          <Label text="Expected / Model Answer" />

          <TextInput
            style={[
              styles.input,
              type ===
                "long_answer" &&
                styles.textAreaSmall,
            ]}
            value={
              question.correctAnswer ||
              ""
            }
            onChangeText={(
              value
            ) =>
              onChange(
                "correctAnswer",
                value
              )
            }
            multiline={
              type ===
              "long_answer"
            }
            textAlignVertical="top"
            placeholder="Enter the expected answer or marking guidance"
          />
        </View>
      )}

      <Label text="Marks" />

      <TextInput
        style={styles.input}
        value={String(
          question.marks || 1
        )}
        onChangeText={(value) =>
          onChange(
            "marks",
            Number(
              value.replace(
                /[^0-9]/g,
                ""
              )
            )
          )
        }
        keyboardType="numeric"
      />
    </View>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fb",
  },

  scroll: {
    flex: 1,
  },

  contentContainer: {
    padding: 20,
    paddingBottom: 60,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f7fb",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#555",
  },

  header: {
    marginBottom: 20,
  },

  backButton: {
    alignSelf: "flex-start",
    marginBottom: 16,
    paddingVertical: 8,
  },

  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },

  pageTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#172033",
  },

  pageSubtitle: {
    marginTop: 6,
    fontSize: 15,
    color: "#667085",
    lineHeight: 22,
  },

  warningBox: {
    backgroundColor: "#fff4e5",
    borderWidth: 1,
    borderColor: "#f0c36d",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },

  warningTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#8a5a00",
    marginBottom: 6,
  },

  warningText: {
    color: "#74520b",
    lineHeight: 21,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },

  statCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 15,
    minWidth: 105,
    flexGrow: 1,
    borderWidth: 1,
    borderColor: "#e4e7ec",
  },

  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#172033",
  },

  statLabel: {
    marginTop: 3,
    color: "#667085",
    fontSize: 13,
  },

  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e4e7ec",
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#172033",
  },

  sectionSubtitle: {
    color: "#667085",
    marginTop: 5,
    marginBottom: 20,
    lineHeight: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#344054",
    marginBottom: 7,
    marginTop: 12,
  },

  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d0d5dd",
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 15,
    color: "#172033",
  },

  textArea: {
    minHeight: 120,
  },

  textAreaSmall: {
    minHeight: 80,
  },

  fixedPriceBox: {
    borderWidth: 1,
    borderColor: "#d0d5dd",
    backgroundColor: "#f8f9fc",
    borderRadius: 9,
    padding: 13,
  },

  fixedPriceText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#172033",
  },

  fixedPriceNote: {
    marginTop: 3,
    fontSize: 12,
    color: "#667085",
  },

  switchRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 15,
  },

  switchTextContainer: {
    flex: 1,
  },

  switchTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#172033",
  },

  switchSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: "#667085",
    lineHeight: 18,
  },

  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  optionButton: {
    borderWidth: 1,
    borderColor: "#d0d5dd",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#fff",
  },

  optionButtonActive: {
    backgroundColor: "#172033",
    borderColor: "#172033",
  },

  optionButtonText: {
    color: "#344054",
    fontWeight: "600",
  },

  optionButtonTextActive: {
    color: "#ffffff",
  },

  sectionHeadingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    gap: 15,
  },

  sectionHeadingText: {
    flex: 1,
  },

  mainSectionBlock: {
    marginBottom: 24,
  },

  mainSectionTitle: {
    fontSize: 23,
    fontWeight: "800",
    color: "#172033",
  },

  mainSectionSubtitle: {
    color: "#667085",
    marginTop: 5,
    lineHeight: 20,
  },

  addButton: {
    backgroundColor: "#172033",
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 9,
  },

  addButtonText: {
    color: "#ffffff",
    fontWeight: "800",
  },

  moduleCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d8dee8",
    padding: 18,
    marginBottom: 22,
  },

  moduleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    paddingBottom: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eaecf0",
  },

  moduleNumber: {
    fontSize: 11,
    fontWeight: "800",
    color: "#667085",
    letterSpacing: 1,
  },

  moduleHeading: {
    fontSize: 20,
    fontWeight: "800",
    color: "#172033",
    marginTop: 3,
  },

  deleteButton: {
    borderWidth: 1,
    borderColor: "#f04438",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },

  deleteButtonText: {
    color: "#d92d20",
    fontWeight: "700",
    fontSize: 12,
  },

  subsectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 12,
    gap: 15,
  },

  subsectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#172033",
  },

  subsectionSubtitle: {
    color: "#667085",
    fontSize: 13,
    marginTop: 3,
  },

  smallAddButton: {
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 8,
  },

  smallAddButtonText: {
    color: "#172033",
    fontWeight: "800",
    fontSize: 12,
  },

  lessonCard: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e4e7ec",
    borderRadius: 13,
    padding: 15,
    marginBottom: 15,
  },

  lessonHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },

  lessonNumber: {
    fontSize: 10,
    fontWeight: "800",
    color: "#667085",
    letterSpacing: 0.8,
  },

  lessonHeading: {
    fontSize: 17,
    fontWeight: "800",
    color: "#172033",
    marginTop: 3,
  },

  removeSmallButton: {
    borderWidth: 1,
    borderColor: "#fda29b",
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 7,
  },

  removeSmallButtonText: {
    color: "#b42318",
    fontSize: 11,
    fontWeight: "700",
  },

  materialSection: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e4e7ec",
    paddingTop: 17,
  },

  materialTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#172033",
  },

  materialSubtitle: {
    color: "#667085",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
    marginBottom: 12,
  },

  uploadDisabledBox: {
    backgroundColor: "#fff8eb",
    borderWidth: 1,
    borderColor: "#f5d08a",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },

  uploadDisabledText: {
    color: "#795600",
    fontSize: 12,
    lineHeight: 17,
  },

  uploadRow: {
    flexDirection: "row",
    gap: 10,
  },

  uploadButton: {
    flex: 1,
    backgroundColor: "#172033",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },

  uploadButtonText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 13,
  },

  buttonDisabled: {
    opacity: 0.55,
  },

  existingMaterials: {
    marginTop: 16,
  },

  existingMaterialsTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#344054",
    marginBottom: 8,
  },

  materialItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e7ec",
    borderRadius: 9,
    padding: 10,
    marginBottom: 7,
    gap: 10,
  },

  materialFileName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#172033",
  },

  materialMeta: {
    marginTop: 3,
    color: "#667085",
    fontSize: 11,
  },

  materialDeleteButton: {
    borderWidth: 1,
    borderColor: "#fda29b",
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },

  materialDeleteText: {
    color: "#b42318",
    fontSize: 11,
    fontWeight: "700",
  },

  noMaterialsText: {
    marginTop: 12,
    color: "#98a2b3",
    fontSize: 12,
    fontStyle: "italic",
  },

  videoSection: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e4e7ec",
    paddingTop: 17,
  },

  videoTypeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },

  videoTypeButton: {
    borderWidth: 1,
    borderColor: "#d0d5dd",
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 9,
    backgroundColor: "#ffffff",
  },

  videoTypeButtonActive: {
    backgroundColor: "#172033",
    borderColor: "#172033",
  },

  videoTypeText: {
    color: "#344054",
    fontSize: 12,
    fontWeight: "700",
  },

  videoTypeTextActive: {
    color: "#ffffff",
  },

  fullUploadButton: {
    backgroundColor: "#172033",
    borderRadius: 9,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 14,
  },

  fullUploadButtonText: {
    color: "#ffffff",
    fontWeight: "800",
  },

  currentVideoBox: {
    backgroundColor: "#eef2f6",
    borderRadius: 8,
    padding: 11,
    marginTop: 10,
  },

  currentVideoLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#667085",
  },

  currentVideoName: {
    marginTop: 4,
    color: "#172033",
    fontSize: 13,
    fontWeight: "600",
  },

  assignmentSection: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e4e7ec",
    paddingTop: 18,
  },

  assignmentTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#172033",
  },

  questionHeader: {
    marginTop: 20,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },

  questionHeaderTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#344054",
  },

  questionCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dfe3ea",
    borderRadius: 10,
    padding: 13,
    marginBottom: 12,
  },

  questionTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 3,
  },

  questionNumber: {
    fontSize: 14,
    fontWeight: "800",
    color: "#172033",
  },

  removeQuestionButton: {
    paddingHorizontal: 7,
    paddingVertical: 5,
  },

  removeQuestionText: {
    color: "#d92d20",
    fontSize: 11,
    fontWeight: "700",
  },

  questionTypeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  questionTypeButton: {
    borderWidth: 1,
    borderColor: "#d0d5dd",
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },

  questionTypeButtonActive: {
    backgroundColor: "#172033",
    borderColor: "#172033",
  },

  questionTypeText: {
    fontSize: 11,
    color: "#344054",
    fontWeight: "700",
  },

  questionTypeTextActive: {
    color: "#ffffff",
  },

  emptyQuestionsText: {
    color: "#98a2b3",
    fontStyle: "italic",
    fontSize: 12,
    marginTop: 8,
  },

  finalExamCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d8dee8",
    borderRadius: 15,
    padding: 18,
    marginTop: 15,
  },

  bottomActions: {
    marginTop: 5,
    gap: 10,
  },

  saveButton: {
    backgroundColor: "#172033",
    borderRadius: 11,
    paddingVertical: 15,
    alignItems: "center",
  },

  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },

  cancelButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d0d5dd",
    borderRadius: 11,
    paddingVertical: 14,
    alignItems: "center",
  },

  cancelButtonText: {
    color: "#344054",
    fontSize: 15,
    fontWeight: "700",
  },
});