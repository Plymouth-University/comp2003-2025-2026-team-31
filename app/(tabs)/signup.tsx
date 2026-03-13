import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function SignupScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Create your Free Account</Text>
      <Text style={styles.text}>
        This is a placeholder signup page for now. The real account creation flow
        can be added later.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f4eef5",
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: "#55286f",
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center",
  },
  text: {
    marginTop: 14,
    color: "#755c82",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 560,
  },
});