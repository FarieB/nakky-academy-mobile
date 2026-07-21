import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  title: string;
  progress: number;
  lessons: number;
  onPress: () => void;
};

export default function CourseCard({
  title,
  progress,
  lessons,
  onPress,
}: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
    >
      <View style={styles.imagePlaceholder}>
        <Text style={styles.icon}>📚</Text>
      </View>

      <Text style={styles.title}>
        {title}
      </Text>

      <Text style={styles.lessons}>
        {lessons} Lessons
      </Text>

      <View style={styles.bar}>
        <View
          style={[
            styles.fill,
            { width: `${progress}%` },
          ]}
        />
      </View>

      <Text style={styles.progress}>
        {progress}% Complete
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({

  card:{
    width:220,
    backgroundColor:"#fff",
    borderRadius:16,
    padding:15,
    marginRight:15,
    elevation:4,
  },

  imagePlaceholder:{
    height:120,
    backgroundColor:"#f8bbd0",
    borderRadius:12,
    justifyContent:"center",
    alignItems:"center",
    marginBottom:15,
  },

  icon:{
    fontSize:48,
  },

  title:{
    fontSize:18,
    fontWeight:"bold",
    marginBottom:6,
  },

  lessons:{
    color:"#666",
    marginBottom:12,
  },

  bar:{
    height:10,
    backgroundColor:"#ececec",
    borderRadius:8,
    overflow:"hidden",
  },

  fill:{
    height:10,
    backgroundColor:"#d81b60",
  },

  progress:{
    marginTop:10,
    color:"#666",
  }

});