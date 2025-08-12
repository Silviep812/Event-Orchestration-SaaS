import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Menu, X, Calendar, Users, BarChart3, Bell } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: Calendar,
      title: "Event Creation",
      description: "Create and manage events with ease"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Work together with your team members"
    },
    {
      icon: BarChart3,
      title: "Analytics & Reports",
      description: "Track progress and generate insights"
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "Stay updated with real-time alerts"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-first Navigation */}
      <nav className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2" aria-label="IEP">
                <img src="/placeholder.svg" alt="IEP logo" className="h-8 w-8" />
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <Button variant="ghost">Features</Button>
              <Button variant="ghost">Pricing</Button>
              <Button variant="ghost">Contact</Button>
              <Button variant="outline">Sign In</Button>
              <Button>Start Trial</Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <Button variant="ghost" className="w-full justify-start">Features</Button>
                <Button variant="ghost" className="w-full justify-start">Pricing</Button>
                <Button variant="ghost" className="w-full justify-start">Contact</Button>
                <Button variant="outline" className="w-full">Sign In</Button>
                <Button className="w-full">Start Trial</Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-6">
            Professional Event Management
            <span className="block text-primary">Made Simple</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Streamline your event planning process with our comprehensive SaaS platform. 
            Create, manage, and track events while collaborating seamlessly with your team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-3" asChild>
              <Link to="/dashboard">Start Free Trial</Link>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-3">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-12">
            Everything You Need for Event Success
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-center h-full">
                <CardHeader>
                  <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 bg-muted">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6">
            Ready to Transform Your Events?
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8">
            Join thousands of event professionals who trust IEP for their event management needs.
          </p>
          <Button size="lg" className="text-lg px-8 py-3" asChild>
            <Link to="/dashboard">Start Your Free Trial Today</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
