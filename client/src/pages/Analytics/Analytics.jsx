import React, { useEffect, useState, useCallback, useRef } from "react";
import { jsPDF } from "jspdf";
import DashboardLayout from "../../components/DashboardLayout";

const API_URL = import.meta.env.VITE_VRI_URL;
const REFRESH_INTERVAL = 30000;

const C = {
  gold:      [178, 118, 28],
  goldLight: [200, 148, 55],
  black:     [0,   0,   0],
  dark:      [10,  10,  10],
  grayDark:  [28,  28,  28],
  grayMid:   [55,  55,  55],
  grayLight: [120, 120, 120],
  white:     [255, 255, 255],
  green:     [74,  222, 128],
  yellow:    [250, 204,  21],
  red:       [248, 113, 113],
  blue:      [96,  165, 250],
};

function drawFooter(doc, W, H, page, total) {
  doc.setFillColor(...C.grayDark);  doc.rect(0, H - 12, W, 12, "F");
  doc.setFillColor(...C.gold);      doc.rect(0, H - 12, W, 0.4, "F");
  doc.setFont("helvetica", "normal"); doc.setFontSize(6.5);
  doc.setTextColor(...C.grayLight);
  doc.text("Bounce Cure  •  Confidential Report", 12, H - 4.5);
  doc.text("Page " + page + " of " + total, W - 12, H - 4.5, { align: "right" });
}

function setupPageBg(doc, W, H) {
  doc.setFillColor(...C.black);    doc.rect(0, 0, W, H, "F");
  doc.setFillColor(...C.gold);     doc.rect(0, 0, W, 1.2, "F");
  doc.setFillColor(...C.grayDark); doc.rect(0, 0, 5, H, "F");
  doc.setFillColor(...C.gold);     doc.rect(0, 0, 1.6, H, "F");
}

function drawBrandHeader(doc, W, user, subtitle, dateStr, timeStr) {
  const HX = 12, HY = 8, HW = W - 24, HH = 40;
  doc.setFillColor(...C.grayDark); doc.roundedRect(HX, HY, HW, HH, 2, 2, "F");
  doc.setFillColor(...C.gold);     doc.roundedRect(HX, HY, 1.8, HH, 0.8, 0.8, "F");
  const lx = HX + 14, ly = HY + HH / 2;
  doc.setFillColor(...C.gold);     doc.circle(lx, ly, 8, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(...C.black);
  doc.text("BC", lx, ly + 2.5, { align: "center" });
  doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.setTextColor(...C.goldLight);
  doc.text("Bounce Cure", HX + 28, HY + 14);
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...C.grayLight);
  doc.text(subtitle, HX + 28, HY + 22);
  doc.setFontSize(6.8);
  doc.text("Generated: " + dateStr + "  •  " + timeStr, HX + 28, HY + 29);
  if (user?.name || user?.email) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(...C.gold);
    doc.text(user.name || "", W - HX - 4, HY + 16, { align: "right" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(6.5); doc.setTextColor(...C.grayLight);
    doc.text(user.email || "", W - HX - 4, HY + 23, { align: "right" });
  }
  return HY + HH;
}

// ── Helper: draw a row of metric cards ───────────────────────────
function drawMetricCards(doc, HX, HW, curY, metrics, COLS = 3) {
  const cardW = (HW - (COLS - 1) * 3) / COLS, cardH = 20, cGap = 3;
  metrics.forEach((m, i) => {
    const col = i % COLS, row = Math.floor(i / COLS);
    const cx = HX + col * (cardW + cGap), cy = curY + row * (cardH + cGap);
    doc.setFillColor(...C.grayDark); doc.roundedRect(cx, cy, cardW, cardH, 2, 2, "F");
    doc.setFillColor(...C.gold);     doc.roundedRect(cx, cy, 1.6, cardH, 0.8, 0.8, "F");
    doc.setFont("helvetica", "normal"); doc.setFontSize(6.5); doc.setTextColor(...C.grayLight);
    doc.text(m.label.toUpperCase(), cx + 5, cy + 7);
    doc.setFont("helvetica", "bold"); doc.setFontSize(13);
    doc.setTextColor(...(m.color || C.goldLight));
    doc.text(String(m.value), cx + 5, cy + 16);
  });
  return curY + Math.ceil(metrics.length / COLS) * (cardH + cGap);
}

// ── Helper: draw a section heading + gold rule ────────────────────
function drawSectionHeading(doc, HX, W, curY, text) {
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...C.gold);
  doc.text(text, HX, curY);
  doc.setDrawColor(...C.gold); doc.setLineWidth(0.25); doc.line(HX, curY + 2, W - HX, curY + 2);
  return curY + 6;
}

