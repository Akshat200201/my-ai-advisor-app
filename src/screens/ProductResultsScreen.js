import React, { useState } from "react";
import { View, Button, FlatList } from "react-native";
import AnimatedBackground from "../components/AnimatedBackground";
import ProductCard from "../components/ProductCard";

export default function ProductResultsScreen({ results }) {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      {/* Magical animated background */}
      <AnimatedBackground darkMode={darkMode} />

      {/* Dark theme toggle */}
      <Button
        title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        onPress={() => setDarkMode(!darkMode)}
      />

      {/* Product results */}
      <FlatList
        data={results}
        keyExtractor={(item, i) => i.toString()}
        renderItem={({ item }) => <ProductCard item={item} />}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}
