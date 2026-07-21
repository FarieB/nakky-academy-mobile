import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";

import API from "../../src/services/api";

import AchievementCard from "../../components/AchievementCard";
import CourseCard from "../../components/CourseCard";
import DashboardButton from "../../components/DashboardButton";
import DashboardCard from "../../components/DashboardCard";
import DashboardHeader from "../../components/DashboardHeader";
import FeaturedCourse from "../../components/FeaturedCourse";
import NewsCard from "../../components/NewsCard";
import SectionTitle from "../../components/SectionTitle";

export default function StudentDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) return;

      API.defaults.headers.common.Authorization = `Bearer ${token}`;

      const res = await API.get("/dashboard");

      setData(res.data);
    } catch (err: any) {
      console.log(
        "STUDENT DASHBOARD ERROR:",
        err?.response?.data || err.message
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ActivityIndicator
        style={{ marginTop: 100 }}
        size="large"
        color="#E91E63"
      />
    );
  }

  const firstName =
    data?.profile?.name?.split(" ")[0] || "Student";

  const enrollments = data?.enrollments || [];

  const featuredCourse =
    enrollments.length > 0 ? enrollments[0] : null;

  return (
    <ScrollView style={styles.container}>

      <DashboardHeader
        title={`Welcome ${firstName} 👋`}
        subtitle="Continue building your caregiving career."
      />

      <FeaturedCourse
        title={
          featuredCourse?.course?.title ??
          "Advanced Elderly Care"
        }
        subtitle={
          featuredCourse?.course?.description ??
          "Learn professional caregiving skills that employers are looking for."
        }
        onPress={() =>
          router.push("/student/courses" as any)
        }
      />

      <DashboardCard
        title="Continue Learning"
        value={`${featuredCourse?.progress ?? 75}%`}
      >
        <Text style={styles.courseTitle}>
          {featuredCourse?.course?.title ??
            "Elderly Care Course"}
        </Text>

        <DashboardButton
          title="Continue Course"
          onPress={() =>
            router.push("/student/courses" as any)
          }
        />
      </DashboardCard>

      <SectionTitle title="My Courses" />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {enrollments.length > 0 ? (
          enrollments.map((item: any) => (
            <CourseCard
              key={item._id}
              title={item.course?.title}
              progress={item.progress}
              lessons={
                item.course?.content?.length || 0
              }
              onPress={() =>
                router.push("/student/courses" as any)
              }
            />
          ))
        ) : (
          <>
            <CourseCard
              title="Elderly Care"
              progress={75}
              lessons={24}
              onPress={() => {}}
            />

            <CourseCard
              title="Au Pair"
              progress={40}
              lessons={18}
              onPress={() => {}}
            />

            <CourseCard
              title="Child Care"
              progress={15}
              lessons={30}
              onPress={() => {}}
            />
          </>
        )}
      </ScrollView>

     
      {/* ========================= */}
      {/* Recommended Courses */}
      {/* ========================= */}

      <DashboardCard title="Recommended Courses">

        {data?.recommendedCourses?.length > 0 ? (

          data.recommendedCourses.map((course: any) => (

            <Text
              key={course._id}
              style={styles.listItem}
            >
              ❤️ {course.title}
            </Text>

          ))

        ) : (

          <>
            <Text style={styles.listItem}>
              ❤️ First Aid
            </Text>

            <Text style={styles.listItem}>
              🧠 Dementia Care
            </Text>

            <Text style={styles.listItem}>
              👶 Babysitting Essentials
            </Text>
          </>

        )}

      </DashboardCard>


      {/* ========================= */}
      {/* Certificates */}
      {/* ========================= */}

      <DashboardCard
        title="Certificates"
        value={`${data?.certificates?.length || 0}`}
      >

        <DashboardButton
          title="View Certificates"
          onPress={() => {}}
        />

      </DashboardCard>


      {/* ========================= */}
      {/* Learning Progress */}
      {/* ========================= */}

      <DashboardCard
        title="Learning Progress"
        value={`${featuredCourse?.progress ?? 68}%`}
      >

        <Text style={styles.listItem}>
          Completed Lessons{" "}
          {featuredCourse?.lessonsCompleted?.length || 0}
        </Text>

        <Text style={styles.listItem}>
          Courses Completed{" "}
          {data?.completedCourses || 0}
        </Text>

      </DashboardCard>


      {/* ========================= */}
      {/* Quick Actions */}
      {/* ========================= */}

      <SectionTitle title="Quick Actions" />

      <DashboardButton
        title="Browse Courses"
        onPress={() =>
          router.push("/student/courses" as any)
        }
      />

      <DashboardButton
        title="My Certificates"
        onPress={() => {}}
      />

      <DashboardButton
        title="Course Store"
        onPress={() => {}}
      />

      <DashboardButton
        title="Profile"
        onPress={() => {}}
      />


      {/* ========================= */}
      {/* Achievements */}
      {/* ========================= */}

      <SectionTitle title="Achievements" />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
      >

        <AchievementCard
          emoji="🏆"
          title="First Course"
        />

        <AchievementCard
          emoji="⭐"
          title="Fast Learner"
        />

        <AchievementCard
          emoji="🎖"
          title="Verified Student"
        />

        <AchievementCard
          emoji="🔥"
          title="7 Day Streak"
        />

      </ScrollView>


      {/* ========================= */}
      {/* Course Store */}
      {/* ========================= */}

      <DashboardCard title="Course Store">

        <DashboardButton
          title="Browse Courses"
          onPress={() =>
            router.push("/student/courses" as any)
          }
        />

      </DashboardCard>


      {/* ========================= */}
      {/* Latest News */}
      {/* ========================= */}

      <SectionTitle title="Latest News" />

      {data?.announcements?.length > 0 ? (

        data?.announcements?.map((item: any) => (

          <NewsCard
            key={item._id}
            title={item.title}
            description={item.message}
          />

        ))

      ) : (

        <>
          <NewsCard
            title="New Dementia Care Course"
            description="Our latest professional caregiving course is now available."
          />

          <NewsCard
            title="New Jobs Added"
            description="Employers have posted new caregiver opportunities near you."
          />
        </>

      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    padding: 20,
  },

  courseTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },

  listItem: {
    fontSize: 16,
    marginBottom: 10,
  },

}); 