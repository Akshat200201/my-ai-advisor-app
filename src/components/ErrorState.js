import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function ErrorState({ message = "Something went wrong.", onRetry }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Oops!</Text>
      <Text style={styles.text}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.btn} onPress={onRetry}>
          <Text style={styles.btnText}>Try again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 24, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  text: { color: "#4b5563", textAlign: "center", paddingHorizontal: 16 },
  btn: { marginTop: 12, backgroundColor: "#111827", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  btnText: { color: "#fff", fontWeight: "600" }
});
