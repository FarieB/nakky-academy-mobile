import { StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  value?: string | number;
  children?: React.ReactNode;
};

export default function DashboardCard({
  title,
  value,
  children,
}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      {value !== undefined && (
        <Text style={styles.value}>{value}</Text>
      )}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    marginBottom: 15,
    elevation: 3,
  },

  title: {
    fontSize: 15,
    color: "#666",
    marginBottom: 8,
  },

  value: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#d81b60",
  },
});