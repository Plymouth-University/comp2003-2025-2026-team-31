import React from "react";
import InfoPage from "../../components/info-page";

export default function TeamPage() {
  return (
    <InfoPage
      eyebrow="About"
      title="Team"
      paragraphs={[
        "ArtoFest was created by a student team as part of a university software project.",
        "The team worked across planning, design, front-end development and back-end development to turn the idea into a working festival discovery and planning app.",
        "The project brings together search, festival pages, account features, saved festivals, planning tools, streaming links and travel ideas in one connected experience.",
        "ArtoFest is still growing, but the goal is simple: make it easier for people to find festivals and start planning the ones they care about.",
      ]}
    />
  );
}