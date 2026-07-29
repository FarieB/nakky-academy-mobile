import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import SectionTitle from "../../components/SectionTitle";
import API from "../../src/services/api";

export default function CandidateDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchDashboard = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      const res = await API.get("/dashboard");
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

  useEffect(() => {
    fetchDashboard();
  }, []);

  // ==========================
  // PROFILE COMPLETION
  // ==========================
  const calculateProfileCompletion = () => {
    if (!data?.profile) return 0;
    const fields = [
      data.profile.bio,
      data.profile.skills?.length,
      data.profile.yearsExperience,
      data.profile.workerType,
      data.profile.city,
      data.profile.province,
      data.profile.uploadedDocuments?.idDocument,
    ];
    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Text>Failed to load dashboard</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ============================= */}
      {/* HEADER */}
      {/* ============================= */}
      <DashboardHeader
        title={`Welcome ${
          data?.profile?.firstName ||
          data?.profile?.name?.split(" ")[0] ||
          "Candidate"
        } 👋`}
        subtitle="Professional Candidate Dashboard"
      />

      {/* ============================= */}
      {/* PROFILE SUMMARY */}
      {/* ============================= */}
    <DashboardCard title="Profile Completion">

  <Text style={styles.progressPercentage}>
    {calculateProfileCompletion()}%
  </Text>

  <View style={styles.progressBarBackground}>
    <View
      style={[
        styles.progressBarFill,
        {
          width: `${calculateProfileCompletion()}%`,
        },
      ]}
    />
  </View>

  <View style={styles.checkRow}>
    <Text style={styles.checkText}>
      {data?.profile?.profilePhoto ? "✅" : "❌"} Profile Photo
    </Text>

    <Text style={styles.checkText}>
      {data?.profile?.workerType ? "✅" : "❌"} Profession
    </Text>
  </View>

  <View style={styles.checkRow}>
    <Text style={styles.checkText}>
      {data?.profile?.yearsExperience ? "✅" : "❌"} Experience
    </Text>

    <Text style={styles.checkText}>
      {data?.profile?.skills?.length ? "✅" : "❌"} Skills
    </Text>
  </View>

  <View style={styles.checkRow}>
    <Text style={styles.checkText}>
      {data?.profile?.province ? "✅" : "❌"} Location
    </Text>

    <Text style={styles.checkText}>
      {data?.profile?.uploadedDocuments?.cv
        ? "✅"
        : "❌"} CV
    </Text>
  </View>

  <View style={styles.checkRow}>
    <Text style={styles.checkText}>
      {data?.profile?.uploadedDocuments?.references?.length
        ? "✅"
        : "❌"} References
    </Text>

    <Text style={styles.checkText}>
      {data?.profile?.verifiedBadge
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
        title="👤 Complete Profile"
        onPress={() => router.push("/profile-builder")}
      />
      <DashboardButton
        title="📄 Upload Documents"
        onPress={() => router.push("/upload-documents")}
      />
      <DashboardButton
        title="✔ Verification"
        onPress={() => router.push("/verify")}
      />
      <DashboardButton
        title="💳 Pay Verification"
        onPress={() => router.push("/pay-verification")}
      />
      <DashboardButton
        title="💬 Inbox"
        onPress={() => router.push("/messaging/inbox")}
      />
      <DashboardButton
        title="🔔 Notifications"
        onPress={() => router.push("/notifications")}
      />

      {/* ============================= */}
      {/* RECENT MESSAGES */}
      {/* ============================= */}
      <SectionTitle title="Recent Messages" />
      {data?.messages?.length ? (
        data.messages.slice(0, 3).map((msg: any) => (
          <DashboardCard
            key={msg._id}
            title={msg.sender?.firstName || msg.sender?.name}
          >
            <Text>{msg.message}</Text>
           <TouchableOpacity
                style={styles.actionButton}
                onPress={() =>
                  router.push({
                    pathname: "/messaging/" + msg.sender?._id,
                    params: {
                      name: msg.sender?.firstName || msg.sender?.name || "User",
                    },
                  })
                }
              >
                <Text style={styles.actionButtonText}>Open Conversation</Text>
              </TouchableOpacity>
 
          </DashboardCard>
        ))
      ) : (
        <DashboardCard title="Messages">
          <Text>No recent messages.</Text>
        </DashboardCard>
      )}

      {/* ============================= */}
      {/* RECENT NOTIFICATIONS */}
      {/* ============================= */}
      <SectionTitle title="Notifications" />
      {data?.notifications?.length ? (
        data.notifications.slice(0, 3).map((notification: any) => (
          <DashboardCard key={notification._id} title={notification.title}>
            <Text>{notification.message}</Text>
          </DashboardCard>
        ))
      ) : (
        <DashboardCard title="Notifications">
          <Text>No notifications.</Text>
        </DashboardCard>
      )}

      <View style={{ height: 40 }} />
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
  },
  info: {
    fontSize: 16,
    color: "#555",
    marginBottom: 12,
    lineHeight: 24,
  },
  value: {
    fontWeight: "bold",
    color: "#2E7D32",
  },
  actionButton: {
    backgroundColor: "#2E7D32",
    marginTop: 18,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 18,
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 3,
  },
  statTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  badgeVerified: {
    color: "#2E7D32",
    fontWeight: "bold",
  },
  badgePending: {
    color: "#FB8C00",
    fontWeight: "bold",
  },
  badgeOutstanding: {
    color: "#D32F2F",
    fontWeight: "bold",
  },
  quickActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginTop: 10,
  },
  quickActionCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 22,
    paddingHorizontal: 15,
    marginBottom: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 3,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    color: "#333",
  },
  emptyText: {
    color: "#888",
    fontSize: 15,
    textAlign: "center",
    paddingVertical: 15,
  },
  sectionSpacing: {
    marginTop: 20,
  },
});