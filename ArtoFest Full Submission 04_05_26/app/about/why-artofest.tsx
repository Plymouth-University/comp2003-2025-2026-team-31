import React from "react";
import InfoPage from "../../components/info-page";

export default function WhyArtoFestPage() {
  return (
    <InfoPage
      eyebrow="About"
      title="Why ArtoFest"
      paragraphs={[
        "Finding festivals should not feel like hard work. ArtoFest brings festival discovery and planning into one place, so you can spend less time searching and more time choosing where you want to go.",
        "Instead of jumping between search engines, social media pages and separate event websites, you can browse festival information in a cleaner and more focused way.",
        "ArtoFest is useful when you already know what you want, but it is also designed for discovery. You might search by country, look for a certain type of festival, or simply explore what is happening in a particular month.",
        "Once you find something interesting, you can save it to your plan and come back to it later. That makes it easier to compare options before deciding which festivals are worth looking into properly.",
      ]}
    />
  );
}