import { StyleSheet, Text, View } from "react-native";

export default function SectionTitle({
  title,
}: {
  title: string;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({

  container:{
    marginTop:25,
    marginBottom:15,
  },

  title:{
    fontSize:22,
    fontWeight:"700",
    color:"#d81b60",
  }

});