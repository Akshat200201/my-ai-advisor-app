import React, { useCallback, useMemo, useState } from "react";
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { PRODUCT_CATALOG } from "./catalog";
import ErrorState from "./components/ErrorState";
import LoadingState from "./components/LoadingState";
import ProductCard from "./components/ProductCard";
import AnimatedBackground from "./components/AnimatedBackground";
import * as Animatable from "react-native-animatable";
import Constants from "expo-constants";

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || "";

const USE_LLM = Platform.OS !== "web" && Boolean(OPENAI_API_KEY);

const STOPWORDS = new Set([
    "the", "a", "an", "and", "or", "for", "in", "on", "with", "to", "of", "under", "below",
    "less", "than", "need", "i", "me", "my", "men", "man", "women", "woman", "kids", "kid",
    "budget", "price", "cheap", "best", "good", "buy", "new"
]);

function normalizeToken(t) {
    const s = (t || "").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
    if (!s || STOPWORDS.has(s)) return "";
    if (s.length > 3 && s.endsWith("s")) return s.slice(0, -1);
    return s;
}
function tokens(input) {
    return (input || "")
        .toString()
        .toLowerCase()
        .split(/\s+/)
        .map(normalizeToken)
        .filter(Boolean)
        .filter((v, i, arr) => arr.indexOf(v) === i);
}
const SYNONYMS = { shoe: ["sneaker", "footwear", "trainer"], headphone: ["headphones", "headset"], comb: ["brush"] };
function expandToken(t) { const list = SYNONYMS[t]; return list ? [t, ...list] : [t]; }

function extractBudget(query) {
    const q = query.toLowerCase();
    const m = q.match(/(?:under|below|less than|budget|<=?|₹|\$)\s*([0-9]{3,6})/);
    if (m && m[1]) return Number(m[1]);
    return null;
}

function prefilter(catalog, query, limit = 8) {
    const qTokens = tokens(query);
    const budget = extractBudget(query);
    if (!qTokens.length) return [];

    const scored = catalog
        .map((p) => {
            const hay = `${p.brand} ${p.product_name} ${p.category} ${p.description}`.toLowerCase();
            let hits = 0;
            qTokens.forEach((t) => {
                const forms = expandToken(t);
                if (forms.some((f) => hay.includes(f))) hits += 1;
            });
            if (hits === 0) return null;

            let score = hits * 6;
            if (budget !== null) score += p.price <= budget ? 4 : -3;
            if (p.price) score += Math.max(0, 9000 - p.price) / 9000;

            return { ...p, _score: score };
        })
        .filter(Boolean);

    if (!scored.length) return [];
    return scored
        .sort((a, b) => b._score - a._score)
        .slice(0, limit)
        .map(({ _score, ...rest }) => rest);
}

function buildPrompt(userQuery, candidates) {
    const condensed = candidates.map((c) => ({
        productId: c.id,
        name: c.product_name,
        brand: c.brand,
        price: c.price,
        category: c.category,
        description: c.description
    }));

    return [
        `You are an AI Product Advisor.`,
        `USER_QUERY:\n${userQuery}`,
        `CANDIDATES:\n${JSON.stringify(condensed, null, 2)}`,
        `Return ONLY valid JSON with keys: requirements{primaryNeeds[], constraints{budgetINR}}, recommendations[].`,
        `Each recommendation: { productId: string, fitScore: number (0-100), summary: string, reasons: string[] }.`,
    ].join("\n\n");
}

function safeParseJSON(text) {
    if (!text) return null;
    let cleaned = text.trim();
    if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "");
    }
    try { return JSON.parse(cleaned); } catch { return null; }
}

function withTimeout(promise, ms = 15000) {
    return new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error("Network timeout")), ms);
        promise.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
    });
}

async function callOpenAI(userQuery, candidates) {
    const prompt = buildPrompt(userQuery, candidates);
    const res = await withTimeout(fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            temperature: 0.2,
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: "You are an AI Product Advisor that returns JSON only." },
                { role: "user", content: prompt }
            ]
        })
    }), 15000);

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.log("[LLM] HTTP error", res.status, text);
        throw new Error(`OpenAI HTTP ${res.status}`);
    }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? "";
    const parsed = safeParseJSON(text);
    if (!parsed) throw new Error("Model did not return valid JSON.");
    return parsed;
}

