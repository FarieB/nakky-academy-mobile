import { Pressable, StyleSheet, Text } from "react-native";
import { Colors } from "./theme";

type Props = {
  title: string;
  onPress: () => void;
};

export default function PrimaryButton({
  title,
  onPress,
}: Props) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  text: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});