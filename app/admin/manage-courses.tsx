import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import API from "../../src/services/api";

const COURSE_PRICE = 1200;

/* =========================================================
   TYPES
========================================================= */

type Material = {
  _id?: string;
  filename?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
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
  duration?: number;
  order?: number;
  materials?: Material[];
  video?: Video;
};

type Question = {
  _id?: string;
  question?: string;
  type?: string;
  marks?: number;
};

type Assignment = {
  enabled?: boolean;
  title?: string;
  instructions?: string;
  passMark?: number;
  questions?: Question[];
};

type Module = {
  _id?: string;
  title?: string;
  description?: string;
  order?: number;
  lessons?: Lesson[];
  assignment?: Assignment;
};

type FinalExam = {
  enabled?: boolean;
  title?: string;
  instructions?: string;
  durationMinutes?: number;
  passMark?: number;
  questions?: Question[];
};

type Course = {
  _id: string;
  title: string;
  shortDescription?: string;
  description?: string;
  category?: string;
  level?: string;
  duration?: number;
  price?: number;
  published?: boolean;
  certificate?: boolean;
  passMark?: number;
  modules?: Module[];
  finalExam?: FinalExam;
  content?: Lesson[];
};

/* =========================================================
   HELPERS
========================================================= */

const getMaterialType = (material: Material) => {
  const mime = material.mimeType?.toLowerCase() || "";

  if (mime.includes("pdf")) {
    return "PDF";
  }

  if (mime.includes("audio")) {
    return "Audio";
  }

  return "File";
};