function localAdvisor(query, candidates) {
    const qTokens = tokens(query);
    const budget = extractBudget(query);
    const ranked = candidates.map((c) => {
        const baseText = `${c.product_name} ${c.brand} ${c.category} ${c.description}`.toLowerCase();
        let score = 50;
        qTokens.forEach((t) => (score += baseText.includes(t) ? 8 : 0));
        if (budget !== null) score += c.price <= budget ? 12 : -8;
        const reasons = [];
        if (budget !== null && c.price <= budget) reasons.push(`Fits your budget (₹${c.price}).`);
        if (qTokens.some((t) => baseText.includes(t))) reasons.push(`Matches your keywords.`);
        reasons.push(`Category: ${c.category}.`);
        return { ...c, fitScore: Math.max(0, Math.min(100, Math.round(score))), summary: `${c.product_name} by ${c.brand} at ₹${c.price}`, _why: reasons };
    })
        .sort((a, b) => b.fitScore - a.fitScore);
    return ranked;
}

function usePalette(dark) {
    return {
        bg: dark ? "#0b1220" : "#ffffff",
        card: dark ? "#111827" : "#ffffff",
        border: dark ? "#1f2937" : "#e5e7eb",
        text: dark ? "#e5e7eb" : "#111827",
        sub: dark ? "#9ca3af" : "#6b7280",
        inputBg: dark ? "#0f172a" : "#f9fafb",
        chipBg: dark ? "#0f172a" : "#f3f4f6",
        chipBorder: dark ? "#1f2937" : "#e5e7eb",
        bannerBg: dark ? "#172554" : "#fef3c7",
        bannerBorder: dark ? "#1e3a8a" : "#fde68a",
        bannerText: dark ? "#93c5fd" : "#78350f",
        btnBg: "#111827",
        btnText: "#ffffff"
    };
}

