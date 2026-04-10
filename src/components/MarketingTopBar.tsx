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
    <nav className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-between items-center gap-y-2 min-h-[4rem] py-2">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/" className="flex items-center gap-3 shrink-0" aria-label="Ida Event Partners — We Got You">
              <img
                src={IEP_LOGO_COLORED}
                alt="Ida Event Partners — We Got You"
                className="h-10 w-auto sm:h-11 object-contain"
                width={44}
                height={44}
                loading="eager"
                decoding="async"
              />
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="text-sm font-semibold text-foreground tracking-tight">Ida Event Partners</span>
                <span className="text-xs text-muted-foreground">Welcome — plan smarter events</span>
              </div>
            </Link>
          </div>

          <div className="hidden lg:flex items-center gap-1 text-sm text-foreground/90">
            <Button variant="ghost" className="text-foreground/90" onClick={() => scrollToHash("features")}>
              Features
            </Button>
            <Button variant="ghost" className="text-foreground/90" onClick={() => scrollToHash("payment-plan")}>
              Payment plan
            </Button>
            <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium whitespace-nowrap">
              14-day free trial
            </span>
            <div className="flex items-center gap-1.5 pl-2 ml-1 border-l text-muted-foreground tabular-nums">
              <Clock className="h-4 w-4 shrink-0" aria-hidden />
              <div className="flex flex-col items-end text-[11px] leading-tight">
                <span className="text-foreground font-medium">{timeLabel}</span>
                <span>{dateLabel}</span>
              </div>
            </div>
            {showSignInCta && (
              <>
                <Button variant="outline" size="sm" className="ml-2" onClick={() => navigate("/auth")}>
                  Sign In
                </Button>
                <Button size="sm" onClick={() => navigate("/auth")}>
                  Start trial
                </Button>
              </>
            )}
            {page === "auth" && (
              <Button variant="secondary" size="sm" className="ml-2" onClick={() => navigate("/")}>
                Home
              </Button>
            )}
          </div>

          <div className="flex lg:hidden items-center gap-2">
            <div className="flex items-center gap-1 text-muted-foreground tabular-nums text-xs">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              <span>{timeLabel}</span>
            </div>
            {showSignInCta && (
              <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
            )}
            {page === "auth" && (
              <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
                Home
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(!open)}
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {open && (
          <div className="lg:hidden border-t pb-3">
            <div className="px-2 pt-2 space-y-1">
              <p className="px-2 text-xs text-muted-foreground">Welcome — plan smarter events</p>
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
                Payment plan
              </Button>
              <div className="px-2 py-2 text-sm text-primary font-medium">14-day free trial</div>
              {showSignInCta && (
                <>
                  <Button variant="outline" className="w-full" onClick={() => navigate("/auth")}>
                    Sign In
                  </Button>
                  <Button className="w-full" onClick={() => navigate("/auth")}>
                    Start trial
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
