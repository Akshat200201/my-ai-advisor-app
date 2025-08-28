import React from "react";
import { View } from "react-native";
import * as Animatable from "react-native-animatable";

export default function LoadingState() {
  return (
    <View style={{ gap: 12, marginTop: 16 }}>
      {[...Array(10)].map((_, i) => (
        <Animatable.View
          key={i}
          animation={{ 0: { opacity: 0.4 }, 0.5: { opacity: 1 }, 1: { opacity: 0.4 } }}
          iterationCount="infinite"
          duration={1000}
          useNativeDriver
          style={{
            height: 96, borderRadius: 14, backgroundColor: "#f3f4f6",
            borderWidth: 1, borderColor: "#e5e7eb"
          }}
        />
      ))}
    </View>
  );
}
