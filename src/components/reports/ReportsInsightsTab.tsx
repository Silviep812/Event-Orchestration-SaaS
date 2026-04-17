import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  ComposedChart,
} from "recharts";

export type InsightBudgetRow = {
  name: string;
  budget: number;
  actual: number;
};

export type InsightTaskRateRow = {
  name: string;
  rate: number;
};

export type InsightVendorCatRow = {
  name: string;
  selections: number;
};

export type InsightVendorSpendRow = {
  vendor: string;
  actual: number;
};

export type InsightLocationRow = {
  location: string;
  events: number;
  avgCompletion: number | null;
};

export type InsightChangeFreqRow = {
  date: string;
  changes: number;
};

interface ReportsInsightsTabProps {
  budgetVsActual: InsightBudgetRow[];
  taskCompletionRates: InsightTaskRateRow[];
  vendorSelectionsByCategory: InsightVendorCatRow[];
  vendorSpendTop: InsightVendorSpendRow[];
  locationPerformance: InsightLocationRow[];
  changeFrequency: InsightChangeFreqRow[];
}

function truncateLabel(s: string, max = 18) {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

/**
 * Spec “Analytics & Reports” — five report areas (change frequency data passed for dedicated chart).
 */
export function ReportsInsightsTab({
  budgetVsActual,
  taskCompletionRates,
  vendorSelectionsByCategory,
  vendorSpendTop,
  locationPerformance,
  changeFrequency,
}: ReportsInsightsTabProps) {
  const budgetChart = budgetVsActual.map((r) => ({
    ...r,
    label: truncateLabel(r.name),
  }));
  const taskChart = taskCompletionRates.map((r) => ({
    ...r,
    label: truncateLabel(r.name),
  }));
  const locChart = locationPerformance.map((r) => ({
    ...r,
    label: truncateLabel(r.location),
    avgCompletionDisplay: r.avgCompletion == null ? 0 : Math.round(r.avgCompletion * 10) / 10,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Budget vs. actual</CardTitle>
            <CardDescription>
              Planned event budget compared to sum of recorded line-item spend from budget line items.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            {budgetChart.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events with budget data in this scope.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={budgetChart} margin={{ top: 8, right: 8, left: 8, bottom: 48 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" angle={-35} textAnchor="end" interval={0} height={70} tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={(v) => `$${v}`} width={56} />
                  <Tooltip
                    formatter={(value: number, key: string) =>
                      key === "budget" ? [`$${value.toLocaleString()}`, "Planned"] : [`$${value.toLocaleString()}`, "Actual"]
                    }
                    labelFormatter={(_, p) => (p?.[0]?.payload?.name as string) || ""}
                  />
                  <Legend />
                  <Bar dataKey="budget" name="Planned budget" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" name="Actual spend" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task completion rate</CardTitle>
            <CardDescription>Completed tasks divided by active tasks (excludes cancelled).</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            {taskChart.length === 0 ? (
              <p className="text-sm text-muted-foreground">No task data for these events.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskChart} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="label" width={100} tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(v: number) => [`${v.toFixed(1)}%`, "Completion"]}
                    labelFormatter={(_, p) => (p?.[0]?.payload?.name as string) || ""}
                  />
                  <Bar dataKey="rate" name="Completion %" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Change frequency</CardTitle>
          <CardDescription>Number of system changes captured in the activity feed per day.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          {changeFrequency.length === 0 ? (
            <p className="text-sm text-muted-foreground">No change activity in the selected filters.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={changeFrequency}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="changes" name="Changes" stroke="hsl(var(--primary))" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Vendor performance</CardTitle>
            <CardDescription>Workflow selection intensity by category (vendor, hospitality, resource).</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {vendorSelectionsByCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No vendor / hospitality / resource selections yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vendorSelectionsByCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="selections" name="Selections" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vendor spend (budget lines)</CardTitle>
            <CardDescription>Top vendors by summed actual cost on budget line items.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {vendorSpendTop.length === 0 ? (
              <p className="text-sm text-muted-foreground">No vendor-attributed spend recorded yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vendorSpendTop.map((v) => ({ ...v, label: truncateLabel(v.vendor, 22) }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    formatter={(v: number) => [`$${v.toLocaleString()}`, "Actual"]}
                    labelFormatter={(_, p) => (p?.[0]?.payload?.vendor as string) || ""}
                  />
                  <Bar dataKey="actual" name="Spend" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Multi-location performance</CardTitle>
          <CardDescription>
            Events grouped by location or venue. Bars show average task completion across events at each site.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[320px]">
          {locChart.length === 0 ? (
            <p className="text-sm text-muted-foreground">No location grouping available.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={locChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" angle={-30} textAnchor="end" height={70} tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" allowDecimals={false} label={{ value: "Events", angle: -90, position: "insideLeft" }} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  formatter={(value: number, name: string) =>
                    name === "events" ? [value, "Events"] : [`${value}%`, "Avg. completion"]
                  }
                  labelFormatter={(_, p) => (p?.[0]?.payload?.location as string) || ""}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="events" name="Events" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgCompletionDisplay"
                  name="Avg. completion %"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
