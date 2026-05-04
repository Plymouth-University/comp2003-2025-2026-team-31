import React from "react";
import InfoPage from "../components/info-page";

export default function PrivacyPolicyPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Privacy Policy"
      paragraphs={[
        "ArtoFest uses account details to let users log in and save festivals to their own plan.",
        "When you create an account or log in, your details are sent to the account system so your identity can be checked. After a successful login, ArtoFest stores a local session on your device or browser so you can stay signed in.",
        "If you save festivals, ArtoFest stores those saved choices against your account. This is what allows your wishlist, month selector and printable plan to work.",
        "You can log out from the Profile page. Logging out removes the saved session from your device or browser.",
        "ArtoFest may link to external festival websites or video platforms. Those websites are separate from ArtoFest and may have their own privacy policies.",
        "ArtoFest does not currently process payments, sell tickets or complete bookings inside the app.",
      ]}
    />
  );
}