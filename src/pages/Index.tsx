import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, BarChart3, Bell, FolderOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { MarketingTopBar } from "@/components/MarketingTopBar";
import { MarketingWaitlistForm } from "@/components/marketing/MarketingWaitlistForm";
import { IEP_LOGO_COLORED } from "@/lib/brandAssets";

const scrollToId = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

const Index = () => {
  useEffect(() => {
    const raw = window.location.hash.replace(/^#/, "");
    if (raw && document.getElementById(raw)) {
      requestAnimationFrame(() => scrollToId(raw));
    }
  }, []);

  const features = [
    {
      icon: FolderOpen,
      title: "Organize every detail",
      description: "Organize and manage every detail in one place",
      color: "from-rose-400 to-orange-400",
      bgColor: "bg-gradient-to-br from-rose-100/90 to-orange-100/80 dark:from-rose-900/25 dark:to-orange-900/20",
    },
    {
      icon: Calendar,
      title: "AI-powered workflows",
      description: "Use AI-powered workflows to streamline planning",
      color: "from-amber-400 to-yellow-400",
      bgColor: "bg-gradient-to-br from-amber-100/90 to-yellow-100/80 dark:from-amber-900/25 dark:to-yellow-900/20",
    },
    {
      icon: Bell,
      title: "Real-time changes",
      description: "Handle real-time event changes with confidence",
      color: "from-sky-400 to-cyan-400",
      bgColor: "bg-gradient-to-br from-sky-100/90 to-cyan-100/80 dark:from-sky-900/25 dark:to-cyan-900/20",
    },
    {
      icon: Users,
      title: "Reusable templates",
      description: "Build and reuse templates for faster setup",
      color: "from-emerald-400 to-teal-400",
      bgColor: "bg-gradient-to-br from-emerald-100/90 to-teal-100/80 dark:from-emerald-900/25 dark:to-teal-900/20",
    },
    {
      icon: BarChart3,
      title: "Built-in analytics",
      description: "Track performance with built-in analytics",
      color: "from-orange-400 to-rose-400",
      bgColor: "bg-gradient-to-br from-orange-100/90 to-rose-100/80 dark:from-orange-900/25 dark:to-rose-900/20",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/95 via-orange-50/50 to-rose-50/40 dark:from-background dark:via-background dark:to-background">
      <MarketingTopBar page="home" />

      <section className="relative px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(251,191,36,0.22),transparent_55%),radial-gradient(ellipse_60%_50%_at_100%_50%,rgba(244,114,182,0.12),transparent_50%)]"
          aria-hidden
        />
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <img
              src={IEP_LOGO_COLORED}
              alt="Ida Event Partners — We Got You"
              className="block w-full max-w-[min(100vw,35rem)] h-auto mx-auto object-contain object-center drop-shadow-md"
              width={640}
              height={192}
              loading="eager"
              decoding="async"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-balance text-foreground tracking-tight">
            Plan Memorable Events—Without the Chaos
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed text-pretty">
            Bring your vision to life with ease. With IDA Event Partners, you can create unforgettable events while we handle the complexity behind the scenes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
            <Link to="/auth">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-3 shadow-md">
                Start with Your Vision
              </Button>
            </Link>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="text-lg px-8 py-3 w-full sm:w-auto border-amber-200/80 bg-white/60 backdrop-blur-sm"
              onClick={() => scrollToId("demo")}
            >
              See how it works
            </Button>
          </div>
        </div>
      </section>

      <section
        id="payment-plan"
        className="px-4 sm:px-6 lg:px-8 py-12 sm:py-14 border-y border-amber-200/40 bg-gradient-to-br from-rose-50/80 via-amber-50/60 to-orange-50/70 dark:from-muted/40 dark:via-muted/30 dark:to-muted/40"
      >
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-balance">Simple pricing — tailored to how you work</h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed text-pretty">
            Pricing is personalized: it can depend on your planner profile, event scope (for example theme, role, attendee
            count, or timeline), and current offers. Typical shapes include a{" "}
            <span className="font-medium text-foreground">free trial</span>,{" "}
            <span className="font-medium text-foreground">subscription</span> (monthly or annual),{" "}
            <span className="font-medium text-foreground">one-time</span> packages for defined event sizes, and{" "}
            <span className="font-medium text-foreground">limited-time promotions</span>. Exact amounts are confirmed at signup
            or checkout and may change. After a trial ends, we may retain your account identifier and related details and archive
            them for operational, compliance, and promotional purposes as described in our terms and privacy policy.
          </p>
          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => scrollToId("features")}>
            Explore features
          </Button>
        </div>
      </section>

      <section id="demo" className="px-4 sm:px-6 lg:px-8 py-12 sm:py-14 border-y border-amber-100/50 bg-white/40 dark:bg-muted/20 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold">See it in action</h2>
          <p className="text-muted-foreground">
            Start your trial to explore directories, project tools, workflows, and team features — no payment required during
            the trial.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link to="/auth">
              <Button size="lg">Start demo / trial</Button>
            </Link>
            <Button type="button" variant="outline" size="lg" onClick={() => scrollToId("features")}>
              Browse features
            </Button>
          </div>
        </div>
      </section>

      <section id="features" className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-12 text-balance">
            Smart Tools That Work for You
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className={`text-center h-full border border-amber-100/60 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] ${feature.bgColor}`}
              >
                <CardHeader>
                  <div
                    className={`mx-auto mb-4 p-4 bg-gradient-to-br ${feature.color} rounded-full w-fit shadow-md`}
                  >
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-foreground">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-muted-foreground">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 bg-gradient-to-br from-rose-50/70 via-amber-50/50 to-orange-50/60 dark:from-muted/30 dark:via-muted/20 dark:to-muted/30 border-y border-amber-100/50">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-balance">Collaborate & Grow</h2>
          <p className="text-lg text-muted-foreground leading-relaxed text-pretty">
            Connect with trusted businesses and service providers to enhance your event and expand your network.
          </p>
        </div>
      </section>

      <section id="pricing" className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-12 text-balance">
            Pricing plans
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Starter Plan",
                price: "Free",
                features: ["Basic event creation", "Limited templates", "Core planning tools"],
                cta: "Get started free",
                href: "/auth",
                disabled: false,
                highlight: false,
              },
              {
                name: "Pro Plan",
                price: "",
                features: [
                  "Unlimited events",
                  "Advanced AI workflows",
                  "Real-time collaboration tools",
                  "Analytics dashboard",
                ],
                cta: "Upgrade to Pro",
                href: "/auth",
                disabled: false,
                highlight: true,
              },
              {
                name: "Business Plan",
                price: "",
                features: [
                  "Multi-user collaboration",
                  "Vendor and partner integrations",
                  "Priority support",
                  "Custom workflow automation",
                ],
                cta: "Coming Soon",
                href: "",
                disabled: true,
                highlight: false,
              },
            ].map((tier) => (
              <Card
                key={tier.name}
                className={`flex flex-col h-full border ${
                  tier.highlight
                    ? "border-amber-300/80 shadow-lg ring-2 ring-amber-200/60 bg-gradient-to-br from-amber-50/90 to-orange-50/80 dark:from-amber-900/20 dark:to-orange-900/15"
                    : "border-amber-100/60 shadow-md bg-white/70 dark:bg-muted/20"
                }`}
              >
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-foreground">{tier.name}</CardTitle>
                  {tier.price && (
                    <CardDescription className="text-2xl font-semibold text-foreground">
                      {tier.price}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col flex-1 gap-6">
                  <ul className="space-y-2 text-base text-muted-foreground flex-1">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <span className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {tier.disabled ? (
                    <Button size="lg" disabled className="w-full">
                      {tier.cta}
                    </Button>
                  ) : (
                    <Link to={tier.href} className="w-full">
                      <Button size="lg" className="w-full">
                        {tier.cta}
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>


      <section
        id="waitlist"
        className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 border-y border-amber-100/60 bg-white/55 dark:bg-muted/25 backdrop-blur-sm"
      >
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2 text-balance">Get launch updates</h2>
          <p className="text-center text-muted-foreground text-sm sm:text-base mb-6 text-pretty">
            Join the campaign list for IEP — product news, early access, and event planning tips. Prefer to start
            immediately?{" "}
            <Link to="/auth" className="text-primary font-medium underline-offset-4 hover:underline">
              Start your free trial
            </Link>
            .
          </p>
          <MarketingWaitlistForm signupSource="landing_home" />
          <p className="text-center text-xs text-muted-foreground mt-6">
            <Link to="/marketing-creatives" className="underline-offset-4 hover:underline">
              View social ad previews (team)
            </Link>
          </p>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 bg-gradient-to-r from-amber-100/50 via-rose-50/40 to-orange-50/50 dark:from-muted/50 dark:via-muted/40 dark:to-muted/50 border-t border-amber-200/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 text-balance">Ready when you are</h2>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 text-pretty">
            Join planners who want less stress and more clarity — starting with a free trial built for you.
          </p>
          <Link to="/auth">
            <Button size="lg" className="text-lg px-8 py-3 shadow-md">
              Start your free trial
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
