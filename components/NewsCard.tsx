import { StyleSheet, Text, View } from "react-native";

export default function NewsCard({
    title,
    description,
}:{
    title:string;
    description:string;
}){

return(

<View style={styles.card}>

<Text style={styles.title}>
{title}
</Text>

<Text style={styles.description}>
{description}
</Text>

</View>

)

}

const styles=StyleSheet.create({

card:{
backgroundColor:"#fff",
padding:18,
borderRadius:15,
marginBottom:15,
elevation:3,
},

title:{
fontWeight:"bold",
fontSize:18,
marginBottom:8,
},

description:{
color:"#666",
lineHeight:22,
}

});