// ── Full (all-campaigns) PDF ───────────────────────────────────────
const generateFullPDF = (sgSummary, campaigns, user) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const HX = 12, HW = W - 24;

  const now      = new Date();
  const dateStr  = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const timeStr  = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const totalSent    = sgSummary?.processed    ?? 0;
  const delivered    = sgSummary?.delivered    ?? 0;
  const opens        = sgSummary?.opens        ?? 0;
  const clicks       = sgSummary?.clicks       ?? 0;
  const bounces      = sgSummary?.bounces      ?? 0;
  const spam         = sgSummary?.spam         ?? 0;
  const openRate     = sgSummary?.openRate     ?? 0;
  const clickRate    = sgSummary?.clickRate    ?? 0;
  const deliveryRate = sgSummary?.deliveryRate ?? 0;

  setupPageBg(doc, W, H);
  let curY = drawBrandHeader(doc, W, user, "Analytics Report  •  SendGrid Campaign Performance Overview", dateStr, timeStr) + 8;

  curY = drawSectionHeading(doc, HX, W, curY, "KEY METRICS");
  curY = drawMetricCards(doc, HX, HW, curY, [
    { label: "Total Sent",    value: totalSent.toLocaleString() },
    { label: "Delivered",     value: delivered.toLocaleString() },
    { label: "Opens",         value: opens.toLocaleString() },
    { label: "Clicks",        value: clicks.toLocaleString() },
    { label: "Bounces",       value: bounces.toLocaleString() },
    { label: "Spam Reports",  value: spam.toLocaleString() },
    { label: "Open Rate",     value: openRate + "%" },
    { label: "Click Rate",    value: clickRate + "%" },
    { label: "Delivery Rate", value: deliveryRate + "%" },
  ]) + 6;

  curY = drawSectionHeading(doc, HX, W, curY, "PERFORMANCE RATES");
  [
    { label: "Delivery Rate", value: deliveryRate },
    { label: "Open Rate",     value: openRate },
    { label: "Click Rate",    value: clickRate },
  ].forEach((b) => {
    const barX = HX + 30, barMaxW = HW - 44, barH = 5;
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(...C.white);
    doc.text(b.label, HX, curY + barH - 0.5);
    doc.setFillColor(...C.grayMid); doc.roundedRect(barX, curY, barMaxW, barH, barH / 2, barH / 2, "F");
    const fw = Math.max(barH, (Math.min(b.value, 100) / 100) * barMaxW);
    doc.setFillColor(...C.gold); doc.roundedRect(barX, curY, fw, barH, barH / 2, barH / 2, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(...C.gold);
    doc.text(b.value + "%", barX + barMaxW + 2, curY + barH - 0.5);
    curY += barH + 5;
  });
  curY += 3;

  curY = drawSectionHeading(doc, HX, W, curY, "CAMPAIGN DETAILS");
  const colHeaders = ["Campaign", "Batches", "Pending", "Sent", "Status"];
  const colWidths  = [HW * 0.38, HW * 0.14, HW * 0.14, HW * 0.14, HW * 0.20];
  const rowH2 = 8;

  doc.setFillColor(...C.grayDark); doc.rect(HX, curY, HW, rowH2, "F");
  doc.setDrawColor(...C.gold); doc.setLineWidth(0.25); doc.rect(HX, curY, HW, rowH2, "S");
  doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(...C.gold);
  let hx = HX + 3;
  colHeaders.forEach((h, i) => { doc.text(h, hx, curY + 5.5); hx += colWidths[i]; });
  curY += rowH2;

  const tableRows = campaigns.length > 0
    ? campaigns.map((c) => ({
        cells: [
          c.name || "—",
          c.totalBatches > 1 ? (c.currentBatch ?? 0) + "/" + c.totalBatches : "—",
          c.pending != null ? String(c.pending) : "—",
          String(c.sentCount ?? 0),
          c.status || "—",
        ],
        status: (c.status || "").toLowerCase(),
      }))
    : [{ cells: ["No campaigns found", "—", "—", "—", "—"], status: "" }];

  tableRows.forEach((row, idx) => {
    if (curY + rowH2 > H - 18) {
      drawFooter(doc, W, H, doc.internal.getNumberOfPages(), doc.internal.getNumberOfPages());
      doc.addPage(); setupPageBg(doc, W, H); curY = 14;
    }
    doc.setFillColor(...(idx % 2 === 0 ? C.dark : [18, 18, 18])); doc.rect(HX, curY, HW, rowH2, "F");
    doc.setDrawColor(...C.grayMid); doc.setLineWidth(0.12); doc.rect(HX, curY, HW, rowH2, "S");
    let rx = HX + 3;
    row.cells.forEach((cell, ci) => {
      if (ci === 4) {
        const s = row.status;
        if (s === "completed" || s === "sent")          doc.setTextColor(...C.green);
        else if (s === "sending" || s === "processing") doc.setTextColor(...C.yellow);
        else if (s === "failed")                        doc.setTextColor(...C.red);
        else if (s === "scheduled")                     doc.setTextColor(...C.blue);
        else                                            doc.setTextColor(...C.grayLight);
        doc.setFont("helvetica", "bold");
      } else { doc.setTextColor(...C.white); doc.setFont("helvetica", "normal"); }
      doc.setFontSize(7);
      const maxC = ci === 0 ? 32 : 12;
      doc.text(cell.length > maxC ? cell.slice(0, maxC - 1) + "…" : cell, rx, curY + 5.5);
      rx += colWidths[ci];
    });
    curY += rowH2;
  });

  const pageTotal = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageTotal; p++) { doc.setPage(p); drawFooter(doc, W, H, p, pageTotal); }

  const yy = now.getFullYear(), mm = String(now.getMonth() + 1).padStart(2, "0"), dd = String(now.getDate()).padStart(2, "0");
  doc.save("analytics-report-" + yy + "-" + mm + "-" + dd + ".pdf");
};

