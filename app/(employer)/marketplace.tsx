import { useRouter } from "expo-router";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function EmployerMarketplace() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>NAKKY ACADEMY</Text>

        <Text style={styles.title}>Employer Marketplace</Text>

        <Text style={styles.subtitle}>
          Find qualified candidates and manage your hiring opportunities.
        </Text>

        <TouchableOpacity
          style={styles.featuredCard}
          onPress={() =>
            router.push("/(employer)/search-candidates")
          }
        >
          <Text style={styles.featuredIcon}>🔎</Text>

          <View style={styles.featuredContent}>
            <Text style={styles.featuredTitle}>
              Search Candidates
            </Text>

            <Text style={styles.featuredText}>
              Search candidates by worker type, location, experience and
              preferences.
            </Text>
          </View>

          <Text style={styles.arrowWhite}>›</Text>
        </TouchableOpacity>

        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              router.push("/(employer)/recommended-candidates")
            }
          >
            <Text style={styles.icon}>⭐</Text>

            <Text style={styles.cardTitle}>
              Recommended Candidates
            </Text>

            <Text style={styles.cardText}>
              See candidates matched to your requirements.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              router.push("/(employer)/saved-candidates")
            }
          >
            <Text style={styles.icon}>❤️</Text>

            <Text style={styles.cardTitle}>
              Saved Candidates
            </Text>

            <Text style={styles.cardText}>
              Review candidates you have saved.
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => router.push("/(employer)/interviews")}
        >
          <Text style={styles.menuIcon}>📅</Text>

          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>My Interviews</Text>

            <Text style={styles.menuText}>
              Send and manage interview requests with candidates.
            </Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => router.push("/(employer)/inbox")}
        >
          <Text style={styles.menuIcon}>💬</Text>

          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Messages</Text>

            <Text style={styles.menuText}>
              Communicate with candidates when both parties have active
              subscriptions.
            </Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuCard}
          onPress={() =>
            router.push("/(employer)/employer-profile")
          }
        >
          <Text style={styles.menuIcon}>🏠</Text>

          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Employer Profile</Text>

            <Text style={styles.menuText}>
              Manage your household, hiring requirements and family profile.
            </Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            Marketplace communication
          </Text>

          <Text style={styles.infoText}>
            You can search and browse candidates before subscribing.
          </Text>

          <Text style={styles.infoText}>
            An active employer subscription is required to initiate
            communication or interview requests.
          </Text>

          <Text style={styles.infoText}>
            The candidate must also have an active subscription before direct
            communication can take place.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back to Dashboard</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F9",
  },

  content: {
    padding: 18,
    paddingBottom: 40,
  },

  eyebrow: {
    color: "#D6007F",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 5,
  },

  title: {
    fontSize: 29,
    fontWeight: "900",
    color: "#171717",
  },

  subtitle: {
    color: "#666",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 7,
    marginBottom: 20,
  },

  featuredCard: {
    backgroundColor: "#D6007F",
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  featuredIcon: {
    fontSize: 32,
  },

  featuredContent: {
    flex: 1,
    marginLeft: 13,
  },

  featuredTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  featuredText: {
    color: "#FFFFFF",
    opacity: 0.9,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },

  arrowWhite: {
    color: "#FFFFFF",
    fontSize: 28,
  },

  grid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },

  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 15,
    minHeight: 145,
    borderWidth: 1,
    borderColor: "#E7E7E7",
  },

  icon: {
    fontSize: 27,
    marginBottom: 9,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#222",
  },

  cardText: {
    color: "#777",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 5,
  },

  menuCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginTop: 9,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E7E7E7",
  },

  menuIcon: {
    fontSize: 24,
    width: 43,
    textAlign: "center",
  },

  menuContent: {
    flex: 1,
    marginLeft: 10,
    paddingRight: 7,
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
    color: "#AAA",
    fontSize: 28,
  },

  infoCard: {
    backgroundColor: "#F0F0F2",
    borderRadius: 15,
    padding: 16,
    marginTop: 18,
  },

  infoTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#222",
    marginBottom: 7,
  },

  infoText: {
    color: "#666",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 6,
  },

  backButton: {
    borderWidth: 1.5,
    borderColor: "#D6007F",
    borderRadius: 11,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 18,
  },

  backButtonText: {
    color: "#D6007F",
    fontWeight: "800",
    fontSize: 14,
  },
});