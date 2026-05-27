import React, { useEffect, useState, useCallback, useRef } from "react";
import { jsPDF } from "jspdf";
import DashboardLayout from "../../components/DashboardLayout";

const API_URL = import.meta.env.VITE_VRI_URL;
const REFRESH_INTERVAL = 30000;

// ── Color palette (light / white theme) ──────────────────────────
const C = {
  orange: [178, 118, 28],
  orangeAlt: [200, 148, 55],
  black: [0, 0, 0],
  white: [255, 255, 255],
  offWhite: [250, 250, 250],
  lightGray: [240, 240, 240],
  midGray: [180, 180, 180],
  darkGray: [80, 80, 80],
  labelGray: [120, 120, 120],
  green: [34, 139, 34],
  yellow: [180, 120, 0],
  red: [200, 50, 50],
  blue: [30, 100, 200],
};

// ── Page background ───────────────────────────────────────────────
function setupPageBg(doc, W, H) {
  doc.setFillColor(...C.white); doc.rect(0, 0, W, H, "F");
  doc.setFillColor(...C.orange); doc.rect(0, 0, 2.5, H, "F");
}

// ── Brand header ──────────────────────────────────────────────────
function drawBrandHeader(doc, W, user, subtitle, dateStr, timeStr) {
  const HX = 10, HY = 8, HW = W - 20, HH = 38;

  doc.setFillColor(...C.white);
  doc.roundedRect(HX, HY, HW, HH, 2, 2, "F");
  doc.setDrawColor(...C.midGray); doc.setLineWidth(0.3);
  doc.roundedRect(HX, HY, HW, HH, 2, 2, "S");
  doc.setFillColor(...C.orange);
  doc.roundedRect(HX, HY, 2, HH, 0.8, 0.8, "F");

  // Logo circle
  // Profile Image Circle
  // ── Logo Image ─────────────────────────────
  // ── Logo Image ─────────────────────────────
  // Logo circle
  const lx = HX + 20;
  const ly = HY + HH / 2;
  const logoSize = 30;

  // ── Use rasul.jpg instead of bounce.jpg ──
  doc.addImage(
    "/rasul-1.png",
    "PNG",
    lx - 22,
    ly - 18,
    39, // width
    35 // height
  );


  // Text
  const tx = HX + 33;
  doc.setFont("helvetica", "bold"); doc.setFontSize(16);
  doc.setTextColor(...C.orange); doc.text("Bounce Cure", tx, HY + 13);

  doc.setFont("helvetica", "normal"); doc.setFontSize(8);
  doc.setTextColor(...C.darkGray); doc.text(subtitle, tx, HY + 21);

  doc.setFontSize(7); doc.setTextColor(...C.labelGray);
  doc.text("Generated: " + dateStr + "  •  " + timeStr, tx, HY + 29);

  if (user?.name || user?.email) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(7.5);
    doc.setTextColor(...C.orange);
    doc.text(user.name || "", W - HX - 4, HY + 16, { align: "right" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(7);
    doc.setTextColor(...C.labelGray);
    doc.text(user.email || "", W - HX - 4, HY + 23, { align: "right" });
  }

  return HY + HH;
}

// ── Section heading + orange rule ─────────────────────────────────
function drawSectionHeading(doc, HX, W, curY, text) {
  doc.setFont("helvetica", "bold"); doc.setFontSize(8.5);
  doc.setTextColor(...C.orange); doc.text(text, HX, curY);
  doc.setDrawColor(...C.orange); doc.setLineWidth(0.3);
  doc.line(HX, curY + 2.5, W - HX, curY + 2.5);
  return curY + 8;
}

// ── Metric cards ──────────────────────────────────────────────────
function drawMetricCards(doc, HX, HW, curY, metrics, COLS = 3) {
  const gap = 3, cardW = (HW - (COLS - 1) * gap) / COLS, cardH = 22;
  metrics.forEach((m, i) => {
    const col = i % COLS, row = Math.floor(i / COLS);
    const cx = HX + col * (cardW + gap), cy = curY + row * (cardH + gap);

    doc.setFillColor(...C.lightGray);
    doc.roundedRect(cx, cy, cardW, cardH, 2, 2, "F");
    doc.setDrawColor(...C.midGray); doc.setLineWidth(0.2);
    doc.roundedRect(cx, cy, cardW, cardH, 2, 2, "S");
    doc.setFillColor(...C.orange);
    doc.roundedRect(cx, cy, 2, cardH, 0.8, 0.8, "F");

    doc.setFont("helvetica", "normal"); doc.setFontSize(6.5);
    doc.setTextColor(...C.labelGray);
    doc.text(m.label.toUpperCase(), cx + 6, cy + 8);

    doc.setFont("helvetica", "bold"); doc.setFontSize(14);
    doc.setTextColor(...(m.color || C.orange));
    doc.text(String(m.value), cx + 6, cy + 18);
  });
  return curY + Math.ceil(metrics.length / COLS) * (cardH + gap);
}

// ── Footer ────────────────────────────────────────────────────────
function drawFooter(doc, W, H, page, total) {
  doc.setDrawColor(...C.orange); doc.setLineWidth(0.3);
  doc.line(10, H - 12, W - 10, H - 12);
  doc.setFont("helvetica", "normal"); doc.setFontSize(6.5);
  doc.setTextColor(...C.orange);
  doc.text("Bounce Cure  •  Confidential Report", 12, H - 6);
  doc.setTextColor(...C.labelGray);
  doc.text("Page " + page + " of " + total, W - 12, H - 6, { align: "right" });
}

// ── Full (all-campaigns) PDF ──────────────────────────────────────
const generateFullPDF = (sgSummary, campaigns, user) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const HX = 10, HW = W - 20;

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const totalSent = sgSummary?.processed ?? 0;
  const delivered = sgSummary?.delivered ?? 0;
  const opens = sgSummary?.opens ?? 0;
  const clicks = sgSummary?.clicks ?? 0;
  const bounces = sgSummary?.bounces ?? 0;
  const spam = sgSummary?.spam ?? 0;
  const openRate = sgSummary?.openRate ?? 0;
  const clickRate = sgSummary?.clickRate ?? 0;
  const deliveryRate = sgSummary?.deliveryRate ?? 0;

  setupPageBg(doc, W, H);
  let curY = drawBrandHeader(
    doc, W, user,
    "Analytics Report  •  SendGrid Campaign Performance Overview",
    dateStr, timeStr
  ) + 8;

  // Key Metrics
  curY = drawSectionHeading(doc, HX, W, curY, "KEY METRICS");
  curY = drawMetricCards(doc, HX, HW, curY, [
    { label: "Total Sent", value: totalSent.toLocaleString() },
    { label: "Delivered", value: delivered.toLocaleString() },
    { label: "Opens", value: opens.toLocaleString() },
    { label: "Clicks", value: clicks.toLocaleString() },
    { label: "Bounces", value: bounces.toLocaleString() },
    { label: "Spam Reports", value: spam.toLocaleString() },
    { label: "Open Rate", value: openRate + "%" },
    { label: "Click Rate", value: clickRate + "%" },
    { label: "Delivery Rate", value: deliveryRate + "%" },
  ]) + 8;

  // Performance Rates
  curY = drawSectionHeading(doc, HX, W, curY, "PERFORMANCE RATES");
  [
    { label: "Delivery Rate", value: deliveryRate },
    { label: "Open Rate", value: openRate },
    { label: "Click Rate", value: clickRate },
  ].forEach((b) => {
    const barX = HX + 32, barMaxW = HW - 44, barH = 5.5;
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5);
    doc.setTextColor(...C.darkGray);
    doc.text(b.label, HX, curY + barH - 0.5);

    doc.setFillColor(...C.lightGray);
    doc.roundedRect(barX, curY, barMaxW, barH, barH / 2, barH / 2, "F");
    doc.setDrawColor(...C.midGray); doc.setLineWidth(0.2);
    doc.roundedRect(barX, curY, barMaxW, barH, barH / 2, barH / 2, "S");

    const fw = Math.max(barH, (Math.min(b.value, 100) / 100) * barMaxW);
    doc.setFillColor(...C.orange);
    doc.roundedRect(barX, curY, fw, barH, barH / 2, barH / 2, "F");

    doc.setFont("helvetica", "bold"); doc.setFontSize(7.5);
    doc.setTextColor(...C.orange);
    doc.text(b.value + "%", barX + barMaxW + 3, curY + barH - 0.5);
    curY += barH + 6;
  });
  curY += 4;

  // Campaign Details table
  curY = drawSectionHeading(doc, HX, W, curY, "CAMPAIGN DETAILS");

  const colHeaders = ["Campaign", "Date", "Pending", "Sent", "Status"];
  const colWidths = [HW * 0.40, HW * 0.18, HW * 0.12, HW * 0.12, HW * 0.18];
  const rowH = 8;

  // Header row
  doc.setFillColor(...C.lightGray); doc.rect(HX, curY, HW, rowH, "F");
  doc.setDrawColor(...C.midGray); doc.setLineWidth(0.2); doc.rect(HX, curY, HW, rowH, "S");
  doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(...C.orange);
  let hx = HX + 3;
  colHeaders.forEach((h, i) => { doc.text(h, hx, curY + 5.5); hx += colWidths[i]; });
  curY += rowH;

  const tableRows = campaigns.length > 0
    ? campaigns.map((c) => ({
      cells: [
        c.name || "—",
        c.createdAt ? new Date(c.createdAt).toISOString().slice(0, 10) : "—",
        c.pending != null ? String(c.pending) : "—",
        String(c.sentCount ?? 0),
        c.status || "—",
      ],
      status: (c.status || "").toLowerCase(),
    }))
    : [{ cells: ["No campaigns found", "—", "—", "—", "—"], status: "" }];

  tableRows.forEach((row, idx) => {
    if (curY + rowH > H - 18) {
      drawFooter(doc, W, H, doc.internal.getNumberOfPages(), doc.internal.getNumberOfPages());
      doc.addPage(); setupPageBg(doc, W, H); curY = 14;
    }
    doc.setFillColor(...(idx % 2 === 0 ? C.white : C.offWhite));
    doc.rect(HX, curY, HW, rowH, "F");
    doc.setDrawColor(...C.lightGray); doc.setLineWidth(0.15);
    doc.rect(HX, curY, HW, rowH, "S");

    let rx = HX + 3;
    row.cells.forEach((cell, ci) => {
      if (ci === 4) {
        const s = row.status;
        if (s === "completed" || s === "sent") doc.setTextColor(...C.green);
        else if (s === "sending" || s === "processing") doc.setTextColor(...C.yellow);
        else if (s === "failed") doc.setTextColor(...C.red);
        else if (s === "scheduled") doc.setTextColor(...C.blue);
        else doc.setTextColor(...C.labelGray);
        doc.setFont("helvetica", "bold");
      } else {
        doc.setTextColor(...C.darkGray);
        doc.setFont("helvetica", "normal");
      }
      doc.setFontSize(7);
      const maxC = ci === 0 ? 32 : 14;
      doc.text(cell.length > maxC ? cell.slice(0, maxC - 1) + "…" : cell, rx, curY + 5.5);
      rx += colWidths[ci];
    });
    curY += rowH;
  });

  const pageTotal = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageTotal; p++) { doc.setPage(p); drawFooter(doc, W, H, p, pageTotal); }

  const yy = now.getFullYear(),
    mm = String(now.getMonth() + 1).padStart(2, "0"),
    dd = String(now.getDate()).padStart(2, "0");
  doc.save("analytics-report-" + yy + "-" + mm + "-" + dd + ".pdf");
};