// ── Single-campaign PDF ────────────────────────────────────────────
// sgStats = sendgrid stats filtered to this campaign's date range
const generateCampaignPDF = (campaign, user, sgStats) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const HX = 12, HW = W - 24;

  const now     = new Date();
  const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  // Derive the campaign date label for display
  const campDate = campaign.createdAt
    ? new Date(campaign.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "—";

  setupPageBg(doc, W, H);
  let curY = drawBrandHeader(doc, W, user, "Individual Campaign Report", dateStr, timeStr) + 8;

  // Campaign name banner
  doc.setFillColor(22, 22, 22); doc.roundedRect(HX, curY, HW, 14, 2, 2, "F");
  doc.setFillColor(...C.gold);  doc.roundedRect(HX, curY, 1.6, 14, 0.8, 0.8, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...C.white);
  const cName = campaign.name || "Unnamed Campaign";
  doc.text(cName.length > 55 ? cName.slice(0, 54) + "…" : cName, HX + 6, curY + 9.5);

  // Date badge on the right of the banner
  doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(...C.grayLight);
  doc.text("Campaign Date: " + campDate, W - HX - 4, curY + 9.5, { align: "right" });
  curY += 20;

  // ── Campaign metric cards ──────────────────────────────────────
  const status = (campaign.status || "").toLowerCase();
  const statusLabel =
    status === "completed" || status === "sent"       ? "Completed" :
    status === "sending"   || status === "processing" ? "Sending…"  :
    status === "failed"    ? "Failed"    :
    status === "scheduled" ? "Scheduled" :
    campaign.status || "—";

  const statusColor =
    status === "completed" || status === "sent"       ? C.green  :
    status === "sending"   || status === "processing" ? C.yellow :
    status === "failed"    ? C.red  :
    status === "scheduled" ? C.blue : C.grayLight;

  curY = drawSectionHeading(doc, HX, W, curY, "CAMPAIGN METRICS");
  curY = drawMetricCards(doc, HX, HW, curY, [
    { label: "Total Sent",  value: String(campaign.sentCount ?? 0) },
    { label: "Pending",     value: campaign.pending != null ? String(campaign.pending) : "—" },
    { label: "Batches",     value: campaign.totalBatches > 1 ? (campaign.currentBatch ?? 0) + " / " + campaign.totalBatches : "—" },
    { label: "Status",      value: statusLabel, color: statusColor },
    { label: "Campaign ID", value: campaign.id ? String(campaign.id).slice(0, 12) : "—" },
    { label: "Created",     value: campDate },
  ]) + 8;

  // ── SendGrid stats for this campaign's date ────────────────────
  if (sgStats) {
    const opens        = sgStats.opens        ?? 0;
    const clicks       = sgStats.clicks       ?? 0;
    const bounces      = sgStats.bounces      ?? 0;
    const delivered    = sgStats.delivered    ?? 0;
    const spam         = sgStats.spam         ?? 0;
    const openRate     = sgStats.openRate     ?? 0;
    const clickRate    = sgStats.clickRate    ?? 0;
    const deliveryRate = sgStats.deliveryRate ?? 0;

    curY = drawSectionHeading(doc, HX, W, curY, "SENDGRID EMAIL STATS  (campaign date)");
    curY = drawMetricCards(doc, HX, HW, curY, [
      { label: "Delivered",     value: delivered.toLocaleString() },
      { label: "Opens",         value: opens.toLocaleString() },
      { label: "Clicks",        value: clicks.toLocaleString() },
      { label: "Bounces",       value: bounces.toLocaleString() },
      { label: "Spam Reports",  value: spam.toLocaleString() },
      { label: "Open Rate",     value: openRate + "%" },
      { label: "Click Rate",    value: clickRate + "%" },
      { label: "Delivery Rate", value: deliveryRate + "%" },
    ]) + 8;

    // Performance bars
    curY = drawSectionHeading(doc, HX, W, curY, "PERFORMANCE RATES");
    [
      { label: "Delivery Rate", value: deliveryRate },
      { label: "Open Rate",     value: openRate },
      { label: "Click Rate",    value: clickRate },
    ].forEach((b) => {
      const barX = HX + 32, barMaxW = HW - 44, barH = 5;
      doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(...C.white);
      doc.text(b.label, HX, curY + barH - 0.5);
      doc.setFillColor(...C.grayMid); doc.roundedRect(barX, curY, barMaxW, barH, barH / 2, barH / 2, "F");
      const fw = Math.max(barH, (Math.min(b.value, 100) / 100) * barMaxW);
      doc.setFillColor(...C.gold); doc.roundedRect(barX, curY, fw, barH, barH / 2, barH / 2, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(...C.gold);
      doc.text(b.value + "%", barX + barMaxW + 2, curY + barH - 0.5);
      curY += barH + 5;
    });
    curY += 6;
  }

  // ── Batch progress bar (if multi-batch) ───────────────────────
  if (campaign.totalBatches > 1) {
    curY = drawSectionHeading(doc, HX, W, curY, "BATCH PROGRESS");
    const pct = Math.round(((campaign.currentBatch ?? 0) / campaign.totalBatches) * 100);
    const barX = HX + 32, barMaxW = HW - 44, barH = 6;
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(...C.white);
    doc.text("Batch Progress", HX, curY + barH - 0.5);
    doc.setFillColor(...C.grayMid); doc.roundedRect(barX, curY, barMaxW, barH, barH / 2, barH / 2, "F");
    const fw = Math.max(barH, (pct / 100) * barMaxW);
    doc.setFillColor(...C.gold); doc.roundedRect(barX, curY, fw, barH, barH / 2, barH / 2, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(...C.gold);
    doc.text(pct + "%", barX + barMaxW + 2, curY + barH - 0.5);
    curY += barH + 12;
  }
  const pageTotal = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageTotal; p++) { doc.setPage(p); drawFooter(doc, W, H, p, pageTotal); }

  const safeName = (campaign.name || "campaign").replace(/[^a-z0-9]/gi, "-").toLowerCase().slice(0, 30);
  const yy = now.getFullYear(), mm = String(now.getMonth() + 1).padStart(2, "0"), dd = String(now.getDate()).padStart(2, "0");
  doc.save("campaign-" + safeName + "-" + yy + "-" + mm + "-" + dd + ".pdf");
};

// ── Component ─────────────────────────────────────────────────────
export default function Analytics() {
  const [campaigns,          setCampaigns]          = useState([]);
  const [sgSummary,          setSgSummary]          = useState(null);
  const [loading,            setLoading]            = useState(true);
  const [error,              setError]              = useState("");
  const [pdfLoading,         setPdfLoading]         = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState("all");
  const [user,               setUser]               = useState(null);
  const pollingRef = useRef(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    fetchCampaigns();

    pollingRef.current = setInterval(() => {
      fetchCampaigns();   // Always refresh
    }, 15000);

    return () => clearInterval(pollingRef.current);
  }, []);
  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch(`${API_URL}/api/campaigns`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setCampaigns(data);
    } catch (err) {
      console.error("fetchCampaigns error:", err);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const token   = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const [summaryRes, campaignsRes] = await Promise.all([
        fetch(`${API_URL}/api/analytics/sendgrid/summary`,   { headers }),
        fetch(`${API_URL}/api/analytics/sendgrid/campaigns`, { headers }),
      ]);
      const [summaryData, campaignsData] = await Promise.all([
        summaryRes.json(),
        campaignsRes.json(),
      ]);
      setSgSummary(summaryData);
      setCampaigns(campaignsData.campaigns || []);
    } catch (err) {
      console.error("Fetch failed:", err);
      setError("Failed to load analytics data");
    }
  }, []);

  useEffect(() => {
    const load = async () => { setLoading(true); await fetchData(); setLoading(false); };
    load();
    const interval = setInterval(() => { if (!document.hidden) fetchData(); }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  const deleteCampaign = async (id) => {
    if (!window.confirm("Are you sure you want to delete this campaign?")) return;
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch(`${API_URL}/api/campaigns/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Failed to delete campaign"); return; }
      setCampaigns(prev => prev.filter(c => String(c.id) !== String(id)));
      alert("Campaign deleted successfully");
    } catch (err) {
      console.error("Delete error:", err);
      alert("Error deleting campaign");
    }
  };

  // ── Fetch SendGrid stats scoped to a campaign's date ──────────
  const fetchCampaignSgStats = async (campaign) => {
    try {
      const token = localStorage.getItem("token");

      // Build start/end from campaign's createdAt (full day)
      const created  = campaign.createdAt ? new Date(campaign.createdAt) : new Date();
      const startDate = created.toISOString().slice(0, 10);          // "YYYY-MM-DD"

      // end date = day after (so the range covers the full day)
      const end = new Date(created);
      end.setDate(end.getDate() + 1);
      const endDate = end.toISOString().slice(0, 10);

      const res = await fetch(
        `${API_URL}/api/analytics/sendgrid/summary?startDate=${startDate}&endDate=${endDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error("fetchCampaignSgStats error:", err);
      return null;
    }
  };

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      if (selectedCampaignId === "all") {
        generateFullPDF(sgSummary, campaigns, user);
      } else {
        const camp = campaigns.find(c => String(c.id) === String(selectedCampaignId));
        if (!camp) { alert("Campaign not found"); return; }

        // Fetch SendGrid stats for this campaign's date
        const campStats = await fetchCampaignSgStats(camp);

        generateCampaignPDF(camp, user, campStats);
      }
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setPdfLoading(false);
    }
  };

  const totalSent    = sgSummary?.processed    || 0;
  const delivered    = sgSummary?.delivered    || 0;
  const openRate     = sgSummary?.openRate     || 0;
  const clickRate    = sgSummary?.clickRate    || 0;
  const deliveryRate = sgSummary?.deliveryRate || 0;
  const bounces      = sgSummary?.bounces      || 0;
  const spam         = sgSummary?.spam         || 0;

  const getBatchProgress = (c) => {
    const total = c.totalBatches || 1, current = c.currentBatch || 0;
    if (total <= 1) return null;
    return { current, total };
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-black text-white p-6 space-y-6">

        {/* ── Header row ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-16">
          <h1 className="text-2xl font-bold text-[#b2761c]">Analytics Dashboard</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedCampaignId}
              onChange={e => setSelectedCampaignId(e.target.value)}
              disabled={loading || campaigns.length === 0}
              className="bg-[#0a0a0a] border border-gray-700 text-white text-sm rounded-lg px-3 py-2.5
                         focus:outline-none focus:border-[#b2761c] disabled:opacity-40 cursor-pointer
                         max-w-[220px] truncate"
            >
              <option value="all">All Campaigns (Full Report)</option>
              {campaigns.map(c => (
                <option key={c.id} value={String(c.id)}>
                  {c.name ? (c.name.length > 28 ? c.name.slice(0, 27) + "…" : c.name) : `Campaign ${c.id}`}
                </option>
              ))}
            </select>

            <button
              onClick={handleDownloadPDF}
              disabled={pdfLoading || loading}
              className={[
                "flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm border transition-all duration-200",
                pdfLoading || loading
                  ? "border-gray-700 text-gray-600 bg-gray-900 cursor-not-allowed"
                  : "border-[#b2761c] text-[#b2761c] bg-transparent hover:bg-[#b2761c] hover:text-black cursor-pointer"
              ].join(" ")}
            >
              {pdfLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
                  </svg>
                  Generating…
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 16l-4-4h3V4h2v8h3l-4 4z"/>
                    <path d="M20 18H4v2h16v-2z"/>
                  </svg>
                  Download Report
                </>
              )}
            </button>
          </div>
        </div>

        {!loading && campaigns.length > 0 && (
          <p className="text-xs text-gray-500 -mt-2">
            Select a specific campaign to download its individual report with SendGrid stats for that date, or keep "All Campaigns" for a full overview.
          </p>
        )}

        {error && <div className="bg-red-600 text-white p-3 rounded">{error}</div>}

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "Total Sent",      value: totalSent           },
            { title: "Delivered",       value: delivered           },
            { title: "Open Rate",       value: `${openRate}%`      },
            { title: "Click Rate",      value: `${clickRate}%`     },
            { title: "Delivery Rate",   value: `${deliveryRate}%`  },
            { title: "Bounces",         value: bounces             },
            { title: "Spam Reports",    value: spam                },
            { title: "Total Campaigns", value: campaigns.length    },
          ].map((item, i) => (
            <div key={i} className="bg-[#0a0a0a] border border-gray-800 p-4 rounded-xl">
              <p className="text-gray-400 text-sm">{item.title}</p>
              <p className="text-[#b2761c] text-2xl font-bold">{item.value}</p>
            </div>
          ))}
        </div>

        {/* ── Campaign table ── */}
        <div className="bg-[#0a0a0a] border border-gray-800 p-6 rounded-xl overflow-x-auto">
          <h2 className="text-lg font-semibold text-[#b2761c] mb-4">Campaign Progress</h2>
          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : campaigns.length === 0 ? (
            <p className="text-gray-400">No campaigns found</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-700 text-gray-400">
                <tr>
                  <th className="py-2">Campaign</th>
                  <th>Total</th> 
                  <th>Batches</th>
                  <th>Pending</th>
                  <th>Sent</th>
                  <th>Status</th>
                  <th>Delete</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  const bp = getBatchProgress(c);
                  const totalMails = c.recipientsJson
                  ? JSON.parse(c.recipientsJson).length
                  : (c.sentCount || 0) + (c.pending || 0);
                  return (
                    <tr key={c.id} className="border-b border-gray-800 hover:bg-gray-900">
                      <td className="py-2 pr-4 max-w-[180px] truncate">{c.name}</td>
                      <td className="pr-4">
                        {totalMails}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {c.totalBatches > 0
                          ? (
                            <div className="flex flex-col">
                              <div className="flex flex-col gap-1">
                                <span className="text-[#d99c2b] font-semibold">
                                  {c.currentBatch ?? 1} / {c.totalBatches}
                                </span>
                                <div className="w-24 bg-gray-800 rounded-full h-1.5">
                                  <div
                                    className="bg-[#b2761c] h-1.5 rounded-full"
                                    style={{
                                      width: `${Math.round(((c.currentBatch ?? 0) / c.totalBatches) * 100)}%`
                                    }}
                                  />
                                </div>
                              </div>
                              {c.status === "sending" && (
                                <span className="text-xs text-gray-500">
                                  batch {c.currentBatch} of {c.totalBatches}
                                </span>
                              )}
                            </div>
                          )
                          : <span className="text-gray-600">—</span>
                        }
                      </td>
                      
                      <td className="pr-4">{c.pending != null ? c.pending : "-"}</td>
                      <td className="pr-4">{c.sentCount ?? 0}</td>
                      <td className="pr-4">
                        {["sending","processing"].includes(c.status) && (
                          <span className="inline-flex items-center gap-1 text-yellow-400 font-medium">
                            <span className="animate-pulse">●</span> Sending
                          </span>
                        )}
                        {["completed","sent"].includes(c.status) && <span className="text-green-500 font-medium">✓ Completed</span>}
                        {c.status === "failed"    && <span className="text-red-500 font-medium">✗ Failed</span>}
                        {c.status === "scheduled" && <span className="text-blue-400 font-medium">⏰ Scheduled</span>}
                      </td>
                      <td>
                        <button onClick={() => deleteCampaign(c.id)} className="text-red-600 hover:text-red-400 text-sm font-medium">
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Batch info ── */}
        {/* <div className="bg-[#0a0a0a] border border-gray-800 p-4 rounded-xl text-sm text-gray-400">
          <p className="text-[#b2761c] font-semibold mb-2">⏱ Batch Sending Info</p>
          <p>Campaigns with &gt;2,000 emails are split into batches of 2,000 automatically.</p>
          <p className="mt-1">Each batch sends over 30 minutes, then the next batch starts. Example: 10,000 emails = 5 batches × 30 min = ~2.5 hours total.</p>
        </div> */}

      </div>
    </DashboardLayout>
  );
}