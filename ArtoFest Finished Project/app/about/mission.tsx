import React from "react";
import InfoPage from "../../components/info-page";

export default function MissionPage() {
  return (
    <InfoPage
      eyebrow="About"
      title="Our mission"
      paragraphs={[
        "ArtoFest helps people discover festivals without having to search through loads of different websites.",
        "Whether you are looking for music, food, film, theatre, culture or art, ArtoFest gives you a simple place to start. You can browse festivals by country, month and art form, then open the ones that interest you for more details.",
        "Our aim is to make festival planning feel less scattered. You can save festivals to your own plan, compare them by month and keep your favourite options in one place.",
        "ArtoFest is built for people who want inspiration, useful information and a clearer way to start planning their next festival experience.",
      ]}
    />
  );
}