import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useFocusEffect,
  useRouter,
} from "expo-router";
import {
  useCallback,
  useState,
} from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import DashboardButton from "../../components/DashboardButton";
import DashboardCard from "../../components/DashboardCard";
import DashboardHeader from "../../components/DashboardHeader";
import LogoutButton from "../../components/LogoutButton";
import SectionTitle from "../../components/SectionTitle";
import API from "../../src/services/api";

export default function CandidateDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchDashboard = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      API.defaults.headers.common["Authorization"] =
        `Bearer ${token}`;

      const res = await API.get("/dashboard");

      console.log(
        "CANDIDATE DASHBOARD DATA:",
        res.data
      );

      setData(res.data);

    } catch (err: any) {
      console.log(
        "CANDIDATE DASHBOARD ERROR:",
        err?.response?.data || err.message
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [])
  );

  // ==========================
  // LOADING
  // ==========================

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#2E7D32"
        />
      </View>
    );
  }

  // ==========================
  // FAILED TO LOAD
  // ==========================

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          Failed to load dashboard.
        </Text>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchDashboard}
        >
          <Text style={styles.actionButtonText}>
            Try Again
          </Text>
        </TouchableOpacity>

        <LogoutButton />
      </View>
    );
  }

  // ==========================
  // PROFILE
  // ==========================

  const profile = data?.profile;

  // ==========================
  // NO PROFILE YET
  // ==========================

  if (!profile) {
    return (
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <DashboardHeader
          title="Welcome 👋"
          subtitle="Professional Candidate Dashboard"
        />

        <DashboardCard title="Create Your Candidate Profile">
          <Text style={styles.info}>
            You haven't created your candidate profile yet.
          </Text>

          <Text style={styles.info}>
            Complete your profile so employers can discover
            your skills, experience, qualifications and
            availability.
          </Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              router.push("/profile-builder")
            }
          >
            <Text style={styles.actionButtonText}>
              👤 Create Candidate Profile
            </Text>
          </TouchableOpacity>
        </DashboardCard>

        <DashboardCard title="Verification">
          <Text style={styles.info}>
            After creating your profile, you can complete
            your verification documents and request your
            verification badge.
          </Text>

          <TouchableOpacity
            style={styles.verifyButton}
            onPress={() =>
              router.push("/verify")
            }
          >
            <Text style={styles.actionButtonText}>
              ✔ Go to Verification
            </Text>
          </TouchableOpacity>
        </DashboardCard>

        <SectionTitle title="Quick Actions" />

        <DashboardButton
          title="💳 Pay Verification"
          onPress={() =>
            router.push("/(candidate)/verification-info")
          }
        />

        <DashboardButton
          title="💬 Inbox"
          onPress={() =>
            router.push("/messaging/inbox")
          }
        />

        <DashboardButton
          title="🔔 Notifications"
          onPress={() =>
            router.push("/notifications")
          }
        />

        <View style={{ height: 40 }} />

        <LogoutButton />
      </ScrollView>
    );
  }

  // ==========================
  // PROFILE COMPLETION
  // ==========================

  const calculateProfileCompletion = () => {
    const checks = [
      !!profile?.profilePhoto,
      !!profile?.bio,
      profile?.workerTypes?.length > 0,
      profile?.skills?.length > 0,
      profile?.languages?.length > 0,
      profile?.yearsExperience >= 0,
      !!profile?.province,
      !!profile?.city,
      !!profile?.documents?.idDocument,
      !!profile?.documents?.cv,
      profile?.references?.length > 0,
      profile?.qualifications?.length > 0,
    ];

    const completed =
      checks.filter(Boolean).length;

    return Math.round(
      (completed / checks.length) * 100
    );
  };

  const profileCompletion =
    calculateProfileCompletion();

  // ==========================
  // NORMAL DASHBOARD
  // ==========================

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >

      {/* ============================= */}
      {/* HEADER */}
      {/* ============================= */}

      <DashboardHeader
        title={`Welcome ${
          profile?.firstName ||
          profile?.name?.split(" ")[0] ||
          "Candidate"
        } 👋`}
        subtitle="Professional Candidate Dashboard"
      />

      {/* ============================= */}
      {/* PROFILE SUMMARY */}
      {/* ============================= */}

      <DashboardCard title="Profile Completion">

        <Text style={styles.progressPercentage}>
          {profileCompletion}%
        </Text>

        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${profileCompletion}%`,
              },
            ]}
          />
        </View>

        <View style={styles.checkRow}>

          <Text style={styles.checkText}>
            {profile?.profilePhoto
              ? "✅"
              : "❌"}{" "}
            Profile Photo
          </Text>

          <Text style={styles.checkText}>
            {profile?.workerTypes?.length
              ? "✅"
              : "❌"}{" "}
            Profession
          </Text>

        </View>

        <View style={styles.checkRow}>

          <Text style={styles.checkText}>
            {profile?.yearsExperience >= 0
              ? "✅"
              : "❌"}{" "}
            Experience
          </Text>

          <Text style={styles.checkText}>
            {profile?.skills?.length
              ? "✅"
              : "❌"}{" "}
            Skills
          </Text>

        </View>

        <View style={styles.checkRow}>

          <Text style={styles.checkText}>
            {profile?.languages?.length
              ? "✅"
              : "❌"}{" "}
            Languages
          </Text>

          <Text style={styles.checkText}>
            {profile?.documents?.cv
              ? "✅"
              : "❌"}{" "}
            CV
          </Text>

        </View>

        <View style={styles.checkRow}>

          <Text style={styles.checkText}>
            {profile?.references?.length
              ? "✅"
              : "❌"}{" "}
            References
          </Text>

          <Text style={styles.checkText}>
            {profile?.qualifications?.length
              ? "✅"
              : "❌"}{" "}
            Qualifications
          </Text>

        </View>

        <View style={styles.checkRow}>

          <Text style={styles.checkText}>
            {profile?.documents?.idDocument
              ? "✅"
              : "❌"}{" "}
            ID
          </Text>

          <Text style={styles.checkText}>
            {profile?.profileVerified
              ? "✅ Verified"
              : "🟡 Verification Pending"}
          </Text>

        </View>

      </DashboardCard>

      {/* ============================= */}
      {/* QUICK ACTIONS */}
      {/* ============================= */}

      <SectionTitle title="Quick Actions" />

      <DashboardButton
        title={
          profile?.profileCompleted
            ? "✏ Edit Profile"
            : "👤 Complete Profile"
        }
        onPress={() =>
          router.push("/profile-builder")
        }
      />

      <DashboardButton
        title="✔ Verification"
        onPress={() =>
          router.push("/verify")
        }
      />

      <DashboardButton
        title="💳 Pay Verification"
        onPress={() =>
          router.push("/(candidate)/verification-info")
        }
      />

      <DashboardButton
        title="💬 Inbox"
        onPress={() =>
          router.push("/messaging/inbox")
        }
      />

      <DashboardButton
        title="🔔 Notifications"
        onPress={() =>
          router.push("/notifications")
        }
      />

      {/* ============================= */}
      {/* RECENT MESSAGES */}
      {/* ============================= */}

      <SectionTitle title="Recent Messages" />

      {data?.messages?.length ? (

        data.messages
          .slice(0, 3)
          .map((msg: any) => (

            <DashboardCard
              key={msg._id}
              title={
                msg.sender?.firstName ||
                msg.sender?.name ||
                "User"
              }
            >

              <Text style={styles.info}>
                {msg.message}
              </Text>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() =>
                  router.push({
                    pathname:
                      "/messaging/[userId]",
                    params: {
                      userId:
                        msg.sender?._id,
                      name:
                        msg.sender?.firstName ||
                        msg.sender?.name ||
                        "User",
                    },
                  })
                }
              >

                <Text
                  style={
                    styles.actionButtonText
                  }
                >
                  Open Conversation
                </Text>

              </TouchableOpacity>

            </DashboardCard>

          ))

      ) : (

        <DashboardCard title="Messages">

          <Text style={styles.emptyText}>
            No recent messages.
          </Text>

        </DashboardCard>

      )}

      {/* ============================= */}
      {/* NOTIFICATIONS */}
      {/* ============================= */}

      <SectionTitle title="Notifications" />

      {data?.notifications?.length ? (

        data.notifications
          .slice(0, 3)
          .map((notification: any) => (

            <DashboardCard
              key={notification._id}
              title={notification.title}
            >

              <Text style={styles.info}>
                {notification.message}
              </Text>

            </DashboardCard>

          ))

      ) : (

        <DashboardCard title="Notifications">

          <Text style={styles.emptyText}>
            No notifications.
          </Text>

        </DashboardCard>

      )}

      <View style={{ height: 40 }} />

      <LogoutButton />

    </ScrollView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    paddingHorizontal: 18,
    paddingTop: 20,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    padding: 20,
  },

  errorText: {
    fontSize: 16,
    color: "#D32F2F",
    marginBottom: 20,
    textAlign: "center",
  },

  info: {
    fontSize: 16,
    color: "#555",
    marginBottom: 12,
    lineHeight: 24,
  },

  actionButton: {
    backgroundColor: "#2E7D32",
    marginTop: 18,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  verifyButton: {
    backgroundColor: "#1976D2",
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  retryButton: {
    backgroundColor: "#2E7D32",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginBottom: 25,
  },

  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },

  progressPercentage: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#2E7D32",
    textAlign: "center",
    marginBottom: 15,
  },

  progressBarBackground: {
    height: 10,
    backgroundColor: "#E0E0E0",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 20,
  },

  progressBarFill: {
    height: 10,
    backgroundColor: "#2E7D32",
  },

  checkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  checkText: {
    fontSize: 15,
    color: "#444",
    flex: 1,
  },

  emptyText: {
    color: "#888",
    fontSize: 15,
    textAlign: "center",
    paddingVertical: 15,
  },

});