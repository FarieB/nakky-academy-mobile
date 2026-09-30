import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import useAdminGuard from "../../src/hooks/useAdminGuard";
import API from "../../src/services/api";

interface Student {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  profilePhoto?: string;

  role?: string;

  accountStatus?: "active" | "inactive";

  subscriptionStatus?: string;
  subscriptionExpiry?: string;
  currentSubscription?: string;

  isVerified?: boolean;
  verifiedBadge?: boolean;
  verificationStatus?: string;

  createdAt?: string;
  lastLogin?: string;
  lastSeen?: string;

  uploadedDocuments?: {
    idDocument?: string;
    policeClearance?: string;
    references?: string[];
    qualifications?: string[];
  };
}

export default function StudentsScreen() {
  const isAdminLoading = useAdminGuard();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedStudent, setSelectedStudent] =
    useState<Student | null>(null);

  const [processingId, setProcessingId] =
    useState<string | null>(null);

  // =====================================================
  // LOAD STUDENTS
  // =====================================================

  const loadStudents = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await API.get("/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const allUsers: Student[] = Array.isArray(response.data)
        ? response.data
        : response.data?.users || [];

      // Only students belong on this screen.
      const studentUsers = allUsers.filter(
        (user) => user.role === "student"
      );

      // Newest registrations first.
      studentUsers.sort((a, b) => {
        const dateA = a.createdAt
          ? new Date(a.createdAt).getTime()
          : 0;

        const dateB = b.createdAt
          ? new Date(b.createdAt).getTime()
          : 0;

        return dateB - dateA;
      });

      setStudents(studentUsers);
    } catch (error: any) {
      console.error(
        "ADMIN STUDENTS ERROR:",
        error?.response?.data || error
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load students."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    if (!isAdminLoading) {
      loadStudents();
    }
  }, [isAdminLoading]);

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStudents();
  };

  // =====================================================
  // ACTIVATE / DEACTIVATE STUDENT
  // =====================================================

  const toggleStudentStatus = (student: Student) => {
    const active = student.accountStatus !== "inactive";

    Alert.alert(
      active ? "Deactivate Student" : "Activate Student",
      active
        ? `Deactivate ${
            student.name || student.email || "this student"
          }?\n\nThe student will no longer be able to use the platform.`
        : `Reactivate ${
            student.name || student.email || "this student"
          }?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: active ? "Deactivate" : "Activate",
          style: active ? "destructive" : "default",

          onPress: async () => {
            try {
              setProcessingId(student._id);

              const token =
                await AsyncStorage.getItem("token");

              if (!token) {
                throw new Error(
                  "Authentication token not found."
                );
              }

              const endpoint = active
                ? `/admin/users/${student._id}/deactivate`
                : `/admin/users/${student._id}/activate`;

              await API.put(
                endpoint,
                {},
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              Alert.alert(
                active
                  ? "Student Deactivated"
                  : "Student Activated",
                active
                  ? "The student account has been deactivated."
                  : "The student account has been activated."
              );

              await loadStudents();

              if (
                selectedStudent?._id === student._id
              ) {
                setSelectedStudent({
                  ...student,
                  accountStatus: active
                    ? "inactive"
                    : "active",
                });
              }
            } catch (error: any) {
              console.error(
                "STUDENT STATUS ERROR:",
                error?.response?.data || error
              );

              Alert.alert(
                "Action Failed",
                error?.response?.data?.message ||
                  error?.message ||
                  "Unable to update student status."
              );
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  // =====================================================
  // HELPERS
  // =====================================================

  const formatDate = (date?: string) => {
    if (!date) {
      return "Not available";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "Not available";
    }

    return parsed.toLocaleDateString();
  };

  // =====================================================
  // RENDER STUDENT
  // =====================================================

  const renderStudent = ({
    item,
  }: {
    item: Student;
  }) => {
    const active = item.accountStatus !== "inactive";

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setSelectedStudent(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {(
                item.name?.[0] ||
                item.email?.[0] ||
                "S"
              ).toUpperCase()}
            </Text>
          </View>

          <View style={styles.cardIdentity}>
            <Text style={styles.name}>
              {item.name || "Unnamed Student"}
            </Text>

            <Text style={styles.email}>
              {item.email || "No email"}
            </Text>

            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.statusBadge,
                  active
                    ? styles.activeBadge
                    : styles.inactiveBadge,
                ]}
              >
                <Text style={styles.statusBadgeText}>
                  {active ? "ACTIVE" : "INACTIVE"}
                </Text>
              </View>

              {item.isVerified ? (
                <View
                  style={[
                    styles.statusBadge,
                    styles.verifiedBadge,
                  ]}
                >
                  <Text style={styles.statusBadgeText}>
                    VERIFIED
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.infoText}>
            Phone:{" "}
            {item.phone || "Not provided"}
          </Text>

          <Text style={styles.infoText}>
            Registered:{" "}
            {formatDate(item.createdAt)}
          </Text>

          <Text style={styles.infoText}>
            Last login:{" "}
            {formatDate(item.lastLogin)}
          </Text>
        </View>

        <Text style={styles.tapHint}>
          Tap to view student
        </Text>
      </TouchableOpacity>
    );
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (isAdminLoading || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Loading students...
        </Text>
      </View>
    );
  }

  // =====================================================
  // MAIN
  // =====================================================

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Student Management
        </Text>

        <Text style={styles.subtitle}>
          View and manage student accounts
        </Text>
      </View>

      <FlatList
        data={students}
        keyExtractor={(item) => item._id}
        renderItem={renderStudent}
        contentContainerStyle={
          students.length === 0
            ? styles.emptyContainer
            : styles.list
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              No Students
            </Text>

            <Text style={styles.emptyText}>
              There are currently no registered students.
            </Text>
          </View>
        }
      />

      {/* =================================================
          STUDENT DETAIL MODAL
      ================================================= */}

      <Modal
        visible={selectedStudent !== null}
        animationType="slide"
        onRequestClose={() =>
          setSelectedStudent(null)
        }
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() =>
                setSelectedStudent(null)
              }
            >
              <Text style={styles.closeButton}>
                Close
              </Text>
            </TouchableOpacity>

            <Text style={styles.modalTitle}>
              Student Profile
            </Text>

            <View style={{ width: 45 }} />
          </View>

          {selectedStudent ? (
            <ScrollView
              contentContainerStyle={
                styles.detailContent
              }
            >
              {/* PROFILE HEADER */}

              <View style={styles.profileHeader}>
                <View
                  style={styles.largeAvatarPlaceholder}
                >
                  <Text style={styles.largeAvatarText}>
                    {(
                      selectedStudent.name?.[0] ||
                      selectedStudent.email?.[0] ||
                      "S"
                    ).toUpperCase()}
                  </Text>
                </View>

                <Text style={styles.profileName}>
                  {selectedStudent.name ||
                    "Unnamed Student"}
                </Text>

                <View
                  style={[
                    styles.accountBadge,
                    selectedStudent.accountStatus !==
                    "inactive"
                      ? styles.activeAccountBadge
                      : styles.inactiveAccountBadge,
                  ]}
                >
                  <Text style={styles.accountBadgeText}>
                    {selectedStudent.accountStatus !==
                    "inactive"
                      ? "ACTIVE ACCOUNT"
                      : "INACTIVE ACCOUNT"}
                  </Text>
                </View>
              </View>

              {/* ACCOUNT INFORMATION */}

              <Section title="Account Information">
                <InfoRow
                  label="Name"
                  value={selectedStudent.name}
                />

                <InfoRow
                  label="Email"
                  value={selectedStudent.email}
                />

                <InfoRow
                  label="Phone"
                  value={selectedStudent.phone}
                />

                <InfoRow
                  label="Role"
                  value={selectedStudent.role}
                />

                <InfoRow
                  label="Account status"
                  value={
                    selectedStudent.accountStatus
                  }
                />

                <InfoRow
                  label="Registered"
                  value={formatDate(
                    selectedStudent.createdAt
                  )}
                />

                <InfoRow
                  label="Last login"
                  value={formatDate(
                    selectedStudent.lastLogin
                  )}
                />

                <InfoRow
                  label="Last seen"
                  value={formatDate(
                    selectedStudent.lastSeen
                  )}
                />
              </Section>

              {/* VERIFICATION */}

              <Section title="Verification">
                <InfoRow
                  label="Verified"
                  value={
                    selectedStudent.isVerified
                      ? "Yes"
                      : "No"
                  }
                />

                <InfoRow
                  label="Verification badge"
                  value={
                    selectedStudent.verifiedBadge
                      ? "Active"
                      : "Not active"
                  }
                />

                <InfoRow
                  label="Verification status"
                  value={
                    selectedStudent.verificationStatus
                  }
                />
              </Section>

              {/* SUBSCRIPTION */}

              <Section title="Subscription">
                <InfoRow
                  label="Status"
                  value={
                    selectedStudent.subscriptionStatus
                  }
                />

                <InfoRow
                  label="Expiry"
                  value={formatDate(
                    selectedStudent.subscriptionExpiry
                  )}
                />
              </Section>

              {/* DOCUMENTS */}

              <Section title="Uploaded Documents">
                <InfoRow
                  label="ID document"
                  value={
                    selectedStudent
                      .uploadedDocuments
                      ?.idDocument
                      ? "Uploaded"
                      : "Not uploaded"
                  }
                />

                <InfoRow
                  label="Police clearance"
                  value={
                    selectedStudent
                      .uploadedDocuments
                      ?.policeClearance
                      ? "Uploaded"
                      : "Not uploaded"
                  }
                />

                <InfoRow
                  label="References"
                  value={
                    selectedStudent
                      .uploadedDocuments
                      ?.references?.length
                      ? `${selectedStudent.uploadedDocuments.references.length} uploaded`
                      : "None"
                  }
                />

                <InfoRow
                  label="Qualifications"
                  value={
                    selectedStudent
                      .uploadedDocuments
                      ?.qualifications?.length
                      ? `${selectedStudent.uploadedDocuments.qualifications.length} uploaded`
                      : "None"
                  }
                />
              </Section>

              {/* ACTION */}

              <View style={styles.actions}>
                <TouchableOpacity
                  style={
                    selectedStudent.accountStatus !==
                    "inactive"
                      ? styles.deactivateButton
                      : styles.activateButton
                  }
                  disabled={
                    processingId ===
                    selectedStudent._id
                  }
                  onPress={() =>
                    toggleStudentStatus(
                      selectedStudent
                    )
                  }
                >
                  <Text style={styles.actionText}>
                    {processingId ===
                    selectedStudent._id
                      ? "Processing..."
                      : selectedStudent.accountStatus !==
                        "inactive"
                      ? "Deactivate Account"
                      : "Activate Account"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

// =====================================================
// REUSABLE SECTION
// =====================================================

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {title}
      </Text>

      <View style={styles.sectionBody}>
        {children}
      </View>
    </View>
  );
}

// =====================================================
// REUSABLE INFO ROW
// =====================================================

function InfoRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text style={styles.infoValue}>
        {value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
          ? String(value)
          : "Not provided"}
      </Text>
    </View>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  loadingText: {
    marginTop: 10,
    color: "#555",
  },

  header: {
    padding: 20,
    paddingTop: 25,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e5ea",
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#17202a",
  },

  subtitle: {
    marginTop: 5,
    color: "#68737d",
    fontSize: 14,
  },

  list: {
    padding: 15,
    paddingBottom: 30,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e8eb",
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatarPlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#dfe5eb",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#53606c",
  },

  cardIdentity: {
    flex: 1,
    marginLeft: 12,
  },

  name: {
    fontSize: 17,
    fontWeight: "800",
    color: "#18212b",
  },

  email: {
    marginTop: 3,
    color: "#68737d",
    fontSize: 13,
  },

  badgeRow: {
    flexDirection: "row",
    marginTop: 7,
    gap: 6,
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },

  activeBadge: {
    backgroundColor: "#d9f5df",
  },

  inactiveBadge: {
    backgroundColor: "#f2d9d9",
  },

  verifiedBadge: {
    backgroundColor: "#d9eaff",
  },

  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#27313a",
  },

  cardInfo: {
    marginTop: 15,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#edf0f2",
  },

  infoText: {
    fontSize: 13,
    color: "#4e5963",
    marginBottom: 4,
  },

  tapHint: {
    marginTop: 8,
    color: "#2f6fed",
    fontSize: 12,
    fontWeight: "700",
  },

  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },

  empty: {
    alignItems: "center",
    padding: 30,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#333",
  },

  emptyText: {
    marginTop: 8,
    color: "#777",
  },

  modalContainer: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },

  modalHeader: {
    minHeight: 65,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e5ea",
  },

  closeButton: {
    color: "#2f6fed",
    fontSize: 15,
    fontWeight: "700",
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#18212b",
  },

  detailContent: {
    padding: 16,
    paddingBottom: 40,
  },

  profileHeader: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 22,
    marginBottom: 15,
  },

  largeAvatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#dfe5eb",
    justifyContent: "center",
    alignItems: "center",
  },

  largeAvatarText: {
    fontSize: 42,
    fontWeight: "800",
    color: "#53606c",
  },

  profileName: {
    marginTop: 12,
    fontSize: 23,
    fontWeight: "800",
    color: "#17202a",
    textAlign: "center",
  },

  accountBadge: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },

  activeAccountBadge: {
    backgroundColor: "#d9f5df",
  },

  inactiveAccountBadge: {
    backgroundColor: "#f2d9d9",
  },

  accountBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#27313a",
  },

  section: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 14,
    overflow: "hidden",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#17202a",
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 10,
  },

  sectionBody: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },

  infoRow: {
    flexDirection: "row",
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: "#edf0f2",
  },

  infoLabel: {
    width: "42%",
    color: "#68737d",
    fontSize: 13,
    fontWeight: "600",
  },

  infoValue: {
    flex: 1,
    color: "#18212b",
    fontSize: 13,
    fontWeight: "600",
  },

  actions: {
    marginTop: 5,
    gap: 10,
  },

  deactivateButton: {
    backgroundColor: "#8e2d2d",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  activateButton: {
    backgroundColor: "#2878c8",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  actionText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
});