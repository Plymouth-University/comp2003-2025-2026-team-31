import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function ProfileScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.text}>
        This is a placeholder page for future user profile features.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0b0b0f",
    padding: 24,
  },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "800",
  },
  text: {
    color: "#cfcfcf",
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
  },
});