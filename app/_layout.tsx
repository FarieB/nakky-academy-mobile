import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  Image,
  StyleSheet,
  View,
} from "react-native";

// Keep the native splash screen visible while the React Native app starts.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [showCustomSplash, setShowCustomSplash] = useState(true);

  useEffect(() => {
    const startApp = async () => {
      // Remove Android's native splash screen.
      await SplashScreen.hideAsync();

      // Show our full-screen custom splash for 3 seconds.
      await new Promise((resolve) => setTimeout(resolve, 3000));

      setShowCustomSplash(false);
    };

    startApp();
  }, []);

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />

      {showCustomSplash && (
        <View style={styles.splashContainer}>
          <StatusBar hidden />

          <Image
            source={require("../assets/images/splash.png")}
            style={styles.splashImage}
            resizeMode="cover"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  splashContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#000000",
    zIndex: 9999,
  },

  splashImage: {
    width: "100%",
    height: "100%",
  },
});