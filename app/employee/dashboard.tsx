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

export default function EmployeeDashboard() {
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
        "EMPLOYEE DASHBOARD ERROR:",
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
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Employee Dashboard</Text>

      {/* ===================== */}
      {/* PROFILE STATUS */}
      {/* ===================== */}
      <View style={styles.card}>
        <Text style={styles.bold}>Profile Status</Text>

        <Text>
          Verification:
          {data.profile?.verifiedBadge
            ? " ✅ Verified"
            : " ❌ Not Verified"}
        </Text>

        <Text style={{ marginTop: 5 }}>
          Verification Fee:
          {data.profile?.hasPaidVerificationFee
            ? " ✅ Paid"
            : " ❌ Not Paid"}
        </Text>

        <Text style={{ marginTop: 5 }}>
          Profile Completion: {calculateProfileCompletion()}%
        </Text>

        {!data.profile?.verifiedBadge && (
          <View style={{ marginTop: 10 }}>
            <Button
              title="Upload Verification Documents"
              onPress={() =>
                router.push("/employee/upload-documents" as any)
              }
            />
          </View>
        )}

        {!data.profile?.hasPaidVerificationFee && (
          <View style={{ marginTop: 10 }}>
            <Button
              title="Pay Verification Fee"
              onPress={() =>
                router.push("/employee/pay-verification" as any)
              }
            />
          </View>
        )}
      </View>

      {/* ===================== */}
      {/* QUICK ACTIONS */}
      {/* ===================== */}
      <View style={styles.card}>
        <Text style={styles.bold}>Quick Actions</Text>

        <View style={{ marginTop: 10 }}>
          <Button
            title="Update Profile"
            onPress={() =>
              router.push("/employee/profile" as any)
            }
          />
        </View>

        <View style={{ marginTop: 10 }}>
          <Button
            title="Open Inbox"
            onPress={() =>
              router.push("/employee/inbox" as any)
            }
          />
        </View>

        <View style={{ marginTop: 10 }}>
          <Button
            title="Notifications"
            onPress={() =>
              router.push("/employee/notifications" as any)
            }
          />
        </View>
      </View>

      {/* ===================== */}
      {/* NOTIFICATIONS */}
      {/* ===================== */}
      <Text style={styles.section}>Notifications 🔔</Text>

      {data.notifications?.length > 0 ? (
        data.notifications.slice(0, 3).map((notification: any) => (
          <View key={notification._id} style={styles.card}>
            <Text style={styles.bold}>
              {notification.title}
            </Text>

            <Text>{notification.message}</Text>
          </View>
        ))
      ) : (
        <Text>No notifications yet</Text>
      )}

      {/* ===================== */}
      {/* RECENT MESSAGES */}
      {/* ===================== */}
      <Text style={styles.section}>Recent Messages 💬</Text>

      {data.messages?.length > 0 ? (
        data.messages.slice(0, 3).map((msg: any) => (
          <View key={msg._id} style={styles.card}>
            <Text style={styles.bold}>
              {msg.sender?.name}
            </Text>

            <Text>{msg.message}</Text>

            <View style={{ marginTop: 10 }}>
              <Button
                title="Open Chat"
                onPress={() =>
                  router.push({
                    pathname: "/employee/chat" as any,
                    params: {
                      userId: msg.sender?._id,
                      name: msg.sender?.name,
                    },
                  })
                }
              />
            </View>
          </View>
        ))
      ) : (
        <Text>No recent messages</Text>
      )}

      {/* ===================== */}
      {/* JOB RECOMMENDATIONS */}
      {/* ===================== */}
      <Text style={styles.section}>Recommended Jobs 🤖</Text>

      {data.jobs?.length > 0 ? (
        data.jobs.map((job: any) => (
          <View key={job._id} style={styles.card}>
            <Text style={styles.bold}>{job.title}</Text>

            <Text>{job.description}</Text>

            <Text>Province: {job.province}</Text>

            <Text>Type: {job.jobType}</Text>

            <Text>
              Match Score: {job.matchScore || 85}%
            </Text>

            <View style={{ marginTop: 10 }}>
              <Button
                title="View Job"
                onPress={() =>
                  router.push({
                    pathname: "/employee/job-details" as any,
                    params: { id: job._id },
                  })
                }
              />
            </View>
          </View>
        ))
      ) : (
        <Text>No job recommendations yet</Text>
      )}

      {/* ===================== */}
      {/* INVITATIONS */}
      {/* ===================== */}
      <Text style={styles.section}>Invitations 📨</Text>

      {data.invitations?.length > 0 ? (
        data.invitations.map((invite: any) => (
          <View key={invite._id} style={styles.card}>
            <Text style={styles.bold}>
              {invite.job?.title}
            </Text>

            <Text>
              Employer: {invite.employer?.name}
            </Text>

            <View style={{ marginTop: 10 }}>
              <Button
                title="Open Chat"
                onPress={() =>
                  router.push({
                    pathname: "/employee/chat" as any,
                    params: {
                      userId: invite.employer?._id,
                      name: invite.employer?.name,
                    },
                  })
                }
              />
            </View>
          </View>
        ))
      ) : (
        <Text>No invitations yet</Text>
      )}

      {/* ===================== */}
      {/* WORK HISTORY */}
      {/* ===================== */}
      <Text style={styles.section}>Work History 🧾</Text>

      {data.hires?.length > 0 ? (
        data.hires.map((hire: any) => (
          <View key={hire._id} style={styles.card}>
            <Text style={styles.bold}>
              {hire.job?.title}
            </Text>

            <Text>
              Employer: {hire.employer?.name}
            </Text>

            <Text>Status: {hire.status || "Active"}</Text>
          </View>
        ))
      ) : (
        <Text>No work history yet</Text>
      )}
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

  bold: {
    fontWeight: "bold",
  },
});