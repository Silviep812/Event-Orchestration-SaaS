import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  Bell,
  Calendar,
  FolderOpen,
  Handshake,
  LayoutTemplate,
  Play,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { MarketingTopBar } from "@/components/MarketingTopBar";
import { LandingDemoModal } from "@/components/marketing/LandingDemoModal";
import { MarketingWaitlistForm } from "@/components/marketing/MarketingWaitlistForm";
import { AUTH_SIGN_IN_PATH, AUTH_STARTER_PLAN_PATH } from "@/lib/authRoutes";
import { IEP_LOGO_COLORED } from "@/lib/brandAssets";

const scrollToId = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

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
    title: "Real-time event changes",
    description: "Handle real-time event changes with confidence",
    color: "from-sky-400 to-cyan-400",
    bgColor: "bg-gradient-to-br from-sky-100/90 to-cyan-100/80 dark:from-sky-900/25 dark:to-cyan-900/20",
  },
  {
    icon: LayoutTemplate,
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
  {
    icon: Users,
    title: "Collaboration",
    description: "Collaborate with teams, hosts, and partners in one workspace",
    color: "from-violet-400 to-fuchsia-400",
    bgColor: "bg-gradient-to-br from-violet-100/90 to-fuchsia-100/80 dark:from-violet-900/25 dark:to-fuchsia-900/20",
  },
  {
    icon: Handshake,
    title: "Trusted vendors and partners",
    description: "Connect with trusted vendors and partners to grow your network",
    color: "from-teal-400 to-cyan-400",
    bgColor: "bg-gradient-to-br from-teal-100/90 to-cyan-100/80 dark:from-teal-900/25 dark:to-cyan-900/20",
  },
];

const pricingTiers = [
  {
    name: "Starter Plan",
    price: "Free",
    targetUser: "Hosts and individuals",
    features: [
      "Basic event creation — Themes (Celebration and Dining)",
      "Limited templates",
      "Core planning tools",
    ],
    cta: "Try Starter Plan free",
    href: AUTH_STARTER_PLAN_PATH,
  },
  {
    name: "Pro Plan",
    price: "$49/month",
    targetUser: "Professional Event Planners",
    features: [
      "Unlimited events (All Themes except Special Events and Weddings)",
      "Unlimited templates",
      "Advanced planning tools",
      "Advanced AI workflows",
      "Real-time collaboration tools",
      "Analytics dashboard",
    ],
    cta: "$49.00 monthly",
    href: AUTH_SIGN_IN_PATH,
    highlight: true,
  },
  {
    name: "Business Plan",
    price: "TBA",
    targetUser: "Venues, hospitality providers, and organizations",
    features: [
      "All that the Pro Plan offers",
      "Multi-user collaboration",
      "Vendor & partner integrations",
      "Priority support",
      "Custom workflow automation",
    ],
    cta: "TBA",
    href: AUTH_SIGN_IN_PATH,
    disabled: true,
  },
  {
    name: "Enterprise Plan",
    price: "Fixed contract",
    targetUser:
      "Multi-location organizations, franchises, universities, municipalities, and large event companies with custom onboarding, advanced security, API access, and dedicated support",
    features: [
      "All that the Business Plan offers",
      "Multi-user collaboration",
      "Vendor & partner integrations",
      "Priority support",
      "Custom workflow automation",
    ],
    cta: "Contract Fix Price",
    href: AUTH_SIGN_IN_PATH,
  },
  {
    name: "One-time usage",
    price: "$59",
    targetUser: "Starter event planners who choose to plan a one-time event",
    features: [
      "One-time event access",
      "Single event planning scope",
      "No monthly subscription",
      "$59.00 one time only",
    ],
    cta: "$59.00 one time only",
    href: AUTH_STARTER_PLAN_PATH,
  },
] as const;

