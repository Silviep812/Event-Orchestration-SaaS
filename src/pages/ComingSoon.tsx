import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import iepFullLogo from "@/assets/iep-full-logo.png";

const ComingSoon = () => {
  const navigate = useNavigate();
  const clickCountRef = useRef(0);
  const lastClickTimeRef = useRef(0);

  const handleLogoClick = () => {
    const now = Date.now();
    // Reset if more than 2 seconds since last click
    if (now - lastClickTimeRef.current > 2000) {
      clickCountRef.current = 0;
    }
    lastClickTimeRef.current = now;
    clickCountRef.current += 1;

    if (clickCountRef.current >= 5) {
      navigate("/dashboard");
    }
  };
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      // TODO: Connect to database to store email
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-2xl mx-auto">
        {/* Logo */}
        <div className="mb-8">
          <img 
            src={iepFullLogo} 
            alt="Ida Event Partners Logo" 
            className="h-[120px] w-auto mx-auto cursor-pointer"
            onClick={handleLogoClick}
          />
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
          <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Coming Soon
          </span>
        </h1>

        {/* Subheadline */}
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">
          Ida Event Partners
        </h2>

        {/* Description */}
        <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
          Your comprehensive event planning platform is launching soon. 
          Stay tuned for a User-friendly way to create, manage, make change requests, monitor progress, collaborate with team on event and so much more.
        </p>

        {/* Email signup */}
        {!submitted ? (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <div className="flex-1">
              <Label htmlFor="email" className="sr-only">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
                required
              />
            </div>
            <Button type="submit" className="whitespace-nowrap">
              Notify Me
            </Button>
          </form>
        ) : (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-primary font-medium">
              Thanks! We'll notify you when we launch.
            </p>
          </div>
        )}

        {/* Footer note */}
        <p className="mt-12 text-sm text-muted-foreground">
          © {new Date().getFullYear()} Ida Event Partners. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default ComingSoon;
