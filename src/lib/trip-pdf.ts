import { jsPDF } from "jspdf";
import type { ItineraryDay } from "./trip-types";
import { getCurrencySnapshot } from "./currency";

function fmtPdfMoney(usd: number): string {
  const { currency, usdToInr } = getCurrencySnapshot();
  if (currency === "INR") {
    // jsPDF default helvetica lacks the ₹ glyph; use "Rs" prefix.
    return `Rs ${Math.round(usd * usdToInr).toLocaleString("en-IN")}`;
  }
  return `$${Math.round(usd).toLocaleString()}`;
}

type TripForPdf = {
  title: string;
  destination: string;
  days: number;
  budget: string;
  interests: string[];
  itinerary: ItineraryDay[];
};

export function downloadTripPdf(trip: TripForPdf) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const writeWrapped = (text: string, fontSize: number, opts?: { bold?: boolean; color?: [number, number, number] }) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
    if (opts?.color) doc.setTextColor(...opts.color);
    else doc.setTextColor(20, 20, 20);
    const lines = doc.splitTextToSize(text, maxWidth);
    for (const line of lines) {
      ensureSpace(fontSize + 4);
      doc.text(line, margin, y);
      y += fontSize + 4;
    }
  };

  // Header
  writeWrapped(trip.title, 22, { bold: true });
  y += 4;
  writeWrapped(`${trip.days}-day trip to ${trip.destination}`, 12, { color: [110, 110, 110] });
  writeWrapped(`Budget: ${trip.budget} · Interests: ${trip.interests.join(", ") || "—"}`, 11, {
    color: [110, 110, 110],
  });

  const tripTotal = trip.itinerary.reduce(
    (sum, d) => sum + d.activities.reduce((s, a) => s + (a.costEstimate ?? 0), 0),
    0
  );
  if (tripTotal > 0) {
    writeWrapped(`Estimated total: ${fmtPdfMoney(tripTotal)} / person`, 11, {
      bold: true,
    });
  }

  y += 12;
  doc.setDrawColor(220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 16;

  // Days
  for (const day of trip.itinerary) {
    ensureSpace(60);
    writeWrapped(`Day ${day.day} — ${day.title}`, 16, { bold: true });
    if (day.summary) writeWrapped(day.summary, 11, { color: [90, 90, 90] });
    y += 4;

    for (const a of day.activities) {
      ensureSpace(40);
      const time = a.startTime ? `${a.startTime} · ${a.time}` : a.time;
      writeWrapped(`• ${time} — ${a.title}`, 12, { bold: true });
      if (a.description) writeWrapped(a.description, 11, { color: [70, 70, 70] });
      if (a.costEstimate && a.costEstimate > 0) {
        writeWrapped(`  ~ ${fmtPdfMoney(a.costEstimate)} / person`, 10, {
          color: [120, 120, 120],
        });
      }
      y += 4;
    }

    const dayTotal = day.activities.reduce((s, a) => s + (a.costEstimate ?? 0), 0);
    if (dayTotal > 0) {
      writeWrapped(`Day total: ${fmtPdfMoney(dayTotal)} / person`, 11, {
        bold: true,
      });
    }
    y += 12;
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(`Planora AI · Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 20, {
      align: "center",
    });
  }

  const filename = `${trip.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "trip"}.pdf`;
  doc.save(filename);
}
