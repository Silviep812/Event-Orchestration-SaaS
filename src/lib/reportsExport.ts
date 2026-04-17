/** CSV + PDF helpers for Analytics & Reports (`Reports` page). */

function csvEscape(cell: string | number | null | undefined): string {
  const s = cell == null ? "" : String(cell);
  return `"${s.replace(/"/g, '""')}"`;
}

export function rowsToCsv(rows: (string | number | null | undefined)[][]): string {
  return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
}

export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]): void {
  const blob = new Blob([rowsToCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function lastTableBottom(doc: object): number {
  const lt = (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable;
  return (lt?.finalY ?? 72) + 28;
}

export type PdfEventPlanRow = {
  title: string;
  locationLabel: string;
  budgetPlan: string;
  budgetActual: string;
  variance: string;
  taskCompletion: string;
};

export type PdfVendorCategory = { category: string; selections: string };
export type PdfVendorSpend = { vendor: string; spend: string };
export type PdfLocationRow = { location: string; events: string; avgCompletion: string };

/**
 * Multi-section PDF pack: event plan, budget vs actual, task completion, vendor & location summaries, change analytics.
 */
export async function downloadAnalyticsReportsPdf(args: {
  title: string;
  generatedAtLabel: string;
  fileSlug: string;
  eventPlan: PdfEventPlanRow[];
  budgetVsActual: { name: string; budget: number; actual: number }[];
  taskCompletion: { name: string; pct: number }[];
  changeTimeline: { date: string; changes: number }[];
  topEntities: { entity: string; changes: number }[];
  vendorCategories: PdfVendorCategory[];
  vendorSpend: PdfVendorSpend[];
  locations: PdfLocationRow[];
}): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  let y = 48;

  const ensureSpace = (needed: number) => {
    const h = doc.internal.pageSize.getHeight();
    if (y + needed > h - 50) {
      doc.addPage();
      y = 48;
    }
  };

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(args.title, margin, y);
  y += 26;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Generated: ${args.generatedAtLabel}`, margin, y);
  y += 28;

  const section = (label: string) => {
    ensureSpace(36);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(label, margin, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
  };

  section("Event plan — budget vs. tasks");
  autoTable(doc, {
    startY: y,
    head: [["Event", "Location", "Budget (plan)", "Actual spend", "Variance", "Task completion"]],
    body: args.eventPlan.map((r) => [
      r.title,
      r.locationLabel,
      r.budgetPlan,
      r.budgetActual,
      r.variance,
      r.taskCompletion,
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [66, 66, 66] },
    margin: { left: margin, right: margin },
  });
  y = lastTableBottom(doc);

  section("Budget vs. actual (planned vs. recorded spend)");
  ensureSpace(120);
  autoTable(doc, {
    startY: y,
    head: [["Event", "Planned budget", "Actual (line items)", "Gap"]],
    body: args.budgetVsActual.map((r) => [
      r.name,
      r.budget.toFixed(0),
      r.actual.toFixed(0),
      (r.budget - r.actual).toFixed(0),
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [66, 66, 66] },
    margin: { left: margin, right: margin },
  });
  y = lastTableBottom(doc);

  section("Task completion rate (completed ÷ active tasks)");
  ensureSpace(120);
  autoTable(doc, {
    startY: y,
    head: [["Event", "Completion %"]],
    body: args.taskCompletion.map((r) => [r.name, `${r.pct.toFixed(1)}%`]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [66, 66, 66] },
    margin: { left: margin, right: margin },
  });
  y = lastTableBottom(doc);

  section("Change frequency (by day)");
  ensureSpace(160);
  autoTable(doc, {
    startY: y,
    head: [["Date", "Changes"]],
    body: args.changeTimeline.map((r) => [r.date, String(r.changes)]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [66, 66, 66] },
    margin: { left: margin, right: margin },
  });
  y = lastTableBottom(doc);

  section("Change frequency — top entity types");
  ensureSpace(160);
  autoTable(doc, {
    startY: y,
    head: [["Entity", "Changes"]],
    body: args.topEntities.map((r) => [r.entity, String(r.changes)]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [66, 66, 66] },
    margin: { left: margin, right: margin },
  });
  y = lastTableBottom(doc);

  section("Vendor performance — workflow selections by category");
  ensureSpace(120);
  autoTable(doc, {
    startY: y,
    head: [["Category", "Selection count"]],
    body: args.vendorCategories.map((r) => [r.category, r.selections]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [66, 66, 66] },
    margin: { left: margin, right: margin },
  });
  y = lastTableBottom(doc);

  section("Vendor performance — top spend (budget line items)");
  ensureSpace(160);
  autoTable(doc, {
    startY: y,
    head: [["Vendor", "Actual spend"]],
    body: args.vendorSpend.map((r) => [r.vendor, r.spend]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [66, 66, 66] },
    margin: { left: margin, right: margin },
  });
  y = lastTableBottom(doc);

  section("Multi-location performance");
  ensureSpace(120);
  autoTable(doc, {
    startY: y,
    head: [["Location", "Events", "Avg. task completion"]],
    body: args.locations.map((r) => [r.location, r.events, r.avgCompletion]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [66, 66, 66] },
    margin: { left: margin, right: margin },
  });

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text("Event Orchestration — Analytics & Reports", margin, doc.internal.pageSize.getHeight() - 28);
  doc.save(`analytics-reports-${args.fileSlug}.pdf`);
}