const getFileSize = (size?: number) => {
  if (!size) {
    return "";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

/* =========================================================
   GET MODULES
========================================================= */

const getModules = (course: Course): Module[] => {
  if (
    Array.isArray(course.modules) &&
    course.modules.length > 0
  ) {
    return course.modules;
  }

  /*
   * Backwards compatibility for older courses
   * using content[] instead of modules[].
   */
  if (
    Array.isArray(course.content) &&
    course.content.length > 0
  ) {
    return [
      {
        title: "Module 1",
        order: 1,
        description: "Legacy course structure",
        lessons: course.content,
        assignment: {
          enabled: false,
          questions: [],
        },
      },
    ];
  }

  return [];
};

/* =========================================================
   COURSE STATISTICS
========================================================= */

const getCourseStats = (course: Course) => {
  const modules = getModules(course);

  let lessons = 0;
  let materials = 0;
  let videos = 0;
  let assignments = 0;
  let questions = 0;

  modules.forEach((module) => {
    const moduleLessons = module.lessons || [];

    lessons += moduleLessons.length;

    if (module.assignment?.enabled) {
      assignments += 1;

      questions +=
        module.assignment.questions?.length || 0;
    }

    moduleLessons.forEach((lesson) => {
      materials += lesson.materials?.length || 0;

      if (
        lesson.video?.type === "upload" ||
        lesson.video?.type === "external"
      ) {
        videos += 1;
      }
    });
  });

  if (course.finalExam?.enabled) {
    questions += course.finalExam.questions?.length || 0;
  }

  return {
    modules: modules.length,
    lessons,
    materials,
    videos,
    assignments,
    questions,
    finalExam: Boolean(course.finalExam?.enabled),
  };
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function ManageCoursesScreen() {
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [expandedCourses, setExpandedCourses] =
    useState<Record<string, boolean>>({});

  const [expandedModules, setExpandedModules] =
    useState<Record<string, boolean>>({});

  const [actionLoading, setActionLoading] =
    useState<string | null>(null);

  /* =======================================================
     LOAD COURSES
  ======================================================= */

  const loadCourses = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      const response = await API.get("/courses", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;

      /*
       * Backend may return:
       *
       * [...]
       *
       * OR:
       *
       * { courses: [...] }
       */

      const courseList: Course[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.courses)
        ? data.courses
        : [];

      setCourses(courseList);
    } catch (error: any) {
      console.error(
        "LOAD COURSES ERROR:",
        error?.response?.data || error
      );

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to load courses.";

      Alert.alert("Error", message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* =======================================================
     LOAD WHEN SCREEN RECEIVES FOCUS
  ======================================================= */

  useFocusEffect(
    useCallback(() => {
      loadCourses();
    }, [])
  );

  /* =======================================================
     REFRESH
  ======================================================= */

  const onRefresh = () => {
    setRefreshing(true);
    loadCourses(false);
  };

  /* =======================================================
     EXPAND COURSE
  ======================================================= */

  const toggleCourse = (courseId: string) => {
    setExpandedCourses((previous) => ({
      ...previous,
      [courseId]: !previous[courseId],
    }));
  };

  /* =======================================================
     EXPAND MODULE
  ======================================================= */

  const toggleModule = (moduleId: string) => {
    setExpandedModules((previous) => ({
      ...previous,
      [moduleId]: !previous[moduleId],
    }));
  };

  /* =======================================================
     EDIT COURSE
  ======================================================= */

  const editCourse = (courseId: string) => {
    router.push({
      pathname: "/admin/edit-course",
      params: {
        id: courseId,
      },
    });
  };

  /* =======================================================
     DELETE COURSE
  ======================================================= */

  const deleteCourse = (course: Course) => {
    Alert.alert(
      "Delete Course?",
      `Are you sure you want to delete "${course.title}"? This action cannot be undone.`,
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
              setActionLoading(`delete-${course._id}`);

              const token =
                await AsyncStorage.getItem("token");

              if (!token) {
                throw new Error(
                  "Your session has expired. Please log in again."
                );
              }

              await API.delete(
                `/courses/${course._id}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              setCourses((previous) =>
                previous.filter(
                  (item) => item._id !== course._id
                )
              );

              Alert.alert(
                "Deleted",
                "The course has been deleted."
              );
            } catch (error: any) {
              console.error(
                "DELETE COURSE ERROR:",
                error?.response?.data || error
              );

              Alert.alert(
                "Delete Error",
                error?.response?.data?.message ||
                  error?.message ||
                  "Unable to delete course."
              );
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  /* =======================================================
     PUBLISH / UNPUBLISH
  ======================================================= */

  const togglePublished = async (course: Course) => {
    const newStatus = !course.published;

    try {
      setActionLoading(`publish-${course._id}`);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      const endpoint = newStatus
        ? "publish"
        : "unpublish";

      await API.put(
        `/courses/${course._id}/${endpoint}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCourses((previous) =>
        previous.map((item) =>
          item._id === course._id
            ? {
                ...item,
                published: newStatus,
              }
            : item
        )
      );

      Alert.alert(
        newStatus ? "Published" : "Unpublished",
        newStatus
          ? "The course is now visible to students."
          : "The course has been unpublished."
      );
    } catch (error: any) {
      console.error(
        "PUBLISH ERROR:",
        error?.response?.data || error
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to update course status."
      );
    } finally {
      setActionLoading(null);
    }
  };

  /* =======================================================
     CREATE COURSE
  ======================================================= */

  const createCourse = () => {
    router.push("/admin/create-course");
  };

  /* =======================================================
     RENDER LESSON
  ======================================================= */

  const renderLesson = (
    lesson: Lesson,
    lessonIndex: number
  ) => {
    const materials = lesson.materials || [];

    const hasVideo =
      lesson.video?.type === "upload" ||
      lesson.video?.type === "external";

    return (
      <View
        key={
          lesson._id ||
          `lesson-${lessonIndex}`
        }
        style={styles.lessonItem}
      >
        <View style={styles.lessonTop}>
          <View style={styles.lessonNumberCircle}>
            <Text style={styles.lessonNumberText}>
              {lessonIndex + 1}
            </Text>
          </View>

          <View style={styles.lessonMain}>
            <Text style={styles.lessonTitle}>
              {lesson.title || "Untitled Lesson"}
            </Text>

            {lesson.description ? (
              <Text
                style={styles.lessonDescription}
                numberOfLines={2}
              >
                {lesson.description}
              </Text>
            ) : null}

            <View style={styles.lessonMetaRow}>
              <Text style={styles.lessonMeta}>
                {lesson.duration || 0} min
              </Text>

              <Text style={styles.lessonMeta}>
                {materials.length}{" "}
                material
                {materials.length === 1
                  ? ""
                  : "s"}
              </Text>

              <Text style={styles.lessonMeta}>
                {hasVideo
                  ? "Video"
                  : "No video"}
              </Text>
            </View>
          </View>
        </View>

        {/* MATERIALS */}

        {materials.length > 0 && (
          <View style={styles.materialList}>
            <Text style={styles.materialListTitle}>
              Learning Materials
            </Text>

            {materials.map(
              (material, materialIndex) => (
                <View
                  key={
                    material._id ||
                    `${material.filename}-${materialIndex}`
                  }
                  style={styles.materialRow}
                >
                  <View style={styles.materialIcon}>
                    <Text style={styles.materialIconText}>
                      {getMaterialType(material) ===
                      "PDF"
                        ? "PDF"
                        : "♪"}
                    </Text>
                  </View>

                  <View style={styles.materialInfo}>
                    <Text
                      style={styles.materialName}
                      numberOfLines={2}
                    >
                      {material.originalName ||
                        material.filename ||
                        "Unnamed file"}
                    </Text>

                    <Text style={styles.materialMeta}>
                      {getMaterialType(material)}

                      {material.size
                        ? ` • ${getFileSize(
                            material.size
                          )}`
                        : ""}
                    </Text>
                  </View>
                </View>
              )
            )}
          </View>
        )}

        {/* VIDEO */}

        {hasVideo && (
          <View style={styles.videoSummary}>
            <Text style={styles.videoSummaryTitle}>
              Video
            </Text>

            <Text
              style={styles.videoSummaryText}
              numberOfLines={2}
            >
              {lesson.video?.type === "external"
                ? lesson.video?.title ||
                  lesson.video?.url ||
                  "External video"
                : lesson.video?.filename ||
                  "Uploaded video"}
            </Text>

            <Text style={styles.videoTypeLabel}>
              {lesson.video?.type === "external"
                ? "External link"
                : "Uploaded video"}
            </Text>
          </View>
        )}
      </View>
    );
  };

  /* =======================================================
     RENDER MODULE
  ======================================================= */

  const renderModule = (
    module: Module,
    moduleIndex: number
  ) => {
    const moduleId =
      module._id ||
      `module-${moduleIndex}`;

    const expanded = Boolean(
      expandedModules[moduleId]
    );

    const lessons = module.lessons || [];
    const assignment = module.assignment;

    return (
      <View
        key={moduleId}
        style={styles.moduleCard}
      >
        <TouchableOpacity
          style={styles.moduleHeader}
          onPress={() =>
            toggleModule(moduleId)
          }
          activeOpacity={0.7}
        >
          <View style={styles.moduleNumberBox}>
            <Text style={styles.moduleNumberText}>
              {moduleIndex + 1}
            </Text>
          </View>

          <View style={styles.moduleHeaderMain}>
            <Text style={styles.moduleTitle}>
              {module.title ||
                `Module ${moduleIndex + 1}`}
            </Text>

            <Text style={styles.moduleMeta}>
              {lessons.length} lesson
              {lessons.length === 1
                ? ""
                : "s"}

              {assignment?.enabled
                ? " • Assignment"
                : ""}
            </Text>
          </View>

          <Text style={styles.expandIcon}>
            {expanded ? "−" : "+"}
          </Text>
        </TouchableOpacity>

        {expanded && (
          <View style={styles.moduleContent}>
            {module.description ? (
              <Text style={styles.moduleDescription}>
                {module.description}
              </Text>
            ) : null}

            {/* LESSONS */}

            <Text style={styles.moduleContentTitle}>
              Lessons
            </Text>

            {lessons.length > 0 ? (
              lessons.map(
                (lesson, lessonIndex) =>
                  renderLesson(
                    lesson,
                    lessonIndex
                  )
              )
            ) : (
              <Text style={styles.emptyText}>
                No lessons in this module.
              </Text>
            )}

            {/* ASSIGNMENT */}

            {assignment?.enabled && (
              <View style={styles.assignmentSummary}>
                <View style={styles.assignmentHeader}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={styles.assignmentTitle}
                    >
                      {assignment.title ||
                        "Module Assignment"}
                    </Text>

                    <Text
                      style={styles.assignmentMeta}
                    >
                      {assignment.questions
                        ?.length || 0}{" "}
                      question
                      {(assignment.questions
                        ?.length || 0) === 1
                        ? ""
                        : "s"}{" "}
                      • Pass mark{" "}
                      {assignment.passMark || 80}
                      %
                    </Text>
                  </View>

                  <View
                    style={styles.assessmentBadge}
                  >
                    <Text
                      style={
                        styles.assessmentBadgeText
                      }
                    >
                      Assignment
                    </Text>
                  </View>
                </View>

                {assignment.instructions ? (
                  <Text
                    style={
                      styles.assignmentInstructions
                    }
                    numberOfLines={3}
                  >
                    {assignment.instructions}
                  </Text>
                ) : null}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Loading courses...
        </Text>
      </View>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.contentContainer
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
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

          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Text style={styles.pageTitle}>
                Manage Courses
              </Text>

              <Text style={styles.pageSubtitle}>
                View and manage your complete
                course structure.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.createButton}
              onPress={createCourse}
            >
              <Text
                style={styles.createButtonText}
              >
                + Create Course
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* =================================================
            COURSE COUNT
        ================================================= */}

        <View style={styles.countBar}>
          <Text style={styles.countText}>
            {courses.length} course
            {courses.length === 1
              ? ""
              : "s"}
          </Text>
        </View>

        {/* =================================================
            EMPTY STATE
        ================================================= */}

        {courses.length === 0 ? (
          <View style={styles.emptyCourses}>
            <Text
              style={styles.emptyCoursesTitle}
            >
              No courses yet
            </Text>

            <Text style={styles.emptyCoursesText}>
              Create your first course with
              modules, lessons, learning
              materials and assessments.
            </Text>

            <TouchableOpacity
              style={
                styles.emptyCreateButton
              }
              onPress={createCourse}
            >
              <Text
                style={
                  styles.emptyCreateButtonText
                }
              >
                Create First Course
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          courses.map((course) => {
            const stats =
              getCourseStats(course);

            const expanded = Boolean(
              expandedCourses[course._id]
            );

            const deleteLoading =
              actionLoading ===
              `delete-${course._id}`;

            const publishLoading =
              actionLoading ===
              `publish-${course._id}`;

            const modules =
              getModules(course);

            return (
              <View
                key={course._id}
                style={styles.courseCard}
              >
                {/* =========================================
                    COURSE HEADER
                ========================================= */}

                <TouchableOpacity
                  style={styles.courseHeader}
                  onPress={() =>
                    toggleCourse(
                      course._id
                    )
                  }
                  activeOpacity={0.7}
                >
                  <View
                    style={
                      styles.courseHeaderMain
                    }
                  >
                    <View
                      style={
                        styles.courseTitleRow
                      }
                    >
                      <Text
                        style={
                          styles.courseTitle
                        }
                      >
                        {course.title ||
                          "Untitled Course"}
                      </Text>

                      <View
                        style={[
                          styles.statusBadge,
                          course.published
                            ? styles.publishedBadge
                            : styles.draftBadge,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            course.published
                              ? styles.publishedText
                              : styles.draftText,
                          ]}
                        >
                          {course.published
                            ? "Published"
                            : "Draft"}
                        </Text>
                      </View>
                    </View>

                    {course.shortDescription ? (
                      <Text
                        style={
                          styles.courseDescription
                        }
                        numberOfLines={2}
                      >
                        {
                          course.shortDescription
                        }
                      </Text>
                    ) : null}

                    <View
                      style={
                        styles.courseMetaRow
                      }
                    >
                      <Text
                        style={
                          styles.courseMeta
                        }
                      >
                        {course.category ||
                          "General"}
                      </Text>

                      <Text
                        style={
                          styles.courseMeta
                        }
                      >
                        {course.level ||
                          "Beginner"}
                      </Text>

                      <Text
                        style={
                          styles.courseMeta
                        }
                      >
                        R
                        {COURSE_PRICE.toFixed(
                          2
                        )}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={
                      styles.courseExpandIcon
                    }
                  >
                    {expanded ? "−" : "+"}
                  </Text>
                </TouchableOpacity>

                {/* =========================================
                    COURSE STATISTICS
                ========================================= */}

                <View
                  style={
                    styles.courseStats
                  }
                >
                  <MiniStat
                    value={stats.modules}
                    label="Modules"
                  />

                  <MiniStat
                    value={stats.lessons}
                    label="Lessons"
                  />

                  <MiniStat
                    value={stats.materials}
                    label="Materials"
                  />

                  <MiniStat
                    value={stats.videos}
                    label="Videos"
                  />

                  <MiniStat
                    value={stats.assignments}
                    label="Assignments"
                  />

                  <MiniStat
                    value={
                      stats.finalExam
                        ? 1
                        : 0
                    }
                    label="Final Exam"
                  />
                </View>

                {/* =========================================
                    COURSE ACTIONS
                ========================================= */}

                <View
                  style={
                    styles.courseActions
                  }
                >
                  <TouchableOpacity
                    style={
                      styles.editButton
                    }
                    onPress={() =>
                      editCourse(
                        course._id
                      )
                    }
                  >
                    <Text
                      style={
                        styles.editButtonText
                      }
                    >
                      Edit Course
                    </Text>
                  </TouchableOpacity>

                  <View
                    style={
                      styles.publishControl
                    }
                  >
                    <Text
                      style={
                        styles.publishLabel
                      }
                    >
                      {course.published
                        ? "Published"
                        : "Draft"}
                    </Text>

                    {publishLoading ? (
                      <ActivityIndicator
                        size="small"
                      />
                    ) : (
                      <Switch
                        value={Boolean(
                          course.published
                        )}
                        onValueChange={() =>
                          togglePublished(
                            course
                          )
                        }
                      />
                    )}
                  </View>

                  <TouchableOpacity
                    style={
                      styles.deleteCourseButton
                    }
                    disabled={
                      deleteLoading
                    }
                    onPress={() =>
                      deleteCourse(
                        course
                      )
                    }
                  >
                    {deleteLoading ? (
                      <ActivityIndicator
                        size="small"
                      />
                    ) : (
                      <Text
                        style={
                          styles.deleteCourseText
                        }
                      >
                        Delete
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* =========================================
                    EXPANDED COURSE STRUCTURE
                ========================================= */}

                {expanded && (
                  <View
                    style={
                      styles.structureContainer
                    }
                  >
                    <View
                      style={
                        styles.structureHeader
                      }
                    >
                      <View
                        style={
                          styles.structureHeaderText
                        }
                      >
                        <Text
                          style={
                            styles.structureTitle
                          }
                        >
                          Course Structure
                        </Text>

                        <Text
                          style={
                            styles.structureSubtitle
                          }
                        >
                          Modules → Lessons →
                          Materials → Assessments
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={
                          styles.openEditorButton
                        }
                        onPress={() =>
                          editCourse(
                            course._id
                          )
                        }
                      >
                        <Text
                          style={
                            styles.openEditorText
                          }
                        >
                          Open Builder
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* MODULES */}

                    {modules.length > 0 ? (
                      modules.map(
                        (
                          module,
                          moduleIndex
                        ) =>
                          renderModule(
                            module,
                            moduleIndex
                          )
                      )
                    ) : (
                      <View
                        style={
                          styles.noStructureBox
                        }
                      >
                        <Text
                          style={
                            styles.noStructureText
                          }
                        >
                          This course has no
                          modules yet.
                        </Text>
                      </View>
                    )}

                    {/* =====================================
                        FINAL EXAM
                    ===================================== */}

                    <View
                      style={
                        styles.finalExamSummary
                      }
                    >
                      <View
                        style={
                          styles.finalExamHeader
                        }
                      >
                        <View
                          style={
                            styles.finalExamIcon
                          }
                        >
                          <Text
                            style={
                              styles.finalExamIconText
                            }
                          >
                            ✓
                          </Text>
                        </View>

                        <View
                          style={
                            styles.finalExamMain
                          }
                        >
                          <Text
                            style={
                              styles.finalExamTitle
                            }
                          >
                            {course.finalExam
                              ?.enabled
                              ? course.finalExam
                                  .title ||
                                "Final Examination"
                              : "Final Examination"}
                          </Text>

                          <Text
                            style={
                              styles.finalExamMeta
                            }
                          >
                            {course.finalExam
                              ?.enabled
                              ? `${
                                  course
                                    .finalExam
                                    .questions
                                    ?.length ||
                                  0
                                } questions • ${
                                  course
                                    .finalExam
                                    .durationMinutes ||
                                  60
                                } minutes • Pass ${
                                  course
                                    .finalExam
                                    .passMark ||
                                  80
                                }%`
                              : "Not enabled"}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.assessmentBadge,
                            !course.finalExam
                              ?.enabled &&
                              styles.disabledBadge,
                          ]}
                        >
                          <Text
                            style={[
                              styles.assessmentBadgeText,
                              !course.finalExam
                                ?.enabled &&
                                styles.disabledBadgeText,
                            ]}
                          >
                            {course.finalExam
                              ?.enabled
                              ? "Enabled"
                              : "Disabled"}
                          </Text>
                        </View>
                      </View>

                      {course.finalExam
                        ?.instructions ? (
                        <Text
                          style={
                            styles.finalExamInstructions
                          }
                          numberOfLines={3}
                        >
                          {
                            course.finalExam
                              .instructions
                          }
                        </Text>
                      ) : null}
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}

        <View style={{ height: 70 }} />
      </ScrollView>
    </View>
  );
}

/* =========================================================
   MINI STAT
========================================================= */

function MiniStat({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniStatValue}>
        {value}
      </Text>

      <Text style={styles.miniStatLabel}>
        {label}
      </Text>
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
    color: "#667085",
    fontSize: 15,
  },

  header: {
    marginBottom: 18,
  },

  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 7,
    marginBottom: 14,
  },

  backButtonText: {
    color: "#172033",
    fontWeight: "700",
    fontSize: 15,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },

  headerText: {
    flex: 1,
  },

  pageTitle: {
    fontSize: 29,
    fontWeight: "800",
    color: "#172033",
  },

  pageSubtitle: {
    marginTop: 5,
    color: "#667085",
    fontSize: 14,
    lineHeight: 20,
  },

  createButton: {
    backgroundColor: "#172033",
    borderRadius: 9,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },

  createButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },

  countBar: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e7ec",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },

  countText: {
    color: "#475467",
    fontWeight: "700",
    fontSize: 13,
  },

  emptyCourses: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e7ec",
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
    marginTop: 10,
  },

  emptyCoursesTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#172033",
  },

  emptyCoursesText: {
    textAlign: "center",
    color: "#667085",
    marginTop: 7,
    lineHeight: 20,
    maxWidth: 430,
  },

  emptyCreateButton: {
    marginTop: 18,
    backgroundColor: "#172033",
    paddingHorizontal: 17,
    paddingVertical: 12,
    borderRadius: 9,
  },

  emptyCreateButtonText: {
    color: "#ffffff",
    fontWeight: "800",
  },

  courseCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dfe3ea",
    marginBottom: 18,
    overflow: "hidden",
  },

  courseHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    gap: 12,
  },

  courseHeaderMain: {
    flex: 1,
  },

  courseTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 9,
  },

  courseTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#172033",
    flexShrink: 1,
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },

  publishedBadge: {
    backgroundColor: "#ecfdf3",
  },

  draftBadge: {
    backgroundColor: "#f2f4f7",
  },

  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },

  publishedText: {
    color: "#027a48",
  },

  draftText: {
    color: "#667085",
  },

  courseDescription: {
    color: "#667085",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 7,
  },

  courseMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 9,
  },

  courseMeta: {
    color: "#475467",
    fontSize: 12,
    fontWeight: "600",
  },

  courseExpandIcon: {
    fontSize: 25,
    fontWeight: "300",
    color: "#667085",
  },

  courseStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#eaecf0",
    paddingVertical: 11,
    paddingHorizontal: 10,
    gap: 5,
  },

  miniStat: {
    flex: 1,
    minWidth: 70,
    alignItems: "center",
    paddingHorizontal: 3,
  },

  miniStatValue: {
    fontSize: 17,
    fontWeight: "800",
    color: "#172033",
  },

  miniStatLabel: {
    fontSize: 9,
    color: "#667085",
    marginTop: 2,
    textAlign: "center",
  },

  courseActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 12,
  },

  editButton: {
    backgroundColor: "#172033",
    borderRadius: 8,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },

  editButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },

  publishControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flex: 1,
    justifyContent: "flex-end",
  },

  publishLabel: {
    fontSize: 11,
    color: "#667085",
    fontWeight: "600",
  },

  deleteCourseButton: {
    borderWidth: 1,
    borderColor: "#fda29b",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },

  deleteCourseText: {
    color: "#b42318",
    fontSize: 11,
    fontWeight: "700",
  },

  structureContainer: {
    borderTopWidth: 1,
    borderTopColor: "#eaecf0",
    backgroundColor: "#f8fafc",
    padding: 15,
  },

  structureHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 13,
  },

  structureHeaderText: {
    flex: 1,
  },

  structureTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#172033",
  },

  structureSubtitle: {
    marginTop: 3,
    color: "#667085",
    fontSize: 12,
  },

  openEditorButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d0d5dd",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  openEditorText: {
    color: "#344054",
    fontWeight: "700",
    fontSize: 11,
  },

  moduleCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e1e5eb",
    borderRadius: 11,
    marginBottom: 10,
    overflow: "hidden",
  },

  moduleHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 13,
    gap: 10,
  },

  moduleNumberBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#172033",
    alignItems: "center",
    justifyContent: "center",
  },

  moduleNumberText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 13,
  },

  moduleHeaderMain: {
    flex: 1,
  },

  moduleTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#172033",
  },

  moduleMeta: {
    color: "#667085",
    fontSize: 11,
    marginTop: 3,
  },

  expandIcon: {
    fontSize: 22,
    color: "#667085",
    fontWeight: "300",
  },

  moduleContent: {
    borderTopWidth: 1,
    borderTopColor: "#eaecf0",
    padding: 12,
  },

  moduleDescription: {
    color: "#667085",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 13,
  },

  moduleContentTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#344054",
    marginBottom: 8,
  },

  lessonItem: {
    borderWidth: 1,
    borderColor: "#e4e7ec",
    borderRadius: 9,
    backgroundColor: "#fbfcfe",
    padding: 11,
    marginBottom: 9,
  },

  lessonTop: {
    flexDirection: "row",
    gap: 10,
  },

  lessonNumberCircle: {
    width: 27,
    height: 27,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d0d5dd",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },

  lessonNumberText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#344054",
  },

  lessonMain: {
    flex: 1,
  },

  lessonTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#172033",
  },

  lessonDescription: {
    fontSize: 11,
    color: "#667085",
    lineHeight: 16,
    marginTop: 3,
  },

  lessonMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 6,
  },

  lessonMeta: {
    fontSize: 10,
    color: "#667085",
    fontWeight: "600",
  },

  materialList: {
    borderTopWidth: 1,
    borderTopColor: "#eaecf0",
    marginTop: 10,
    paddingTop: 9,
  },

  materialListTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475467",
    marginBottom: 6,
  },

  materialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 5,
  },

  materialIcon: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: "#eef2f6",
    alignItems: "center",
    justifyContent: "center",
  },

  materialIconText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#344054",
  },

  materialInfo: {
    flex: 1,
  },

  materialName: {
    fontSize: 11,
    color: "#344054",
    fontWeight: "600",
  },

  materialMeta: {
    fontSize: 9,
    color: "#98a2b3",
    marginTop: 2,
  },

  videoSummary: {
    borderTopWidth: 1,
    borderTopColor: "#eaecf0",
    marginTop: 9,
    paddingTop: 9,
  },

  videoSummaryTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475467",
  },

  videoSummaryText: {
    fontSize: 11,
    color: "#344054",
    fontWeight: "600",
    marginTop: 3,
  },

  videoTypeLabel: {
    fontSize: 9,
    color: "#98a2b3",
    marginTop: 2,
  },

  assignmentSummary: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#d9e1ec",
    borderRadius: 9,
    backgroundColor: "#f8fafc",
    padding: 11,
  },

  assignmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  assignmentTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#172033",
  },

  assignmentMeta: {
    fontSize: 10,
    color: "#667085",
    marginTop: 3,
  },

  assignmentInstructions: {
    marginTop: 8,
    color: "#667085",
    fontSize: 11,
    lineHeight: 16,
  },

  assessmentBadge: {
    backgroundColor: "#eef2ff",
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 6,
  },

  assessmentBadgeText: {
    color: "#344054",
    fontSize: 9,
    fontWeight: "800",
  },

  disabledBadge: {
    backgroundColor: "#f2f4f7",
  },

  disabledBadgeText: {
    color: "#98a2b3",
  },

  finalExamSummary: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d9e1ec",
    borderRadius: 11,
    padding: 13,
    marginTop: 3,
  },

  finalExamHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  finalExamIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#172033",
    alignItems: "center",
    justifyContent: "center",
  },

  finalExamIconText: {
    color: "#ffffff",
    fontWeight: "800",
  },

  finalExamMain: {
    flex: 1,
  },

  finalExamTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#172033",
  },

  finalExamMeta: {
    color: "#667085",
    fontSize: 10,
    marginTop: 3,
  },

  finalExamInstructions: {
    marginTop: 9,
    color: "#667085",
    fontSize: 11,
    lineHeight: 17,
  },

  noStructureBox: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e7ec",
    borderRadius: 9,
    padding: 15,
  },

  noStructureText: {
    color: "#98a2b3",
    fontSize: 12,
    fontStyle: "italic",
  },

  emptyText: {
    color: "#98a2b3",
    fontSize: 11,
    fontStyle: "italic",
    marginBottom: 8,
  },
});