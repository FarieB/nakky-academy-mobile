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
  View
} from "react-native";

import API from "../../src/services/api";

type SubscriptionStatus = {
  active?: boolean;
  status?: string;
  expiry?: string | null;
  subscriptionStatus?: string;
  subscriptionExpiry?: string | null;
  profileVerified?: boolean;
  verifiedBadge?: boolean;
};

type DashboardData = {
  user?: {
    _id?: string;
    firstName?: string;
    surname?: string;
    name?: string;
    role?: string;
    accountStatus?: string;
  };
  candidate?: {
    _id?: string;
    firstName?: string;
    surname?: string;
    profileCompleted?: boolean;
    profileVerified?: boolean;
    verificationStatus?: string;
    verifiedBadge?: boolean;
  };
  profile?: {
    _id?: string;
    firstName?: string;
    surname?: string;
    profileCompleted?: boolean;
    profileVerified?: boolean;
    verificationStatus?: string;
    verifiedBadge?: boolean;
  };
    profileCompletion?: {
    percentage: number;
    completed: number;
    total: number;
    missing: Record<string, boolean>;
  };
  [key: string]: any;
};

export default function CandidateDashboard() {
  const router = useRouter();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [subscription, setSubscription] =
    useState<SubscriptionStatus | null>(null);

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

      const [dashboardResponse, subscriptionResponse] =
        await Promise.allSettled([
          API.get("/dashboard"),
         API.get("/payments/candidate-subscription")
        ]);

      if (dashboardResponse.status === "fulfilled") {
        setDashboard(dashboardResponse.value.data || null);
      }

      if (subscriptionResponse.status === "fulfilled") {
        setSubscription(subscriptionResponse.value.data || null);
      }
    } catch (error: any) {
      console.error(
        "CANDIDATE DASHBOARD ERROR:",
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

  const getCandidateName = () => {
    const user = dashboard?.user;
    const candidate = dashboard?.candidate || dashboard?.profile;

    if (candidate?.firstName) {
      return `${candidate.firstName}${
        candidate.surname ? ` ${candidate.surname}` : ""
      }`;
    }

    if (user?.firstName) {
      return `${user.firstName}${user.surname ? ` ${user.surname}` : ""}`;
    }

    if (user?.name) {
      return user.name;
    }

    return "Candidate";
  };

  const isMarketplaceActive = Boolean(
    subscription?.active === true ||
      subscription?.status === "active" ||
      subscription?.subscriptionStatus === "active"
  );

  const subscriptionExpiry =
    subscription?.expiry || subscription?.subscriptionExpiry || null;

  const isProfileVerified = Boolean(
    subscription?.profileVerified ||
      subscription?.verifiedBadge ||
      dashboard?.candidate?.profileVerified ||
      dashboard?.candidate?.verifiedBadge ||
      dashboard?.profile?.profileVerified ||
      dashboard?.profile?.verifiedBadge
  );

  const profileCompletion = dashboard?.profileCompletion;

  const profilePercentage = Math.max(
    0,
    Math.min(100, profileCompletion?.percentage ?? 0)
  );

  const profileCompleted =
    profileCompletion != null
      ? profilePercentage === 100
      : Boolean(
          dashboard?.candidate?.profileCompleted ||
            dashboard?.profile?.profileCompleted ||
            dashboard?.profileCompleted
        );

  const getSubscriptionLabel = () => {
    if (isMarketplaceActive) {
      return "Active";
    }

    const status =
      subscription?.status || subscription?.subscriptionStatus || "";

    if (status === "expired") {
      return "Expired";
    }

    if (status === "pending") {
      return "Payment Pending";
    }

    return "Not Active";
  };

  const formatExpiry = () => {
    if (!subscriptionExpiry) {
      return "Not active";
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

  const openMarketplace = () => {
    router.push("/(candidate)/marketplace");
  };

  const openRecommendations = () => {
    router.push("/(candidate)/recommendations");
  };

  const openProfile = () => {
    router.push("/(candidate)/profile-builder");
  };

  const openVerification = () => {
    router.push("/(candidate)/verification-info");
  };

  const openInbox = () => {
    router.push("/(candidate)/inbox");
  };

  const openNotifications = () => {
    router.push("/(candidate)/notifications");
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
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
            <Text style={styles.smallHeaderText}>NAKKY ACADEMY</Text>

            <Text style={styles.welcomeText}>
              Welcome, {getCandidateName()}
            </Text>

            <Text style={styles.headerSubtitle}>
              Your candidate dashboard
            </Text>
          </View>

          <TouchableOpacity
            style={styles.notificationButton}
            onPress={openNotifications}
          >
            <Text style={styles.notificationIcon}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* MARKETPLACE BANNER */}
        <TouchableOpacity
          style={styles.marketplaceBanner}
          onPress={openMarketplace}
          activeOpacity={0.9}
        >
          <View style={styles.marketplaceBannerContent}>
            <Text style={styles.marketplaceEyebrow}>NAKKY MARKETPLACE</Text>

            <Text style={styles.marketplaceTitle}>
              Find opportunities and employers
            </Text>

            <Text style={styles.marketplaceText}>
              Browse employers, jobs, recommendations and manage your
              marketplace activity.
            </Text>

            <View style={styles.marketplaceButton}>
              <Text style={styles.marketplaceButtonText}>
                Open Marketplace →
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* SUBSCRIPTION STATUS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Marketplace Access</Text>

          <View
            style={[
              styles.statusCard,
              isMarketplaceActive
                ? styles.statusCardActive
                : styles.statusCardInactive,
            ]}
          >
            <View style={styles.statusHeader}>
              <View>
                <Text style={styles.statusLabel}>Annual Subscription</Text>

                <Text
                  style={[
                    styles.statusValue,
                    isMarketplaceActive
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
                  isMarketplaceActive
                    ? styles.statusBadgeActive
                    : styles.statusBadgeInactive,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    isMarketplaceActive
                      ? styles.statusBadgeTextActive
                      : styles.statusBadgeTextInactive,
                  ]}
                >
                  {isMarketplaceActive ? "ACTIVE" : "INACTIVE"}
                </Text>
              </View>
            </View>

            {isMarketplaceActive && subscriptionExpiry ? (
              <Text style={styles.expiryText}>
                Active until {formatExpiry()}
              </Text>
            ) : (
              <Text style={styles.statusDescription}>
                Your R200 candidate verification payment also provides your
                annual marketplace subscription.
              </Text>
            )}

            {!isMarketplaceActive && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={openVerification}
              >
                <Text style={styles.primaryButtonText}>
                  Verification & Annual Subscription
                </Text>
              </TouchableOpacity>
            )}

            {isMarketplaceActive && (
              <Text style={styles.communicationNote}>
                ✓ You can communicate with employers who also have an active
                subscription.
              </Text>
            )}
          </View>
        </View>

        {/* PROFILE STATUS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Candidate Profile</Text>

          <View style={styles.profileStatusCard}>
            <View style={styles.profileStatusRow}>
              <View>
                <Text style={styles.profileStatusTitle}>
                  {profileCompleted
                    ? "Profile completed"
                    : "Complete your profile"}
                </Text>

                <Text style={styles.profileStatusText}>
                  {profileCompleted
                    ? "Employers can view your marketplace profile."
                    : "Complete your profile so employers can discover you."}
                </Text>
              </View>

              <Text style={styles.profileStatusIcon}>
                {profileCompleted ? "✓" : "!"}
              </Text>
            </View>

            
            <View style={styles.completionHeader}>
              <Text style={styles.profileStatusText}>
                Profile completion
              </Text>

              <Text style={styles.completionPercentage}>
                {profilePercentage}%
              </Text>
            </View>

            <View
              style={styles.progressTrack}
              accessibilityRole="progressbar"
              accessibilityValue={{
                min: 0,
                max: 100,
                now: profilePercentage,
              }}
            >
              <View
                style={[
                  styles.progressFill,
                  { width: `${profilePercentage}%` },
                ]}
              />
            </View>

            <Text style={styles.profileStatusText}>
              {profileCompletion
                ? `${profileCompletion.completed} of ${profileCompletion.total} profile sections completed`
                : "Refresh your dashboard to load your profile completion."}
            </Text>


            <TouchableOpacity
              style={styles.outlineButton}
              onPress={openProfile}
            >
              <Text style={styles.outlineButtonText}>
                {profileCompleted ? "Edit My Profile" : "Build My Profile"}
              </Text>
            </TouchableOpacity>
          </View>

          {isProfileVerified && (
            <View style={styles.verifiedCard}>
              <Text style={styles.verifiedIcon}>✓</Text>

              <View style={styles.verifiedContent}>
                <Text style={styles.verifiedTitle}>
                  Nakky Verified Candidate
                </Text>

                <Text style={styles.verifiedText}>
                  Your candidate verification has been approved.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* MARKETPLACE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Marketplace</Text>

          <View style={styles.grid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={openMarketplace}
            >
              <Text style={styles.actionIcon}>🔎</Text>

              <Text style={styles.actionTitle}>Find Opportunities</Text>

              <Text style={styles.actionText}>
                Browse employers, jobs and opportunities.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={openRecommendations}
            >
              <Text style={styles.actionIcon}>⭐</Text>

              <Text style={styles.actionTitle}>Recommendations</Text>

              <Text style={styles.actionText}>
                See recommended marketplace matches.
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ACCOUNT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Account</Text>

          <TouchableOpacity style={styles.menuRow} onPress={openProfile}>
            <View style={styles.menuIconContainer}>
              <Text style={styles.menuIcon}>👤</Text>
            </View>

            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>My Candidate Profile</Text>

              <Text style={styles.menuText}>
                Update your information, experience and documents.
              </Text>
            </View>

            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuRow} onPress={openInbox}>
            <View style={styles.menuIconContainer}>
              <Text style={styles.menuIcon}>💬</Text>
            </View>

            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Messages</Text>

              <Text style={styles.menuText}>
                Communicate with employers when both accounts are subscribed.
              </Text>
            </View>

            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={openVerification}
          >
            <View style={styles.menuIconContainer}>
              <Text style={styles.menuIcon}>🛡️</Text>
            </View>

            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Verification & Subscription</Text>

              <Text style={styles.menuText}>
                Manage your R200 annual verification and marketplace access.
              </Text>
            </View>

            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={openNotifications}
          >
            <View style={styles.menuIconContainer}>
              <Text style={styles.menuIcon}>🔔</Text>
            </View>

            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Notifications</Text>

              <Text style={styles.menuText}>
                View messages and important account notifications.
              </Text>
            </View>

            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* RULE NOTICE */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How marketplace communication works</Text>

          <Text style={styles.infoText}>
            You can create your profile, upload documents, browse opportunities
            and be discovered before paying.
          </Text>

          <Text style={styles.infoText}>
            Your R200 verification payment activates your candidate
            verification and one-year marketplace subscription after approval.
          </Text>

          <Text style={styles.infoText}>
            Direct communication requires both the candidate and employer to
            have active subscriptions.
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

  marketplaceBannerContent: {
    width: "100%",
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

  statusCard: {
    borderRadius: 16,
    padding: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
  },

  statusCardActive: {
    borderColor: "#A9D8B4",
  },

  statusCardInactive: {
    borderColor: "#E5D1DC",
  },

  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  statusLabel: {
    color: "#777",
    fontSize: 13,
    marginBottom: 4,
  },

  statusValue: {
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

  statusDescription: {
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

  communicationNote: {
    color: "#198754",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
    fontWeight: "600",
  },

  profileStatusCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 17,
    borderWidth: 1,
    borderColor: "#E7E7E7",
  },

  profileStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  profileStatusTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#222",
  },

  profileStatusText: {
    color: "#777",
    fontSize: 13,
    marginTop: 5,
    maxWidth: "88%",
    lineHeight: 18,
  },

  profileStatusIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FCEAF3",
    color: "#D6007F",
    textAlign: "center",
    textAlignVertical: "center",
    fontWeight: "900",
    fontSize: 18,
    overflow: "hidden",
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

  verifiedCard: {
    marginTop: 10,
    backgroundColor: "#FFF9E5",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  verifiedIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFD84D",
    color: "#171717",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
    textAlignVertical: "center",
    overflow: "hidden",
  },

  verifiedContent: {
    flex: 1,
    marginLeft: 11,
  },

  verifiedTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#222",
  },

  verifiedText: {
    fontSize: 12,
    color: "#666",
    marginTop: 3,
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
    minHeight: 145,
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

  
  completionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
  },

  completionPercentage: {
    fontSize: 18,
    fontWeight: "700",
    color: "#D41472",
  },

  progressTrack: {
    height: 8,
    backgroundColor: "#E8E8E8",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 8,
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#D41472",
    borderRadius: 8,
  },

});