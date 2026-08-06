import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

export default function useAdminGuard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const userString = await AsyncStorage.getItem("user");

        if (!userString) {
          router.replace("/login");
          return;
        }

        const user = JSON.parse(userString);

        if (user.role !== "admin") {
          router.replace("/login");
          return;
        }

        setLoading(false);
      } catch (err) {
        router.replace("/login");
      }
    };

    checkAdmin();
  }, []);

  return loading;
}