import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";

interface InvoiceRow {
  id: string;
  invoice_number: string | null;
  plan_name: string;
  amount: number;
  currency: string;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  description: string | null;
  billing_period_start: string | null;
  billing_period_end: string | null;
  created_at: string;
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "paid") return "secondary";
  if (status === "overdue") return "destructive";
  if (status === "sent") return "default";
  return "outline";
}

export default function Invoices() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<{
    plan: string | null;
    status: string | null;
    expires: string | null;
  }>({ plan: null, status: null, expires: null });

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_plan, subscription_status, subscription_expires_at")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      setSubscription({
        plan: (profile as any).subscription_plan || "starter",
        status: (profile as any).subscription_status || "active",
        expires: (profile as any).subscription_expires_at || null,
      });
    }

    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("invoices load:", error);
    }
    setInvoices((data as InvoiceRow[]) || []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { void load(); }, [load]);

  const markPaid = async (id: string) => {
    const { error } = await supabase
      .from("invoices")
      .update({ status: "paid", paid_at: new Date().toISOString() } as any)
      .eq("id", id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Invoice marked as paid" });
    void load();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing & Invoices</h1>
        <p className="text-muted-foreground">
          View your subscription status and invoice history.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <Badge variant="default" className="text-sm capitalize">
            {subscription.plan || "Starter"} Plan
          </Badge>
          <Badge variant={subscription.status === "active" ? "secondary" : "outline"} className="text-sm capitalize">
            {subscription.status || "Active"}
          </Badge>
          {subscription.expires && (
            <span className="text-sm text-muted-foreground">
              Expires: {format(new Date(subscription.expires), "MMM d, yyyy")}
            </span>
          )}
          {subscription.plan === "starter" && (
            <p className="text-sm text-muted-foreground w-full mt-2">
              You are on the free Starter plan. Upgrade to Pro for unlimited events, advanced workflows, and analytics.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> Invoice History
          </CardTitle>
          <CardDescription>
            All invoices for your account. Contact support if you need to dispute a charge.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-6">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading invoices…
            </div>
          ) : invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No invoices yet. Invoices will appear here when you upgrade to a paid plan.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4">Invoice #</th>
                    <th className="py-2 pr-4">Plan</th>
                    <th className="py-2 pr-4">Amount</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Due Date</th>
                    <th className="py-2 pr-4">Period</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-mono text-xs">{inv.invoice_number || "—"}</td>
                      <td className="py-3 pr-4 capitalize">{inv.plan_name}</td>
                      <td className="py-3 pr-4">${inv.amount.toFixed(2)} {inv.currency}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={statusVariant(inv.status)} className="capitalize">
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        {inv.due_date ? format(new Date(inv.due_date), "MMM d, yyyy") : "—"}
                      </td>
                      <td className="py-3 pr-4 text-xs text-muted-foreground">
                        {inv.billing_period_start && inv.billing_period_end
                          ? `${format(new Date(inv.billing_period_start), "MMM d")} – ${format(new Date(inv.billing_period_end), "MMM d, yyyy")}`
                          : "—"}
                      </td>
                      <td className="py-3">
                        {inv.status === "sent" || inv.status === "overdue" ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => void markPaid(inv.id)}
                          >
                            Mark Paid
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
