import { Link } from "expo-router";
import React from "react";
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

function LogoMark() {
  return (
    <View style={styles.logoWrap}>
      <Text style={styles.logoText}>
        <Text style={styles.logoArto}>arto</Text>
        <Text style={styles.logoFest}>fest</Text>
      </Text>
    </View>
  );
}

async function openExternal(url: string) {
  try {
    await Linking.openURL(url);
  } catch (error) {
    console.error("Could not open link:", error);
  }
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href as any} asChild>
      <Pressable>
        <Text style={styles.link}>{children}</Text>
      </Pressable>
    </Link>
  );
}

export default function Footer() {
  const { width } = useWindowDimensions();
  const isMobile = width < 760;

  return (
    <View style={styles.footerOuter}>
      <View style={styles.footerInner}>
        <View style={isMobile ? styles.mobileTopSection : styles.topSection}>
          <View style={isMobile ? styles.mobileLogoColumn : styles.logoColumn}>
            <LogoMark />

            <Text style={styles.footerTagline}>
              Discover festivals, save your favourites and start shaping your
              next cultural trip.
            </Text>
          </View>

          <View style={isMobile ? styles.mobileLinksArea : styles.linksArea}>
            <View style={styles.column}>
              <Text style={styles.heading}>About</Text>
              <FooterLink href="/about/mission">Our mission</FooterLink>
              <FooterLink href="/about/how-it-works">How it works</FooterLink>
              <FooterLink href="/about/why-artofest">Why ArtoFest</FooterLink>
              <FooterLink href="/about/team">Team</FooterLink>
            </View>

            <View style={styles.column}>
              <Text style={styles.heading}>Help</Text>
              <FooterLink href="/faq/what-is-artofest">What is ArtoFest?</FooterLink>
              <FooterLink href="/faq/how-do-i-search-for-festivals">
                Searching festivals
              </FooterLink>
              <FooterLink href="/faq/is-artofest-free-to-use">
                Is it free?
              </FooterLink>
              <FooterLink href="/faq/can-i-save-festivals-to-view-later">
                Saving festivals
              </FooterLink>
            </View>

            <View style={styles.column}>
              <Text style={styles.heading}>Explore</Text>
              <FooterLink href="/explore">Find festivals</FooterLink>
              <FooterLink href="/plan">Plan your trip</FooterLink>
              <FooterLink href="/stream">Watch streams</FooterLink>
              <FooterLink href="/book">Travel ideas</FooterLink>
            </View>

            <View style={styles.column}>
              <Text style={styles.heading}>Stay Connected</Text>

              <Pressable onPress={() => openExternal("mailto:contact@artofest.com")}>
                <Text style={styles.link}>Email us</Text>
              </Pressable>

              <Text style={styles.note}>
                ArtoFest does not sell tickets or complete bookings inside the
                app.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={isMobile ? styles.mobileBottomRow : styles.bottomRow}>
          <Text style={styles.copyright}>
            © 2026 ArtoFest. All rights reserved.
          </Text>

          <View style={isMobile ? styles.mobileBottomLinks : styles.bottomLinks}>
            <FooterLink href="/privacy-policy">Privacy Policy</FooterLink>
            <FooterLink href="/terms-of-service">Terms of service</FooterLink>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footerOuter: {
    width: "100%",
    backgroundColor: "#160019",
    marginTop: 54,
  },

  footerInner: {
    width: "100%",
    maxWidth: 1980,
    alignSelf: "center",
    paddingHorizontal: Platform.OS === "web" ? 34 : 20,
    paddingTop: Platform.OS === "web" ? 46 : 30,
    paddingBottom: Platform.OS === "web" ? 34 : 28,
  },

  topSection: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    columnGap: 70,
  },

  mobileTopSection: {
    width: "100%",
  },

  logoColumn: {
    width: 390,
    flexShrink: 0,
  },

  mobileLogoColumn: {
    width: "100%",
    marginBottom: 26,
  },

  logoWrap: {
    justifyContent: "center",
  },

  logoText: {
    fontSize: Platform.OS === "web" ? 76 : 48,
    lineHeight: Platform.OS === "web" ? 82 : 54,
    fontWeight: "900",
    letterSpacing: Platform.OS === "web" ? -2 : -1,
  },

  logoArto: {
    color: "#f49b1a",
  },

  logoFest: {
    color: "#b455a6",
  },

  footerTagline: {
    marginTop: 12,
    maxWidth: 340,
    color: "rgba(255,255,255,0.78)",
    fontSize: Platform.OS === "web" ? 15 : 14,
    lineHeight: Platform.OS === "web" ? 22 : 20,
  },

  linksArea: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    columnGap: 40,
  },

  mobileLinksArea: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 26,
    columnGap: 20,
  },

  column: {
    minWidth: Platform.OS === "web" ? 190 : "45%",
    maxWidth: Platform.OS === "web" ? 260 : "48%",
  },

  heading: {
    color: "#ffffff",
    fontSize: Platform.OS === "web" ? 17 : 15,
    fontWeight: "900",
    marginBottom: 10,
  },

  link: {
    color: "#ffffff",
    fontSize: Platform.OS === "web" ? 15 : 14,
    lineHeight: Platform.OS === "web" ? 31 : 25,
  },

  note: {
    color: "rgba(255,255,255,0.72)",
    fontSize: Platform.OS === "web" ? 13 : 12,
    lineHeight: Platform.OS === "web" ? 20 : 18,
    marginTop: 8,
  },

  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.28)",
    marginTop: Platform.OS === "web" ? 42 : 32,
    marginBottom: 22,
  },

  bottomRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  mobileBottomRow: {
    width: "100%",
    rowGap: 14,
  },

  bottomLinks: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 42,
  },

  mobileBottomLinks: {
    flexDirection: "column",
    alignItems: "flex-start",
    rowGap: 4,
  },

  copyright: {
    color: "#ffffff",
    fontSize: Platform.OS === "web" ? 15 : 14,
    fontWeight: "800",
  },
});