// ── Component ─────────────────────────────────────────────────────
export default function Analytics() {
  const [campaigns, setCampaigns] = useState([]);
  const [sgSummary, setSgSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState("all");
  const [user, setUser] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const pollingRef = useRef(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    } catch { }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const [summaryRes, campaignsRes] = await Promise.all([
        fetch(`${API_URL}/api/analytics/sendgrid/summary`, { headers }),
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

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const deleteCampaign = async (id) => {
    if (!window.confirm("Are you sure you want to delete this campaign?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/campaigns/${id}`, {
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

  const deleteSelectedCampaigns = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} selected campaign(s)?`)) return;
    setBulkDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const ids = Array.from(selectedIds);
      await Promise.all(
        ids.map(id =>
          fetch(`${API_URL}/api/campaigns/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      setCampaigns(prev => prev.filter(c => !selectedIds.has(String(c.id))));
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Bulk delete error:", err);
      alert("Error deleting some campaigns");
    } finally {
      setBulkDeleting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === campaigns.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(campaigns.map(c => String(c.id))));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(String(id))) next.delete(String(id));
      else next.add(String(id));
      return next;
    });
  };

  const fetchCampaignSgStats = async (campaign) => {
    try {
      const token = localStorage.getItem("token");
      const created = campaign.createdAt ? new Date(campaign.createdAt) : new Date();
      const startDate = created.toISOString().slice(0, 10);
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

      // ─────────────────────────────────────
      // MULTI SELECT
      // ─────────────────────────────────────
      if (selectedIds.size > 0) {

        const selectedCampaigns = campaigns.filter(c =>
          selectedIds.has(String(c.id))
        );

        // calculate summary for selected campaigns
        const selectedSummary = {
          processed: selectedCampaigns.reduce((a, c) => a + (c.sentCount || 0), 0),
          delivered: selectedCampaigns.reduce((a, c) => a + (c.sentCount || 0), 0),
          opens: 0,
          clicks: 0,
          bounces: 0,
          spam: 0,
          openRate: 0,
          clickRate: 0,
          deliveryRate: 100,
        };

        generateFullPDF(
          selectedSummary,
          selectedCampaigns,
          user
        );

        return;
      }

      // ─────────────────────────────────────
      // ALL CAMPAIGNS
      // ─────────────────────────────────────
      if (selectedCampaignId === "all") {

        generateFullPDF(
          sgSummary,
          campaigns,
          user
        );

        return;
      }

      // ─────────────────────────────────────
      // SINGLE CAMPAIGN
      // ─────────────────────────────────────
      const selectedCampaign = campaigns.find(
        c => String(c.id) === String(selectedCampaignId)
      );

      if (!selectedCampaign) {
        alert("Campaign not found");
        return;
      }

      const singleCampaignSummary = {
        processed: selectedCampaign.sentCount || 0,

        delivered:
          selectedCampaign.deliveredCount || 0,

        opens:
          selectedCampaign.openCount || 0,

        clicks:
          selectedCampaign.clickCount || 0,

        bounces:
          selectedCampaign.bounceCount || 0,

        spam:
          selectedCampaign.spamCount || 0,

        openRate:
          selectedCampaign.openRate || 0,

        clickRate:
          selectedCampaign.clickRate || 0,

        deliveryRate:
          selectedCampaign.deliveryRate || 0,
      };

      generateFullPDF(
        singleCampaignSummary,
        [selectedCampaign],
        user
      );

    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  const totalSent = sgSummary?.processed || 0;
  const delivered = sgSummary?.delivered || 0;
  const openRate = sgSummary?.openRate || 0;
  const clickRate = sgSummary?.clickRate || 0;
  const deliveryRate = sgSummary?.deliveryRate || 0;
  const bounces = sgSummary?.bounces || 0;
  const spam = sgSummary?.spam || 0;

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
            <div className="relative">
              <button
                onClick={() => setShowDropdown(prev => !prev)}
                className="bg-[#0a0a0a] border border-gray-700 text-white text-sm rounded-lg px-4 py-2.5
               min-w-[240px] flex items-center justify-between hover:border-[#b2761c]"
              >
                <span>
                  {selectedIds.size > 0
                    ? `${selectedIds.size} Campaign(s) Selected`
                    : "All Campaigns (Full Report)"}
                </span>

                <svg
                  className={`w-4 h-4 transition-transform ${showDropdown ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showDropdown && (
                <div className="absolute z-50 mt-2 w-full bg-black border border-gray-700 rounded-lg shadow-xl max-h-72 overflow-y-auto">

                  {/* ALL OPTION */}
                  <label className="flex items-center gap-3 px-4 py-3 hover:bg-gray-900 cursor-pointer border-b border-gray-800">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === 0}
                      onChange={() => {
                        setSelectedIds(new Set());
                        setSelectedCampaignId("all");
                      }}
                      className="accent-[#b2761c] w-4 h-4"
                    />
                    <span className="text-white text-sm">
                      All Campaigns (Full Report)
                    </span>
                  </label>

                  {/* CAMPAIGNS */}
                  {campaigns.map(c => {
                    const checked = selectedIds.has(String(c.id));

                    return (
                      <label
                        key={c.id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-900 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setSelectedIds(prev => {
                              const next = new Set(prev);

                              if (next.has(String(c.id))) {
                                next.delete(String(c.id));
                              } else {
                                next.add(String(c.id));
                              }

                              return next;
                            });

                            setSelectedCampaignId("custom");
                          }}
                          className="accent-[#b2761c] w-4 h-4"
                        />

                        <span className="text-white text-sm truncate">
                          {c.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={handleManualRefresh}
              disabled={loading || refreshing}
              className={[
                "flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border transition-all duration-200",
                loading || refreshing
                  ? "border-gray-700 text-gray-600 bg-gray-900 cursor-not-allowed"
                  : "border-gray-600 text-gray-300 bg-transparent hover:bg-gray-800 hover:text-white cursor-pointer"
              ].join(" ")}
              title="Refresh data"
            >
              <svg
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>

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
                <>Generating…</>
              ) : (
                <>
                  Download {
                    selectedIds.size > 0
                      ? `Selected (${selectedIds.size})`
                      : selectedCampaignId === "all"
                        ? "Report"
                        : "Campaign Report"
                  }
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
            { title: "Total Sent", value: totalSent },
            { title: "Delivered", value: delivered },
            { title: "Open Rate", value: `${openRate}%` },
            { title: "Click Rate", value: `${clickRate}%` },
            { title: "Delivery Rate", value: `${deliveryRate}%` },
            { title: "Bounces", value: bounces },
            { title: "Spam Reports", value: spam },
            { title: "Total Campaigns", value: campaigns.length },
          ].map((item, i) => (
            <div key={i} className="bg-[#0a0a0a] border border-gray-800 p-4 rounded-xl">
              <p className="text-gray-400 text-sm">{item.title}</p>
              <p className="text-[#b2761c] text-2xl font-bold">{item.value}</p>
            </div>
          ))}
        </div>

        {/* ── Campaign table ── */}
        <div className="bg-[#0a0a0a] border border-gray-800 p-6 rounded-xl overflow-x-auto">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-lg font-semibold text-[#b2761c]">Campaign Progress</h2>
            {selectedIds.size > 0 && (
              <button
                onClick={deleteSelectedCampaigns}
                disabled={bulkDeleting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-red-700 text-red-500 hover:bg-red-700 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bulkDeleting ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>
                    Deleting…
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                    </svg>
                    Delete Selected ({selectedIds.size})
                  </>
                )}
              </button>
            )}
          </div>
          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : campaigns.length === 0 ? (
            <p className="text-gray-400">No campaigns found</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-700 text-gray-400">
                <tr>
                  <th className="py-2 pr-3 w-8">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === campaigns.length && campaigns.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-800 accent-[#b2761c] cursor-pointer"
                      title="Select all"
                    />
                  </th>
                  <th className="py-2">Campaign</th>
                  <th>Total</th>
                  {/* <th>Batches</th> */}
                  <th>Pending</th>
                  <th>Sent</th>
                  <th className="w-[120px]">Status</th>
                  <th className="w-[110px]">Date</th>
                  <th>Delete</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  const bp = getBatchProgress(c);
                  const totalMails = c.totalRecipients || (c.sentCount || 0) + (c.pending || 0);
                  const isSelected = selectedIds.has(String(c.id));
                  return (
                    <tr
                      key={c.id}
                      className={`border-b border-gray-800 hover:bg-gray-900 transition-colors ${isSelected ? "bg-[#1a1200]" : ""}`}
                    >
                      <td className="py-2 pr-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(c.id)}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-800 accent-[#b2761c] cursor-pointer"
                        />
                      </td>
                      <td className="py-2 pr-4 max-w-[180px] truncate">{c.name}</td>
                      <td className="pr-4">{totalMails}</td>
                      {/* <td className="px-4 py-3 text-sm text-gray-300">
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
                      </td> */}
                      <td className="pr-4">{c.pending != null ? c.pending : "-"}</td>
                      <td className="pr-4">{c.sentCount ?? 0}</td>
                      <td className="pr-4">
                        <div className="flex flex-col">
                          {["sending", "processing"].includes(c.status) && (
                            <span className="inline-flex items-center gap-1 text-yellow-400 font-medium">
                              <span className="animate-pulse">●</span> Sending
                            </span>
                          )}

                          {["completed", "sent"].includes(c.status) && (
                            <span className="text-green-500 font-medium">
                              ✓ Completed
                            </span>
                          )}

                          {c.status === "failed" && (
                            <span className="text-red-500 font-medium">
                              ✗ Failed
                            </span>
                          )}

                          {c.status === "scheduled" && (
                            <span className="text-blue-400 font-medium">
                              ⏰ Scheduled
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="pr-4">
                        <div className="flex flex-col text-sm">
                          <span className="text-gray-300">
                            {c.createdAt
                              ? new Date(c.createdAt).toLocaleDateString()
                              : "—"}
                          </span>


                        </div>
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

      </div>
    </DashboardLayout>
  );
}