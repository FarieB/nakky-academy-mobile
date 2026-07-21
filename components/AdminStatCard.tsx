import { StyleSheet, Text, View } from "react-native";

interface Props {
  icon: string;
  title: string;
  value: string | number;
}

export default function AdminStatCard({
  icon,
  title,
  value,
}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.icon}>{icon}</Text>

      <Text style={styles.title}>{title}</Text>

      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 18,
    marginBottom: 15,
    borderRadius: 16,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 3,
  },

  icon: {
    fontSize: 30,
    marginBottom: 10,
  },

  title: {
    color: "#777",
    fontSize: 15,
  },

  value: {
    marginTop: 6,
    fontSize: 28,
    fontWeight: "bold",
    color: "#E91E63",
  },
});