import { FormEvent, useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PublicPageLayout } from "@/components/marketing/PublicPageLayout";

const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL?.trim() || "";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [error, setError] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supportEmail) {
      setError("Support email is not configured yet. Set VITE_SUPPORT_EMAIL before publishing this contact form.");
      return;
    }
    const subject = encodeURIComponent(`Website contact from ${form.name.trim() || "visitor"}`);
    const body = encodeURIComponent(`Name: ${form.name.trim()}\nEmail: ${form.email.trim()}\n\n${form.message.trim()}`);
    window.location.href = `mailto:${supportEmail}?subject=${subject}&body=${body}`;
  };

  return (
    <PublicPageLayout title="Contact us" description="Questions about Ida Event Partners, your account, or the platform? Send us a message.">
      <div className="rounded-xl border bg-card p-5 shadow-sm sm:p-7">
        <div className="mb-6 flex items-center gap-3"><Mail className="h-5 w-5 text-primary" /><p className="text-sm text-muted-foreground">We’ll respond using the email address you provide.</p></div>
        {!supportEmail ? <Alert className="mb-6"><AlertDescription>Contact delivery will be enabled when the production support email is configured.</AlertDescription></Alert> : null}
        <form className="space-y-5" onSubmit={submit}>
          <div><Label htmlFor="contact-name">Name</Label><Input id="contact-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={120} required /></div>
          <div><Label htmlFor="contact-email">Email</Label><Input id="contact-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={255} required /></div>
          <div><Label htmlFor="contact-message">Message</Label><Textarea id="contact-message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} maxLength={4000} rows={7} required /></div>
          {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
          <Button type="submit"><Mail className="mr-2 h-4 w-4" />Compose email</Button>
        </form>
      </div>
    </PublicPageLayout>
  );
}
