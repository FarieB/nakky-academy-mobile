import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
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
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Employer Dashboard</Text>

      {/* ===================== */}
      {/* SUBSCRIPTION STATUS */}
      {/* ===================== */}
      <View style={styles.card}>
        <Text style={styles.bold}>Subscription Status</Text>
        <Text>
          {data.subscriptionStatus === "active"
            ? "✅ Active"
            : "❌ Inactive"}
        </Text>

        {data.subscriptionStatus !== "active" && (
          <View style={{ marginTop: 10 }}>
            <Button
              title="Subscribe Now"
              onPress={() => router.push("/employer/subscribe" as any)}
            />
          </View>
        )}
      </View>

      {/* ===================== */}
      {/* ACTIONS */}
      {/* ===================== */}

            <View style={{ marginBottom: 20 }}>
        <Button
          title="Open Inbox"
          onPress={() => router.push("/employer/inbox" as any)}
        />
      </View>
      
      <View style={styles.card}>
        <Button
          title="Post Job"
          onPress={() => router.push("/employer/post-job" as any)}
        />

        <View style={{ marginTop: 10 }}>
          <Button
            title="Search Candidates"
            onPress={() =>
              router.push("/employer/search-candidates" as any)
              
            }
          />
          <Button
            title="Match Candidates"
             onPress={() => router.push("/employer/job-matches" as any)}
          />
          <Button
            title="Messages"
             onPress={() => router.push("/employer/messages" as any)}
          />
        </View>

          <View style={{ marginTop: 10 }}>
            <Button
              title="Notifications"
              onPress={() =>
                router.push("/notifications" as any)
              }
            />
          </View>

      </View>

      {/* ===================== */}
      {/* STATS */}
      {/* ===================== */}
      <View style={styles.card}>
        <Text>Total Jobs: {data.stats.totalJobs}</Text>
        <Text>Invitations: {data.stats.totalInvitations}</Text>
        <Text>Hires: {data.stats.totalHires}</Text>
        <Text>Messages: {data.stats.totalMessages}</Text>
      </View>

      {/* ===================== */}
      {/* JOBS */}
      {/* ===================== */}
    <Text style={styles.section}>Your Jobs</Text>

            {data.jobs.map((job: any) => (
  <View key={job._id} style={styles.card}>
    <Text style={styles.bold}>{job.title}</Text>
    <Text>{job.description}</Text>

    <View style={{ marginTop: 10 }}>
      <Button
        title="View Matches"
        onPress={() =>
          router.push({
            pathname: "/employer/job-matches" as any,
            params: { jobId: job._id },
          })
        }
      />
    </View>
  </View>
))}

      {/* ===================== */}
      {/* RECOMMENDATIONS */}
      {/* ===================== */}
      <Text style={styles.section}>Recommended Candidates 🤖</Text>

      {data.recommendations && data.recommendations.length > 0 ? (
        data.recommendations.map((rec: any, index: number) => (
          <View key={index} style={styles.card}>
            <Text style={styles.bold}>Job ID: {rec.job}</Text>

            {rec.topCandidates.length === 0 ? (
              <Text>No recommendations found</Text>
            ) : (
              rec.topCandidates.map((item: any, i: number) => (
                <View key={i} style={styles.innerCard}>
                  <Text style={styles.bold}>
                    {item.candidate?.name}
                  </Text>

                  <Text>
                    Type: {item.candidate?.workerType}
                  </Text>

                  <Text>
                    Experience: {item.candidate?.yearsExperience} yrs
                  </Text>

                  <Text>
                    Rating: ⭐ {item.candidate?.averageRating || 0}
                  </Text>

                  <Text>Score: {item.score}</Text>
                </View>
              ))
            )}
          </View>
        ))
      ) : (
        <Text>No AI recommendations yet</Text>
      )}

      {/* ===================== */}
      {/* HIRES */}
      {/* ===================== */}
      <Text style={styles.section}>Hired Candidates</Text>
      {data.hires.map((hire: any) => (
        <View key={hire._id} style={styles.card}>
          <Text style={styles.bold}>{hire.candidate?.name}</Text>
          <Text>{hire.job?.title}</Text>
        </View>
      ))}

      {/* ===================== */}
      {/* MESSAGES */}
      {/* ===================== */}
      <Text style={styles.section}>Recent Messages</Text>
      {data.messages.slice(0, 5).map((msg: any) => (
        <View key={msg._id} style={styles.card}>
          <Text style={styles.bold}>{msg.sender?.name}</Text>
          <Text>{msg.message}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  section: {
    fontSize: 18,
    marginTop: 20,
    marginBottom: 10,
    fontWeight: "600",
  },
  card: {
    padding: 15,
    backgroundColor: "#f2f2f2",
    marginBottom: 10,
    borderRadius: 8,
  },
  innerCard: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#ffffff",
    borderRadius: 6,
  },
  bold: {
    fontWeight: "bold",
  },
});