import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
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


// =====================================================
// TYPES
// =====================================================

interface User {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  profilePhoto?: string;
  accountStatus?: "active" | "inactive";
  subscriptionStatus?: string;
  subscriptionExpiry?: string;
  verifiedBadge?: boolean;
  isVerified?: boolean;
  verificationStatus?: string;
  hasPaidVerificationFee?: boolean;
  createdAt?: string;
  lastLogin?: string;
}

interface Qualification {
  title?: string;
  institution?: string;
  yearCompleted?: string | number;
  certificateFile?: string;
}

interface Reference {
  file?: string;
}

interface Documents {
  idDocument?: string;
  policeClearance?: string;
  cv?: string;
}

interface Candidate {
  _id: string;
  user?: User;

  firstName?: string;
  surname?: string;
  profilePhoto?: string;

  gender?: string;
  dateOfBirth?: string;
  nationality?: string;
  languages?: string[];

  province?: string;
  city?: string;
  suburb?: string;

  bio?: string;
  workerTypes?: string[];
  yearsExperience?: number;
  expectedSalary?: number;
  skills?: string[];

  workPreferences?: any;
  availabilityStatus?: string;

  qualifications?: Qualification[];
  references?: Reference[];
  documents?: Documents;

  academyCertificates?: any[];

  averageRating?: number;
  totalReviews?: number;

  profileCompleted?: boolean;
  profileActive?: boolean;
  profileVerified?: boolean;
}


// =====================================================
// SCREEN
// =====================================================

export default function CandidatesScreen() {
  const isAdminLoading = useAdminGuard();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedCandidate, setSelectedCandidate] =
    useState<Candidate | null>(null);

  const [detailLoading, setDetailLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);