export default function AdvisorScreen() {
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("idle");
    const [results, setResults] = useState([]);
    const [error, setError] = useState("");
    const [dark, setDark] = useState(false);

    const C = usePalette(dark);

    const tips = useMemo(
        () => [
            `Examples: "Need a neck massager under 2000"`,
            `"portable ECG for home use"`,
            `"hair growth device with LED, budget 3000"`
        ],
        []
    );

    const quick = useMemo(
        () => ["neck massager under 2000", "portable ECG for home use", "LED hair growth comb"],
        []
    );

    const onSubmit = useCallback(async () => {
        const trimmed = (query || "").trim();
        if (!trimmed) return;

        setStatus("loading");
        setError("");
        setResults([]);

        try {
            const candidates = prefilter(PRODUCT_CATALOG, trimmed, 8);

            if (USE_LLM && candidates.length) {
                let mapped = [];
                try {
                    const out = await callOpenAI(trimmed, candidates);
                    const byId = new Map(PRODUCT_CATALOG.map((p) => [p.id, p]));
                    mapped = (out?.recommendations || [])
                        .map((rec) => {
                            const base =
                                byId.get(rec.productId) ||
                                candidates.find((c) => c.id === rec.productId);
                            if (!base) return null;
                            return { ...base, fitScore: rec.fitScore, summary: rec.summary, _why: rec.reasons };
                        })
                        .filter(Boolean);

                    if (!mapped.length) mapped = localAdvisor(trimmed, candidates);
                } catch {
                    mapped = localAdvisor(trimmed, candidates);
                }
                setResults(mapped);
            } else {
                setResults(candidates.length ? localAdvisor(trimmed, candidates) : []);
            }

            setStatus("success");
        } catch (e) {
            console.error(e);
            setError("We couldn't process the AI response. Please try again.");
            setStatus("error");
        }
    }, [query]);

    const renderItem = ({ item, index }) => (
        <Animatable.View
            animation="fadeInUp"
            delay={index * 60}         
            duration={500}             
            easing="ease-out-cubic"
            useNativeDriver
            style={{ transform: [{ translateY: 0 }] }}
        >
            <ProductCard item={item} dark={dark} />
        </Animatable.View>
    );

    return (
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === "ios" ? "padding" : undefined}
  >
    <View style={styles.bgWrap}>
      <AnimatedBackground darkMode={dark} />
    </View>

    <View style={styles.foreground}>
      <View style={[styles.container, { backgroundColor: "transparent" }]}>
        <View style={[styles.hero, { backgroundColor: C.card, borderColor: C.border }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={[styles.heroTitle, { color: C.text }]}>🛍️ AI Product Advisor</Text>
            <TouchableOpacity
              onPress={() => setDark((d) => !d)}
              style={{
                paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
                backgroundColor: C.chipBg, borderWidth: 1, borderColor: C.chipBorder
              }}
            >
              <Text style={{ color: C.text, fontWeight: "700" }}>{dark ? "☀️ Light" : "🌙 Dark"}</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.heroCaption, { color: C.sub }]}>
            Tell us what you need — we’ll pick and explain the best matches.
          </Text>
        </View>

        {Platform.OS === "web" && (
          <View style={{
            padding: 10, backgroundColor: C.bannerBg, borderWidth: 1,
            borderColor: C.bannerBorder, borderRadius: 10, marginBottom: 10
          }}>
            <Text style={{ color: C.bannerText }}>
              Running on web: using local matching. Use Android/iOS to test OpenAI calls.
            </Text>
          </View>
        )}

        <View style={styles.inputWrap}>
          <TextInput
            placeholder='e.g., "neck massager under 2000"'
            placeholderTextColor={dark ? "#6b7280" : "#9ca3af"}
            value={query}
            onChangeText={setQuery}
            style={[
              styles.input,
              { backgroundColor: C.inputBg, borderColor: C.border, color: C.text }
            ]}
            returnKeyType="search"
            onSubmitEditing={onSubmit}
          />
          <TouchableOpacity style={[styles.btn, { backgroundColor: C.btnBg }]} onPress={onSubmit}>
            <Text style={[styles.btnText, { color: C.btnText }]}>Find</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.chipsWrap}>
          {quick.map((q) => (
            <TouchableOpacity
              key={q}
              onPress={() => setQuery(q)}
              style={{
                paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
                backgroundColor: C.chipBg, borderWidth: 1, borderColor: C.chipBorder, marginRight: 8, marginTop: 8
              }}
            >
              <Text style={{ color: C.text }}>{q}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {status === "idle" && (
          <View style={{ marginTop: 8 }}>
            {tips.map((t, i) => (
              <Text key={i} style={[styles.tip, { color: C.sub }]}>• {t}</Text>
            ))}
          </View>
        )}

        {status === "loading" && <LoadingState />}
        {status === "error" && <ErrorState message={error} onRetry={onSubmit} />}

        {status === "success" && (
          <>
            <Text style={[styles.resultsHeader, { color: C.text }]}>Results ({results.length})</Text>
            {results.length === 0 ? (
              <Text style={{ color: C.sub, marginTop: 8 }}>
                No matches in the catalog for “{query}”. Try different words (e.g., brand or product type).
              </Text>
            ) : (
              <FlatList
                data={results}
                keyExtractor={(item, idx) => item.id ?? `${idx}-${item.product_name}`}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 40 }}
              />
            )}
          </>
        )}
      </View>
    </View>
  </KeyboardAvoidingView>
);

}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, paddingTop: 40 },

    hero: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        marginBottom: 12
    },
    bgWrap: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
    },
    foreground: {
        flex: 1,
        zIndex: 1,                         
    },

    heroTitle: { fontSize: 20, fontWeight: "800" },
    heroCaption: { marginTop: 6 },

    inputWrap: { marginTop: 4, flexDirection: "row", gap: 8 },
    input: {
        flex: 1,
        height: 46,
        borderRadius: 12,
        paddingHorizontal: 12,
        borderWidth: 1
    },
    btn: {
        paddingHorizontal: 16,
        height: 46,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center"
    },
    btnText: { fontWeight: "700" },

    chipsWrap: { flexDirection: "row", flexWrap: "wrap", marginTop: 10 },

    tip: { marginTop: 4 },
    resultsHeader: { marginTop: 16, marginBottom: 6, fontWeight: "800" }
});
