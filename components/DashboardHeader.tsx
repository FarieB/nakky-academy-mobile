import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import useNotificationBadge from "../src/hooks/useNotificationBadge";

type Props = {
  title: string;
  subtitle?: string;
};

export default function DashboardHeader({
  title,
  subtitle,
}: Props) {
  const router = useRouter();
  const badge = useNotificationBadge();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && (
            <Text style={styles.subtitle}>
              {subtitle}
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={() => router.push("/notifications" as any)}
        >
          <View style={styles.notificationContainer}>
            <Text style={styles.bell}>🔔</Text>
            
            {badge > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {badge > 99 ? "99+" : badge}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 25,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#d81b60",
  },

  subtitle: {
    color: "#777",
    marginTop: 4,
    fontSize: 15,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  notificationContainer: {
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
  },

  bell: {
    fontSize: 28,
  },

  badge: {
    position: "absolute",
    right: -2,
    top: -2,
    backgroundColor: "red",
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },

  badgeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 10,
  },
});
