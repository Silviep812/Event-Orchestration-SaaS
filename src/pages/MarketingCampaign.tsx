import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Megaphone, Users, Mail, Target, TrendingUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Counts = {
  subscribers: number;
  campaigns: number;
  emailsSent: number;
  openRate: number | null;
  clickRate: number | null;
  conversions: number;
};

export default function MarketingCampaign() {
  const { user, userRoles, loading: authLoading } = useAuth();
  const isAdmin = userRoles.includes("admin");
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [recent, setRecent] = useState<
    { id: string; email: string; name: string | null; signup_source: string | null; created_at: string }[]
  >([]);
  const [schemaWarning, setSchemaWarning] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAdmin || !user) {
      setLoading(false);
      return;
    }
    setSchemaWarning(null);
    setLoading(true);
    try {
      const missingTable = (err: { message?: string; code?: string } | null) => {
        const m = (err?.message ?? "").toLowerCase();
        return (
          m.includes("schema cache") ||
          m.includes("does not exist") ||
          err?.code === "PGRST205" ||
          err?.code === "42P01"
        );
      };

      const subCount = await supabase.from("marketing_subscribers").select("id", { count: "exact", head: true });
      const campCount = await supabase.from("marketing_campaigns").select("id", { count: "exact", head: true });
      const deliveries = await supabase
        .from("marketing_email_deliveries")
        .select("opened, clicked", { count: "exact" })
        .not("sent_at", "is", null);
      const recentRows = await supabase
        .from("marketing_subscribers")
        .select("id, email, name, signup_source, created_at")
        .order("created_at", { ascending: false })
        .limit(12);
      const convCount = await supabase.from("marketing_conversions").select("id", { count: "exact", head: true });

      const issues: string[] = [];
      if (subCount.error && missingTable(subCount.error)) issues.push("marketing_subscribers");
      if (campCount.error && missingTable(campCount.error)) issues.push("marketing_campaigns");
      if (deliveries.error && missingTable(deliveries.error)) issues.push("marketing_email_deliveries");
      if (recentRows.error && missingTable(recentRows.error)) issues.push("marketing_subscribers (list)");
      if (convCount.error && missingTable(convCount.error)) issues.push("marketing_conversions");

      if (issues.length > 0) {
        setSchemaWarning(
          `Some marketing tables are not in the database yet. Run the SQL migration file ` +
            `20260331130000_marketing_campaign_binder_schema.sql in Supabase (SQL Editor), then reload. ` +
            `Missing: ${[...new Set(issues)].join(", ")}.`,
        );
      }

      const rows = deliveries.error ? [] : (deliveries.data ?? []);
      const sent = rows.length;
      const opens = rows.filter((r: { opened: boolean }) => r.opened).length;
      const clicks = rows.filter((r: { clicked: boolean }) => r.clicked).length;

      setCounts({
        subscribers: subCount.error ? 0 : (subCount.count ?? 0),
        campaigns: campCount.error ? 0 : (campCount.count ?? 0),
        emailsSent: sent,
        openRate: sent > 0 ? Math.round((opens / sent) * 1000) / 10 : null,
        clickRate: sent > 0 ? Math.round((clicks / sent) * 1000) / 10 : null,
        conversions: convCount.error ? 0 : (convCount.count ?? 0),
      });
      setRecent(
        recentRows.error ? [] : ((recentRows.data as typeof recent) ?? []),
      );
    } catch (e: unknown) {
      setSchemaWarning(
        e && typeof e === "object" && "message" in e
          ? String((e as Error).message)
          : "Failed to load marketing data.",
      );
      setCounts({
        subscribers: 0,
        campaigns: 0,
        emailsSent: 0,
        openRate: null,
        clickRate: null,
        conversions: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user]);

  useEffect(() => {
    if (authLoading) return;
    load();
  }, [authLoading, load]);

  if (authLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container max-w-lg py-12 text-center text-muted-foreground">
        Sign in to view marketing tools.
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container max-w-lg py-12 space-y-4">
        <div className="flex items-center gap-2 text-lg font-medium">
          <Megaphone className="h-5 w-5" />
          Marketing campaign dashboard
        </div>
        <p className="text-muted-foreground">
          This page is available to <strong className="text-foreground">administrators</strong> only. It shows
          subscribers, campaigns, and delivery metrics from the Marketing Campaign Binder schema.
        </p>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="h-6 w-6" />
          Marketing campaign dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Campaign Binder metrics: subscribers, active campaigns, sends, open/click rates (when delivery rows
          exist), and conversions.
        </p>
      </div>

      {schemaWarning ? (
        <div className="rounded-md border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          {schemaWarning}
        </div>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : counts ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total subscribers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.subscribers}</div>
              <p className="text-xs text-muted-foreground">marketing_subscribers</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Campaigns</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.campaigns}</div>
              <p className="text-xs text-muted-foreground">marketing_campaigns</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Emails sent</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.emailsSent}</div>
              <p className="text-xs text-muted-foreground">marketing_email_deliveries (sent_at set)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Open rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.openRate != null ? `${counts.openRate}%` : "—"}</div>
              <p className="text-xs text-muted-foreground">From delivery rows</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Click rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.clickRate != null ? `${counts.clickRate}%` : "—"}</div>
              <p className="text-xs text-muted-foreground">From delivery rows</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Conversions</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.conversions}</div>
              <p className="text-xs text-muted-foreground">marketing_conversions</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent subscribers</CardTitle>
          <CardDescription>Latest leads (signup_source helps attribute channel).</CardDescription>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subscribers yet. Use Contact or an Edge Function to insert.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-sm">{r.email}</TableCell>
                    <TableCell>{r.name ?? "—"}</TableCell>
                    <TableCell>{r.signup_source ?? "—"}</TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {new Date(r.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
