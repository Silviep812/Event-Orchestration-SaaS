import { LegalDocument } from "@/components/marketing/LegalDocument";

export default function RefundPolicy() {
  return (
    <LegalDocument title="Refund Policy" description="How subscription and billing concerns are handled.">
      <section><h2>Before purchase</h2><p>Plan features, billing cadence, and any trial terms are shown at checkout. Review these details before completing a purchase.</p></section>
      <section><h2>Subscription changes</h2><p>You may request cancellation or a plan change through the service or by contacting support. The final production policy will specify when a change takes effect and how access continues through an active billing period.</p></section>
      <section><h2>Refund requests</h2><p>To request a refund, provide the account email, purchase date, and a short explanation through the contact page. Requests are reviewed against the final published policy and applicable consumer-protection law.</p></section>
      <section><h2>Payment disputes</h2><p>Please contact support first so we can investigate billing issues promptly. This does not limit any rights you may have under applicable law.</p></section>
    </LegalDocument>
  );
}
