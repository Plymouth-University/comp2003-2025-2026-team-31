import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Footer from "../components/footer";
import { theme } from "../lib/theme";

type InfoPageProps = {
  eyebrow?: string;
  title: string;
  paragraphs: string[];
};

export default function InfoPage({
  eyebrow,
  title,
  paragraphs,
}: InfoPageProps) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.pageShell}>
        <View style={styles.page}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.title}>{title}</Text>

          <View style={styles.card}>
            {paragraphs.map((paragraph, index) => (
              <Text key={`${title}-${index}`} style={styles.body}>
                {paragraph}
              </Text>
            ))}
          </View>
        </View>

        <Footer />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  contentContainer: {
    flexGrow: 1,
  },

  pageShell: {
    flex: 1,
    justifyContent: "space-between",
  },

  page: {
  width: "100%",
  maxWidth: 1280,
  alignSelf: "center",
  paddingHorizontal: 24,
  paddingTop: 28,
  },

  eyebrow: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  title: {
    color: theme.colors.primary,
    fontSize: 38,
    lineHeight: 42,
    fontWeight: "900",
  },

  card: {
    marginTop: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 24,
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },

  body: {
    color: theme.colors.text,
    fontSize: 17,
    lineHeight: 28,
    marginBottom: 16,
  },
});