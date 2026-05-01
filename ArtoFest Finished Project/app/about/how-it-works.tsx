import React from "react";
import InfoPage from "../../components/info-page";

export default function HowItWorksPage() {
  return (
    <InfoPage
      eyebrow="About"
      title="How it works"
      paragraphs={[
        "Start by searching for festivals on the Home page. You can narrow the results by country, month and art form, so it is easier to find events that match what you are looking for.",
        "The Explore page gives you another way to browse. You can look through festivals by country, filter by art form and use the map to see where festivals are located.",
        "When you find a festival you like, open its festival page to see the key details. This may include the festival image, location, date, art form and a link to the official website.",
        "If you create an account, you can save festivals to your own plan. Your saved festivals can be viewed later, organised by month and turned into a printable plan.",
        "You can also visit the Stream page to find festival-related online content, or use the Travel ideas page to see how booking support could work in the future.",
      ]}
    />
  );
}