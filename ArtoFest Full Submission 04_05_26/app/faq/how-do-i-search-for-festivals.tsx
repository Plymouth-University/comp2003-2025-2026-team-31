import React from "react";
import InfoPage from "../../components/info-page";

export default function HowDoISearchForFestivalsPage() {
  return (
    <InfoPage
      eyebrow="FAQ"
      title="How do I search for festivals?"
      paragraphs={[
        "You can search from the Home page using the dropdown filters. Choose a country, month or art form, then view the festivals that match your choices.",
        "You do not have to use every filter at once. You can search broadly, such as by country, or narrow things down further by also choosing a month or art form.",
        "The Explore page gives you more ways to browse. You can search countries, filter by art form and use the map to see where festivals are located.",
        "When a festival catches your eye, open its festival page to see more information and visit the official website if a link is available.",
      ]}
    />
  );
}