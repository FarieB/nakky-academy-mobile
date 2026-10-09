import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import API from "../../src/services/api";

type DashboardData = {
  user?: {
    _id?: string;
    firstName?: string;
    surname?: string;
    name?: string;
    role?: string;
    accountStatus?: string;
  };

  employer?: {
    _id?: string;
    companyName?: string;
    firstName?: string;
    surname?: string;
    profileCompleted?: boolean;
    profileActive?: boolean;
  };

  profile?: {
    _id?: string;
    companyName?: string;
    firstName?: string;
    surname?: string;
    profileCompleted?: boolean;
    profileActive?: boolean;
  };

  subscriptionStatus?: string;

  [key: string]: any;
};

type SubscriptionData = {
  active?: boolean;
  status?: string;
  subscriptionStatus?: string;
  expiry?: string | null;
  subscriptionExpiry?: string | null;
  plan?: {
    name?: string;
    price?: number;
  };
};

export default function EmployerDashboard() {
  const router = useRouter();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [subscription, setSubscription] =
    useState<SubscriptionData | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      API.defaults.headers.common.Authorization = `Bearer ${token}`;

      const [dashboardResponse, profileResponse, subscriptionResponse] =
        await Promise.allSettled([
          API.get("/dashboard"),
          API.get("/profiles/employer"),
          API.get("/subscriptions/my-subscription"),
        ]);

      if (dashboardResponse.status === "fulfilled") {
        setDashboard(dashboardResponse.value.data || null);
      }

      if (profileResponse.status === "fulfilled") {
        const profileData = profileResponse.value.data;

        setDashboard((current) => ({
          ...(current || {}),
          employer: profileData,
          profile: profileData,
        }));
      }

      if (subscriptionResponse.status === "fulfilled") {
        setSubscription(subscriptionResponse.value.data || null);
      }
    } catch (error: any) {
      console.error(
        "EMPLOYER DASHBOARD ERROR:",
        error?.response?.data || error?.message || error
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const getEmployerName = () => {
    const employer = dashboard?.employer || dashboard?.profile;
    const user = dashboard?.user;

    if (employer?.companyName) {
      return employer.companyName;
    }

    if (employer?.firstName) {
      return `${employer.firstName}${
        employer.surname ? ` ${employer.surname}` : ""
      }`;
    }

    if (user?.firstName) {
      return `${user.firstName}${user.surname ? ` ${user.surname}` : ""}`;
    }

    if (user?.name) {
      return user.name;
    }

    return "Employer";
  };

  const employerSubscriptionStatus =
    subscription?.status ||
    subscription?.subscriptionStatus ||
    dashboard?.subscriptionStatus ||
    "";

  const employerSubscriptionActive = Boolean(
    subscription?.active === true ||
      employerSubscriptionStatus === "active"
  );

  const subscriptionExpiry =
    subscription?.expiry || subscription?.subscriptionExpiry || null;

  const employerProfile = dashboard?.employer || dashboard?.profile;

  const profileCompleted = Boolean(
    employerProfile?.profileCompleted ||
      dashboard?.profileCompleted
  );

  const openMarketplace = () => {
    router.push("/(employer)/marketplace");
  };

  const openEmployerProfile = () => {
    router.push("/(employer)/employer-profile");
  };

  const openSearchCandidates = () => {
    router.push("/(employer)/search-candidates");
  };

  const openRecommendedCandidates = () => {
    router.push("/(employer)/recommended-candidates");
  };

  const openSavedCandidates = () => {
    router.push("/(employer)/saved-candidates");
  };

  const openInbox = () => {
    router.push("/(employer)/inbox");
  };

  const openSubscribe = () => {
    router.push("/(employer)/subscribe");
  };

  const openNotifications = () => {
    router.push("/notifications");
  };

  const formatExpiry = () => {
    if (!subscriptionExpiry) {
      return "Not available";
    }

    const date = new Date(subscriptionExpiry);

    if (Number.isNaN(date.getTime())) {
      return "Not available";
    }

    return date.toLocaleDateString("en-ZA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getSubscriptionLabel = () => {
    if (employerSubscriptionActive) {
      return "Active";
    }

    if (employerSubscriptionStatus === "pending") {
      return "Payment Pending";
    }

    if (employerSubscriptionStatus === "expired") {
      return "Expired";
    }

    return "Not Active";
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Loading your dashboard...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.smallHeaderText}>
              NAKKY ACADEMY
            </Text>

            <Text style={styles.welcomeText}>
              Welcome, {getEmployerName()}
            </Text>

            <Text style={styles.headerSubtitle}>
              Employer dashboard
            </Text>
          </View>

          <TouchableOpacity
            style={styles.notificationButton}
            onPress={openNotifications}
          >
            <Text style={styles.notificationIcon}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* MARKETPLACE */}
        <TouchableOpacity
          style={styles.marketplaceBanner}
          onPress={openMarketplace}
          activeOpacity={0.9}
        >
          <Text style={styles.marketplaceEyebrow}>
            NAKKY MARKETPLACE
          </Text>

          <Text style={styles.marketplaceTitle}>
            Find the right candidate
          </Text>

          <Text style={styles.marketplaceText}>
            Search candidates, view recommendations, manage your saved
            candidates and connect with suitable workers.
          </Text>

          <View style={styles.marketplaceButton}>
            <Text style={styles.marketplaceButtonText}>
              Open Marketplace →
            </Text>
          </View>
        </TouchableOpacity>

        {/* SUBSCRIPTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Employer Subscription
          </Text>

          <View
            style={[
              styles.subscriptionCard,
              employerSubscriptionActive
                ? styles.subscriptionCardActive
                : styles.subscriptionCardInactive,
            ]}
          >
            <View style={styles.subscriptionHeader}>
              <View>
                <Text style={styles.subscriptionLabel}>
                  Marketplace Subscription
                </Text>

                <Text
                  style={[
                    styles.subscriptionValue,
                    employerSubscriptionActive
                      ? styles.activeText
                      : styles.inactiveText,
                  ]}
                >
                  {getSubscriptionLabel()}
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  employerSubscriptionActive
                    ? styles.statusBadgeActive
                    : styles.statusBadgeInactive,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    employerSubscriptionActive
                      ? styles.statusBadgeTextActive
                      : styles.statusBadgeTextInactive,
                  ]}
                >
                  {employerSubscriptionActive
                    ? "ACTIVE"
                    : "INACTIVE"}
                </Text>
              </View>
            </View>

            {employerSubscriptionActive && subscriptionExpiry ? (
              <Text style={styles.expiryText}>
                Active until {formatExpiry()}
              </Text>
            ) : (
              <Text style={styles.subscriptionDescription}>
                You can browse candidates before subscribing. An active
                employer subscription is required to initiate direct
                communication.
              </Text>
            )}

            <TouchableOpacity
              style={
                employerSubscriptionActive
                  ? styles.outlineButton
                  : styles.primaryButton
              }
              onPress={openSubscribe}
            >
              <Text
                style={
                  employerSubscriptionActive
                    ? styles.outlineButtonText
                    : styles.primaryButtonText
                }
              >
                {employerSubscriptionActive
                  ? "Manage Subscription"
                  : "Subscribe to Contact Candidates"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* PROFILE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Employer Profile
          </Text>

          <View style={styles.profileCard}>
            <View style={styles.profileRow}>
              <View style={styles.profileIconContainer}>
                <Text style={styles.profileIcon}>🏢</Text>
              </View>

              <View style={styles.profileContent}>
                <Text style={styles.profileTitle}>
                  {profileCompleted
                    ? "Profile completed"
                    : "Complete your employer profile"}
                </Text>

                <Text style={styles.profileText}>
                  {profileCompleted
                    ? "Candidates can view your public employer information."
                    : "Create your employer profile so candidates can understand your requirements."}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.outlineButton}
              onPress={openEmployerProfile}
            >
              <Text style={styles.outlineButtonText}>
                {profileCompleted
                  ? "Edit Employer Profile"
                  : "Create Employer Profile"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CANDIDATE DISCOVERY */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Find Candidates
          </Text>

          <View style={styles.grid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={openSearchCandidates}
            >
              <Text style={styles.actionIcon}>🔎</Text>

              <Text style={styles.actionTitle}>
                Search Candidates
              </Text>

              <Text style={styles.actionText}>
                Search by worker type, location, experience and preferences.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={openRecommendedCandidates}
            >
              <Text style={styles.actionIcon}>⭐</Text>

              <Text style={styles.actionTitle}>
                Recommended
              </Text>

              <Text style={styles.actionText}>
                View candidates recommended for your requirements.
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.fullActionCard}
            onPress={openSavedCandidates}
          >
            <View style={styles.fullActionIcon}>
              <Text style={styles.actionIcon}>❤️</Text>
            </View>

            <View style={styles.fullActionContent}>
              <Text style={styles.fullActionTitle}>
                Saved Candidates
              </Text>

              <Text style={styles.fullActionText}>
                Review candidates you have saved for later.
              </Text>
            </View>

            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* COMMUNICATION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Communication
          </Text>

          <TouchableOpacity
            style={styles.communicationCard}
            onPress={openInbox}
          >
            <View style={styles.communicationIcon}>
              <Text style={styles.actionIcon}>💬</Text>
            </View>

            <View style={styles.communicationContent}>
              <Text style={styles.communicationTitle}>
                Messages
              </Text>

              <Text style={styles.communicationText}>
                View your conversations and communicate with candidates when
                marketplace communication requirements are satisfied.
              </Text>
            </View>

            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          {!employerSubscriptionActive && (
            <View style={styles.warningCard}>
              <Text style={styles.warningIcon}>!</Text>

              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>
                  Subscription required for new contact
                </Text>

                <Text style={styles.warningText}>
                  You can continue browsing candidates and viewing public
                  profiles. You need an active employer subscription to
                  initiate communication.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* QUICK ACTIONS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Quick Actions
          </Text>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={openEmployerProfile}
          >
            <View style={styles.menuIconContainer}>
              <Text style={styles.menuIcon}>🏢</Text>
            </View>

            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>
                Employer Profile
              </Text>

              <Text style={styles.menuText}>
                Update your company or employer information.
              </Text>
            </View>

            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={openSearchCandidates}
          >
            <View style={styles.menuIconContainer}>
              <Text style={styles.menuIcon}>🔍</Text>
            </View>

            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>
                Search Candidates
              </Text>

              <Text style={styles.menuText}>
                Browse available candidates.
              </Text>
            </View>

            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={openRecommendedCandidates}
          >
            <View style={styles.menuIconContainer}>
              <Text style={styles.menuIcon}>⭐</Text>
            </View>

            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>
                Recommended Candidates
              </Text>

              <Text style={styles.menuText}>
                View candidates matched to your requirements.
              </Text>
            </View>

            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={openSavedCandidates}
          >
            <View style={styles.menuIconContainer}>
              <Text style={styles.menuIcon}>❤️</Text>
            </View>

            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>
                Saved Candidates
              </Text>

              <Text style={styles.menuText}>
                Review candidates you have saved.
              </Text>
            </View>

            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={openInbox}
          >
            <View style={styles.menuIconContainer}>
              <Text style={styles.menuIcon}>💬</Text>
            </View>

            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>
                Inbox
              </Text>

              <Text style={styles.menuText}>
                View your marketplace conversations.
              </Text>
            </View>

            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={openSubscribe}
          >
            <View style={styles.menuIconContainer}>
              <Text style={styles.menuIcon}>💳</Text>
            </View>

            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>
                Subscription
              </Text>

              <Text style={styles.menuText}>
                Manage your employer marketplace subscription.
              </Text>
            </View>

            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* MARKETPLACE RULE */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            Nakky Academy Marketplace
          </Text>

          <Text style={styles.infoText}>
            Employers can create their profile, search candidates and browse
            candidate profiles before subscribing.
          </Text>

          <Text style={styles.infoText}>
            An active employer subscription is required to initiate direct
            communication.
          </Text>

          <Text style={styles.infoText}>
            Direct communication also requires the candidate to have an active
            candidate subscription.
          </Text>
        </View>

        <View style={styles.footerSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F9",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F7F7F9",
  },

  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 15,
  },

  content: {
    padding: 18,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  smallHeaderText: {
    color: "#D6007F",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 5,
  },

  welcomeText: {
    fontSize: 26,
    fontWeight: "800",
    color: "#171717",
  },

  headerSubtitle: {
    color: "#777",
    fontSize: 14,
    marginTop: 4,
  },

  notificationButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  notificationIcon: {
    fontSize: 21,
  },

  marketplaceBanner: {
    backgroundColor: "#D6007F",
    borderRadius: 20,
    padding: 20,
    marginBottom: 22,
    elevation: 4,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  marketplaceEyebrow: {
    color: "#FFD84D",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  marketplaceTitle: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "800",
    marginTop: 7,
  },

  marketplaceText: {
    color: "#FFFFFF",
    opacity: 0.92,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },

  marketplaceButton: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginTop: 15,
  },

  marketplaceButtonText: {
    color: "#D6007F",
    fontWeight: "800",
    fontSize: 14,
  },

  section: {
    marginBottom: 22,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#171717",
    marginBottom: 10,
  },

  subscriptionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
  },

  subscriptionCardActive: {
    borderColor: "#A9D8B4",
  },

  subscriptionCardInactive: {
    borderColor: "#E5D1DC",
  },

  subscriptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  subscriptionLabel: {
    color: "#777",
    fontSize: 13,
    marginBottom: 4,
  },

  subscriptionValue: {
    fontSize: 21,
    fontWeight: "800",
  },

  activeText: {
    color: "#198754",
  },

  inactiveText: {
    color: "#D6007F",
  },

  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },

  statusBadgeActive: {
    backgroundColor: "#E5F5E9",
  },

  statusBadgeInactive: {
    backgroundColor: "#FCEAF3",
  },

  statusBadgeText: {
    fontSize: 10,
    fontWeight: "900",
  },

  statusBadgeTextActive: {
    color: "#198754",
  },

  statusBadgeTextInactive: {
    color: "#D6007F",
  },

  expiryText: {
    color: "#666",
    fontSize: 13,
    marginTop: 10,
  },

  subscriptionDescription: {
    color: "#666",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
  },

  primaryButton: {
    backgroundColor: "#D6007F",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 15,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },

  outlineButton: {
    borderWidth: 1.5,
    borderColor: "#D6007F",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
    marginTop: 15,
  },

  outlineButtonText: {
    color: "#D6007F",
    fontWeight: "800",
    fontSize: 14,
  },

  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 17,
    borderWidth: 1,
    borderColor: "#E7E7E7",
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  profileIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#FCEAF3",
    justifyContent: "center",
    alignItems: "center",
  },

  profileIcon: {
    fontSize: 22,
  },

  profileContent: {
    flex: 1,
    marginLeft: 12,
  },

  profileTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#222",
  },

  profileText: {
    color: "#777",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },

  grid: {
    flexDirection: "row",
    gap: 10,
  },

  actionCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 15,
    minHeight: 150,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },

  actionIcon: {
    fontSize: 26,
    marginBottom: 10,
  },

  actionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#222",
  },

  actionText: {
    color: "#777",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 5,
  },

  fullActionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 14,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },

  fullActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#FCEAF3",
    justifyContent: "center",
    alignItems: "center",
  },

  fullActionContent: {
    flex: 1,
    marginLeft: 12,
  },

  fullActionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#222",
  },

  fullActionText: {
    color: "#777",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },

  communicationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },

  communicationIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#FCEAF3",
    justifyContent: "center",
    alignItems: "center",
  },

  communicationContent: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 5,
  },

  communicationTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#222",
  },

  communicationText: {
    color: "#777",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },

  warningCard: {
    backgroundColor: "#FFF9E5",
    borderRadius: 14,
    padding: 13,
    marginTop: 10,
    flexDirection: "row",
  },

  warningIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFD84D",
    color: "#171717",
    textAlign: "center",
    textAlignVertical: "center",
    fontWeight: "900",
    fontSize: 17,
    overflow: "hidden",
  },

  warningContent: {
    flex: 1,
    marginLeft: 10,
  },

  warningTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#222",
  },

  warningText: {
    fontSize: 12,
    color: "#666",
    lineHeight: 17,
    marginTop: 3,
  },

  menuRow: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 14,
    marginBottom: 9,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E9E9E9",
  },

  menuIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#FCEAF3",
    justifyContent: "center",
    alignItems: "center",
  },

  menuIcon: {
    fontSize: 20,
  },

  menuContent: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 8,
  },

  menuTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#222",
  },

  menuText: {
    color: "#777",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },

  arrow: {
    fontSize: 28,
    color: "#AAA",
  },

  infoCard: {
    backgroundColor: "#F0F0F2",
    borderRadius: 15,
    padding: 16,
    marginTop: 2,
  },

  infoTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#222",
    marginBottom: 8,
  },

  infoText: {
    fontSize: 12,
    color: "#666",
    lineHeight: 18,
    marginBottom: 7,
  },

  footerSpace: {
    height: 20,
  },
});