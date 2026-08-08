import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
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

export default function EmployerDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [employerProfile, setEmployerProfile] = useState<any>(null);

  const fetchDashboard = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) return;

      API.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      const res = await API.get("/dashboard");

      setData(res.data);
    } catch (err: any) {
      console.log(
        "EMPLOYER DASHBOARD ERROR:",
        err?.response?.data || err.message
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployerProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) return;

      API.defaults.headers.common.Authorization = `Bearer ${token}`;

      const response = await API.get("/profiles/employer");

      console.log("EMPLOYER PROFILE LOADED:", response.data);

      setEmployerProfile(response.data);
    } catch (err: any) {
      console.log(
        "EMPLOYER PROFILE LOAD ERROR:",
        err?.response?.data || err.message
      );

      setEmployerProfile(null);
    }
  };

    useFocusEffect(
    useCallback(() => {
      fetchDashboard();
      fetchEmployerProfile();
    }, [])
  );

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
        <Text>Failed to load dashboard.</Text>
      </View>
    );
  }

  const subscriptionActive =
    data?.subscriptionStatus === "active";

  const recommended =
    data?.recommendedCandidates || [];

  const saved =
    data?.savedCandidates || [];

const savedCount =
    data?.stats?.savedCandidates ?? saved.length;

  const messages =
    data?.messages || [];

  const notifications =
    data?.notifications || [];

  return (

    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ========================================= */}
      {/* HEADER */}
      {/* ========================================= */}

     <DashboardHeader
        title={`Welcome ${
          employerProfile?.contactPerson ||
          "Employer"
        } 👋`}
        subtitle="Find trusted candidates for your home or business"
      /> 

      {/* ========================================= */}
      {/* SUBSCRIPTION WARNING */}
      {/* ========================================= */}

      {!subscriptionActive && (
        <DashboardCard title="Subscription Required">
          <Text style={styles.warningText}>
            Your subscription is currently inactive.
          </Text>

          <Text style={styles.info}>
            You can browse candidates but you cannot
            view contact details or send messages until
            your subscription has been activated.
          </Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/subscribe")}
          >
            <Text style={styles.actionButtonText}>
              Activate Subscription
            </Text>
          </TouchableOpacity>
        </DashboardCard>
      )}

      {/* ========================================= */}
      {/* ACCOUNT SUMMARY */}
      {/* ========================================= */}

      <SectionTitle title="Account Summary" />

      <DashboardCard title="Subscription">

        <Text style={styles.info}>
          Status:
          <Text
            style={[
              styles.value,
              {
                color: subscriptionActive
                  ? "#2E7D32"
                  : "#D32F2F",
              },
            ]}
          >
            {" "}
            {subscriptionActive ? "Active" : "Inactive"}
          </Text>
        </Text>

        <Text style={styles.info}>
          Saved Candidates:
          <Text style={styles.value}>
            {" "}
            {savedCount}
          </Text>
        </Text>

        <Text style={styles.info}>
          Recommended Candidates:
          <Text style={styles.value}>
            {" "}
            {recommended.length}
          </Text>
        </Text>

        <Text style={styles.info}>
          Notifications:
          <Text style={styles.value}>
            {" "}
            {notifications.length}
          </Text>
        </Text>

      </DashboardCard>

      {/* ========================================= */}
      {/* STATISTICS */}
      {/* ========================================= */}

      <SectionTitle title="Overview" />

      <View style={styles.statRow}>

        <View style={styles.statCard}>
          <Text style={styles.statTitle}>
            Saved
          </Text>

          <Text style={styles.statValue}>
            {saved.length}
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statTitle}>
            Recommended
          </Text>

          <Text style={styles.statValue}>
            {recommended.length}
          </Text>
        </View>

      </View>

      <View style={styles.statRow}>

        <View style={styles.statCard}>
          <Text style={styles.statTitle}>
            Messages
          </Text>

          <Text style={styles.statValue}>
            {messages.length}
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statTitle}>
            Subscription
          </Text>

          <Text
            style={[
              styles.statValue,
              {
                fontSize: 18,
                color: subscriptionActive
                  ? "#2E7D32"
                  : "#D32F2F",
              },
            ]}
          >
            {subscriptionActive ? "Active" : "Inactive"}
          </Text>
        </View>

      </View>

      {/* ========================================= */}
      {/* QUICK ACTIONS */}
      {/* ========================================= */}

      <SectionTitle title="Quick Actions" />

      <DashboardButton
        title="👤 Complete Employer Profile"
        onPress={() =>
          router.push("/employer-profile")
        }
      />

      <DashboardButton
        title="🔍 Search Candidates"
        onPress={() =>
          router.push("/search-candidates")
        }
      />

      <DashboardButton
        title="❤ Saved Candidates"
        onPress={() =>
          router.push("/saved-candidates")
        }
      />

      <DashboardButton
        title="⭐ Recommended Candidates"
        onPress={() =>
          router.push("/recommended-candidates")
        }
      />

      <DashboardButton
        title="💳 Manage Subscription"
        onPress={() =>
          router.push("/subscribe")
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

            {/* ========================================= */}
      {/* RECENT MESSAGES */}
      {/* ========================================= */}

      <SectionTitle title="Recent Messages" />

      {messages.length ? (
        messages.slice(0, 3).map((msg: any) => (
          <DashboardCard
            key={msg._id}
            title={msg.sender?.firstName || msg.sender?.name || "User"}
          >
            <Text style={styles.info}>
              {msg.message}
            </Text>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                router.push({
                  pathname: "/messaging/[userId]",
                  params: {
                    userId: msg.sender?._id,
                    name:
                      msg.sender?.firstName ||
                      msg.sender?.name ||
                      "User",
                  },
                })
              }
            >
              <Text style={styles.actionButtonText}>
                Open Conversation
              </Text>
            </TouchableOpacity>
          </DashboardCard>
        ))
      ) : (
        <DashboardCard title="Messages">
          <Text style={styles.emptyText}>
            No recent conversations.
          </Text>
        </DashboardCard>
      )}

      {/* ========================================= */}
      {/* NOTIFICATIONS */}
      {/* ========================================= */}

      <SectionTitle title="Notifications" />

      {notifications.length ? (
        notifications.slice(0, 3).map((notification: any) => (
          <DashboardCard
            key={notification._id}
            title={notification.title}
          >
            <Text>{notification.message}</Text>
          </DashboardCard>
        ))
      ) : (
        <DashboardCard title="Notifications">
          <Text style={styles.emptyText}>
            No notifications.
          </Text>
        </DashboardCard>
      )}

      {/* ========================================= */}
      {/* RECOMMENDED CANDIDATES */}
      {/* ========================================= */}

      <SectionTitle title="Recommended Candidates" />

      {recommended.length ? (
        recommended.slice(0, 5).map((candidate: any) => (
          <DashboardCard
            key={candidate._id}
            title={candidate.firstName}
          >
            <Text style={styles.info}>
              💼 {candidate.workerTypes?.join(", ") || "Not specified"}
            </Text>

            <Text style={styles.info}>
              📍 {candidate.city}, {candidate.province}
            </Text>

            <Text style={styles.info}>
              ⭐ {candidate.yearsExperience || 0} Years Experience
            </Text>

            <Text style={styles.info}>
              🌍 {candidate.languages?.join(", ") || "Not specified"}
            </Text>

            <Text style={styles.info}>
              💰 R{candidate.expectedSalary || 0}/month
            </Text>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                router.push({
                  pathname: "/candidate-details",
                  params: {
                    id: candidate._id,
                  },
                })
              }
            >
              <Text style={styles.actionButtonText}>
                View Profile
              </Text>
            </TouchableOpacity>

            {subscriptionActive ? (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    marginTop: 10,
                    backgroundColor: "#1976D2",
                  },
                ]}
                onPress={() =>
                  router.push({
                    pathname: "/messaging/[userId]",
                    params: {
                      userId: candidate.user,
                      name: candidate.firstName,
                    },
                  })
                }
              >
                <Text style={styles.actionButtonText}>
                  Contact Candidate
                </Text>
              </TouchableOpacity>
            ) : (
              <View
                style={{
                  marginTop: 12,
                  backgroundColor: "#FFF3CD",
                  padding: 12,
                  borderRadius: 10,
                }}
              >
                <Text
                  style={{
                    textAlign: "center",
                    color: "#856404",
                    fontWeight: "600",
                  }}
                >
                  🔒 Subscribe to view contact details
                </Text>
              </View>
            )}
          </DashboardCard>
        ))
      ) : (
        <DashboardCard title="Recommendations">
          <Text style={styles.emptyText}>
            No recommended candidates yet.
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
  },

  warningText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#D32F2F",
    marginBottom: 10,
  },

  info: {
    fontSize: 16,
    color: "#555",
    marginBottom: 10,
    lineHeight: 24,
  },

  value: {
    fontWeight: "bold",
    color: "#2E7D32",
  },

  actionButton: {
    marginTop: 15,
    backgroundColor: "#2E7D32",
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
    marginBottom: 5,
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
    alignItems: "center",
  },

  statTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
  },

  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E7D32",
    textAlign: "center",
  },

  badgeActive: {
    color: "#2E7D32",
    fontWeight: "bold",
  },

  badgeInactive: {
    color: "#D32F2F",
    fontWeight: "bold",
  },

  candidatePhoto: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignSelf: "center",
    marginBottom: 15,
  },

  candidateName: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    color: "#222",
    marginBottom: 10,
  },

  candidateInfo: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 6,
  },

  quickActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  quickActionCard: {
    width: "48%",
    backgroundColor: "#FFF",
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 10,
    alignItems: "center",
    marginBottom: 15,
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
    fontSize: 30,
    marginBottom: 8,
  },

  quickActionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },

  emptyText: {
    textAlign: "center",
    color: "#999",
    fontSize: 15,
    paddingVertical: 10,
  },

  sectionSpacing: {
    marginTop: 25,
  },
});