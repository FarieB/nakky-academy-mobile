import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  title: string;
  subtitle: string;
  onPress: () => void;
};

export default function FeaturedCourse({
  title,
  subtitle,
  onPress,
}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.badge}>FEATURED COURSE</Text>

      <Text style={styles.title}>
        {title}
      </Text>

      <Text style={styles.subtitle}>
        {subtitle}
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={onPress}
      >
        <Text style={styles.buttonText}>
          Enrol Now
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({

  card:{
    backgroundColor:"#d81b60",
    borderRadius:18,
    padding:22,
    marginBottom:25,
  },

  badge:{
    color:"#fff",
    opacity:0.8,
    marginBottom:10,
    fontWeight:"600",
  },

  title:{
    fontSize:24,
    fontWeight:"bold",
    color:"#fff",
  },

  subtitle:{
    marginTop:10,
    color:"#fff",
    marginBottom:20,
    lineHeight:22,
  },

  button:{
    backgroundColor:"#fff",
    alignSelf:"flex-start",
    paddingHorizontal:20,
    paddingVertical:10,
    borderRadius:10,
  },

  buttonText:{
    color:"#d81b60",
    fontWeight:"bold",
  }

});