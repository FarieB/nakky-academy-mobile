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

interface User {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  profilePhoto?: string;
  accountStatus?: "active" | "inactive";
  subscriptionStatus?: string;
  subscriptionExpiry?: string;
  createdAt?: string;
  lastLogin?: string;
}

interface Employer {
  _id: string;
  user?: User;

  contactPerson?: string;
  employerType?: string;
  householdName?: string;

  province?: string;
  city?: string;
  suburb?: string;

  lookingFor?: string[];
  employmentTypes?: string[];
  preferredGender?: string;
  preferredAgeMin?: number;
  preferredAgeMax?: number;
  preferredExperience?: string;
  preferredNationalities?: string[];
  preferredLanguages?: string[];
  salaryOffered?: number;

  profileActive?: boolean;
  hiringStatus?: "Looking" | "Hired" | "Paused";
}

export default function EmployersScreen() {
  const isAdminLoading = useAdminGuard();

  const [employers, setEmployers] = useState<Employer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedEmployer, setSelectedEmployer] =
    useState<Employer | null>(null);

  const [detailLoading, setDetailLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // =====================================================
  // LOAD EMPLOYERS
  // =====================================================

  const loadEmployers = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await API.get("/profiles/admin/employers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.employers || [];

      setEmployers(data);
    } catch (error: any) {
      console.error(
        "ADMIN EMPLOYERS ERROR:",
        error?.response?.data || error
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load employers."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =====================================================
  // LOAD SINGLE EMPLOYER
  // =====================================================

  const openEmployer = async (employer: Employer) => {
    try {
      setDetailLoading(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await API.get(
        `/profiles/admin/employer/${employer._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSelectedEmployer(response.data);
    } catch (error: any) {
      console.error(
        "ADMIN EMPLOYER DETAIL ERROR:",
        error?.response?.data || error
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load employer profile."
      );
    } finally {
      setDetailLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    if (!isAdminLoading) {
      loadEmployers();
    }
  }, [isAdminLoading]);

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEmployers();
  };

  // =====================================================
  // ACTIVATE / DEACTIVATE EMPLOYER
  // =====================================================

  const toggleEmployerStatus = (employer: Employer) => {
    const active = employer.profileActive !== false;

    Alert.alert(
      active ? "Deactivate Employer" : "Activate Employer",
      active
        ? `Deactivate ${
            employer.contactPerson ||
            employer.user?.name ||
            "this employer"
          }?\n\nThe employer account will no longer be able to use the platform.`
        : `Reactivate ${
            employer.contactPerson ||
            employer.user?.name ||
            "this employer"
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
              setProcessingId(employer._id);

              const token = await AsyncStorage.getItem("token");

              if (!token) {
                throw new Error("Authentication token not found.");
              }

              const endpoint = active
                ? `/profiles/admin/employer/${employer._id}/deactivate`
                : `/profiles/admin/employer/${employer._id}/activate`;

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
                  ? "Employer Deactivated"
                  : "Employer Activated",
                active
                  ? "The employer account has been deactivated."
                  : "The employer account has been activated."
              );

              await loadEmployers();

              if (selectedEmployer?._id === employer._id) {
                await openEmployer(employer);
              }
            } catch (error: any) {
              console.error(
                "EMPLOYER STATUS ERROR:",
                error?.response?.data || error
              );

              Alert.alert(
                "Action Failed",
                error?.response?.data?.message ||
                  error?.message ||
                  "Unable to update employer status."
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

  const employerName = (employer: Employer) =>
    employer.contactPerson ||
    employer.user?.name ||
    employer.householdName ||
    "Unnamed Employer";

  const formatDate = (date?: string) => {
    if (!date) return "Not available";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "Not available";
    }

    return parsed.toLocaleDateString();
  };

  // =====================================================
  // RENDER EMPLOYER
  // =====================================================

  const renderEmployer = ({
    item,
  }: {
    item: Employer;
  }) => {
    const active = item.profileActive !== false;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => openEmployer(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {(
                employerName(item)[0] || "E"
              ).toUpperCase()}
            </Text>
          </View>

          <View style={styles.cardIdentity}>
            <Text style={styles.name}>
              {employerName(item)}
            </Text>

            <Text style={styles.email}>
              {item.user?.email || "No email"}
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

              <View
                style={[
                  styles.statusBadge,
                  item.hiringStatus === "Looking"
                    ? styles.lookingBadge
                    : item.hiringStatus === "Hired"
                    ? styles.hiredBadge
                    : styles.pausedBadge,
                ]}
              >
                <Text style={styles.statusBadgeText}>
                  {item.hiringStatus || "Not specified"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.infoText}>
            Employer type:{" "}
            {item.employerType || "Not specified"}
          </Text>

          <Text style={styles.infoText}>
            Household:{" "}
            {item.householdName || "Not specified"}
          </Text>

          <Text style={styles.infoText}>
            Location:{" "}
            {[item.suburb, item.city, item.province]
              .filter(Boolean)
              .join(", ") || "Not specified"}
          </Text>
        </View>

        <Text style={styles.tapHint}>
          Tap to view full profile
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
          Loading employers...
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
          Employer Management
        </Text>

        <Text style={styles.subtitle}>
          View and manage employer accounts
        </Text>
      </View>

      <FlatList
        data={employers}
        keyExtractor={(item) => item._id}
        renderItem={renderEmployer}
        contentContainerStyle={
          employers.length === 0
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
              No Employers
            </Text>

            <Text style={styles.emptyText}>
              There are currently no employer profiles.
            </Text>
          </View>
        }
      />

      {/* =================================================
          EMPLOYER DETAIL MODAL
      ================================================= */}

      <Modal
        visible={selectedEmployer !== null}
        animationType="slide"
        onRequestClose={() =>
          setSelectedEmployer(null)
        }
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() =>
                setSelectedEmployer(null)
              }
            >
              <Text style={styles.closeButton}>
                Close
              </Text>
            </TouchableOpacity>

            <Text style={styles.modalTitle}>
              Employer Profile
            </Text>

            <View style={{ width: 45 }} />
          </View>

          {detailLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" />
              <Text style={styles.loadingText}>
                Loading profile...
              </Text>
            </View>
          ) : selectedEmployer ? (
            <ScrollView
              contentContainerStyle={styles.detailContent}
            >
              {/* PROFILE HEADER */}

              <View style={styles.profileHeader}>
                <View style={styles.largeAvatarPlaceholder}>
                  <Text style={styles.largeAvatarText}>
                    {(
                      employerName(selectedEmployer)[0] ||
                      "E"
                    ).toUpperCase()}
                  </Text>
                </View>

                <Text style={styles.profileName}>
                  {employerName(selectedEmployer)}
                </Text>

                <View
                  style={[
                    styles.accountBadge,
                    selectedEmployer.profileActive !== false
                      ? styles.activeAccountBadge
                      : styles.inactiveAccountBadge,
                  ]}
                >
                  <Text style={styles.accountBadgeText}>
                    {selectedEmployer.profileActive !==
                    false
                      ? "ACTIVE ACCOUNT"
                      : "INACTIVE ACCOUNT"}
                  </Text>
                </View>
              </View>

              {/* ACCOUNT */}

              <Section title="Account Information">
                <InfoRow
                  label="Name"
                  value={
                    selectedEmployer.user?.name
                  }
                />

                <InfoRow
                  label="Email"
                  value={
                    selectedEmployer.user?.email
                  }
                />

                <InfoRow
                  label="Phone"
                  value={
                    selectedEmployer.user?.phone
                  }
                />

                <InfoRow
                  label="Account status"
                  value={
                    selectedEmployer.user
                      ?.accountStatus
                  }
                />

                <InfoRow
                  label="Subscription status"
                  value={
                    selectedEmployer.user
                      ?.subscriptionStatus
                  }
                />

                <InfoRow
                  label="Subscription expiry"
                  value={formatDate(
                    selectedEmployer.user
                      ?.subscriptionExpiry
                  )}
                />

                <InfoRow
                  label="Registered"
                  value={formatDate(
                    selectedEmployer.user?.createdAt
                  )}
                />

                <InfoRow
                  label="Last login"
                  value={formatDate(
                    selectedEmployer.user?.lastLogin
                  )}
                />
              </Section>

              {/* EMPLOYER */}

              <Section title="Employer Information">
                <InfoRow
                  label="Contact person"
                  value={
                    selectedEmployer.contactPerson
                  }
                />

                <InfoRow
                  label="Employer type"
                  value={
                    selectedEmployer.employerType
                  }
                />

                <InfoRow
                  label="Household name"
                  value={
                    selectedEmployer.householdName
                  }
                />

                <InfoRow
                  label="Hiring status"
                  value={
                    selectedEmployer.hiringStatus
                  }
                />
              </Section>

              {/* LOCATION */}

              <Section title="Location">
                <InfoRow
                  label="Province"
                  value={
                    selectedEmployer.province
                  }
                />

                <InfoRow
                  label="City"
                  value={
                    selectedEmployer.city
                  }
                />

                <InfoRow
                  label="Suburb"
                  value={
                    selectedEmployer.suburb
                  }
                />
              </Section>

              {/* REQUIREMENTS */}

              <Section title="Hiring Requirements">
                <InfoRow
                  label="Looking for"
                  value={
                    selectedEmployer.lookingFor?.join(
                      ", "
                    )
                  }
                />

                <InfoRow
                  label="Employment types"
                  value={
                    selectedEmployer.employmentTypes?.join(
                      ", "
                    )
                  }
                />

                <InfoRow
                  label="Preferred gender"
                  value={
                    selectedEmployer.preferredGender
                  }
                />

                <InfoRow
                  label="Preferred age"
                  value={
                    selectedEmployer.preferredAgeMin !==
                      undefined ||
                    selectedEmployer.preferredAgeMax !==
                      undefined
                      ? `${selectedEmployer.preferredAgeMin ?? "Any"} - ${
                          selectedEmployer.preferredAgeMax ??
                          "Any"
                        }`
                      : undefined
                  }
                />

                <InfoRow
                  label="Experience"
                  value={
                    selectedEmployer.preferredExperience
                  }
                />

                <InfoRow
                  label="Nationalities"
                  value={
                    selectedEmployer.preferredNationalities?.join(
                      ", "
                    )
                  }
                />

                <InfoRow
                  label="Languages"
                  value={
                    selectedEmployer.preferredLanguages?.join(
                      ", "
                    )
                  }
                />

                <InfoRow
                  label="Salary offered"
                  value={
                    selectedEmployer.salaryOffered
                      ? `R${selectedEmployer.salaryOffered}`
                      : undefined
                  }
                />
              </Section>

              {/* ACTION */}

              <View style={styles.actions}>
                <TouchableOpacity
                  style={
                    selectedEmployer.profileActive !==
                    false
                      ? styles.deactivateButton
                      : styles.activateButton
                  }
                  disabled={
                    processingId ===
                    selectedEmployer._id
                  }
                  onPress={() =>
                    toggleEmployerStatus(
                      selectedEmployer
                    )
                  }
                >
                  <Text style={styles.actionText}>
                    {processingId ===
                    selectedEmployer._id
                      ? "Processing..."
                      : selectedEmployer.profileActive !==
                        false
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

  lookingBadge: {
    backgroundColor: "#d9eaff",
  },

  hiredBadge: {
    backgroundColor: "#d9f5df",
  },

  pausedBadge: {
    backgroundColor: "#fff0c7",
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