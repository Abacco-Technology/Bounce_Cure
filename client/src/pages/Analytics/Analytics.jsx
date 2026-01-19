import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";

const API_URL = import.meta.env.VITE_VRI_URL;

export default function Analytics() {
  const [campaigns, setCampaigns] = useState([]);
  const [sgSummary, setSgSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================
  // Fetch campaigns
  // ============================
  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/analytics/sendgrid/campaigns`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch (err) {
      console.error("Fetch campaigns failed:", err);
      setError("Failed to load campaigns");
    }
  };

  // ============================
  // Fetch summary
  // ============================
  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/analytics/sendgrid/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setSgSummary(data);
    } catch (err) {
      console.error("Fetch summary failed:", err);
    }
  };

  // ============================
  // Initial load
  // ============================
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchCampaigns();
      await fetchSummary();
      setLoading(false);
    };

    load();
  }, []);

  // ============================
  // Auto refresh every 5 seconds
  // ============================
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCampaigns();
      fetchSummary();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // ============================
  // Safe summary values
  // ============================
  const totalSent = sgSummary?.processed || 0;
  const delivered = sgSummary?.delivered || 0;
  const opens = sgSummary?.opens || 0;
  const clicks = sgSummary?.clicks || 0;
  const bounces = sgSummary?.bounces || 0;
  const spam = sgSummary?.spam || 0;

  const openRate = sgSummary?.openRate || 0;
  const clickRate = sgSummary?.clickRate || 0;
  const deliveryRate = sgSummary?.deliveryRate || 0;

  // ============================
  // UI
  // ============================
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-black text-white p-6 space-y-6">

        <h1 className="text-2xl font-bold text-[#c2831f] pt-16">
          Analytics Dashboard
        </h1>

        {error && (
          <div className="bg-red-600 text-white p-3 rounded">
            {error}
          </div>
        )}

        {/* ===================== */}
        {/* STAT CARDS */}
        {/* ===================== */}
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
            <div
              key={i}
              className="bg-[#0a0a0a] border border-gray-800 p-4 rounded-xl"
            >
              <p className="text-gray-400 text-sm">{item.title}</p>
              <p className="text-[#c2831f] text-2xl font-bold">{item.value}</p>
            </div>
          ))}
        </div>

        {/* ===================== */}
        {/* TABLE */}
        {/* ===================== */}
        <div className="bg-[#0a0a0a] border border-gray-800 p-6 rounded-xl overflow-x-auto">
          <h2 className="text-lg font-semibold text-[#c2831f] mb-4">
            Campaign Progress
          </h2>

          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : campaigns.length === 0 ? (
            <p className="text-gray-400">No campaigns found</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-700 text-gray-400">
                <tr>
                  <th className="py-2">Campaign</th>
                  <th>Sent</th>
                  <th>Pending</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {campaigns.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-gray-800 hover:bg-gray-900"
                  >
                    <td className="py-2">{c.name}</td>

                    <td>{c.sentCount}</td>

                    <td>
                      {c.pending !== null && c.pending !== undefined
                        ? c.pending
                        : "-"}
                    </td>

                    <td>
                      {["sending", "processing"].includes(c.status) && (
                        <span className="text-yellow-400 font-medium">Sending</span>
                      )}

                      {["completed", "sent"].includes(c.status) && (
                        <span className="text-green-500 font-medium">Completed</span>
                      )}

                      {c.status === "failed" && (
                        <span className="text-red-500 font-medium">Failed</span>
                      )}

                      {c.status === "scheduled" && (
                        <span className="text-blue-400 font-medium">Scheduled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
