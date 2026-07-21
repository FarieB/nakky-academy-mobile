import { StyleSheet, Text, View } from "react-native";

export default function AchievementCard({
    emoji,
    title,
}:{
    emoji:string;
    title:string;
}){

return(

<View style={styles.card}>

<Text style={styles.icon}>
{emoji}
</Text>

<Text style={styles.title}>
{title}
</Text>

</View>

)

}

const styles=StyleSheet.create({

card:{
width:120,
backgroundColor:"#fff",
padding:15,
borderRadius:15,
alignItems:"center",
marginRight:15,
elevation:3,
},

icon:{
fontSize:38,
marginBottom:10,
},

title:{
fontWeight:"600",
textAlign:"center",
}

});