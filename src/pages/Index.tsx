import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Menu, X, Calendar, Users, BarChart3, Bell, FolderOpen } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";


const Index = () => {
  console.log('Index component is rendering');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const features = [
    {
      icon: Calendar,
      title: "Event Creation",
      description: "Create Event with drop and drag",
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20"
    },
    {
      icon: FolderOpen,
      title: "Directories",
      description: "Find Venue Hospitality Vendors Entertainment",
      color: "from-yellow-500 to-orange-500",
      bgColor: "bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20"
    },
    {
      icon: Calendar,
      title: "Manage Events",
      description: "Changes and Updates With ease",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20"
    },

    {
      icon: Users,
      title: "Team Collaboration",
      description: "Work together with your team members",
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20"
    },
    {
      icon: BarChart3,
      title: "Analytics & Reports",
      description: "Track progress and generate insights",
      color: "from-orange-500 to-red-500",
      bgColor: "bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20"
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "Stay updated with real-time alerts",
      color: "from-indigo-500 to-purple-500",
      bgColor: "bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-first Navigation */}
      <nav className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center" aria-label="IEP">
                <img src="/lovable-uploads/e8e18250-fa27-4ae4-a4bc-867e063bcfd1.png" alt="IEP logo" className="h-8 w-8" />
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <Button variant="ghost" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>Features</Button>
              <Button variant="ghost">Pricing</Button>
              <Button variant="ghost" onClick={() => navigate('/contact')}>Contact</Button>
              <Button 
                variant="outline" 
                onClick={(e) => {
                  console.log('Desktop Sign In button clicked', e);
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = '/auth';
                }}
              >
                Sign In
              </Button>
              <Button onClick={() => navigate('/auth')}>Start Trial</Button>
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
                <Button variant="ghost" className="w-full justify-start" onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                  setMobileMenuOpen(false);
                }}>Features</Button>
                <Button variant="ghost" className="w-full justify-start">Pricing</Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => {
                  navigate('/contact');
                  setMobileMenuOpen(false);
                }}>Contact</Button>
                <Button
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    console.log('Mobile Sign In button clicked');
                    navigate('/auth');
                  }}
                >
                  Sign In
                </Button>
                <Link to="/auth">
                  <Button className="w-full">Start Trial</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-6">
            Welcome to Ida Event Partners
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Streamline your event planning process with our comprehensive SaaS platform. 
            Create, manage, and track events while collaborating seamlessly with your team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="w-full text-lg px-8 py-3">Start Free Trial</Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8 py-3">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-12">
            Everything You Need for Event Success
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className={`text-center h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${feature.bgColor}`}>
                <CardHeader>
                  <div className={`mx-auto mb-4 p-4 bg-gradient-to-br ${feature.color} rounded-full w-fit shadow-lg`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-gray-700 dark:text-gray-300">
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
          <Link to="/auth">
            <Button size="lg" className="text-lg px-8 py-3">Start Your Free Trial Today</Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
