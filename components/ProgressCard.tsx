import { StyleSheet, Text, View } from "react-native";
import { Theme } from "../constants/theme";

type Props = {
  title: string;
  progress: number;
};

export default function ProgressCard({
  title,
  progress,
}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.bar}>
        <View
          style={[
            styles.fill,
            { width: `${progress}%` },
          ]}
        />
      </View>

      <Text style={styles.percent}>
        {progress}% Complete
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.card,
    padding: 18,
    borderRadius: Theme.radius.md,
    marginBottom: 18,
  },

  title: {
    fontWeight: "bold",
    fontSize: 17,
    marginBottom: 12,
  },

  bar: {
    height: 12,
    backgroundColor: "#ececec",
    borderRadius: 10,
    overflow: "hidden",
  },

  fill: {
    height: 12,
    backgroundColor: Theme.colors.primary,
  },

  percent: {
    marginTop: 10,
    color: Theme.colors.subtitle,
  },
});