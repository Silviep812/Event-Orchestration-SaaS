import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Globe } from "lucide-react";
import { Link } from "react-router-dom";

const Contact = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center" aria-label="IEP">
                <img src="/lovable-uploads/e8e18250-fa27-4ae4-a4bc-867e063bcfd1.png" alt="IEP logo" className="h-8 w-8" />
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost">Back to Home</Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline">Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

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

          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-6">
              Ready to start planning your next event?
            </p>
            <Link to="/auth">
              <Button size="lg">Start Free Trial</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
