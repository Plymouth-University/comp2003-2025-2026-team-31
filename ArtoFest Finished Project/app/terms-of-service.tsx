import React from "react";
import InfoPage from "../components/info-page";

export default function TermsOfServicePage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Terms of service"
      paragraphs={[
        "ArtoFest is designed to help users discover festivals, view useful information and organise festivals they may want to attend.",
        "Festival details may change over time. Before making travel plans, buying tickets or relying on event information, you should always check the official festival website.",
        "Saving a festival to your plan does not book a ticket, reserve a place, confirm attendance or guarantee that the event will go ahead.",
        "The Travel ideas page is for guidance and demonstration only. ArtoFest does not currently provide live prices, live availability, payment processing or confirmed bookings.",
        "The Stream page may link to external websites or video platforms. ArtoFest is not responsible for the content, availability or rules of external services.",
        "Users should not misuse the app, attempt to access another user's saved festivals or interfere with the service.",
      ]}
    />
  );
}