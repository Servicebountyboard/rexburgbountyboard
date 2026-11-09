import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>REXBURG BOUNTY BOARD</Text>
        <Text style={styles.title}>Rebuild in progress</Text>
        <Text style={styles.body}>
          This application has been reduced to a clean foundation for the next
          implementation.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4EAD5",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  eyebrow: {
    color: "#876443",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.8,
  },
  title: {
    color: "#2F241B",
    fontFamily: "Georgia",
    fontSize: 42,
    lineHeight: 48,
  },
  body: {
    color: "#65584B",
    fontSize: 17,
    lineHeight: 26,
    maxWidth: 520,
  },
});
