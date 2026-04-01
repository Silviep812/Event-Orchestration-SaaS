import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { MarketingTopBar } from "@/components/MarketingTopBar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const { toast } = useToast();
  const [leadEmail, setLeadEmail] = useState("");
  const [leadName, setLeadName] = useState("");
  const [leadSubmitting, setLeadSubmitting] = useState(false);

  const submitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = leadEmail.trim();
    if (!email || !email.includes("@")) {
      toast({ title: "Invalid email", variant: "destructive" });
      return;
    }
    setLeadSubmitting(true);
    const { error } = await supabase.from("marketing_subscribers").insert({
      email,
      name: leadName.trim() || null,
      signup_source: "contact_page",
    });
    setLeadSubmitting(false);
    if (error) {
      if (error.code === "23505") {
        toast({ title: "You are already on the list", description: "This email is already registered." });
      } else {
        toast({
          title: "Could not subscribe",
          description: error.message,
          variant: "destructive",
        });
      }
      return;
    }
    toast({ title: "Thanks — you are on the list" });
    setLeadEmail("");
    setLeadName("");
  };

  return (
    <div className="min-h-screen bg-background">
      <MarketingTopBar page="contact" />

      {/* Contact Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-center">
            Contact Us
          </h1>
          <p className="text-lg text-muted-foreground mb-12 text-center">
            Get in touch with our team. We're here to help with your event planning needs.
          </p>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Ida Event Partners, LLC</h2>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Website</p>
                  <a 
                    href="https://www.idaeventpartners.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-lg font-medium text-primary hover:underline"
                  >
                    www.idaeventpartners.com
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <a 
                    href="mailto:support@idaeventpartners.com"
                    className="text-lg font-medium text-primary hover:underline"
                  >
                    support@idaeventpartners.com
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg mt-8">
            <CardHeader>
              <CardTitle className="text-xl">Campaign updates</CardTitle>
              <p className="text-sm text-muted-foreground">
                Get launch news and tips (Marketing Campaign Binder — lead capture).
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitLead} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="lead-email">Email</Label>
                  <Input
                    id="lead-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead-name">Name (optional)</Label>
                  <Input
                    id="lead-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Your name"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={leadSubmitting}>
                  {leadSubmitting ? "Submitting…" : "Subscribe"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-6">
              Ready to start planning your next event?
            </p>
            <Link to="/auth">
              <Button size="lg">Start 14-day free trial</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
