import { LegalDocument } from "@/components/marketing/LegalDocument";

export default function Privacy() {
  return (
    <LegalDocument title="Privacy Policy" description="How Ida Event Partners handles personal information in the service.">
      <section><h2>Information we collect</h2><p>We collect account details, contact information, event-planning content, communications, and technical information needed to operate and secure the service.</p></section>
      <section><h2>How we use information</h2><p>We use information to provide and improve the service, authenticate users, support event planning workflows, communicate about accounts, and protect against fraud or misuse.</p></section>
      <section><h2>Service providers</h2><p>We may use carefully selected providers to host the application, process payments, deliver email, and measure service performance. These providers may process information only as needed to provide their services.</p></section>
      <section><h2>Sharing and retention</h2><p>Event information is shared with collaborators and providers only through the permissions and actions selected in the product. We retain information for as long as needed to provide the service, meet legal obligations, resolve disputes, and enforce agreements.</p></section>
      <section><h2>Your choices</h2><p>You may request access, correction, deletion, or export of personal information, subject to applicable law and legitimate retention requirements. Use the contact page to submit a request.</p></section>
      <section><h2>Cookie notice</h2><p>We use essential browser storage and cookies to keep the service working and secure. Any analytics or advertising technologies will be disclosed here before they are enabled. You can control many cookies through browser settings.</p></section>
      <section><h2>Updates</h2><p>We may update this policy as the service evolves. The final production policy will state its effective date and explain how material changes are communicated.</p></section>
    </LegalDocument>
  );
}
