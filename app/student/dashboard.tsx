import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import API from "../../src/services/api";

import AchievementCard from "../../components/AchievementCard";
import CourseCard from "../../components/CourseCard";
import DashboardButton from "../../components/DashboardButton";
import DashboardCard from "../../components/DashboardCard";
import DashboardHeader from "../../components/DashboardHeader";
import FeaturedCourse from "../../components/FeaturedCourse";
import LogoutButton from "../../components/LogoutButton";
import NewsCard from "../../components/NewsCard";
import SectionTitle from "../../components/SectionTitle";

export default function StudentDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // ============================================================
  // LOAD DASHBOARD
  // ============================================================

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        router.replace("/login" as any);
        return;
      }

      API.defaults.headers.common.Authorization =
        `Bearer ${token}`;

      const res = await API.get("/dashboard");

      setData(res.data);
    } catch (err: any) {
      console.log(
        "STUDENT DASHBOARD ERROR:",
        err?.response?.data || err?.message
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // REFRESH WHEN DASHBOARD GETS FOCUS
  // ============================================================

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [])
  );

  // ============================================================
  // COUNT LESSONS IN NEW MODULE STRUCTURE
  // ============================================================

  const getLessonCount = (course: any) => {
    if (course?.modules?.length) {
      return course.modules.reduce(
        (total: number, module: any) =>
          total + (module.lessons?.length || 0),
        0
      );
    }

    // Legacy support
    return course?.content?.length || 0;
  };

  // ============================================================
  // COUNT MODULES
  // ============================================================

  const getModuleCount = (course: any) => {
    if (course?.modules?.length) {
      return course.modules.length;
    }

    return course?.content?.length ? 1 : 0;
  };

  // ============================================================
  // GET FIRST INCOMPLETE LESSON
  // ============================================================

  const getResumePosition = (enrollment: any) => {
    const course = enrollment?.course;

    if (!course) {
      return {
        moduleIndex: 0,
        lessonIndex: 0,
      };
    }

    const completedIds =
      enrollment?.lessonsCompleted?.map(
        (item: any) => String(item.lessonId)
      ) || [];

    // ----------------------------------------------------------
    // NEW MODULE STRUCTURE
    // ----------------------------------------------------------

    if (course.modules?.length) {
      for (
        let moduleIndex = 0;
        moduleIndex < course.modules.length;
        moduleIndex++
      ) {
        const lessons =
          course.modules[moduleIndex]?.lessons || [];

        for (
          let lessonIndex = 0;
          lessonIndex < lessons.length;
          lessonIndex++
        ) {
          const lesson = lessons[lessonIndex];

          if (
            !completedIds.includes(
              String(lesson._id)
            )
          ) {
            return {
              moduleIndex,
              lessonIndex,
            };
          }
        }
      }

      // Everything completed
      return {
        moduleIndex: 0,
        lessonIndex: 0,
      };
    }

    // ----------------------------------------------------------
    // LEGACY CONTENT STRUCTURE
    // ----------------------------------------------------------

    const content = course.content || [];

    for (
      let lessonIndex = 0;
      lessonIndex < content.length;
      lessonIndex++
    ) {
      if (
        !completedIds.includes(
          String(content[lessonIndex]._id)
        )
      ) {
        return {
          moduleIndex: 0,
          lessonIndex,
        };
      }
    }

    return {
      moduleIndex: 0,
      lessonIndex: 0,
    };
  };

  // ============================================================
  // OPEN COURSE
  // ============================================================

  const goToCourse = (enrollment?: any) => {
    const courseId =
      enrollment?.course?._id ||
      enrollment?.course;

    if (!courseId) {
      router.push("/student/courses" as any);
      return;
    }

    router.push({
      pathname: "/(student)/course-player",
      params: {
        id: String(courseId),
      },
    } as any);
  };

  // ============================================================
  // CONTINUE LEARNING
  // ============================================================

  const continueCourse = (enrollment: any) => {
    const courseId =
      enrollment?.course?._id ||
      enrollment?.course;

    if (!courseId) return;

    const position =
      getResumePosition(enrollment);

    router.push({
      pathname: "/(student)/lesson-player",
      params: {
        courseId: String(courseId),
        moduleIndex: String(
          position.moduleIndex
        ),
        lessonIndex: String(
          position.lessonIndex
        ),
      },
    } as any);
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#E91E63"
        />

        <Text style={styles.loadingText}>
          Loading your dashboard...
        </Text>
      </View>
    );
  }

  // ============================================================
  // DATA
  // ============================================================

  const firstName =
    data?.profile?.name?.split(" ")[0] ||
    "Student";

  const enrollments =
    data?.enrollments || [];

  const featuredCourse =
    enrollments.length > 0
      ? enrollments[0]
      : null;

  const completedCourses = Array.isArray(
  data?.completedCourses
)
  ? data.completedCourses.length
  : typeof data?.completedCourses === "number"
    ? data.completedCourses
    : data?.completedCourses &&
        typeof data.completedCourses === "object"
      ? 1
      : 0;

  // ============================================================
  // TOTAL PROGRESS
  // ============================================================

  const totalProgress =
    enrollments.length > 0
      ? Math.round(
          enrollments.reduce(
            (total: number, item: any) =>
              total +
              Number(item?.progress || 0),
            0
          ) / enrollments.length
        )
      : 0;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ======================================================
          HEADER
      ====================================================== */}

      <DashboardHeader
        title={`Welcome ${firstName} 👋`}
        subtitle="Continue building your caregiving career."
      />

      {/* ======================================================
          FEATURED COURSE
      ====================================================== */}

      {featuredCourse ? (
        <FeaturedCourse
          title={
            featuredCourse.course?.title ||
            "My Course"
          }
          subtitle={
            featuredCourse.course?.description ||
            "Continue building your caregiving career."
          }
          onPress={() =>
            goToCourse(featuredCourse)
          }
        />
      ) : (
        <FeaturedCourse
          title="Start Your First Course"
          subtitle="Browse our catalogue and enroll in a course to get started."
          onPress={() =>
            router.push(
              "/student/courses" as any
            )
          }
        />
      )}

      {/* ======================================================
          CONTINUE LEARNING
      ====================================================== */}

      {featuredCourse && (
        <DashboardCard
          title="Continue Learning"
          value={`${featuredCourse?.progress ?? 0}%`}
        >
          <Text style={styles.courseTitle}>
            {featuredCourse.course?.title}
          </Text>

          <Text style={styles.progressSummary}>
            {featuredCourse?.lessonsCompleted
              ?.length || 0}{" "}
            lessons completed
          </Text>

          <DashboardButton
            title="Continue Course"
            onPress={() =>
              continueCourse(
                featuredCourse
              )
            }
          />

          <TouchableOpacity
            style={styles.structureButton}
            onPress={() =>
              goToCourse(featuredCourse)
            }
          >
            <Text
              style={
                styles.structureButtonText
              }
            >
              View Course Structure
            </Text>
          </TouchableOpacity>
        </DashboardCard>
      )}

      {/* ======================================================
          MY COURSES
      ====================================================== */}

      <SectionTitle title="My Courses" />

      {enrollments.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {enrollments.map(
            (item: any) => {
              const course =
                item.course;

              const lessonCount =
                getLessonCount(course);

              const moduleCount =
                getModuleCount(course);

              return (
                <View
                  key={item._id}
                  style={styles.courseCardWrapper}
                >
                  <CourseCard
                    title={
                      course?.title ||
                      "Course"
                    }
                    progress={
                      item.progress || 0
                    }
                    lessons={
                      lessonCount
                    }
                    onPress={() =>
                      goToCourse(item)
                    }
                  />

                  <View
                    style={
                      styles.courseMeta
                    }
                  >
                    <Text
                      style={
                        styles.courseMetaText
                      }
                    >
                      📚 {moduleCount}{" "}
                      module
                      {moduleCount !== 1
                        ? "s"
                        : ""}
                    </Text>

                    {item.completed && (
                      <Text
                        style={
                          styles.completedCourseText
                        }
                      >
                        ✓ Completed
                      </Text>
                    )}
                  </View>
                </View>
              );
            }
          )}
        </ScrollView>
      ) : (
        <DashboardCard title="No Courses Yet">
          <Text style={styles.listItem}>
            You haven't enrolled in any
            courses yet.
          </Text>

          <DashboardButton
            title="Browse Courses"
            onPress={() =>
              router.push(
                "/student/courses" as any
              )
            }
          />
        </DashboardCard>
      )}

      {/* ======================================================
          OVERALL LEARNING PROGRESS
      ====================================================== */}

      {enrollments.length > 0 && (
        <DashboardCard
          title="Overall Learning Progress"
          value={`${totalProgress}%`}
        >
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
                      totalProgress
                    )
                  )}%`,
                },
              ]}
            />
          </View>

          <Text style={styles.progressDescription}>
            Keep going — you're making
            progress toward your course
            completion.
          </Text>
        </DashboardCard>
      )}

      {/* ======================================================
          RECOMMENDED COURSES
      ====================================================== */}

      <DashboardCard title="Recommended Courses">
        {data?.recommendedCourses
          ?.length > 0 ? (
          data.recommendedCourses.map(
            (course: any) => (
              <TouchableOpacity
                key={course._id}
                onPress={() =>
                  router.push({
                    pathname:
                      "/(student)/course-details",
                    params: {
                      id: course._id,
                    },
                  } as any)
                }
              >
                <Text
                  style={styles.listItem}
                >
                  ❤️ {course.title}
                </Text>
              </TouchableOpacity>
            )
          )
        ) : (
          <Text style={styles.listItem}>
            No recommendations yet —
            browse our courses to get
            started.
          </Text>
        )}
      </DashboardCard>

      {/* ======================================================
          CERTIFICATES
      ====================================================== */}

      <DashboardCard
        title="Certificates"
        value={`${data?.certificates?.length || 0}`}
      >
        <DashboardButton
          title="View Certificates"
          onPress={() =>
            router.push(
              "/student/certificates" as any
            )
          }
        />
      </DashboardCard>

      {/* ======================================================
          LEARNING PROGRESS
      ====================================================== */}

      <DashboardCard
        title="Learning Progress"
        value={`${featuredCourse?.progress ?? 0}%`}
      >
        <Text style={styles.listItem}>
          Completed Lessons{" "}
          {featuredCourse?.lessonsCompleted
            ?.length || 0}
        </Text>

        <Text style={styles.listItem}>
          Courses Completed{" "}
          {completedCourses}
        </Text>

        {featuredCourse && (
          <Text style={styles.listItem}>
            Total Lessons{" "}
            {getLessonCount(
              featuredCourse.course
            )}
          </Text>
        )}
      </DashboardCard>

      {/* ======================================================
          QUICK ACTIONS
      ====================================================== */}

      <SectionTitle title="Quick Actions" />

      <DashboardButton
        title="Browse Courses"
        onPress={() =>
          router.push(
            "/student/courses" as any
          )
        }
      />

      <DashboardButton
        title="My Certificates"
        onPress={() =>
          router.push(
            "/student/certificates" as any
          )
        }
      />

      <DashboardButton
        title="Course Store"
        onPress={() =>
          router.push(
            "/student/courses" as any
          )
        }
      />

      <DashboardButton
        title="Profile"
        onPress={() =>
          router.push(
            "/student/profile" as any
          )
        }
      />

      {/* ======================================================
          ACHIEVEMENTS
      ====================================================== */}

      <SectionTitle title="Achievements" />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        <AchievementCard
          key="ach-1"
          emoji="🏆"
          title="First Course"
        />

        <AchievementCard
          key="ach-2"
          emoji="⭐"
          title="Fast Learner"
        />

        <AchievementCard
          key="ach-3"
          emoji="🎖"
          title="Verified Student"
        />

        <AchievementCard
          key="ach-4"
          emoji="🔥"
          title="7 Day Streak"
        />
      </ScrollView>

      {/* ======================================================
          COURSE STORE
      ====================================================== */}

      <DashboardCard title="Course Store">
        <DashboardButton
          title="Browse Courses"
          onPress={() =>
            router.push(
              "/student/courses" as any
            )
          }
        />
      </DashboardCard>

      {/* ======================================================
          LATEST NEWS
      ====================================================== */}

      <SectionTitle title="Latest News" />

      {data?.announcements?.length >
      0 ? (
        data.announcements.map(
          (
            item: any,
            index: number
          ) => (
            <NewsCard
              key={
                item._id || index
              }
              title={item.title}
              description={
                item.message
              }
            />
          )
        )
      ) : (
        <Text style={styles.listItem}>
          No announcements yet.
        </Text>
      )}

      {/* ======================================================
          LOGOUT
      ====================================================== */}

      <LogoutButton />

      <View style={styles.bottomSpace} />
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
    padding: 20,
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

  courseTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },

  progressSummary: {
    color: "#777",
    fontSize: 14,
    marginBottom: 15,
  },

  structureButton: {
    borderWidth: 1,
    borderColor: "#E91E63",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
    marginTop: 10,
  },

  structureButtonText: {
    color: "#E91E63",
    fontSize: 14,
    fontWeight: "700",
  },

  courseCardWrapper: {
    marginRight: 12,
    marginBottom: 10,
  },

  courseMeta: {
    marginTop: -5,
    paddingHorizontal: 5,
  },

  courseMetaText: {
    color: "#777",
    fontSize: 12,
  },

  completedCourseText: {
    color: "#2E7D32",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },

  progressBackground: {
    width: "100%",
    height: 12,
    backgroundColor: "#E5E5E5",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 10,
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 20,
  },

  progressDescription: {
    color: "#777",
    fontSize: 14,
    lineHeight: 21,
  },

  listItem: {
    fontSize: 16,
    marginBottom: 10,
  },

  bottomSpace: {
    height: 40,
  },
});