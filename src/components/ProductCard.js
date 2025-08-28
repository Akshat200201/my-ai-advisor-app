import React from "react";
import { View, Text, StyleSheet } from "react-native";

function formatINR(n) {
  const num = Number(n || 0);
  try { return `₹${num.toLocaleString("en-IN")}`; } catch { return `₹${num}`; }
}

export default function ProductCard({ item, dark = false }) {
  if (!item) return null;

  const {
    product_name,
    brand,
    category,
    price,
    description,
    fitScore, 
    _why,     
    summary   
  } = item;

  const C = {
    card: dark ? "#111827" : "#ffffff",
    text: dark ? "#e5e7eb" : "#111827",
    sub: dark ? "#9ca3af" : "#6b7280",
    border: dark ? "#1f2937" : "#e5e7eb",
    badgeIndigoBg: dark ? "#1e293b" : "#eef2ff",
    badgeIndigoBorder: dark ? "#1f2a3a" : "#c7d2fe",
    badgeText: dark ? "#c7d2fe" : "#3730a3",
    shadow: dark ? "0px 6px 20px rgba(0,0,0,0.35)" : "0px 6px 20px rgba(17,24,39,0.06)",
  };

  return (
    <View style={[
      styles.card,
      { backgroundColor: C.card, borderColor: C.border, boxShadow: C.shadow }
    ]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: C.text }]} numberOfLines={2}>
          {product_name}
        </Text>

        {typeof fitScore === "number" && (
          <View style={[
            styles.badge,
            { backgroundColor: C.badgeIndigoBg, borderColor: C.badgeIndigoBorder }
          ]}>
            <Text style={[styles.badgeText, { color: C.badgeText }]}>
              {Math.round(fitScore)}%
            </Text>
          </View>
        )}
      </View>

      <Text style={[styles.sub, { color: C.sub }]} numberOfLines={1}>
        {brand} • {category}
      </Text>

      <Text style={[styles.price, { color: C.text }]}>{formatINR(price)}</Text>

      {(summary || description) && (
        <Text style={[styles.desc, { color: C.text }]} numberOfLines={3}>
          {summary || description}
        </Text>
      )}

      {!!_why?.length && (
        <View style={{ marginTop: 8 }}>
          <Text style={[styles.whyHeader, { color: C.text }]}>Why we recommend it</Text>
          {_why.slice(0, 3).map((line, i) => (
            <Text key={i} style={[styles.whyItem, { color: C.sub }]}>
              • {line}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 14,
    marginVertical: 8,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8
  },
  title: { flex: 1, fontSize: 16, fontWeight: "700" },
  badge: {
    minWidth: 44,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1
  },
  badgeText: { textAlign: "center", fontSize: 12, fontWeight: "700" },
  sub: { marginTop: 4 },
  price: { marginTop: 6, fontWeight: "700" },
  desc: { marginTop: 6, lineHeight: 20 },
  whyHeader: { fontWeight: "600", marginBottom: 4 },
  whyItem: { marginTop: 2, lineHeight: 20 }
});
