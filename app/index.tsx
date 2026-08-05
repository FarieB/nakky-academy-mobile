import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const sliderWidth = width - 40;

const images = [
  require("../assets/images/caregiver.jpg"),
  require("../assets/images/nanny.jpg"),
  require("../assets/images/housekeeper.jpg"),
  require("../assets/images/student.jpg"),
];

const services = [
  { icon: "👵", title: "Elderly Care" },
  { icon: "👶", title: "Child Care" },
  { icon: "🧹", title: "Housekeeping" },
  { icon: "🎓", title: "Online Courses" },
  { icon: "🌿", title: "Gardening" },
  { icon: "🐕", title: "Pet Sitting" },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // ==========================
  // Automatic Image Slider
  // ==========================
  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex =
        currentIndex === images.length - 1 ? 0 : currentIndex + 1;

      scrollRef.current?.scrollTo({
        x: nextIndex * sliderWidth,
        animated: true,
      });

      setCurrentIndex(nextIndex);
    }, 3500);

    return () => clearInterval(interval);
  }, [currentIndex]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Logo */}
      <Image
        source={require("../assets/images/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Nakky Academy</Text>
      <Text style={styles.subtitle}>
        Building Careers.{"\n"}
        Supporting Families.
      </Text>

      {/* Carousel */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(
            event.nativeEvent.contentOffset.x / sliderWidth
          );
          setCurrentIndex(index);
        }}
      >
        {images.map((img, index) => (
          <Image
            key={index}
            source={img}
            style={[styles.carouselImage, { width: sliderWidth }]}
            resizeMode="cover"
          />
        ))}
      </ScrollView>

      <View style={styles.dotsContainer}>
        {images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentIndex === index && styles.activeDot,
            ]}
          />
        ))}
      </View>

      {/* Description */}
      <Text style={styles.description}>
        Nakky Academy connects skilled caregivers, domestic workers,
        employers and students through professional training,
        verification and employment opportunities across South Africa.
      </Text>

      {/* Feature Cards */}
      <Text style={styles.sectionTitle}>Our Services</Text>
      <View style={styles.grid}>
        {services.map((item) => (
          <View key={item.title} style={styles.card}>
            <Text style={styles.cardIcon}>{item.icon}</Text>
            <Text style={styles.cardTitle}>{item.title}</Text>
          </View>
        ))}
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>✔</Text>
          <Text style={styles.statText}>
            Verified{"\n"}Candidates
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>🎓</Text>
          <Text style={styles.statText}>
            Professional{"\n"}Training
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>🤝</Text>
          <Text style={styles.statText}>
            Trusted{"\n"}Employers
          </Text>
        </View>
      </View>

      {/* Buttons */}
      <TouchableOpacity
        style={styles.loginButton}
        onPress={() => router.push("/login")}
      >
        <Text style={styles.loginText}>LOGIN</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.registerButton}
        onPress={() => router.push("/register")}
      >
        <Text style={styles.registerText}>CREATE ACCOUNT</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
  },
  logo: {
    width: 130,
    height: 130,
    alignSelf: "center",
    marginTop: 50,
  },
  title: {
    textAlign: "center",
    fontSize: 34,
    fontWeight: "bold",
    color: "#E91E63",
  },
  subtitle: {
    textAlign: "center",
    fontSize: 18,
    color: "#666",
    marginTop: 10,
    marginBottom: 25,
  },
  carouselImage: {
    width: "100%",
    height: 250,
    borderRadius: 20,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 15,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ccc",
    marginHorizontal: 4,
  },
  activeDot: {
    width: 22,
    backgroundColor: "#E91E63",
  },
  description: {
    marginTop: 25,
    textAlign: "center",
    fontSize: 16,
    lineHeight: 25,
    color: "#555",
  },
  sectionTitle: {
    marginTop: 35,
    marginBottom: 20,
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    elevation: 4,
  },
  cardIcon: {
    fontSize: 34,
  },
  cardTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#444",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 25,
    marginBottom: 30,
  },
  stat: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 34,
  },
  statText: {
    marginTop: 8,
    textAlign: "center",
    color: "#555",
    fontSize: 13,
  },
  loginButton: {
    backgroundColor: "#E91E63",
    padding: 18,
    borderRadius: 18,
    elevation: 5,
  },
  loginText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 18,
  },
  registerButton: {
    marginTop: 16,
    borderWidth: 2,
    borderColor: "#E91E63",
    padding: 18,
    borderRadius: 18,
  },
  registerText: {
    color: "#E91E63",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 18,
  },
});