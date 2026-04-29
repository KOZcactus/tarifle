import { StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

/**
 * Tarifle Mobile, Phase 0 minimum hello-world.
 *
 * Phase 1 MVP'de bu sayfa yerini "ana sayfa" alır:
 * - Arama bar (üst)
 * - Featured tarif şeritleri (yatay scroll, FlashList)
 * - Kategori grid
 * - AI Asistan CTA
 */
export default function Home() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.title}>Tarifle</Text>
      <Text style={styles.subtitle}>
        Mobile uygulama Phase 0 hazırlık aşamasında.
      </Text>
      <Text style={styles.detail}>
        Web platformu: tarifle.app{"\n"}3731 tarif, 60 blog, TR + EN
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 48,
    fontWeight: "700",
    color: "#a03b0f",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#444",
    textAlign: "center",
    marginBottom: 24,
  },
  detail: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    lineHeight: 22,
  },
});
