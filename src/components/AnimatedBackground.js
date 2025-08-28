import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";

export default function AnimatedBackground({ darkMode }) {
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [rotate]);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View
      pointerEvents="none"
      style={[
        styles.container,
        { backgroundColor: darkMode ? "#0b1220" : "#f9fafb" }
      ]}
    >
      {/* Soft glowing circles */}
      <Animated.View
        style={[
          styles.circle,
          {
            backgroundColor: darkMode ? "#1e3a8a" : "#93c5fd",
            transform: [{ rotate: spin }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.circle,
          {
            backgroundColor: darkMode ? "#9333ea" : "#fbbf24",
            top: "58%",
            left: "62%",
            transform: [{ rotate: spin }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  circle: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.14,
    top: "18%",
    left: "18%",
  },
});
