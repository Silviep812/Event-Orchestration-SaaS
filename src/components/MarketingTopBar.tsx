import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { IEP_LOGO_COLORED } from "@/lib/brandAssets";
import { AUTH_SIGN_IN_PATH, AUTH_STARTER_PLAN_PATH } from "@/lib/authRoutes";

type Page = "home" | "auth";

type MarketingTopBarProps = {
  /** Current public page — hides redundant nav actions */
  page?: Page;
  /** Optional: open the landing demo modal from header Demo control */
  onWatchDemo?: () => void;
};

const scrollToHash = (id: string) => {
  if (window.location.pathname === "/") {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  } else {
    window.location.assign(`/#${id}`);
  }
};

export function MarketingTopBar({ page = "home", onWatchDemo }: MarketingTopBarProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const menuId = useId();
  const showSignInCta = page !== "auth";

  const goFeatures = () => {
    scrollToHash("features");
    setOpen(false);
  };

  const goPricing = () => {
    scrollToHash("pricing");
    setOpen(false);
  };

  const goDemo = () => {
    if (onWatchDemo) {
      onWatchDemo();
    } else {
      scrollToHash("demo");
    }
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-amber-200/50 bg-gradient-to-r from-amber-50/95 via-orange-50/90 to-rose-50/85 backdrop-blur-md supports-[backdrop-filter]:from-amber-50/90">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Marketing">
        <div className="flex flex-nowrap items-center justify-between gap-4 min-h-[4.5rem] py-3">
          <div className="flex items-center gap-3 min-w-0 shrink-0">
            <Link to="/" className="flex items-center gap-3 min-w-0" aria-label="Ida Event Partners — We Got You">
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
                <span className="text-xs text-muted-foreground truncate">Plan events with calm confidence</span>
              </div>
            </Link>
          </div>

          <div className="hidden lg:flex flex-nowrap items-center justify-end gap-2 min-w-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-foreground/90 shrink-0 whitespace-nowrap"
              onClick={goFeatures}
            >
              Features
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-foreground/90 shrink-0 whitespace-nowrap"
              onClick={goDemo}
            >
              Demo
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-foreground/90 shrink-0 whitespace-nowrap"
              onClick={goPricing}
            >
              Pricing
            </Button>
            <span className="inline-flex items-center rounded-md bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary whitespace-nowrap shrink-0">
              Free Starter Plan for Event Planners
            </span>
            {showSignInCta && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 whitespace-nowrap"
                  onClick={() => navigate(AUTH_SIGN_IN_PATH)}
                >
                  Sign In
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="shrink-0 whitespace-nowrap"
                  onClick={() => navigate(AUTH_STARTER_PLAN_PATH)}
                >
                  Try Starter Plan - Free
                </Button>
              </>
            )}
            {page === "auth" && (
              <Button type="button" variant="secondary" size="sm" className="shrink-0" onClick={() => navigate("/")}>
                Home
              </Button>
            )}
          </div>

          <div className="flex lg:hidden items-center gap-2 shrink-0">
            {showSignInCta && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 whitespace-nowrap"
                onClick={() => navigate(AUTH_SIGN_IN_PATH)}
              >
                Sign In
              </Button>
            )}
            {page === "auth" && (
              <Button type="button" variant="ghost" size="sm" className="shrink-0" onClick={() => navigate("/")}>
                Home
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => setOpen((prev) => !prev)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls={menuId}
            >
              {open ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
            </Button>
          </div>
        </div>

        {open && (
          <div id={menuId} className="lg:hidden border-t border-amber-200/50 pb-3">
            <div className="px-2 pt-3 space-y-1">
              <p className="px-2 text-xs text-muted-foreground">Plan events with calm confidence</p>
              <Button type="button" variant="ghost" className="w-full justify-start" onClick={goFeatures}>
                Features
              </Button>
              <Button type="button" variant="ghost" className="w-full justify-start" onClick={goDemo}>
                Demo
              </Button>
              <Button type="button" variant="ghost" className="w-full justify-start" onClick={goPricing}>
                Pricing
              </Button>
              <div className="px-2 py-2 text-sm text-primary font-medium">Free Starter Plan for Event Planners</div>
              {showSignInCta && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setOpen(false);
                      navigate(AUTH_SIGN_IN_PATH);
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => {
                      setOpen(false);
                      navigate(AUTH_STARTER_PLAN_PATH);
                    }}
                  >
                    Try Starter Plan - Free
                  </Button>
                </>
              )}
              {page === "auth" && (
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    setOpen(false);
                    navigate("/");
                  }}
                >
                  Home
                </Button>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
