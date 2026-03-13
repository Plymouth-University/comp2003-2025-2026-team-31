import TopNav from "@/components/top-nav";
import { Slot } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function SiteLayout() {
  return (
    <SafeAreaProvider>
    <View style={styles.container}>
      <TopNav />
      <View style={styles.content}>
        <Slot />
      </View>
    </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0b0f",
  },
  content: {
    flex: 1,
  },
});