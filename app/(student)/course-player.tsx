import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import API from "../../src/services/api";

export default function CoursePlayer() {
  const router = useRouter();

  const { id } =
    useLocalSearchParams<{
      id: string;
    }>();

  const [loading, setLoading] =
    useState(true);

  const [course, setCourse] =
    useState<any>(null);

  const [progress, setProgress] =
    useState(0);

  const [completedLessons, setCompletedLessons] =
    useState<string[]>([]);

  const [certificateIssued, setCertificateIssued] =
    useState(false);

  // ============================================================
  // LOAD COURSE
  // ============================================================

  useEffect(() => {
    if (!id) return;

    loadCourse();
  }, [id]);

  const loadCourse = async () => {
    try {
      setLoading(true);

      const token =
        await AsyncStorage.getItem(
          "token"
        );

      if (!token) {
        Alert.alert(
          "Login Required",
          "Please log in again."
        );

        router.replace(
          "/login" as any
        );

        return;
      }

      API.defaults.headers.common.Authorization =
        `Bearer ${token}`;

      const res = await API.get(
        `/courses/${id}/content`
      );

      const courseData =
        res.data;

      setCourse(courseData);

      // ----------------------------------------------------------
      // SUPPORT DIFFERENT BACKEND RESPONSE SHAPES
      // ----------------------------------------------------------

      const enrollment =
        courseData.enrollment ||
        null;

      const completed =
        enrollment?.lessonsCompleted ||
        courseData.lessonsCompleted ||
        [];

      const completedIds =
        completed.map(
          (item: any) =>
            String(
              item?.lessonId ||
                item
            )
        );

      setCompletedLessons(
        completedIds
      );

      setCertificateIssued(
        Boolean(
          enrollment?.certificateIssued ||
            courseData.certificateIssued
        )
      );

      setProgress(
        Number(
          enrollment?.progress ??
            courseData.progress ??
            0
        )
      );
    } catch (err: any) {
      console.error(
        "COURSE PLAYER ERROR:",
        err
      );

      const status =
        err.response?.status;

      if (status === 403) {
        Alert.alert(
          "Course Access Required",
          err.response?.data?.message ||
            "You need to complete payment before accessing this course."
        );

        router.back();

        return;
      }

      Alert.alert(
        "Error",
        err.response?.data?.message ||
          "Unable to load course."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // MODULES
  // ============================================================

  const modules =
    course?.modules || [];

  // ============================================================
  // TOTAL LESSONS
  // ============================================================

  const totalLessons =
    useMemo(() => {
      if (modules.length > 0) {
        return modules.reduce(
          (
            total: number,
            module: any
          ) =>
            total +
            (module.lessons
              ?.length || 0),
          0
        );
      }

      return (
        course?.content?.length ||
        0
      );
    }, [course, modules]);

  // ============================================================
  // COURSE COMPLETION
  // ============================================================

  const courseCompleted =
    Boolean(
      course?.completed ||
        progress >= 100
    );

  // ============================================================
  // LESSON COMPLETED
  // ============================================================

  const isCompleted = (
    lesson: any
  ) => {
    return completedLessons.includes(
      String(lesson._id)
    );
  };

  // ============================================================
  // CHECK IF LESSON IS UNLOCKED
  // ============================================================

  const isLessonUnlocked = (
    moduleIndex: number,
    lessonIndex: number
  ) => {
    // First lesson of first module
    if (
      moduleIndex === 0 &&
      lessonIndex === 0
    ) {
      return true;
    }

    const currentModule =
      modules[moduleIndex];

    // ----------------------------------------------------------
    // PREVIOUS LESSON IN SAME MODULE
    // ----------------------------------------------------------

    if (lessonIndex > 0) {
      const previousLesson =
        currentModule?.lessons?.[
          lessonIndex - 1
        ];

      if (!previousLesson) {
        return true;
      }

      return isCompleted(
        previousLesson
      );
    }

    // ----------------------------------------------------------
    // FIRST LESSON OF MODULE
    // ----------------------------------------------------------

    if (moduleIndex > 0) {
      const previousModule =
        modules[
          moduleIndex - 1
        ];

      const previousLessons =
        previousModule?.lessons ||
        [];

      if (
        previousLessons.length ===
        0
      ) {
        return true;
      }

      const lastPreviousLesson =
        previousLessons[
          previousLessons.length - 1
        ];

      return isCompleted(
        lastPreviousLesson
      );
    }

    return true;
  };

  // ============================================================
  // OPEN LESSON
  // ============================================================

  const openLesson = (
    moduleIndex: number,
    lessonIndex: number
  ) => {
    const module =
      modules[moduleIndex];

    const lesson =
      module?.lessons?.[
        lessonIndex
      ];

    if (!lesson) return;

    if (
      !isLessonUnlocked(
        moduleIndex,
        lessonIndex
      )
    ) {
      Alert.alert(
        "Lesson Locked",
        "Complete the previous lesson before continuing."
      );

      return;
    }

    router.push({
      pathname:
        "/(student)/lesson-player",
      params: {
        courseId: String(
          course._id
        ),
        moduleIndex: String(
          moduleIndex
        ),
        lessonIndex: String(
          lessonIndex
        ),
      },
    } as any);
  };

  // ============================================================
  // OPEN ASSIGNMENT
  // ============================================================

  const openAssignment = (
    module: any,
    moduleIndex: number
  ) => {
    if (
      !module?.assignment
        ?.enabled
    ) {
      return;
    }

    const lessons =
      module.lessons || [];

    const allLessonsCompleted =
      lessons.every(
        (lesson: any) =>
          isCompleted(lesson)
      );

    if (!allLessonsCompleted) {
      Alert.alert(
        "Assignment Locked",
        "Please complete all lessons in this module before attempting the assignment."
      );

      return;
    }

    router.push({
      pathname:
        "/(student)/assignment",
      params: {
        courseId: String(
          course._id
        ),
        moduleId: String(
          module._id
        ),
        moduleIndex: String(
          moduleIndex
        ),
      },
    } as any);
  };

  // ============================================================
  // OPEN FINAL EXAM
  // ============================================================

  const openFinalExam = () => {
    if (
      !course?.finalExam
        ?.enabled
    ) {
      return;
    }

    if (progress < 100) {
      Alert.alert(
        "Final Examination Locked",
        "Please complete all course lessons before attempting the final examination."
      );

      return;
    }

    router.push({
      pathname:
        "/(student)/final-exam",
      params: {
        courseId: String(
          course._id
        ),
      },
    } as any);
  };

  // ============================================================
  // CERTIFICATE
  // ============================================================

  const openCertificate = () => {
    if (!courseCompleted) {
      Alert.alert(
        "Certificate",
        "Complete the course before accessing your certificate."
      );

      return;
    }

    router.push({
      pathname:
        "/(student)/certificate",
      params: {
        id: String(
          course._id
        ),
      },
    } as any);
  };

  // ============================================================
  // DOWNLOAD CERTIFICATE
  // ============================================================

  const downloadCertificate =
    async () => {
      try {
        const token =
          await AsyncStorage.getItem(
            "token"
          );

        API.defaults.headers.common.Authorization =
          `Bearer ${token}`;

        const response =
          await API.get(
            `/courses/${course._id}/download-certificate`
          );

        Alert.alert(
          "Certificate Ready",
          response.data
            ?.message ||
            "Certificate downloaded successfully."
        );
      } catch (err: any) {
        Alert.alert(
          "Certificate",
          err.response?.data
            ?.message ||
            "Unable to download certificate."
        );
      }
    };

  // ============================================================
  // LEGACY COURSE
  // ============================================================

  const legacyContent =
    course?.content || [];

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
          color="#E91E63"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading course...
        </Text>
      </View>
    );
  }

  // ============================================================
  // COURSE NOT FOUND
  // ============================================================

  if (!course) {
    return (
      <View
        style={
          styles.emptyContainer
        }
      >
        <Text
          style={
            styles.emptyTitle
          }
        >
          Course unavailable
        </Text>

        <Text
          style={
            styles.emptyText
          }
        >
          We couldn't load this
          course.
        </Text>

        <TouchableOpacity
          style={
            styles.primaryButton
          }
          onPress={() =>
            router.back()
          }
        >
          <Text
            style={
              styles.primaryButtonText
            }
          >
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.contentContainer
      }
      showsVerticalScrollIndicator={
        false
      }
    >
      {/* ======================================================
          HEADER
      ====================================================== */}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() =>
          router.back()
        }
      >
        <Text
          style={
            styles.backButtonText
          }
        >
          ‹ Back
        </Text>
      </TouchableOpacity>

      <Text style={styles.heading}>
        📚 {course.title}
      </Text>

      {course.description ? (
        <Text
          style={
            styles.description
          }
        >
          {course.description}
        </Text>
      ) : null}

      {/* ======================================================
          PROGRESS
      ====================================================== */}

      <View
        style={
          styles.progressCard
        }
      >
        <View
          style={
            styles.progressHeader
          }
        >
          <Text
            style={
              styles.progressTitle
            }
          >
            Course Progress
          </Text>

          <Text
            style={
              styles.progressPercentage
            }
          >
            {progress}%
          </Text>
        </View>

        <View
          style={
            styles.progressBackground
          }
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(
                  100,
                  Math.max(
                    0,
                    progress
                  )
                )}%`,
              },
            ]}
          />
        </View>

        <Text
          style={
            styles.progressText
          }
        >
          {completedLessons.length}{" "}
          of {totalLessons} lessons
          completed
        </Text>
      </View>

      {/* ======================================================
          COURSE INFO
      ====================================================== */}

      <View
        style={styles.infoCard}
      >
        <Text style={styles.info}>
          📚 Modules:{" "}
          {modules.length ||
            (legacyContent.length
              ? 1
              : 0)}
        </Text>

        <Text style={styles.info}>
          📖 Lessons:{" "}
          {totalLessons}
        </Text>

        {course.price !==
          undefined && (
          <Text
            style={styles.info}
          >
            💰 Course Fee: R
            {course.price}
          </Text>
        )}

        {courseCompleted && (
          <View
            style={
              styles.completedCourseBadge
            }
          >
            <Text
              style={
                styles.completedCourseText
              }
            >
              ✓ Course Completed
            </Text>
          </View>
        )}
      </View>

      {/* ======================================================
          NEW MODULE STRUCTURE
      ====================================================== */}

      {modules.length > 0 && (
        <>
          <Text
            style={styles.section}
          >
            Course Content
          </Text>

          {modules.map(
            (
              module: any,
              moduleIndex: number
            ) => {
              const lessons =
                module.lessons ||
                [];

              const completedCount =
                lessons.filter(
                  (
                    lesson: any
                  ) =>
                    isCompleted(
                      lesson
                    )
                ).length;

              const moduleComplete =
                lessons.length >
                  0 &&
                completedCount ===
                  lessons.length;

              const assignment =
                module.assignment;

              return (
                <View
                  key={
                    module._id ||
                    moduleIndex
                  }
                  style={
                    styles.moduleCard
                  }
                >
                  {/* MODULE HEADER */}

                  <View
                    style={
                      styles.moduleHeader
                    }
                  >
                    <View
                      style={
                        styles.moduleNumber
                      }
                    >
                      <Text
                        style={
                          styles.moduleNumberText
                        }
                      >
                        {moduleIndex +
                          1}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.moduleHeaderContent
                      }
                    >
                      <Text
                        style={
                          styles.moduleLabel
                        }
                      >
                        MODULE{" "}
                        {moduleIndex +
                          1}
                      </Text>

                      <Text
                        style={
                          styles.moduleTitle
                        }
                      >
                        {
                          module.title
                        }
                      </Text>

                      {module.description ? (
                        <Text
                          style={
                            styles.moduleDescription
                          }
                        >
                          {
                            module.description
                          }
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  {/* MODULE PROGRESS */}

                  <View
                    style={
                      styles.moduleProgressRow
                    }
                  >
                    <Text
                      style={
                        styles.moduleProgressText
                      }
                    >
                      {completedCount}{" "}
                      /{" "}
                      {
                        lessons.length
                      }{" "}
                      lessons
                    </Text>

                    {moduleComplete && (
                      <Text
                        style={
                          styles.moduleCompleteText
                        }
                      >
                        ✓ Complete
                      </Text>
                    )}
                  </View>

                  {/* LESSONS */}

                  {lessons.map(
                    (
                      lesson: any,
                      lessonIndex: number
                    ) => {
                      const completed =
                        isCompleted(
                          lesson
                        );

                      const unlocked =
                        isLessonUnlocked(
                          moduleIndex,
                          lessonIndex
                        );

                      const materialCount =
                        lesson
                          .materials
                          ?.length ||
                        0;

                      const hasVideo =
                        Boolean(
                          lesson.video
                            ?.filename ||
                            lesson.video
                              ?.url ||
                            lesson.videoUrl
                        );

                      return (
                        <TouchableOpacity
                          key={
                            lesson._id ||
                            lessonIndex
                          }
                          disabled={
                            !unlocked
                          }
                          style={[
                            styles.lessonCard,
                            !unlocked &&
                              styles.lockedLessonCard,
                          ]}
                          onPress={() =>
                            openLesson(
                              moduleIndex,
                              lessonIndex
                            )
                          }
                        >
                          <View
                            style={
                              styles.lessonIcon
                            }
                          >
                            <Text
                              style={
                                styles.lessonIconText
                              }
                            >
                              {completed
                                ? "✓"
                                : unlocked
                                ? "▶"
                                : "🔒"}
                            </Text>
                          </View>

                          <View
                            style={
                              styles.lessonContent
                            }
                          >
                            <Text
                              style={
                                styles.lessonNumber
                              }
                            >
                              LESSON{" "}
                              {lessonIndex +
                                1}
                            </Text>

                            <Text
                              style={
                                styles.lessonTitle
                              }
                            >
                              {
                                lesson.title
                              }
                            </Text>

                            {lesson.duration ? (
                              <Text
                                style={
                                  styles.lessonDuration
                                }
                              >
                                ⏱{" "}
                                {
                                  lesson.duration
                                }{" "}
                                min
                              </Text>
                            ) : null}

                            <View
                              style={
                                styles.lessonFeatures
                              }
                            >
                              {hasVideo && (
                                <Text
                                  style={
                                    styles.featureText
                                  }
                                >
                                  🎥 Video
                                </Text>
                              )}

                              {materialCount >
                                0 && (
                                <Text
                                  style={
                                    styles.featureText
                                  }
                                >
                                  📎{" "}
                                  {
                                    materialCount
                                  }{" "}
                                  material
                                  {materialCount !==
                                  1
                                    ? "s"
                                    : ""}
                                </Text>
                              )}
                            </View>

                            {!unlocked && (
                              <Text
                                style={
                                  styles.lockedText
                                }
                              >
                                Complete the
                                previous
                                lesson first.
                              </Text>
                            )}
                          </View>

                          <Text
                            style={
                              styles.lessonArrow
                            }
                          >
                            {unlocked
                              ? "›"
                              : "🔒"}
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                  )}

                  {/* MODULE ASSIGNMENT */}

                  {assignment?.enabled && (
                    <TouchableOpacity
                      style={[
                        styles.assignmentCard,
                        !moduleComplete &&
                          styles.lockedAssignment,
                      ]}
                      onPress={() =>
                        openAssignment(
                          module,
                          moduleIndex
                        )
                      }
                    >
                      <Text
                        style={
                          styles.assignmentIcon
                        }
                      >
                        📝
                      </Text>

                      <View
                        style={
                          styles.assignmentContent
                        }
                      >
                        <Text
                          style={
                            styles.assignmentLabel
                          }
                        >
                          MODULE ASSIGNMENT
                        </Text>

                        <Text
                          style={
                            styles.assignmentTitle
                          }
                        >
                          {assignment.title ||
                            "Module Assignment"}
                        </Text>

                        <Text
                          style={
                            styles.assignmentDetails
                          }
                        >
                          {assignment
                            .questions
                            ?.length ||
                            0}{" "}
                          questions
                          {typeof assignment.passMark ===
                          "number"
                            ? ` • Pass mark ${assignment.passMark}%`
                            : ""}
                        </Text>

                        {!moduleComplete && (
                          <Text
                            style={
                              styles.assignmentLockedText
                            }
                          >
                            Complete all
                            module lessons
                            first.
                          </Text>
                        )}
                      </View>

                      <Text
                        style={
                          styles.lessonArrow
                        }
                      >
                        {moduleComplete
                          ? "›"
                          : "🔒"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            }
          )}
        </>
      )}

      {/* ======================================================
          LEGACY CONTENT
      ====================================================== */}

      {modules.length === 0 &&
        legacyContent.length > 0 && (
          <>
            <Text
              style={styles.section}
            >
              Lessons
            </Text>

            {legacyContent.map(
              (
                lesson: any,
                index: number
              ) => {
                const completed =
                  isCompleted(
                    lesson
                  );

                const unlocked =
                  index === 0 ||
                  isCompleted(
                    legacyContent[
                      index - 1
                    ]
                  );

                return (
                  <TouchableOpacity
                    key={
                      lesson._id ||
                      index
                    }
                    disabled={
                      !unlocked
                    }
                    style={[
                      styles.lessonCard,
                      !unlocked &&
                        styles.lockedLessonCard,
                    ]}
                    onPress={() =>
                      router.push({
                        pathname:
                          "/(student)/lesson-player",
                        params: {
                          courseId:
                            course._id,
                          moduleIndex:
                            "0",
                          lessonIndex:
                            String(
                              index
                            ),
                        },
                      } as any)
                    }
                  >
                    <View
                      style={
                        styles.lessonIcon
                      }
                    >
                      <Text
                        style={
                          styles.lessonIconText
                        }
                      >
                        {completed
                          ? "✓"
                          : unlocked
                          ? "▶"
                          : "🔒"}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.lessonContent
                      }
                    >
                      <Text
                        style={
                          styles.lessonNumber
                        }
                      >
                        LESSON{" "}
                        {index + 1}
                      </Text>

                      <Text
                        style={
                          styles.lessonTitle
                        }
                      >
                        {
                          lesson.title
                        }
                      </Text>

                      {lesson.duration ? (
                        <Text
                          style={
                            styles.lessonDuration
                          }
                        >
                          ⏱{" "}
                          {
                            lesson.duration
                          }{" "}
                          min
                        </Text>
                      ) : null}

                      {!unlocked && (
                        <Text
                          style={
                            styles.lockedText
                          }
                        >
                          Complete the
                          previous lesson
                          first.
                        </Text>
                      )}
                    </View>

                    <Text
                      style={
                        styles.lessonArrow
                      }
                    >
                      {unlocked
                        ? "›"
                        : "🔒"}
                    </Text>
                  </TouchableOpacity>
                );
              }
            )}
          </>
        )}

      {/* ======================================================
          FINAL EXAM
      ====================================================== */}

      {course.finalExam
        ?.enabled && (
        <View
          style={
            styles.finalExamCard
          }
        >
          <Text
            style={
              styles.finalExamIcon
            }
          >
            🎓
          </Text>

          <Text
            style={
              styles.finalExamTitle
            }
          >
            Final Examination
          </Text>

          <Text
            style={
              styles.finalExamDescription
            }
          >
            Complete the final
            examination after
            completing your course
            lessons.
          </Text>

          <View
            style={
              styles.finalExamDetails
            }
          >
            <Text
              style={
                styles.examDetail
              }
            >
              Questions:{" "}
              {course.finalExam
                .questions
                ?.length || 0}
            </Text>

            {course.finalExam
              .durationMinutes ? (
              <Text
                style={
                  styles.examDetail
                }
              >
                Duration:{" "}
                {
                  course.finalExam
                    .durationMinutes
                }{" "}
                minutes
              </Text>
            ) : null}

            {typeof course
              .finalExam
              .passMark ===
              "number" && (
              <Text
                style={
                  styles.examDetail
                }
              >
                Pass mark:{" "}
                {
                  course.finalExam
                    .passMark
                }
                %
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.examButton,
              progress < 100 &&
                styles.disabledExamButton,
            ]}
            onPress={
              openFinalExam
            }
          >
            <Text
              style={
                styles.examButtonText
              }
            >
              {progress >= 100
                ? "Start Final Examination"
                : "Complete Lessons First"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ======================================================
          CERTIFICATE
      ====================================================== */}

      {courseCompleted && (
        <View
          style={
            styles.certificateCard
          }
        >
          <Text
            style={
              styles.certificateIcon
            }
          >
            🏆
          </Text>

          <Text
            style={
              styles.certificateTitle
            }
          >
            Congratulations!
          </Text>

          <Text
            style={
              styles.certificateDescription
            }
          >
            You have completed this
            course and are eligible
            for your certificate.
          </Text>

          <TouchableOpacity
            style={
              styles.certificateButton
            }
            onPress={
              openCertificate
            }
          >
            <Text
              style={
                styles.certificateButtonText
              }
            >
              View Certificate
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={
              styles.downloadButton
            }
            onPress={
              downloadCertificate
            }
          >
            <Text
              style={
                styles.downloadButtonText
              }
            >
              Download Certificate
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View
        style={
          styles.bottomSpace
        }
      />
    </ScrollView>
  );
}

// ================================================================
// STYLES
// ================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },

  contentContainer: {
    padding: 20,
    paddingBottom: 60,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 15,
  },

  emptyContainer: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },

  emptyTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#222",
    marginBottom: 10,
  },

  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 25,
  },

  primaryButton: {
    backgroundColor: "#E91E63",
    paddingHorizontal: 25,
    paddingVertical: 14,
    borderRadius: 12,
  },

  primaryButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },

  backButton: {
    marginBottom: 12,
  },

  backButtonText: {
    color: "#E91E63",
    fontSize: 16,
    fontWeight: "700",
  },

  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: "#E91E63",
    marginBottom: 10,
  },

  description: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
    marginBottom: 22,
  },

  // ------------------------------------------------------------
  // PROGRESS
  // ------------------------------------------------------------

  progressCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  progressTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },

  progressPercentage: {
    fontSize: 18,
    fontWeight: "800",
    color: "#E91E63",
  },

  progressBackground: {
    width: "100%",
    height: 14,
    backgroundColor: "#E5E5E5",
    borderRadius: 20,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 20,
  },

  progressText: {
    marginTop: 10,
    fontSize: 14,
    color: "#777",
  },

  // ------------------------------------------------------------
  // INFO
  // ------------------------------------------------------------

  infoCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 25,
    elevation: 2,
  },

  info: {
    fontSize: 15,
    color: "#444",
    marginBottom: 9,
  },

  completedCourseBadge: {
    backgroundColor: "#E8F5E9",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 8,
    alignSelf: "flex-start",
  },

  completedCourseText: {
    color: "#2E7D32",
    fontWeight: "800",
  },

  // ------------------------------------------------------------
  // SECTION
  // ------------------------------------------------------------

  section: {
    fontSize: 23,
    fontWeight: "800",
    color: "#222",
    marginBottom: 15,
  },

  // ------------------------------------------------------------
  // MODULE
  // ------------------------------------------------------------

  moduleCard: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    marginBottom: 20,
    padding: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  moduleHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },

  moduleNumber: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E91E63",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  moduleNumberText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "800",
  },

  moduleHeaderContent: {
    flex: 1,
  },

  moduleLabel: {
    color: "#E91E63",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 3,
  },

  moduleTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#222",
  },

  moduleDescription: {
    color: "#777",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },

  moduleProgressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#EEE",
    marginBottom: 10,
  },

  moduleProgressText: {
    fontSize: 12,
    color: "#777",
    fontWeight: "600",
  },

  moduleCompleteText: {
    color: "#2E7D32",
    fontSize: 12,
    fontWeight: "800",
  },

  // ------------------------------------------------------------
  // LESSON
  // ------------------------------------------------------------

  lessonCard: {
    backgroundColor: "#FAFAFA",
    borderRadius: 14,
    padding: 13,
    marginBottom: 9,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ECECEC",
  },

  lockedLessonCard: {
    opacity: 0.48,
  },

  lessonIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FDE8EF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  lessonIconText: {
    color: "#E91E63",
    fontSize: 16,
    fontWeight: "800",
  },

  lessonContent: {
    flex: 1,
  },

  lessonNumber: {
    color: "#999",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 3,
  },

  lessonTitle: {
    fontSize: 15,
    color: "#222",
    fontWeight: "700",
    marginBottom: 3,
  },

  lessonDuration: {
    color: "#888",
    fontSize: 12,
  },

  lessonFeatures: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
  },

  featureText: {
    fontSize: 11,
    color: "#777",
    marginRight: 10,
  },

  lockedText: {
    color: "#F44336",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 5,
  },

  lessonArrow: {
    color: "#999",
    fontSize: 25,
    marginLeft: 7,
  },

  // ------------------------------------------------------------
  // ASSIGNMENT
  // ------------------------------------------------------------

  assignmentCard: {
    backgroundColor: "#FFF8E1",
    borderRadius: 14,
    padding: 14,
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFE082",
  },

  lockedAssignment: {
    opacity: 0.55,
  },

  assignmentIcon: {
    fontSize: 28,
    marginRight: 12,
  },

  assignmentContent: {
    flex: 1,
  },

  assignmentLabel: {
    color: "#A56B00",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 3,
  },

  assignmentTitle: {
    color: "#333",
    fontSize: 15,
    fontWeight: "800",
  },

  assignmentDetails: {
    color: "#777",
    fontSize: 12,
    marginTop: 3,
  },

  assignmentLockedText: {
    color: "#F44336",
    fontSize: 11,
    marginTop: 4,
    fontWeight: "600",
  },

  // ------------------------------------------------------------
  // FINAL EXAM
  // ------------------------------------------------------------

  finalExamCard: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 22,
    marginTop: 10,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E91E63",
  },

  finalExamIcon: {
    fontSize: 42,
    marginBottom: 8,
  },

  finalExamTitle: {
    fontSize: 23,
    fontWeight: "800",
    color: "#222",
    marginBottom: 8,
  },

  finalExamDescription: {
    color: "#666",
    textAlign: "center",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 15,
  },

  finalExamDetails: {
    width: "100%",
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 14,
    marginBottom: 15,
  },

  examDetail: {
    color: "#555",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 5,
  },

  examButton: {
    width: "100%",
    backgroundColor: "#E91E63",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },

  disabledExamButton: {
    backgroundColor: "#BDBDBD",
  },

  examButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
  },

  // ------------------------------------------------------------
  // CERTIFICATE
  // ------------------------------------------------------------

  certificateCard: {
    backgroundColor: "#E8F5E9",
    borderRadius: 18,
    padding: 22,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#A5D6A7",
  },

  certificateIcon: {
    fontSize: 44,
    marginBottom: 8,
  },

  certificateTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#2E7D32",
    marginBottom: 8,
  },

  certificateDescription: {
    color: "#4B6650",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 16,
  },

  certificateButton: {
    width: "100%",
    backgroundColor: "#4CAF50",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 9,
  },

  certificateButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
  },

  downloadButton: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#4CAF50",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  downloadButtonText: {
    color: "#2E7D32",
    fontSize: 15,
    fontWeight: "700",
  },

  bottomSpace: {
    height: 30,
  },
});