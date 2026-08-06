import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const sliderWidth = width;

const images = [
  require("../assets/images/caregiver.jpg"),
  require("../assets/images/nanny.jpg"),
  require("../assets/images/housekeeper.jpg"),
  require("../assets/images/student.jpg"),
];

export default function ImageCarousel() {
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex =
        currentIndex === images.length - 1
          ? 0
          : currentIndex + 1;

      scrollRef.current?.scrollTo({
        x: nextIndex * sliderWidth,
        animated: true,
      });

      setCurrentIndex(nextIndex);
    }, 3500);

    return () => clearInterval(interval);
  }, [currentIndex]);

  return (
    <>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(
            event.nativeEvent.contentOffset.x /
              sliderWidth
          );

          setCurrentIndex(index);
        }}
      >
        {images.map((img, index) => (
          <Image
            key={index}
            source={img}
            style={styles.image}
            resizeMode="cover"
          />
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentIndex === index &&
                styles.activeDot,
            ]}
          />
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  image: {
    width: sliderWidth,
    height: 260,
  },

  dots: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
    marginBottom: 10,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#CCC",
    marginHorizontal: 4,
  },

  activeDot: {
    width: 22,
    backgroundColor: "#E91E63",
  },
});