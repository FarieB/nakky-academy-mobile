import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import useAdminGuard from "../../src/hooks/useAdminGuard";
import API from "../../src/services/api";
import { getSocket } from "../../src/socket/socket";

import AdminStatCard from "../../components/AdminStatCard";
import DashboardButton from "../../components/DashboardButton";
import DashboardCard from "../../components/DashboardCard";
import DashboardHeader from "../../components/DashboardHeader";
import LogoutButton from "../../components/LogoutButton";
import SectionTitle from "../../components/SectionTitle";

export default function AdminDashboard() {
  // 1. Run the admin security guard first
  const isAdminLoading = useAdminGuard();

  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // ==========================================
  // Reusable Dashboard Loader (Moved Above useEffect)
  // ==========================================
  const loadDashboard = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) return;

      API.defaults.headers.common.Authorization = `Bearer ${token}`;

      const res = await API.get("/dashboard");

      setData(res.data);
    } catch (err: any) {
      console.log(
        "ADMIN DASHBOARD ERROR:",
        err?.response?.data || err.message
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // Real-time Dashboard Socket Listener
  // ==========================================
  useEffect(() => {
    // If the admin guard is still determining security authorization, skip fetching
    if (isAdminLoading) return;

    loadDashboard();

    const socket = getSocket();

    if (!socket) return;

    socket.off("admin_dashboard_update");

    socket.on("admin_dashboard_update", () => {
      console.log("📊 Admin dashboard updating...");
      loadDashboard();
    });

    return () => {
      socket.off("admin_dashboard_update");
    };
  }, [isAdminLoading]); // Added dependency to re-run once security checks pass

  // 2. Block the UI entirely if the security check is active
  if (isAdminLoading) {
    return null;
  }

  // 3. Fallback to data loading spinner once security authorization passes
  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color="#E91E63"
        style={{ marginTop: 100 }}
      />
    );
  }

  return (
    <ScrollView style={styles.container}>

      <DashboardHeader
        title={`Welcome ${data?.profile?.name?.split(" ")[0] || "Admin"} 👋`}
        subtitle="Nakky Academy Control Centre"
      />

      {/* ===================== */}
      {/* PLATFORM OVERVIEW */}
      {/* ===================== */}

      <SectionTitle title="Platform Overview" />

      <View style={styles.row}>
        <AdminStatCard
          icon="👥"
          title="Users"
          value={`${data?.stats?.totalUsers ?? 0}`}
        />

        <AdminStatCard
          icon="📚"
          title="Courses"
          value={`${data?.stats?.totalCourses ?? 0}`}
        />
      </View>

      <View style={styles.row}>
       <AdminStatCard
        icon="🧑‍💼"
        title="Candidates"
        value={`${data?.stats?.totalCandidates ?? 0}`}
    /> 

        <AdminStatCard
          icon="💰"
          title="Revenue"
          value={`R${data?.stats?.revenue ?? 0}`}
        />
      </View>

      {/* ===================== */}
      {/* PENDING VERIFICATIONS */}
      {/* ===================== */}

      <SectionTitle title="Pending Verifications" />

      <DashboardCard title="Awaiting Approval">

        {data?.pendingVerifications?.length ? (

          data.pendingVerifications.map((user: any) => (

            <Text
              key={user._id}
              style={styles.item}
            >
              • {user.name}
            </Text>

          ))

        ) : (

          <Text>No pending verifications.</Text>

        )}

      </DashboardCard>

      {/* ===================== */}
      {/* COURSE MANAGEMENT */}
      {/* ===================== */}

      <SectionTitle title="Course Management" />

      <DashboardButton
        title="Create Course"
        onPress={() => router.push("/admin/create-course" as any)}
      />

      <DashboardButton
        title="Manage Courses"
        onPress={() =>
          router.push("/admin/manage-courses" as any)
        }
      /> 

      <DashboardButton
        title="Course Categories"
        onPress={() => router.push("/admin/course-categories" as any)}
      />

      {/* ===================== */}
      {/* USER MANAGEMENT */}
      {/* ===================== */}

      <SectionTitle title="User Management" />

      <DashboardButton
        title={`Students (${data?.stats?.totalStudents ?? 0})`}
        onPress={() => router.push("/admin/students" as any)}
      />

      <DashboardButton
       title={`Candidates (${data?.stats?.totalCandidates ?? 0})`}
        onPress={() => router.push("/admin/candidates" as any)} 
      />

      <DashboardButton
        title={`Employers (${data?.stats?.totalEmployers ?? 0})`}
        onPress={() => router.push("/admin/employers" as any)}
      />

      <DashboardButton
        title="Administrators"
        onPress={() => router.push("/admin/admins" as any)}
      />

      {/* ===================== */}
      {/* PAYMENTS */}
      {/* ===================== */}

      <SectionTitle title="Payments" />

      <DashboardButton
        title="Employer Subscriptions"
        onPress={() => router.push("/admin/subscriptions" as any)}
      />

      <DashboardButton
        title="Course Purchases"
        onPress={() => router.push("/admin/course-payments" as any)}
      />

      <DashboardButton
        title="Verification Fees"
        onPress={() => router.push("/admin/verification-payments" as any)}
      />

      {/* ===================== */}
      {/* QUICK ACTIONS */}
      {/* ===================== */}

      <SectionTitle title="Quick Actions" />

      <DashboardButton
        title="Approve Verifications"
        onPress={() => router.push("/admin/verifications" as any)}
      />

      <DashboardButton
        title="Publish Announcement"
        onPress={() => router.push("/admin/announcements" as any)}
      />

      <DashboardButton
        title="Platform Settings"
        onPress={() => router.push("/admin/settings" as any)}
      />

      <DashboardButton
        title="View Reports"
        onPress={() => router.push("/admin/reports" as any)}
      />

      {/* ===================== */}
      {/* RECENT USERS */}
      {/* ===================== */}

      <SectionTitle title="Recent Users" />

      <DashboardCard title="Newest Registrations">

        {data?.recentUsers?.length ? (

          data.recentUsers.map((user: any) => (

            <Text
              key={user._id}
              style={styles.item}
            >
              👤 {user.name} ({user.role})
            </Text>

          ))

        ) : (

          <Text>No recent users.</Text>

        )}

      </DashboardCard>

      {/* ===================== */}
      {/* RECENT ACTIVITY */}
      {/* ===================== */}

      <SectionTitle title="Platform Activity" />

      <DashboardCard title="Latest Activity">

        {data?.recentActivity?.length ? (

          data.recentActivity.map(
            (activity: any, index: number) => (

              <Text
                key={index}
                style={styles.item}
              >
                ✅ {activity.message}
              </Text>

            )
          )

        ) : (

          <Text>No activity yet.</Text>

        )}

      </DashboardCard>

      <LogoutButton />

    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    padding: 20,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },

  item: {
    fontSize: 16,
    marginBottom: 12,
  },
});
