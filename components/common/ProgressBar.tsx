import { StyleSheet, View } from "react-native";
import { Colors } from "./theme";

type Props = {
  progress: number;
};

export default function ProgressBar({ progress }: Props) {
  return (
    <View style={styles.background}>
      <View
        style={[
          styles.fill,
          {
            width: `${progress}%`,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    height: 10,
    backgroundColor: "#EAEAEA",
    borderRadius: 8,
    overflow: "hidden",
    marginVertical: 10,
  },

  fill: {
    height: 10,
    backgroundColor: Colors.primary,
  },
});