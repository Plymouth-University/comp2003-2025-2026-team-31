import React from "react";
import InfoPage from "../../components/info-page";

export default function IsArtoFestFreeToUsePage() {
  return (
    <InfoPage
      eyebrow="FAQ"
      title="Is ArtoFest free to use?"
      paragraphs={[
        "Yes. You can browse festivals, search the Explore page, view festival details and use the Stream page for free.",
        "Creating an account is also free. You only need an account if you want to save festivals to your own plan and view them again later.",
        "ArtoFest does not currently sell tickets or take payments. If you open an official festival website, that website may have its own prices, ticket rules or account requirements.",
      ]}
    />
  );
}