// =====================================================
// LOAD CANDIDATES
// =====================================================

  const loadCandidates = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await API.get("/profiles/admin/candidates", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.candidates || [];

      setCandidates(data);
    } catch (error: any) {
      console.error(
        "ADMIN CANDIDATES ERROR:",
        error?.response?.data || error
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load candidates."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


// =====================================================
// LOAD SINGLE CANDIDATE
// =====================================================

  const openCandidate = async (candidate: Candidate) => {
    try {
      setDetailLoading(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await API.get(
        `/profiles/admin/candidate/${candidate._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSelectedCandidate(response.data);
    } catch (error: any) {
      console.error(
        "ADMIN CANDIDATE DETAIL ERROR:",
        error?.response?.data || error
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load candidate profile."
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
      loadCandidates();
    }
  }, [isAdminLoading]);


// =====================================================
// REFRESH
// =====================================================

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCandidates();
  };


// =====================================================
// VERIFY CANDIDATE
// =====================================================

  const verifyCandidate = (candidate: Candidate) => {
    Alert.alert(
      "Verify Candidate",
      `Verify ${candidate.firstName || ""} ${
        candidate.surname || ""
      }?\n\nThis will give the candidate a verified badge.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Verify",
          onPress: async () => {
            try {
              setProcessingId(candidate._id);

              const token = await AsyncStorage.getItem("token");

              if (!token) {
                throw new Error("Authentication token not found.");
              }

              await API.put(
                `/profiles/admin/candidate/${candidate._id}/verify`,
                {},
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              Alert.alert(
                "Candidate Verified",
                "The candidate has been verified and the verification badge has been activated."
              );

              await loadCandidates();

              if (selectedCandidate?._id === candidate._id) {
                await openCandidate(candidate);
              }
            } catch (error: any) {
              console.error(
                "VERIFY CANDIDATE ERROR:",
                error?.response?.data || error
              );

              Alert.alert(
                "Verification Failed",
                error?.response?.data?.message ||
                  error?.message ||
                  "Unable to verify candidate."
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
// REJECT CANDIDATE
// =====================================================

  const rejectCandidate = (candidate: Candidate) => {
    Alert.alert(
      "Reject Verification",
      `Reject verification for ${candidate.firstName || ""} ${
        candidate.surname || ""
      }?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            try {
              setProcessingId(candidate._id);

              const token = await AsyncStorage.getItem("token");

              if (!token) {
                throw new Error("Authentication token not found.");
              }

              await API.put(
                `/profiles/admin/candidate/${candidate._id}/reject`,
                {},
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              Alert.alert(
                "Verification Rejected",
                "The candidate verification has been rejected."
              );

              await loadCandidates();

              if (selectedCandidate?._id === candidate._id) {
                await openCandidate(candidate);
              }
            } catch (error: any) {
              console.error(
                "REJECT CANDIDATE ERROR:",
                error?.response?.data || error
              );

              Alert.alert(
                "Rejection Failed",
                error?.response?.data?.message ||
                  error?.message ||
                  "Unable to reject candidate."
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
// ACTIVATE / DEACTIVATE
// =====================================================

  const toggleCandidateStatus = (candidate: Candidate) => {
    const active = candidate.profileActive !== false;

    Alert.alert(
      active ? "Deactivate Candidate" : "Activate Candidate",
      active
        ? `Deactivate ${candidate.firstName || ""} ${
            candidate.surname || ""
          }?\n\nThe candidate will no longer be able to use the account.`
        : `Reactivate ${candidate.firstName || ""} ${
            candidate.surname || ""
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
              setProcessingId(candidate._id);

              const token = await AsyncStorage.getItem("token");

              if (!token) {
                throw new Error("Authentication token not found.");
              }

              const endpoint = active
                ? `/profiles/admin/candidate/${candidate._id}/deactivate`
                : `/profile/admin/candidate/${candidate._id}/activate`;

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
                  ? "Candidate Deactivated"
                  : "Candidate Activated",
                active
                  ? "The candidate account has been deactivated."
                  : "The candidate account has been activated."
              );

              await loadCandidates();

              if (selectedCandidate?._id === candidate._id) {
                await openCandidate(candidate);
              }
            } catch (error: any) {
              console.error(
                "CANDIDATE STATUS ERROR:",
                error?.response?.data || error
              );

              Alert.alert(
                "Action Failed",
                error?.response?.data?.message ||
                  error?.message ||
                  "Unable to update candidate status."
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

  const fullName = (candidate: Candidate) =>
    `${candidate.firstName || ""} ${
      candidate.surname || ""
    }`.trim() ||
    candidate.user?.name ||
    "Unnamed Candidate";

  const formatDate = (date?: string) => {
    if (!date) return "Not available";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "Not available";
    }

    return parsed.toLocaleDateString();
  };

  const verificationLabel = (candidate: Candidate) => {
    if (candidate.user?.verificationStatus === "verified") {
      return "VERIFIED";
    }

    if (candidate.user?.verificationStatus === "rejected") {
      return "REJECTED";
    }

    if (candidate.user?.verificationStatus === "pending") {
      return "PENDING";
    }

    if (candidate.profileVerified) {
      return "VERIFIED";
    }

    return "UNVERIFIED";
  };


// =====================================================
// RENDER CANDIDATE
// =====================================================

  const renderCandidate = ({
    item,
  }: {
    item: Candidate;
  }) => {
    const active = item.profileActive !== false;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => openCandidate(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          {item.profilePhoto || item.user?.profilePhoto ? (
            <Image
              source={{
                uri:
                  item.profilePhoto ||
                  item.user?.profilePhoto,
              }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {(item.firstName?.[0] ||
                  item.user?.name?.[0] ||
                  "?").toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.cardIdentity}>
            <Text style={styles.name}>
              {fullName(item)}
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
                  verificationLabel(item) === "VERIFIED"
                    ? styles.verifiedBadge
                    : verificationLabel(item) === "REJECTED"
                    ? styles.rejectedBadge
                    : styles.pendingBadge,
                ]}
              >
                <Text style={styles.statusBadgeText}>
                  {verificationLabel(item)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.infoText}>
            Worker type:{" "}
            {item.workerTypes?.join(", ") ||
              "Not specified"}
          </Text>

          <Text style={styles.infoText}>
            Location:{" "}
            {[item.suburb, item.city, item.province]
              .filter(Boolean)
              .join(", ") || "Not specified"}
          </Text>

          <Text style={styles.infoText}>
            Experience:{" "}
            {item.yearsExperience !== undefined
              ? `${item.yearsExperience} years`
              : "Not specified"}
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
          Loading candidates...
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
          Candidate Management
        </Text>

        <Text style={styles.subtitle}>
          View, verify and manage candidate accounts
        </Text>
      </View>

      <FlatList
        data={candidates}
        keyExtractor={(item) => item._id}
        renderItem={renderCandidate}
        contentContainerStyle={
          candidates.length === 0
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
              No Candidates
            </Text>

            <Text style={styles.emptyText}>
              There are currently no candidate profiles.
            </Text>
          </View>
        }
      />


      {/* =================================================
          CANDIDATE DETAIL MODAL
      ================================================= */}

      <Modal
        visible={selectedCandidate !== null}
        animationType="slide"
        onRequestClose={() =>
          setSelectedCandidate(null)
        }
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() =>
                setSelectedCandidate(null)
              }
            >
              <Text style={styles.closeButton}>
                Close
              </Text>
            </TouchableOpacity>

            <Text style={styles.modalTitle}>
              Candidate Profile
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
          ) : selectedCandidate ? (
            <ScrollView
              contentContainerStyle={
                styles.detailContent
              }
            >
              {/* PROFILE HEADER */}

              <View style={styles.profileHeader}>
                {selectedCandidate.profilePhoto ||
                selectedCandidate.user?.profilePhoto ? (
                  <Image
                    source={{
                      uri:
                        selectedCandidate.profilePhoto ||
                        selectedCandidate.user?.profilePhoto,
                    }}
                    style={styles.largeAvatar}
                  />
                ) : (
                  <View
                    style={styles.largeAvatarPlaceholder}
                  >
                    <Text style={styles.largeAvatarText}>
                      {(selectedCandidate.firstName?.[0] ||
                        selectedCandidate.user?.name?.[0] ||
                        "?").toUpperCase()}
                    </Text>
                  </View>
                )}

                <Text style={styles.profileName}>
                  {fullName(selectedCandidate)}
                </Text>

                {selectedCandidate.user
                  ?.verifiedBadge ? (
                  <View style={styles.bigVerifiedBadge}>
                    <Text style={styles.bigVerifiedText}>
                      ✓ VERIFIED CANDIDATE
                    </Text>
                  </View>
                ) : (
                  <View
                    style={styles.bigUnverifiedBadge}
                  >
                    <Text style={styles.bigUnverifiedText}>
                      NOT VERIFIED
                    </Text>
                  </View>
                )}
              </View>


              {/* ACCOUNT */}

              <Section title="Account Information">
                <InfoRow
                  label="Email"
                  value={
                    selectedCandidate.user?.email
                  }
                />

                <InfoRow
                  label="Phone"
                  value={
                    selectedCandidate.user?.phone
                  }
                />

                <InfoRow
                  label="Account status"
                  value={
                    selectedCandidate.user
                      ?.accountStatus
                  }
                />

                <InfoRow
                  label="Verification status"
                  value={
                    selectedCandidate.user
                      ?.verificationStatus
                  }
                />

                <InfoRow
                  label="Verification fee paid"
                  value={
                    selectedCandidate.user
                      ?.hasPaidVerificationFee
                      ? "Yes"
                      : "No"
                  }
                />

                <InfoRow
                  label="Registered"
                  value={formatDate(
                    selectedCandidate.user
                      ?.createdAt
                  )}
                />

                <InfoRow
                  label="Last login"
                  value={formatDate(
                    selectedCandidate.user
                      ?.lastLogin
                  )}
                />
              </Section>


              {/* PERSONAL */}

              <Section title="Personal Information">
                <InfoRow
                  label="Gender"
                  value={selectedCandidate.gender}
                />

                <InfoRow
                  label="Date of birth"
                  value={
                    selectedCandidate.dateOfBirth
                  }
                />

                <InfoRow
                  label="Nationality"
                  value={
                    selectedCandidate.nationality
                  }
                />

                <InfoRow
                  label="Languages"
                  value={
                    selectedCandidate.languages?.join(
                      ", "
                    )
                  }
                />
              </Section>


              {/* LOCATION */}

              <Section title="Location">
                <InfoRow
                  label="Province"
                  value={
                    selectedCandidate.province
                  }
                />

                <InfoRow
                  label="City"
                  value={
                    selectedCandidate.city
                  }
                />

                <InfoRow
                  label="Suburb"
                  value={
                    selectedCandidate.suburb
                  }
                />
              </Section>


              {/* PROFESSIONAL */}

              <Section title="Professional Information">
                <InfoRow
                  label="Worker types"
                  value={
                    selectedCandidate.workerTypes?.join(
                      ", "
                    )
                  }
                />

                <InfoRow
                  label="Experience"
                  value={
                    selectedCandidate.yearsExperience !==
                    undefined
                      ? `${selectedCandidate.yearsExperience} years`
                      : undefined
                  }
                />

                <InfoRow
                  label="Expected salary"
                  value={
                    selectedCandidate.expectedSalary
                      ? `R${selectedCandidate.expectedSalary}`
                      : undefined
                  }
                />

                <InfoRow
                  label="Skills"
                  value={
                    selectedCandidate.skills?.join(
                      ", "
                    )
                  }
                />

                <InfoRow
                  label="Availability"
                  value={
                    selectedCandidate.availabilityStatus
                  }
                />
              </Section>


              {/* BIO */}

              {selectedCandidate.bio ? (
                <Section title="Profile Description">
                  <Text style={styles.bio}>
                    {selectedCandidate.bio}
                  </Text>
                </Section>
              ) : null}


              {/* QUALIFICATIONS */}

              <Section title="Qualifications">
                {selectedCandidate.qualifications
                  ?.length ? (
                  selectedCandidate.qualifications.map(
                    (qualification, index) => (
                      <View
                        key={`qualification-${index}`}
                        style={styles.documentCard}
                      >
                        <Text
                          style={styles.documentTitle}
                        >
                          {qualification.title ||
                            "Qualification"}
                        </Text>

                        <Text
                          style={styles.documentText}
                        >
                          Institution:{" "}
                          {qualification.institution ||
                            "Not provided"}
                        </Text>

                        <Text
                          style={styles.documentText}
                        >
                          Year:{" "}
                          {qualification.yearCompleted ||
                            "Not provided"}
                        </Text>

                        {qualification.certificateFile ? (
                          <Text
                            style={styles.fileText}
                          >
                            Certificate uploaded
                          </Text>
                        ) : null}
                      </View>
                    )
                  )
                ) : (
                  <Text style={styles.noData}>
                    No qualifications uploaded.
                  </Text>
                )}
              </Section>


              {/* DOCUMENTS */}

              <Section title="Documents">
                <InfoRow
                  label="ID document"
                  value={
                    selectedCandidate.documents
                      ?.idDocument
                      ? "Uploaded"
                      : "Not uploaded"
                  }
                />

                <InfoRow
                  label="Police clearance"
                  value={
                    selectedCandidate.documents
                      ?.policeClearance
                      ? "Uploaded"
                      : "Not uploaded"
                  }
                />

                <InfoRow
                  label="CV"
                  value={
                    selectedCandidate.documents?.cv
                      ? "Uploaded"
                      : "Not uploaded"
                  }
                />
              </Section>


              {/* REFERENCES */}

              <Section title="References">
                {selectedCandidate.references
                  ?.length ? (
                  selectedCandidate.references.map(
                    (reference, index) => (
                      <View
                        key={`reference-${index}`}
                        style={styles.documentCard}
                      >
                        <Text
                          style={styles.documentTitle}
                        >
                          Reference {index + 1}
                        </Text>

                        <Text
                          style={styles.documentText}
                        >
                          {reference.file
                            ? "Reference document uploaded"
                            : "No document uploaded"}
                        </Text>
                      </View>
                    )
                  )
                ) : (
                  <Text style={styles.noData}>
                    No references uploaded.
                  </Text>
                )}
              </Section>


              {/* ACTIONS */}

              <View style={styles.actions}>
                {!selectedCandidate.user
                  ?.verifiedBadge ? (
                  <TouchableOpacity
                    style={styles.verifyButton}
                    disabled={
                      processingId ===
                      selectedCandidate._id
                    }
                    onPress={() =>
                      verifyCandidate(
                        selectedCandidate
                      )
                    }
                  >
                    <Text style={styles.actionText}>
                      {processingId ===
                      selectedCandidate._id
                        ? "Processing..."
                        : "✓ Verify Candidate"}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.rejectButton}
                    disabled={
                      processingId ===
                      selectedCandidate._id
                    }
                    onPress={() =>
                      rejectCandidate(
                        selectedCandidate
                      )
                    }
                  >
                    <Text style={styles.actionText}>
                      {processingId ===
                      selectedCandidate._id
                        ? "Processing..."
                        : "Reject Verification"}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={
                    selectedCandidate.profileActive !==
                    false
                      ? styles.deactivateButton
                      : styles.activateButton
                  }
                  disabled={
                    processingId ===
                    selectedCandidate._id
                  }
                  onPress={() =>
                    toggleCandidateStatus(
                      selectedCandidate
                    )
                  }
                >
                  <Text style={styles.actionText}>
                    {selectedCandidate.profileActive !==
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
    backgroundColor: "#ffffff",
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
    backgroundColor: "#ffffff",
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

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
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

  rejectedBadge: {
    backgroundColor: "#f5d7d7",
  },

  pendingBadge: {
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
    backgroundColor: "#ffffff",
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
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 22,
    marginBottom: 15,
  },

  largeAvatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
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

  bigVerifiedBadge: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#d9eaff",
  },

  bigVerifiedText: {
    color: "#1657a5",
    fontWeight: "800",
    fontSize: 12,
  },

  bigUnverifiedBadge: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#fff0c7",
  },

  bigUnverifiedText: {
    color: "#806000",
    fontWeight: "800",
    fontSize: 12,
  },

  section: {
    backgroundColor: "#ffffff",
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

  bio: {
    color: "#4e5963",
    lineHeight: 21,
    fontSize: 14,
  },

  documentCard: {
    backgroundColor: "#f7f9fb",
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },

  documentTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#18212b",
  },

  documentText: {
    marginTop: 5,
    color: "#5f6973",
    fontSize: 13,
  },

  fileText: {
    marginTop: 7,
    color: "#2f6fed",
    fontSize: 12,
    fontWeight: "700",
  },

  noData: {
    color: "#777",
    paddingVertical: 8,
    fontSize: 13,
  },

  actions: {
    marginTop: 5,
    gap: 10,
  },

  verifyButton: {
    backgroundColor: "#1f8f4c",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  rejectButton: {
    backgroundColor: "#c0392b",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
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
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
});