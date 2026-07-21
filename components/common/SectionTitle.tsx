import { StyleSheet, Text } from "react-native";
import { Colors } from "./theme";

type Props = {
  title: string;
};

export default function SectionTitle({ title }: Props) {
  return <Text style={styles.title}>{title}</Text>;
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginVertical: 15,
    color: Colors.primary,
  },
});