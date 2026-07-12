import { useRouter } from "expo-router";
import { Button, Text, View } from "react-native";

export default function StudentDashboard() {
  const router = useRouter();

  return (
    <View style={{ padding: 20, marginTop: 60 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold" }}>
        Student Dashboard
      </Text>

      <Button
        title="Browse Courses"
        onPress={() => router.push("/student/courses" as any)}
      />
    </View>
  );
}