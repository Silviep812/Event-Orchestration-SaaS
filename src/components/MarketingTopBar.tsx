import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Clock, Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { IEP_LOGO_COLORED } from "@/lib/brandAssets";

type Page = "home" | "auth";

type MarketingTopBarProps = {
  /** Current public page — hides redundant nav actions */
  page?: Page;
};

const scrollToHash = (id: string) => {
  if (window.location.pathname === "/") {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  } else {
    window.location.assign(`/#${id}`);
  }
};

export function MarketingTopBar({ page = "home" }: MarketingTopBarProps) {
  const [now, setNow] = useState(() => new Date());
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeLabel = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const dateLabel = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const showSignInCta = page !== "auth";

  return (
    <nav className="border-b border-amber-200/50 bg-gradient-to-r from-amber-50/95 via-orange-50/90 to-rose-50/85 backdrop-blur-md supports-[backdrop-filter]:from-amber-50/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-nowrap items-center justify-between gap-4 min-h-[4.5rem] py-3">
          <div className="flex items-center gap-3 min-w-0 shrink-0">
            <Link
              to="/"
              className="flex items-center gap-3 min-w-0"
              aria-label="Ida Event Partners — We Got You"
            >
              <img
                src={IEP_LOGO_COLORED}
                alt="Ida Event Partners — We Got You"
                className="h-10 w-auto sm:h-11 object-contain brightness-110 contrast-105 drop-shadow-sm"
                width={44}
                height={44}
                loading="eager"
                decoding="async"
              />
              <div className="hidden sm:flex flex-col justify-center min-w-0 text-left leading-tight gap-0.5">
                <span className="text-sm font-semibold text-foreground tracking-tight truncate">
                  Ida Event Partners
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  Plan events with calm confidence
                </span>
              </div>
            </Link>
          </div>

          <div className="hidden lg:flex flex-nowrap items-center justify-end gap-2 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              className="text-foreground/90 shrink-0 whitespace-nowrap"
              onClick={() => scrollToHash("features")}
            >
              Features
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-foreground/90 shrink-0 whitespace-nowrap"
              onClick={() => scrollToHash("payment-plan")}
            >
              Pricing
            </Button>
            <span className="inline-flex items-center rounded-md bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary whitespace-nowrap shrink-0">
              Free Starter Plan for Event Planners
            </span>
            <div className="flex shrink-0 items-center gap-1.5 pl-3 ml-1 border-l border-amber-200/60 text-muted-foreground tabular-nums">
              <Clock className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
              <div className="flex flex-col items-end text-[11px] leading-tight whitespace-nowrap">
                <span className="text-foreground font-medium">{timeLabel}</span>
                <span>{dateLabel}</span>
              </div>
            </div>
            {showSignInCta && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 whitespace-nowrap"
                  onClick={() => navigate("/auth")}
                >
                  Sign In
                </Button>
                <Button size="sm" className="shrink-0 whitespace-nowrap" onClick={() => navigate("/auth")}>
                  Start free trial
                </Button>
              </>
            )}
            {page === "auth" && (
              <Button variant="secondary" size="sm" className="shrink-0" onClick={() => navigate("/")}>
                Home
              </Button>
            )}
          </div>

          <div className="flex lg:hidden items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 text-muted-foreground tabular-nums text-xs whitespace-nowrap">
              <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>{timeLabel}</span>
            </div>
            {showSignInCta && (
              <Button variant="ghost" size="sm" className="shrink-0 whitespace-nowrap" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
            )}
            {page === "auth" && (
              <Button variant="ghost" size="sm" className="shrink-0" onClick={() => navigate("/")}>
                Home
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => setOpen(!open)}
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {open && (
          <div className="lg:hidden border-t border-amber-200/50 pb-3">
            <div className="px-2 pt-3 space-y-1">
              <p className="px-2 text-xs text-muted-foreground">Plan events with calm confidence</p>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  scrollToHash("features");
                  setOpen(false);
                }}
              >
                Features
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  scrollToHash("demo");
                  setOpen(false);
                }}
              >
                Demo
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  scrollToHash("payment-plan");
                  setOpen(false);
                }}
              >
                Pricing
              </Button>
              <div className="px-2 py-2 text-sm text-primary font-medium">Free Starter Plan for Event Planners</div>
              {showSignInCta && (
                <>
                  <Button variant="outline" className="w-full" onClick={() => navigate("/auth")}>
                    Sign In
                  </Button>
                  <Button className="w-full" onClick={() => navigate("/auth")}>
                    Start free trial
                  </Button>
                </>
              )}
              {page === "auth" && (
                <Button variant="secondary" className="w-full" onClick={() => navigate("/")}>
                  Home
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
