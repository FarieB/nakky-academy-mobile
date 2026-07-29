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

export default function EmployerDashboard() {
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
      console.log("DASHBOARD ERROR:", err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // =====================
  // LOADING STATE
  // =====================
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // =====================
  // ERROR STATE
  // =====================
  if (!data) {
    return (
      <View style={styles.center}>
        <Text>Failed to load dashboard</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ============================== */}
      {/* HEADER */}
      {/* ============================== */}
      <DashboardHeader
        title={`Welcome ${
          data?.profile?.firstName ||
          data?.profile?.name?.split(" ")[0] ||
          "Employer"
        } 👋`}
        subtitle="Professional Employer Dashboard"
      />

      {/* ============================== */}
      {/* ACCOUNT SUMMARY */}
      {/* ============================== */}
      <SectionTitle title="Account Summary" />
      <DashboardCard title="Subscription">
        <Text style={styles.info}>
          Status:
          <Text
            style={[
              styles.value,
              {
                color:
                  data?.subscriptionStatus === "active"
                    ? "#2E7D32"
                    : "#D32F2F",
              },
            ]}
          >
            {" "}
            {data?.subscriptionStatus === "active" ? "Active" : "Inactive"}
          </Text>
        </Text>
        <Text style={styles.info}>
          Saved Candidates:
          <Text style={styles.value}>
            {" "}
            {data?.savedCandidates?.length || 0}
          </Text>
        </Text>
        <Text style={styles.info}>
          Recommended Candidates:
          <Text style={styles.value}>
            {" "}
            {data?.recommendations?.length || 0}
          </Text>
        </Text>
      </DashboardCard>

      {/* ============================== */}
      {/* QUICK ACTIONS */}
      {/* ============================== */}
      <SectionTitle title="Quick Actions" />
      <DashboardButton
        title="🔍 Search Candidates"
        onPress={() => router.push("/search-candidates")}
      />
      <DashboardButton
        title="❤ Saved Candidates"
        onPress={() => router.push("/saved-candidates")}
      />
      <DashboardButton
        title="⭐ Recommended Candidates"
        onPress={() => router.push("/recommended-candidates")}
      />
      <DashboardButton title="💬 Inbox" onPress={() => router.push("/messaging/inbox")} />
      <DashboardButton
        title="💳 Manage Subscription"
        onPress={() => router.push("/subscribe")}
      />

      {/* ============================== */}
      {/* RECENT MESSAGES */}
      {/* ============================== */}
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
              name: msg.sender?.firstName || msg.sender?.name,
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
          <Text>No recent conversations.</Text>
        </DashboardCard>
      )}

      {/* ============================== */}
      {/* RECOMMENDED CANDIDATES */}
      {/* ============================== */}
      <SectionTitle title="Recommended Candidates" />
      {data?.recommendations?.length ? (
        data.recommendations.slice(0, 5).map((candidate: any) => (
          <DashboardCard
            key={candidate._id}
            title={candidate.firstName || candidate.name}
          >
            <Text>Profession: {candidate.workerType}</Text>
            <Text>Experience: {candidate.yearsExperience} years</Text>
            <Text>Province: {candidate.province}</Text>
            <Text>Rating: ⭐ {candidate.averageRating || 0}</Text>
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
              <Text style={styles.actionButtonText}>View Candidate</Text>
            </TouchableOpacity>
          </DashboardCard>
        ))
      ) : (
        <DashboardCard title="Recommendations">
          <Text>No recommendations available yet.</Text>
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
    marginTop: 15,
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
    color: "#777",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  badgeActive: {
    color: "#2E7D32",
    fontWeight: "bold",
  },
  badgeInactive: {
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
    color: "#333",
    textAlign: "center",
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
    color: "#222",
    textAlign: "center",
    marginBottom: 8,
  },
  candidateInfo: {
    fontSize: 15,
    color: "#666",
    marginBottom: 5,
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    fontSize: 15,
    paddingVertical: 15,
  },
  sectionSpacing: {
    marginTop: 20,
  },
});

