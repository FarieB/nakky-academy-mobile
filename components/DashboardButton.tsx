import { StyleSheet, Text, TouchableOpacity } from "react-native";

type Props = {
  title: string;
  onPress: () => void;
};

export default function DashboardButton({
  title,
  onPress,
}: Props) {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#d81b60",
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: "center",
  },

  text: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});