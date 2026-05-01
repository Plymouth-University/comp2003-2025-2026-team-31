import React from "react";
import InfoPage from "../../components/info-page";

export default function WhatIsArtoFestPage() {
  return (
    <InfoPage
      eyebrow="FAQ"
      title="What is ArtoFest?"
      paragraphs={[
        "ArtoFest is a festival discovery and planning app.",
        "You can use it to search for festivals, explore locations, view festival details, open official festival websites and save festivals that interest you.",
        "If you create an account, you can build your own festival plan by saving festivals to a wishlist. You can then view those saved festivals by month and create a printable plan.",
        "ArtoFest also includes a Stream page for festival-related online content and a Travel ideas page showing how travel and accommodation support could be added.",
      ]}
    />
  );
}