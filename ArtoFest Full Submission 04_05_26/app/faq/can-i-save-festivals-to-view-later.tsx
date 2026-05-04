import React from "react";
import InfoPage from "../../components/info-page";

export default function CanISaveFestivalsPage() {
  return (
    <InfoPage
      eyebrow="FAQ"
      title="Can I save festivals to view later?"
      paragraphs={[
        "Yes. If you are logged in, you can save festivals to your personal plan.",
        "Your saved festivals show the festival name, country, image, date information and website button. You can also remove festivals if you change your mind.",
        "The Month Selector helps you view your saved festivals by month, which makes it easier to compare what is happening at different times of the year.",
        "If you are not logged in, the Plan page will ask you to log in or create an account before saving festivals.",
      ]}
    />
  );
}