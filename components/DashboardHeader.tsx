import { StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  subtitle?: string;
};

export default function DashboardHeader({
  title,
  subtitle,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      {subtitle && (
        <Text style={styles.subtitle}>
          {subtitle}
        </Text>
      )}
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
});