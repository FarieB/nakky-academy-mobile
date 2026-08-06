import { Text, View } from "react-native";
// 1. Add the admin guard hook import
import useAdminGuard from "../../src/hooks/useAdminGuard";

export default function VerificationsScreen() {
  // 2. Initialize the guard at the very start of the component
  const isAdminLoading = useAdminGuard();

  // 3. Return null immediately if the security guard is still verifying authorization
  if (isAdminLoading) {
    return null;
  }

  return (
    <View style={{ padding: 20 }}>
      <Text>Admin - Verifications</Text>
    </View>
  );
}
