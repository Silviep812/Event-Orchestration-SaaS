import { Link } from "react-router-dom";
import { MarketingTopBar } from "@/components/MarketingTopBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Public-facing “binder” ad previews for LinkedIn / Instagram / Facebook.
 * Replace placeholder art blocks with exported PNGs from your design tool when ready.
 */
export default function MarketingCreatives() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/90 via-background to-background">
      <MarketingTopBar page="home" />
      <div className="container max-w-5xl py-10 space-y-8 px-4">
        <div className="space-y-2 text-center sm:text-left">
          <Badge variant="secondary" className="mx-auto sm:mx-0 w-fit">
            Social pack
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">IEP launch — ad creatives</h1>
          <p className="text-muted-foreground max-w-2xl">
            Headlines, captions, and layout notes from the marketing campaign binder. Drop in final imagery (1080×1080 or
            1200×628) when your design assets are exported.
          </p>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/auth">Start free trial</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/">Back to home</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <Card className="overflow-hidden border-amber-200/60 shadow-md">
            <CardHeader className="bg-gradient-to-r from-sky-600/90 to-indigo-600/90 text-primary-foreground">
              <CardTitle className="text-lg">Creative 1 — Event planning dashboard</CardTitle>
              <CardDescription className="text-sky-100">
                Visual cue: 90 / 60 / 30-day timeline, weekly workstreams, and a light Gantt strip (see campaign binder).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div
                className="rounded-lg border bg-muted/40 aspect-[4/5] sm:aspect-video flex flex-col justify-between p-4 text-sm"
                aria-hidden
              >
                <div className="flex gap-1">
                  <span className="h-16 flex-1 rounded bg-sky-500/30 border border-sky-500/40" />
                  <span className="h-16 flex-1 rounded bg-emerald-500/25 border border-emerald-500/35" />
                  <span className="h-16 flex-1 rounded bg-amber-500/25 border border-amber-500/35" />
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">Timeline + milestones</p>
                  <p>Venue secured → Marketing launched → Final logistics</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Headline</p>
                <p className="font-semibold text-lg">Plan every detail of your event in one platform</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Caption</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  IEP helps event professionals organize timelines, budgets, vendors, and teams in one place. Start
                  planning smarter.
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-muted-foreground">CTA</p>
                <p className="text-sm font-medium">Start your free trial</p>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-amber-200/60 shadow-md">
            <CardHeader className="bg-gradient-to-r from-violet-600/90 to-fuchsia-600/90 text-primary-foreground">
              <CardTitle className="text-lg">Creative 2 — Event success journey</CardTitle>
              <CardDescription className="text-violet-100">
                Visual cue: seven-step chevron / funnel from team → execution (binder infographic).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div
                className="rounded-lg border bg-muted/40 aspect-[4/5] sm:aspect-video flex items-end gap-0.5 p-3"
                aria-hidden
              >
                {["Team", "Goals", "Budget", "Venue", "Details", "Promote", "Execute"].map((label, i) => (
                  <div
                    key={label}
                    className="flex-1 min-h-0 flex flex-col justify-end text-[10px] text-center font-medium text-white/95"
                    title={label}
                  >
                    <div
                      className="mx-auto w-full max-w-[3.5rem] rounded-t-md shadow-sm"
                      style={{
                        height: `${48 + i * 10}px`,
                        background: `hsl(${250 - i * 18} 65% ${42 + i * 4}%)`,
                      }}
                    />
                    <span className="mt-1 truncate px-0.5">{label}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Headline</p>
                <p className="font-semibold text-lg">Great events start with great planning</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Caption</p>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  <li>Create events</li>
                  <li>Manage budgets</li>
                  <li>Collaborate with vendors</li>
                  <li>Track progress</li>
                </ul>
                <p className="text-sm text-muted-foreground pt-1">From concept to execution, IEP keeps your event on track.</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-muted-foreground">CTA</p>
                <p className="text-sm font-medium">See the demo</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
