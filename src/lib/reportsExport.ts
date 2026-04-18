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

/** Avoid undefined / huge strings breaking jsPDF cells. */
function pdfCell(value: string | number | null | undefined, maxLen = 220): string {
  if (value == null) return "—";
  const s = String(value).replace(/\r\n/g, "\n").trim();
  if (!s) return "—";
  return s.length > maxLen ? `${s.slice(0, maxLen - 1)}…` : s;
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

  try {
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(pdfCell(args.title, 120), margin, y);
    y += 26;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Generated: ${pdfCell(args.generatedAtLabel, 180)}`, margin, y);
    y += 28;

    const section = (label: string) => {
      ensureSpace(36);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(pdfCell(label, 200), margin, y);
      y += 16;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
    };

    const emptyRow = (cols: number) => [Array.from({ length: cols }, () => "—")];

    section("Event plan — budget vs. tasks");
    const planBody =
      args.eventPlan.length > 0
        ? args.eventPlan.map((r) => [
            pdfCell(r.title),
            pdfCell(r.locationLabel),
            pdfCell(r.budgetPlan),
            pdfCell(r.budgetActual),
            pdfCell(r.variance),
            pdfCell(r.taskCompletion),
          ])
        : emptyRow(6);
    autoTable(doc, {
      startY: y,
      head: [["Event", "Location", "Budget (plan)", "Actual spend", "Variance", "Task completion"]],
      body: planBody,
      styles: { fontSize: 8, overflow: "linebreak", cellWidth: "wrap" },
      headStyles: { fillColor: [66, 66, 66] },
      margin: { left: margin, right: margin },
    });
    y = lastTableBottom(doc);

    section("Budget vs. actual (planned vs. recorded spend)");
    ensureSpace(120);
    const budgetBody =
      args.budgetVsActual.length > 0
        ? args.budgetVsActual.map((r) => {
            const gap = Number(r.budget) - Number(r.actual);
            return [
              pdfCell(r.name),
              pdfCell(Number.isFinite(Number(r.budget)) ? Number(r.budget).toFixed(0) : "—"),
              pdfCell(Number.isFinite(Number(r.actual)) ? Number(r.actual).toFixed(0) : "—"),
              pdfCell(Number.isFinite(gap) ? gap.toFixed(0) : "—"),
            ];
          })
        : emptyRow(4);
    autoTable(doc, {
      startY: y,
      head: [["Event", "Planned budget", "Actual (line items)", "Gap"]],
      body: budgetBody,
      styles: { fontSize: 8, overflow: "linebreak", cellWidth: "wrap" },
      headStyles: { fillColor: [66, 66, 66] },
      margin: { left: margin, right: margin },
    });
    y = lastTableBottom(doc);

    section("Task completion rate (completed ÷ active tasks)");
    ensureSpace(120);
    const taskBody =
      args.taskCompletion.length > 0
        ? args.taskCompletion.map((r) => [
            pdfCell(r.name),
            pdfCell(Number.isFinite(r.pct) ? `${r.pct.toFixed(1)}%` : "—"),
          ])
        : emptyRow(2);
    autoTable(doc, {
      startY: y,
      head: [["Event", "Completion %"]],
      body: taskBody,
      styles: { fontSize: 8, overflow: "linebreak", cellWidth: "wrap" },
      headStyles: { fillColor: [66, 66, 66] },
      margin: { left: margin, right: margin },
    });
    y = lastTableBottom(doc);

    section("Change frequency (by day)");
    ensureSpace(160);
    const timelineBody =
      args.changeTimeline.length > 0
        ? args.changeTimeline.map((r) => [pdfCell(r.date), pdfCell(String(r.changes ?? 0))])
        : emptyRow(2);
    autoTable(doc, {
      startY: y,
      head: [["Date", "Changes"]],
      body: timelineBody,
      styles: { fontSize: 8, overflow: "linebreak", cellWidth: "wrap" },
      headStyles: { fillColor: [66, 66, 66] },
      margin: { left: margin, right: margin },
    });
    y = lastTableBottom(doc);

    section("Change frequency — top entity types");
    ensureSpace(160);
    const topBody =
      args.topEntities.length > 0
        ? args.topEntities.map((r) => [pdfCell(r.entity), pdfCell(String(r.changes ?? 0))])
        : emptyRow(2);
    autoTable(doc, {
      startY: y,
      head: [["Entity", "Changes"]],
      body: topBody,
      styles: { fontSize: 8, overflow: "linebreak", cellWidth: "wrap" },
      headStyles: { fillColor: [66, 66, 66] },
      margin: { left: margin, right: margin },
    });
    y = lastTableBottom(doc);

    section("Vendor performance — workflow selections by category");
    ensureSpace(120);
    const vcBody =
      args.vendorCategories.length > 0
        ? args.vendorCategories.map((r) => [pdfCell(r.category), pdfCell(r.selections)])
        : emptyRow(2);
    autoTable(doc, {
      startY: y,
      head: [["Category", "Selection count"]],
      body: vcBody,
      styles: { fontSize: 8, overflow: "linebreak", cellWidth: "wrap" },
      headStyles: { fillColor: [66, 66, 66] },
      margin: { left: margin, right: margin },
    });
    y = lastTableBottom(doc);

    section("Vendor performance — top spend (budget line items)");
    ensureSpace(160);
    const vsBody =
      args.vendorSpend.length > 0
        ? args.vendorSpend.map((r) => [pdfCell(r.vendor), pdfCell(r.spend)])
        : emptyRow(2);
    autoTable(doc, {
      startY: y,
      head: [["Vendor", "Actual spend"]],
      body: vsBody,
      styles: { fontSize: 8, overflow: "linebreak", cellWidth: "wrap" },
      headStyles: { fillColor: [66, 66, 66] },
      margin: { left: margin, right: margin },
    });
    y = lastTableBottom(doc);

    section("Multi-location performance");
    ensureSpace(120);
    const locBody =
      args.locations.length > 0
        ? args.locations.map((r) => [pdfCell(r.location), pdfCell(r.events), pdfCell(r.avgCompletion)])
        : emptyRow(3);
    autoTable(doc, {
      startY: y,
      head: [["Location", "Events", "Avg. task completion"]],
      body: locBody,
      styles: { fontSize: 8, overflow: "linebreak", cellWidth: "wrap" },
      headStyles: { fillColor: [66, 66, 66] },
      margin: { left: margin, right: margin },
    });

    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text("Event Orchestration — Analytics & Reports", margin, doc.internal.pageSize.getHeight() - 28);
    doc.save(`analytics-reports-${args.fileSlug}.pdf`);
  } catch (e) {
    console.error("downloadAnalyticsReportsPdf:", e);
    throw e;
  }
}