const Index = () => {
  const [demoOpen, setDemoOpen] = useState(false);

  useEffect(() => {
    const raw = window.location.hash.replace(/^#/, "");
    if (raw && document.getElementById(raw)) {
      requestAnimationFrame(() => scrollToId(raw));
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/95 via-orange-50/50 to-rose-50/40 dark:from-background dark:via-background dark:to-background">
      <MarketingTopBar page="home" onWatchDemo={() => setDemoOpen(true)} />
      <LandingDemoModal open={demoOpen} onOpenChange={setDemoOpen} />

      {/* Hero */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 overflow-hidden" aria-labelledby="hero-heading">
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
          <h1
            id="hero-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-balance text-foreground tracking-tight"
          >
            Plan Memorable Events—Without the Chaos
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed text-pretty">
            Bring your vision to life with ease. With IDA Event Partners, you can create unforgettable events while we
            handle the complexity behind the scenes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
            <Button asChild size="lg" className="w-full sm:w-auto text-lg px-8 py-3 shadow-md">
              <Link to={AUTH_STARTER_PLAN_PATH}>Start with Your Vision</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="text-lg px-8 py-3 w-full sm:w-auto border-amber-200/80 bg-white/60 backdrop-blur-sm"
              onClick={() => setDemoOpen(true)}
            >
              <Play className="h-5 w-5" aria-hidden />
              Watch Demo
            </Button>
            <Button asChild variant="secondary" size="lg" className="w-full sm:w-auto text-lg px-8 py-3">
              <Link to={AUTH_STARTER_PLAN_PATH}>Try free Starter Plan</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Start with Your Vision */}
      <section
        id="start-with-vision"
        className="px-4 sm:px-6 lg:px-8 py-10 sm:py-12 border-y border-amber-100/50 bg-white/50 dark:bg-muted/20"
        aria-labelledby="vision-heading"
      >
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h2 id="vision-heading" className="text-2xl sm:text-3xl font-bold text-balance">
            Start with Your Vision
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed text-pretty">
            Choose your event theme and let our intelligent platform guide you every step of the way—from concept to
            execution.
          </p>
          <Button asChild size="lg" className="shadow-md">
            <Link to={AUTH_STARTER_PLAN_PATH}>Try free Starter Plan</Link>
          </Button>
        </div>
      </section>

      {/* Demo anchor (Watch Demo opens modal; section remains for deep links) */}
      <section
        id="demo"
        className="px-4 sm:px-6 lg:px-8 py-12 sm:py-14 border-b border-amber-100/50 bg-gradient-to-br from-amber-50/70 via-orange-50/50 to-rose-50/60 dark:from-muted/30 dark:via-muted/20 dark:to-muted/30"
        aria-labelledby="demo-heading"
      >
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h2 id="demo-heading" className="text-2xl sm:text-3xl font-bold">
            See it in action
          </h2>
          <p className="text-muted-foreground text-pretty">
            Watch a short IEP presentation to explore directories, project tools, workflows, and team features.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button type="button" size="lg" className="shadow-md" onClick={() => setDemoOpen(true)}>
              <Play className="h-5 w-5" aria-hidden />
              Watch Demo
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={() => scrollToId("features")}>
              Browse features
            </Button>
          </div>
        </div>
      </section>

      {/* Smart Tools / Features */}
      <section id="features" className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16" aria-labelledby="features-heading">
        <div className="max-w-7xl mx-auto">
          <h2 id="features-heading" className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-4 text-balance">
            Smart Tools That Work for You
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto text-pretty">
            Everything you need to plan with clarity—from organization and automation to collaboration and insights.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className={`text-center h-full border border-amber-100/60 shadow-md hover:shadow-lg transition-shadow duration-300 ${feature.bgColor}`}
              >
                <CardHeader>
                  <div
                    className={`mx-auto mb-4 p-4 bg-gradient-to-br ${feature.color} rounded-full w-fit shadow-md`}
                    aria-hidden
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

      {/* Collaborate & Grow */}
      <section
        className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 bg-gradient-to-br from-rose-50/70 via-amber-50/50 to-orange-50/60 dark:from-muted/30 dark:via-muted/20 dark:to-muted/30 border-y border-amber-100/50"
        aria-labelledby="collaborate-heading"
      >
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h2 id="collaborate-heading" className="text-2xl sm:text-3xl lg:text-4xl font-bold text-balance">
            Collaborate & Grow
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed text-pretty">
            Connect with trusted businesses and service providers to enhance your event and expand your network.
          </p>
        </div>
      </section>

      {/* Designed for Everyone */}
      <section className="px-4 sm:px-6 lg:px-8 py-14 sm:py-16 bg-white/60 dark:bg-muted/20" aria-labelledby="designed-heading">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-amber-100/70 bg-card/90 backdrop-blur-sm shadow-sm">
            <CardHeader>
              <CardTitle id="designed-heading" className="text-2xl">
                Designed for Everyone
              </CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Whether you're hosting your own event or working as a professional planner, IDA Event Partners gives you
                the tools to succeed.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-amber-100/70 bg-card/90 backdrop-blur-sm shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl">Create Smarter. Plan Better. Execute Flawlessly.</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Get started today and turn your ideas into unforgettable experiences.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Plan Unforgettable Events */}
      <section
        className="px-4 sm:px-6 lg:px-8 py-14 sm:py-16 bg-gradient-to-br from-rose-50/80 via-amber-50/60 to-orange-50/70 dark:from-muted/40 dark:via-muted/30 dark:to-muted/40"
        aria-labelledby="unforgettable-heading"
      >
        <div className="max-w-4xl mx-auto text-center space-y-5">
          <h2 id="unforgettable-heading" className="text-2xl sm:text-3xl lg:text-4xl font-bold text-balance">
            Plan Unforgettable Events—Without the Stress
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed text-pretty">
            From idea to execution, IDA Event Partners gives you everything you need to plan, manage, and scale
            exceptional events—all in one place.
          </p>
          <Button asChild size="lg" className="text-lg px-8 py-3 shadow-md">
            <Link to={AUTH_STARTER_PLAN_PATH}>Try free Starter Plan</Link>
          </Button>
        </div>
      </section>

      {/* Turn Your Vision Into a Seamless Experience */}
      <section id="experience" className="px-4 sm:px-6 lg:px-8 py-14 sm:py-16 bg-background" aria-labelledby="experience-heading">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div className="space-y-4">
            <h2 id="experience-heading" className="text-2xl sm:text-3xl lg:text-4xl font-bold text-balance">
              Turn Your Vision Into a Seamless Experience
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Stop juggling spreadsheets, messages, and last-minute chaos.
            </p>
            <p className="text-base text-foreground font-medium">You focus on the experience. We handle the system.</p>
          </div>

          <ul className="grid gap-3 list-none p-0 m-0">
            {[
              "Select your event theme and launch instantly",
              "Automate planning with AI-powered workflows",
              "Adapt to real-time changes without disruption",
              "Track performance with built-in analytics",
              "Connect with trusted vendors and partners",
            ].map((item) => (
              <li key={item} className="rounded-xl border border-amber-100/70 bg-card/90 px-4 py-3 shadow-sm">
                <p className="text-sm sm:text-base text-foreground">{item}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Built for Hosts & Professional Event Planners */}
      <section
        className="px-4 sm:px-6 lg:px-8 py-14 sm:py-16 bg-white/50 dark:bg-muted/20"
        aria-labelledby="audience-heading"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
            <h2 id="audience-heading" className="text-2xl sm:text-3xl lg:text-4xl font-bold text-balance">
              Built for Hosts & Professional Event Planners
            </h2>
            <p className="text-muted-foreground text-pretty">
              Whether you're planning your own event or managing multiple clients:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              {
                title: "Hosts",
                copy: "Create stunning, organized events with zero overwhelm.",
              },
              {
                title: "Event Planners",
                copy: "Scale operations, manage teams, and deliver flawlessly.",
              },
              {
                title: "Businesses",
                copy: "Connect, collaborate, and grow your network.",
              },
            ].map((audience) => (
              <Card key={audience.title} className="border-amber-100/70 bg-card/90 shadow-sm h-full">
                <CardHeader>
                  <CardTitle>{audience.title}</CardTitle>
                  <CardDescription className="text-base">{audience.copy}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button asChild size="lg" className="shadow-md">
              <Link to={AUTH_STARTER_PLAN_PATH}>Create your first event in minutes</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose IEP */}
      <section id="why-choose" className="px-4 sm:px-6 lg:px-8 py-14 sm:py-16 bg-background" aria-labelledby="why-heading">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 id="why-heading" className="text-2xl sm:text-3xl lg:text-4xl font-bold text-balance">
              Why Choose IEP?
            </h2>
            <p className="text-lg text-muted-foreground mt-4">
              Most tools help you plan. We help you execute—flawlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {[
              "Centralized event command center",
              "Reusable templates to save hours",
              "Real-time collaboration across teams",
              "Smart automation to reduce manual work",
              "Save up to 70% of your planning time",
            ].map((item) => (
              <Card key={item} className="border-amber-100/70 bg-card/90 shadow-sm h-full">
                <CardContent className="p-5">
                  <p className="text-sm font-medium text-foreground">{item}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button asChild size="lg" className="shadow-md">
              <Link to={AUTH_STARTER_PLAN_PATH}>Try free Starter Plan</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Simple, Transparent Pricing */}
      <section id="pricing" className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16" aria-labelledby="pricing-heading">
        <div className="max-w-7xl mx-auto">
          <h2 id="pricing-heading" className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-4 text-balance">
            Simple, Transparent Pricing
          </h2>
          <p className="text-center text-muted-foreground mb-10">Start free. Upgrade when you're ready.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
            {pricingTiers.map((tier) => (
              <Card
                key={tier.name}
                className={`flex flex-col h-full border ${
                  "highlight" in tier && tier.highlight
                    ? "border-amber-300/80 shadow-lg ring-2 ring-amber-200/60 bg-gradient-to-br from-amber-50/90 to-orange-50/80 dark:from-amber-900/20 dark:to-orange-900/15"
                    : "border-amber-100/60 shadow-md bg-white/70 dark:bg-muted/20"
                }`}
              >
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-foreground">{tier.name}</CardTitle>
                  <CardDescription className="text-2xl font-semibold text-foreground">{tier.price}</CardDescription>
                  <p className="text-sm text-muted-foreground mt-2 min-h-[3rem]">{tier.targetUser}</p>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 gap-6">
                  <ul className="space-y-2 text-sm sm:text-base text-muted-foreground flex-1">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <span className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-primary shrink-0" aria-hidden />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {"disabled" in tier && tier.disabled ? (
                    <Button size="lg" className="w-full" disabled aria-disabled="true">
                      {tier.cta}
                    </Button>
                  ) : (
                    <Button asChild size="lg" className="w-full">
                      <Link to={tier.href}>{tier.cta}</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Closing pitch before final CTA */}
      <section
        className="px-4 sm:px-6 lg:px-8 py-14 sm:py-16 bg-gradient-to-br from-amber-50/80 via-orange-50/70 to-rose-50/80 dark:from-muted/40 dark:via-muted/30 dark:to-muted/40"
        aria-labelledby="chaos-heading"
      >
        <div className="max-w-4xl mx-auto text-center space-y-5">
          <h2 id="chaos-heading" className="text-2xl sm:text-3xl lg:text-4xl font-bold text-balance">
            Don’t Let Event Chaos Cost You Time & Money
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed text-pretty">
            Every missed detail impacts your event. Join planners and hosts who are creating better events—faster and
            smarter.
          </p>
        </div>
      </section>

      {/* Optional waitlist (kept; Starter Plan language) */}
      <section
        id="waitlist"
        className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 border-y border-amber-100/60 bg-white/55 dark:bg-muted/25 backdrop-blur-sm"
        aria-labelledby="waitlist-heading"
      >
        <div className="max-w-xl mx-auto">
          <h2 id="waitlist-heading" className="text-2xl sm:text-3xl font-bold text-center mb-2 text-balance">
            Get launch updates
          </h2>
          <p className="text-center text-muted-foreground text-sm sm:text-base mb-6 text-pretty">
            Join the campaign list for IEP — product news, early access, and event planning tips. Prefer to start
            immediately?{" "}
            <Link to={AUTH_STARTER_PLAN_PATH} className="text-primary font-medium underline-offset-4 hover:underline">
              Try free Starter Plan
            </Link>
            .
          </p>
          <MarketingWaitlistForm signupSource="landing_home" />
        </div>
      </section>

      {/* Final Starter Plan CTA */}
      <section
        id="get-started"
        className="px-4 sm:px-6 lg:px-8 py-14 sm:py-16 bg-gradient-to-r from-amber-100/50 via-rose-50/40 to-orange-50/50 dark:from-muted/50 dark:via-muted/40 dark:to-muted/50 border-t border-amber-200/30"
        aria-labelledby="final-cta-heading"
      >
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 id="final-cta-heading" className="text-2xl sm:text-3xl lg:text-4xl font-bold text-balance">
            Start Planning Smarter Today
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground text-pretty">
            Join planners and hosts who want less stress and more clarity—with a free Starter Plan for Event Planners.
          </p>
          <Button asChild size="lg" className="text-lg px-8 py-3 shadow-md">
            <Link to={AUTH_STARTER_PLAN_PATH}>Try free Starter Plan</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
