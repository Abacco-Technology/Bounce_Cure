import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail, Send, Calendar, Activity,
  MousePointer, BarChart3, RefreshCw, AlertTriangle,
  LayoutDashboard, FileText, Clock, Users, CheckCircle,
  Zap, Filter, Search, Eye, Pause, PlayCircle, MoreVertical,
  XCircle, Shield, X, Type
} from "lucide-react";
import Templets from "./Templets";
import TextTemplates from "./TextTemplates";
import VerifyCampaignMailForm from "./VerifyCampaignMailForm";


const API_URL = import.meta.env.VITE_VRI_URL;

const Dashboard = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [scheduledCampaigns, setScheduledCampaigns] = useState([]);
  const [automationLogs, setAutomationLogs] = useState([]);
  const [sgSummary, setSgSummary] = useState(null);
  const [automationStats, setAutomationStats] = useState({
    scheduled: 0,
    sent: 0,
    processing: 0,
    failed: 0,
    recurring: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [senderVerified, setSenderVerified] = useState(false);
  const [triggerMessage, setTriggerMessage] = useState("");
  const [showTriggerMessage, setShowTriggerMessage] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCampaigns, setSelectedCampaigns] = useState([]);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [showOptions, setShowOptions] = useState(false);

  // Fetch all campaigns
  const fetchAllCampaigns = async (signal) => {
    try {
      const token = localStorage.getItem("token") || "demo-token";
      const response = await fetch(`${API_URL}/api/campaigns`, {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setAllCampaigns(data);
      } else {
        console.error("Unexpected data format for campaigns:", data);
        setAllCampaigns([]);
      }
    } catch (err) {
      if (err.name === "AbortError") return;   // component unmounted, not a failure
      console.error("Error fetching all campaigns:", err);
      setAllCampaigns([]);
    }
  };

  // Fetch analytics data (Total Sent, Campaigns, Recent Campaigns)
  const fetchAnalyticsData = async (signal) => {
    try {
      const token = localStorage.getItem("token");
      const [summaryRes, campaignsRes] = await Promise.all([
        fetch(`${API_URL}/api/analytics/sendgrid/summary`, {
          headers: { Authorization: `Bearer ${token}` },
          signal,
        }),
        fetch(`${API_URL}/api/analytics/sendgrid/campaigns`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          signal,
        }),
      ]);

      const summaryData = await summaryRes.json();
      const campaignsData = await campaignsRes.json();

      setSgSummary(summaryData);
      if (Array.isArray(campaignsData.campaigns)) {
        setCampaigns(campaignsData.campaigns);
      } else {
        setCampaigns([]);
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("Error fetching analytics data:", err);
      setError("Failed to fetch analytics data");
    }
  };


  // Automation data — the four endpoints are independent, so they run in
  // parallel. Previously each was awaited in turn, making this block cost the
  // sum of four round trips instead of the slowest one.
  const fetchAutomationData = async (signal) => {
    const token = localStorage.getItem("token") || "demo-token";
    const opts = { headers: { Authorization: `Bearer ${token}` }, signal };

    const [stats, scheduled, logs, verification] = await Promise.allSettled([
      fetch(`${API_URL}/api/automation/stats`, opts),
      fetch(`${API_URL}/api/automation-logs/scheduled`, opts),
      fetch(`${API_URL}/api/automation/logs`, opts),
      fetch(`${API_URL}/api/automation/sender/verification`, opts),
    ]);

    if (signal?.aborted) return;

    // Each section updates on its own — one failing endpoint no longer
    // stops the other three from rendering.
    if (stats.status === "fulfilled" && stats.value.ok) {
      try { setAutomationStats(await stats.value.json()); } catch { /* bad JSON */ }
    }

    if (scheduled.status === "fulfilled" && scheduled.value.ok) {
      try {
        const data = await scheduled.value.json();
        const list = Array.isArray(data) ? data : data?.data || [];
        setScheduledCampaigns(list);
        setAutomationStats((prev) => ({
          ...prev,
          scheduled: list.filter((c) => c.status === "scheduled").length,
          totalRecipients: list.reduce((sum, c) => sum + (c.recipients || c.sentCount || 0), 0),
        }));
      } catch { setScheduledCampaigns([]); }
    } else if (scheduled.status === "fulfilled") {
      setScheduledCampaigns([]);
    }

    if (logs.status === "fulfilled" && logs.value.ok) {
      try { setAutomationLogs(await logs.value.json()); } catch { /* bad JSON */ }
    }

    if (verification.status === "fulfilled" && verification.value.ok) {
      try { setSenderVerified((await verification.value.json()).verified); } catch { /* bad JSON */ }
    }
  };

  // Handle campaign actions
  const handleCampaignAction = async (campaignId, action) => {
    try {
      const token = localStorage.getItem("token") || "demo-token";
      const response = await fetch(`${API_URL}/api/campaigns/${campaignId}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        await Promise.all([fetchAllCampaigns(), fetchAutomationData()]);
        setShowActionMenu(null);
      } else {
        const error = await response.json();
        alert(`Failed to ${action} campaign: ${error.error || error.message}`);
      }
    } catch (error) {
      console.error(`Error ${action} campaign:`, error);
      alert(`Failed to ${action} campaign: ${error.message}`);
    }
  };

  // Initialize data
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const fetchData = async () => {
      setError(null);
      // allSettled, not all: a single failing endpoint used to reject the whole
      // batch and leave the page on the spinner with nothing rendered.
      const results = await Promise.allSettled([
        fetchAnalyticsData(signal),
        fetchAutomationData(signal),
        fetchAllCampaigns(signal),
      ]);
      if (signal.aborted) return;
      if (results.every((r) => r.status === "rejected")) {
        setError("Failed to load dashboard data");
      }
      setLoading(false);
    };

    fetchData();

    // Background refresh. Skipped while the tab is hidden — otherwise every
    // open dashboard tab kept polling seven endpoints forever.
    const interval = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      fetchAnalyticsData(signal);
      fetchAutomationData(signal);
      fetchAllCampaigns(signal);
    }, 60000);

    return () => {
      clearInterval(interval);
      controller.abort();   // stop in-flight requests + setState after unmount
    };
  }, []);

  const safeCampaigns = Array.isArray(campaigns) ? campaigns : [];

// ✅ Calculate basic metrics (from Analytics data)
const totalSent =
  sgSummary?.processed && sgSummary?.processed > 0
    ? sgSummary.processed
    : safeCampaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0);

const totalDelivered =
  sgSummary?.delivered && sgSummary?.delivered > 0
    ? sgSummary.delivered
    : safeCampaigns.reduce((sum, c) => sum + (c.deliveredCount || 0), 0);

// ✅ Calculate scheduled metrics (from Automation data)
const totalScheduledCampaigns = scheduledCampaigns.filter(
  (c) => c.status === "scheduled"
).length;

const totalScheduledMails = scheduledCampaigns
  .filter((c) => c.status === "scheduled")
  .reduce((sum, c) => sum + (c.recipients || c.sentCount || 0), 0);


  // Recent campaigns
  const recentCampaigns = [...safeCampaigns]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  // Recent scheduled campaigns
  const recentScheduledCampaigns = [...scheduledCampaigns]
    .sort((a, b) => new Date(b.scheduledDateTime || 0) - new Date(a.scheduledDateTime || 0))
    .slice(0, 5);

  // Filter all campaigns
  const filteredCampaigns = allCampaigns.filter(campaign => {
    const campaignName = campaign?.campaignName || campaign?.name || '';
    const subject = campaign?.subject || '';
    const status = campaign?.status || '';

    const matchesSearch = campaignName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'text-blue-400 bg-blue-400/20';
      case 'sent': return 'text-green-400 bg-green-400/20';
      case 'paused': return 'text-yellow-400 bg-yellow-400/20';
      case 'failed': return 'text-red-400 bg-red-400/20';
      case 'processing': return 'text-purple-400 bg-purple-400/20';
      case 'draft': return 'text-gray-400 bg-gray-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled': return <Clock size={14} />;
      case 'sent': return <CheckCircle size={14} />;
      case 'paused': return <Pause size={14} />;
      case 'failed': return <XCircle size={14} />;
      case 'processing': return <RefreshCw size={14} className="animate-spin" />;
      case 'draft': return <FileText size={14} />;
      default: return <AlertTriangle size={14} />;
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    const date = new Date(dateTime);
    if (isNaN(date.getTime())) return 'Invalid date';

    return date.toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };


  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Header */}
      <div className="flex justify-between items-center ml-5 mt-23">
        <div>
          <h1 className="text-2xl font-bold">Email Campaign Dashboard</h1>
          <p className="text-gray-400 mb-8">
            Complete email marketing management in one place
          </p>
        </div>

        <div className="flex flex-row items-center justify-center gap-5 mr-8">
          {/* Refresh Button */}
          <div className="flex space-x-3 cursor-pointer z-50">
            <button
              onClick={async () => {
                setLoading(true);
                await Promise.allSettled([
                  fetchAnalyticsData(),
                  fetchAutomationData(),
                  fetchAllCampaigns(),
                ]);
                setLoading(false);
              }}
              className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-500 text-[#e2971f] hover:text-white hover:border-yellow-500 transition"
              title="Refresh dashboard data"
            >
              <RefreshCw className={`w-6 h-6 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* New Campaign Button */}
          <div
            onClick={() => setShowOptions(true)}
            className="border border-yellow-400 hover:bg-yellow-300/20 transition rounded-lg py-3 px-4 flex flex-col items-center justify-center text-yellow-400 cursor-pointer"
          >
            <span className="text-sm font-semibold">New Campaign</span>
          </div>

          {/* Modal */}
          {showOptions && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowOptions(false)}
              ></div>

              <div className="relative bg-[#111] text-white rounded-2xl shadow-2xl p-8 w-[90%] max-w-3xl border border-gray-800">
                <button
                  className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl"
                  onClick={() => setShowOptions(false)}
                >
                  ✕
                </button>

                <h2 className="text-2xl font-bold mb-6 text-center">
                  Create New Campaign
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div
                    onClick={() => {
                      setShowOptions(false);
                      localStorage.removeItem("canvasData");
                      navigate("/editor", {
                        state: {
                          template: {
                            pages: [{ id: 1, elements: [] }],
                            activePage: 0,
                          },
                        },
                      });
                    }}
                    className="cursor-pointer bg-gray-900 p-8 rounded-xl hover:bg-gray-800 transition flex flex-col items-center text-center"
                  >
                    <h3 className="text-xl font-semibold mb-2">Canva Design Campaign</h3>
                    <p className="text-gray-400 text-sm">
                      Create a brand new design with an empty canvas
                    </p>
                  </div>

                  {/* <div
                    onClick={() => {
                      setShowOptions(false);
                      navigate("/all-templates");
                    }}
                    className="cursor-pointer bg-gray-900 p-8 rounded-xl hover:bg-gray-800 transition flex flex-col items-center text-center"
                  >
                    <h3 className="text-xl font-semibold mb-2">Choose Templates</h3>
                    <p className="text-gray-400 text-sm">
                      Select from predefined templates
                    </p>
                  </div> */}

                  <div
                    onClick={() => {
                      setShowOptions(false);
                      navigate("/texteditor", {
                        state: {
                          template: {
                            pages: [{ id: 1, elements: [] }],
                            activePage: 0,
                          },
                        },
                      });
                    }}
                    className="cursor-pointer bg-gray-900 p-8 rounded-xl hover:bg-gray-800 transition flex flex-col items-center text-center"
                  >
                    <h3 className="text-xl font-semibold mb-2">Text-Based Campaign</h3>
                    <p className="text-gray-400 text-sm">
                      Plain-text email, written and formatted in the text editor
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-800 px-6">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === "dashboard" 
                ? "bg-[#e2971f] text-black rounded-t-lg" 
                : "text-gray-400 hover:text-white"
            }`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("campaigns")}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === "campaigns" 
                ? "bg-[#e2971f] text-black rounded-t-lg" 
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Send size={18} />
            Campaigns
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === "templates" 
                ? "bg-[#e2971f] text-black rounded-t-lg" 
                : "text-gray-400 hover:text-white"
            }`}
          >
            <FileText size={18} />
            Templates
          </button>
          <button
            onClick={() => setActiveTab("texttemplates")}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === "texttemplates" 
                ? "bg-[#e2971f] text-black rounded-t-lg" 
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Type size={18} />
            Text Campaigns
          </button>
          <button
            onClick={() => setActiveTab("verifyformails")}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === "verifyformails" 
                ? "bg-[#e2971f] text-black rounded-t-lg" 
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Mail size={18} />
            Verify Campaign Mails
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 p-4 rounded-lg">
            {error}
          </div>
        )}

        {activeTab === "dashboard" && (
          <>
            {/* Enhanced Stats Cards - Including Automation Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
  {
    title: "Total Sent",
    value: totalSent.toLocaleString(),
    icon: <Send size={20} />,
    color: "bg-blue-500",
    subtitle: `${totalDelivered.toLocaleString()} delivered`,
  },
  {
    title: "Campaigns",
    value: campaigns.length.toLocaleString(),
    icon: <Mail size={20} />,
    color: "bg-green-500",
    subtitle: "Active campaigns",
  },
  {
    title: "Scheduled Campaigns",
    value: totalScheduledCampaigns.toLocaleString(),
    icon: <Calendar size={20} />,
    color: "bg-purple-500",
    subtitle: "Currently scheduled",
  },
  {
    title: "Scheduled Mails",
    value: totalScheduledMails.toLocaleString(),
    icon: <Clock size={20} />,
    color: "bg-cyan-500",
    subtitle: "Total recipients",
  },
]
.map((stat, idx) => (
                <div
                  key={idx}
                  className="bg-[#0a0a0a] border border-gray-700 p-6 rounded-xl shadow-lg transition-all duration-200 hover:border-gray-500"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-sm text-gray-400 mb-1">{stat.title}</h3>
                      {loading ? (
                        <div className="h-9 w-20 rounded bg-gray-800 animate-pulse" />
                      ) : (
                        <p className="text-3xl font-bold text-white">{stat.value}</p>
                      )}
                      
                    </div>
                    <div className={`p-3 rounded-full ${stat.color} bg-opacity-20`}>{stat.icon}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Two Column Layout - Recent Campaigns & Scheduled Campaigns */}
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
              {/* Recent Campaigns */}
              {/* <div className="bg-[#0a0a0a] border border-gray-800 p-6 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Recent Campaigns</h3>
                  <Activity className="text-[#e2971f]" size={20} />
                </div>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {recentCampaigns.length > 0 ? (
                    recentCampaigns.map((campaign) => (
                      <div key={campaign.id} className="p-4 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors border border-gray-800">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{campaign.name || 'Unnamed Campaign'}</p>
                            <p className="text-sm text-gray-400">
                              {campaign.createdAt ? formatDateTime(campaign.createdAt) : 'N/A'}
                            </p>
                          </div>
                          <Mail className="text-[#e2971f]" size={18} />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex gap-4">
                            <span className="text-gray-400">
                              Sent: <span className="text-[#e2971f] font-semibold">{campaign.sentCount || 0}</span>
                            </span>
                            <span className="text-gray-400">
                              Delivered: <span className="text-blue-400 font-semibold">{campaign.deliveredCount || 0}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center py-8">No campaigns yet</p>
                  )}
                </div>
              </div> */}

              {/* Scheduled Campaigns List */}
              <div className="bg-[#0a0a0a] border border-gray-800 p-6 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Scheduled Campaigns</h3>
                  <Calendar className="text-purple-400" size={20} />
                </div>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {loading && recentScheduledCampaigns.length === 0 ? (
                    <div className="space-y-3">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="h-20 rounded-lg bg-gray-900 animate-pulse" />
                      ))}
                    </div>
                  ) : recentScheduledCampaigns.length > 0 ? (
                    recentScheduledCampaigns.map((campaign) => (
                      <div key={campaign.id} className="p-4 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors border border-gray-800">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{campaign.campaignName || 'Unnamed Campaign'}</p>
                             
                          </div>
                          <div className={`p-2 rounded-lg ${getStatusColor(campaign.status)}`}>
                            {getStatusIcon(campaign.status)}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex gap-4">
                            <span className="text-gray-400">
                              Recipients: <span className="text-purple-400 font-semibold">{campaign.recipients || 0}</span>
                            </span>
                            {campaign.recurringFrequency && (
                              <span className="text-gray-400">
                                <span className="text-cyan-400 font-semibold">{campaign.recurringFrequency}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="mx-auto text-gray-600 mb-2" size={32} />
                      <p className="text-gray-400">No scheduled campaigns</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "campaigns" && (
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">All Campaigns</h2>
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search campaigns..."
                    className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#e2971f]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#e2971f]"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="sent">Sent</option>
                  <option value="paused">Paused</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {loading && filteredCampaigns.length === 0 ? (
                <div className="space-y-3">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-20 rounded-lg bg-gray-900 animate-pulse" />
                  ))}
                </div>
              ) : filteredCampaigns.length > 0 ? (
                filteredCampaigns.map((campaign) => (
                  <div key={campaign.id} className="p-4 bg-gray-900 border border-gray-800 rounded-lg hover:bg-gray-800 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${getStatusColor(campaign.status)}`}>
                          {getStatusIcon(campaign.status)}
                        </div>
                        <div>
                          <h3 className="text-white font-medium">{campaign.campaignName || campaign.name || 'Unnamed Campaign'}</h3>
                          <p className="text-sm text-gray-400">{campaign.subject || 'No subject'}</p>
                          {campaign.scheduledDateTime && (
                            <p className="text-xs text-gray-500 mt-1">
                              Scheduled: {formatDateTime(campaign.scheduledDateTime)}
                            </p>
                          )}
                          {campaign.recurringFrequency && (
                            <p className="text-xs text-gray-500 mt-1">
                              Recurring: {campaign.recurringFrequency}
                            </p>
                          )}
                        </div>
                      </div>
                       
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Calendar className="mx-auto text-gray-600 mb-4" size={48} />
                  <h3 className="text-gray-400 font-medium mb-2">No campaigns found</h3>
                  <p className="text-gray-500 mb-4">Create your first campaign to see it here</p>
                  <button
                    onClick={() => setShowOptions(true)}
                    className="px-4 py-2 bg-[#e2971f] text-white rounded-lg hover:bg-[#d09025]"
                  >
                    Create Campaign
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "templates" && (
          <Templets />
        )}

        {activeTab === "texttemplates" && (
          <TextTemplates />
        )}

        {activeTab === "verifyformails" && (
          <VerifyCampaignMailForm />
        )}
      </div>
    </div>
  );
};

export default Dashboard;