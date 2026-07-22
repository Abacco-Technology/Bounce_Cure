// client/src/pages/Automation/Automation.jsx
import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { Line, Pie, Bar } from "react-chartjs-2";
import "chart.js/auto";
import { 
  Zap, Activity, CheckCircle, Play, Clock, Calendar, 
  Mail, Edit, Trash2, Pause, PlayCircle, MoreVertical,
  Filter, Search, Eye, AlertCircle, TrendingUp, Users,
  RefreshCw, Send, XCircle, Shield, X, AlertTriangle,
  Info, Check
} from "lucide-react";

const API_URL = import.meta.env.VITE_VRI_URL; 

const Automation = () => {
  const [logs, setLogs] = useState([]);
  const [scheduledCampaigns, setScheduledCampaigns] = useState([]);
  const [campaignStats, setCampaignStats] = useState({
    sent: 0,
    pending: 0,
    processing: 0,
    failed: 0,
    scheduled: 0,
    recurring: 0
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCampaigns, setSelectedCampaigns] = useState([]);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [senderVerified, setSenderVerified] = useState(false);
  const [domainAuth, setDomainAuth] = useState({ spf: false, dkim: false, dmarc: false });
  const [triggerMessage, setTriggerMessage] = useState("");
  const [showTriggerMessage, setShowTriggerMessage] = useState(false);
  const [notifications, setNotifications] = useState([]);

  
  // Fetch automation logs
  const fetchAutomationData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/automation/logs`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
 
      if (!response.ok) throw new Error(`Error ${response.status}`);
      const data = await response.json();
      setLogs(data);
      
      // Check for failed campaigns and show notifications
      const failedCampaigns = data.filter(log => log.status === 'failed');
      if (failedCampaigns.length > 0) {
        failedCampaigns.forEach(campaign => {
          if (!notifications.some(n => n.id === `failed-${campaign.id}`)) {
            addNotification({
              id: `failed-${campaign.id}`,
              type: 'campaign_failed',
              title: 'Campaign Failed',
              message: `Campaign "${campaign.campaignName}" failed to send`,
              details: campaign.error || 'Unknown error',
              timestamp: new Date(),
              read: false
            });
          }
        });
      }
    } catch (err) {
      console.error("Failed to fetch automation logs:", err);
    }
  };


// Fetch scheduled + recurring campaigns (merged endpoint)
const fetchScheduledCampaigns = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_URL}/api/automation-logs/scheduled`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Failed to fetch campaigns:", errorText);
      setScheduledCampaigns([]);
      return;
    }

    const data = await response.json();
    console.log("✅ Fetched campaigns:", data.length);

    const scheduledOnly = data.filter(campaign =>
      campaign.scheduleType === "scheduled" || campaign.status === "scheduled"
    );
    setScheduledCampaigns(scheduledOnly);

    // Calculate summary stats dynamically
    const sentCount = scheduledOnly.filter(
      c => c.status === "sent" && (c.scheduleType === "scheduled" || c.scheduleType === "recurring")
    ).length;

    const scheduledCount = scheduledOnly.filter(
      c => c.status === "scheduled"
    ).length;

    const processingCount = data.filter(c => c.status === "processing").length;
    const failedCount = data.filter(c => c.status === "failed").length;
    const recurringCount = data.filter(c => c.recurringFrequency).length;

    setCampaignStats({
      sent: sentCount,
      scheduled: scheduledCount,
      processing: processingCount,
      failed: failedCount,
      recurring: recurringCount,
      pending: 0,
    });
  } catch (err) {
    console.error("⚠️ Error fetching campaigns:", err);
    setScheduledCampaigns([]);
  } finally {
    setLoading(false);
  }
};

  // Check sender verification
  const checkSenderVerification = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/automation/sender/verification`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSenderVerified(data.verified);
        if (data.domainAuth) {
          setDomainAuth(data.domainAuth);
        }
      }
    } catch (error) {
      console.error("Error checking sender verification:", error);
    }
  };

  // Add notification function
  const addNotification = (notification) => {
    setNotifications(prev => {
      // Check if notification already exists
      if (prev.some(n => n.id === notification.id)) {
        return prev;
      }
      return [notification, ...prev];
    });
  };

  // Handle campaign actions
  const handleCampaignAction = async (campaignId, action) => {
    try {
      const response = await fetch(`${API_URL}/api/automation/${campaignId}/${action}`, { 
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      
      if (response.ok) {
        await fetchScheduledCampaigns();
        setShowActionMenu(null);
        
        // Add success notification
        addNotification({
          id: `${action}-${campaignId}-${Date.now()}`,
          type: 'campaign_action',
          title: 'Campaign Updated',
          message: `Campaign ${action}d successfully`,
          timestamp: new Date(),
          read: false
        });
      } else {
        const error = await response.json();
        alert(`Failed to ${action} campaign: ${error.error || error.message}`);
      }
    } catch (error) {
      console.error(`Error ${action} campaign:`, error);
      alert(`Failed to ${action} campaign: ${error.message}`);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedCampaigns.length === 0) return;
    try {
      const promises = selectedCampaigns.map(id => 
        fetch(`${API_URL}/api/automation/${id}/${action}`, { 
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        })
      );
      await Promise.all(promises);
      await fetchScheduledCampaigns();
      setSelectedCampaigns([]);
      
      // Add success notification
      addNotification({
        id: `bulk-${action}-${Date.now()}`,
        type: 'bulk_action',
        title: 'Bulk Action Completed',
        message: `${selectedCampaigns.length} campaigns ${action}d successfully`,
        timestamp: new Date(),
        read: false
      });
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
    }
  };

  const toggleCampaignSelection = (campaignId) => {
    setSelectedCampaigns(prev => prev.includes(campaignId) 
      ? prev.filter(id => id !== campaignId)
      : [...prev, campaignId]);
  };
 
  const handleTriggerSend = async () => {
    try {
      const response = await fetch(`${API_URL}/api/automation/trigger-cron`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      
      const data = await response.json();
      await fetchScheduledCampaigns();

      const scheduledCount = scheduledCampaigns.filter(c => c.status === 'scheduled').length;
      if (scheduledCount > 0) {
        const campaignList = scheduledCampaigns
          .filter(c => c.status === 'scheduled')
          .map(c => `- ${c.campaignName}: ${new Date(c.scheduledDateTime).toLocaleString()}`)
          .join('\n');
        setTriggerMessage(`Found ${scheduledCount} scheduled campaigns:\n${campaignList}`);
      } else {
        setTriggerMessage("No scheduled campaigns found.");
      }

      setShowTriggerMessage(true);
      setTimeout(() => setShowTriggerMessage(false), 5000);
    } catch (error) {
      console.error("Error triggering cron job:", error);
      setTriggerMessage("Failed to trigger cron job");
      setShowTriggerMessage(true);
      setTimeout(() => setShowTriggerMessage(false), 5000);
    }
  };

  useEffect(() => {
    fetchAutomationData();
    fetchScheduledCampaigns();
    checkSenderVerification();

    const interval = setInterval(() => {
      fetchAutomationData();
      fetchScheduledCampaigns();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const filteredCampaigns = scheduledCampaigns.filter(campaign => {
    const matchesSearch = campaign.campaignName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || campaign.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'text-blue-400 bg-blue-400/20';
      case 'sent': return 'text-green-400 bg-green-400/20';
      case 'paused': return 'text-yellow-400 bg-yellow-400/20';
      case 'failed': return 'text-red-400 bg-red-400/20';
      case 'processing': return 'text-purple-400 bg-purple-400/20';
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
      default: return <AlertCircle size={14} />;
    }
  };

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    return date.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const overviewStats = [
    { title: "Total Scheduled", value: campaignStats.scheduled || 0, icon: Calendar, color: "text-blue-400", bgColor: "bg-blue-400/20" },
    { title: "Successfully Sent", value: campaignStats.sent || 0, icon: CheckCircle, color: "text-green-400", bgColor: "bg-green-400/20" },
    { title: "Currently Processing", value: campaignStats.processing || 0, icon: RefreshCw, color: "text-purple-400", bgColor: "bg-purple-400/20" },
    { title: "Recurring Campaigns", value: campaignStats.recurring || 0, icon: RefreshCw, color: "text-[#c2831f]", bgColor: "bg-[#c2831f]/20" }
  ];

  const performanceData = {
    labels: ['Scheduled', 'Sent', 'Failed', 'Processing'],
    datasets: [{
      data: [
        campaignStats.scheduled || 0,
        campaignStats.sent || 0,
        campaignStats.failed || 0,
        campaignStats.processing || 0
      ],
      backgroundColor: ['#3B82F6', '#10B981', '#EF4444', '#8B5CF6'],
      borderWidth: 0
    }]
  };

  const chartOptions = { 
    responsive: true, 
    maintainAspectRatio: false, 
    plugins: { 
      legend: { 
        position: 'bottom', 
        labels: { 
          color: '#D1D5DB', 
          padding: 20 
        } 
      } 
    } 
  };

// Enhanced deliverability tips section
const renderDeliverabilityTips = () => (
  <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
    <div className="flex items-center mb-4">
      <Shield className="text-yellow-400 mr-2" />
      <h3 className="text-lg font-semibold text-white">Email Deliverability Tips</h3>
    </div>

    {!senderVerified && (
      <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 mb-4">
        <div className="flex items-start">
          <AlertTriangle className="text-yellow-400 mr-2 mt-1" />
          <div>
            <h4 className="font-medium text-yellow-400">Sender Verification Required</h4>
            <p className="text-yellow-300 text-sm mt-1">
              Your sender domain is not fully authenticated. This is the most common reason emails go to spam.
            </p>
            <button className="mt-2 px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700">
              Verify Sender Domain
            </button>
          </div>
        </div>
      </div>
    )}

    {/* All 3 sections in one row */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Authentication Status */}
      <div>
        <h4 className="font-medium text-white mb-2">Authentication Status</h4>
        <ul className="text-sm text-gray-300 space-y-1">
          <li className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${domainAuth.spf ? 'bg-green-500' : 'bg-red-500'}`}></div>
            SPF Record {domainAuth.spf ? <Check size={14} className="ml-1 text-green-500" /> : <X size={14} className="ml-1 text-red-500" />}
          </li>
          <li className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${domainAuth.dkim ? 'bg-green-500' : 'bg-red-500'}`}></div>
            DKIM Signature {domainAuth.dkim ? <Check size={14} className="ml-1 text-green-500" /> : <X size={14} className="ml-1 text-red-500" />}
          </li>
          <li className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${domainAuth.dmarc ? 'bg-green-500' : 'bg-red-500'}`}></div>
            DMARC Policy {domainAuth.dmarc ? <Check size={14} className="ml-1 text-green-500" /> : <X size={14} className="ml-1 text-red-500" />}
          </li>
        </ul>
      </div>

      {/* Content Best Practices */}
      <div>
        <h4 className="font-medium text-white mb-2">Content Best Practices</h4>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Avoid spam trigger words</li>
          <li>• Include plain text version</li>
          <li>• Balance text and images</li>
          <li>• Personalize when possible</li>
          <li>• Use a clear subject line</li>
        </ul>
      </div>

      {/* Technical Recommendations */}
      <div>
        <h4 className="font-medium text-white mb-2">Technical Recommendations</h4>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Use a dedicated IP address for sending</li>
          <li>• Warm up your sending domain gradually</li>
          <li>• Monitor your sender reputation</li>
          <li>• Keep your email list clean and updated</li>
          <li>• Include an unsubscribe link in all emails</li>
        </ul>
      </div>
    </div>
  </div>
);


  // Render notifications
  const renderNotifications = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {notifications.filter(n => !n.read).map(notification => (
        <div key={notification.id} className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-white">{notification.title}</h4>
              <p className="text-sm text-gray-300 mt-1">{notification.message}</p>
              {notification.details && (
                <p className="text-xs text-gray-400 mt-2">{notification.details}</p>
              )}
            </div>
            <button 
              onClick={() => setNotifications(prev => 
                prev.map(n => n.id === notification.id ? {...n, read: true} : n)
              )}
              className="text-gray-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {new Date(notification.timestamp).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="animate-spin text-[#c2831f]" size={32} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {renderNotifications()}
      <div className="p-6 bg-black min-h-screen py-20">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Automation</h1>
              <p className="text-gray-400">Manage scheduled campaigns and automation workflows</p>
            </div>
            <div className="flex gap-3">
              {/* Trigger Send Button with message display */}
              <div className="relative">
                <button
                  onClick={fetchScheduledCampaigns}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                >
                  <RefreshCw size={16} />
                  Trigger Send
                </button>
                
                {/* Message popup */}
                {showTriggerMessage && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-white">Scheduled Campaigns</h3>
                      <button 
                        onClick={() => setShowTriggerMessage(false)}
                        className="text-gray-400 hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="text-sm text-gray-300 whitespace-pre-line">
                      {triggerMessage}
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => window.location.href = '/send-campaign'}
                className="px-4 py-2 bg-[#c2831f] text-white rounded-lg hover:bg-[#d09025] flex items-center gap-2"
              >
                <Calendar size={16} />
                Schedule Campaign
              </button>
            </div>
          </div>

          {/* Deliverability Tips */}
          {renderDeliverabilityTips()}
{/* Scheduled Campaign Info Box */}
<div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-6">
  <div className="flex items-start gap-3">
    <Clock className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
    <div className="flex-1">
      <h4 className="font-medium text-blue-400 mb-1">
        Automated Scheduling Active
      </h4>
      <p className="text-blue-300 text-sm">
        Scheduled campaigns are automatically sent at their designated time. 
        The system checks every minute for campaigns that are due to be sent. 
        Your campaigns will maintain their template structure and design exactly as previewed.
      </p>
      <div className="mt-2 flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-xs text-blue-300">Automation system running</span>
      </div>
    </div>
  </div>
</div>
          {/* Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-900 p-1 rounded-lg w-fit">
            {['overview', 'scheduled'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-[#c2831f] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {overviewStats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm">{stat.title}</p>
                          <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                        </div>
                        <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                          <Icon className={`${stat.color}`} size={24} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Campaign Status Distribution</h3>
                  <div className="h-64">
                    <Pie data={performanceData} options={chartOptions} />
                  </div>
                </div>
                
                {/* <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    {logs.slice(0, 6).map((log, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg">
                        <div className={`p-2 rounded-lg ${getStatusColor(log.status)}`}>
                          {getStatusIcon(log.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{log.campaignName}</p>
                          <p className="text-sm text-gray-400">{log.message}</p>
                          {log.error && (
                            <p className="text-xs text-red-400 mt-1 truncate">{log.error}</p>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDateTime(log.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div> */}
              </div>
            </div>
          )}

          {/* Scheduled Tab */}
          {activeTab === 'scheduled' && (
            <div className="space-y-6">
              {/* Controls */}
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search campaigns..."
                      className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c2831f]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#c2831f]"
                  >
                    <option value="all">All Status</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="sent">Sent</option>
                    <option value="paused">Paused</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                
                {selectedCampaigns.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBulkAction('pause')}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2"
                    >
                      <Pause size={16} />
                      Pause Selected
                    </button>
                    <button
                      onClick={() => handleBulkAction('delete')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                    >
                      <Trash2 size={16} />
                      Delete Selected
                    </button>
                  </div>
                )}
              </div>

              {/* Campaigns Table */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-800">
                      <tr>
                        <th className="w-12 p-4">
                          <input
                            type="checkbox"
                            checked={selectedCampaigns.length === filteredCampaigns.length && filteredCampaigns.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCampaigns(filteredCampaigns.map(c => c.id));
                              } else {
                                setSelectedCampaigns([]);
                              }
                            }}
                            className="accent-[#c2831f]"
                          />
                        </th>
                        <th className="text-left p-4 text-gray-300 font-medium">Campaign</th>
                        <th className="text-left p-4 text-gray-300 font-medium">Recipients</th>
                        <th className="text-left p-4 text-gray-300 font-medium">Schedule</th>
                        <th className="text-left p-4 text-gray-300 font-medium">Status</th>
                        <th className="text-left p-4 text-gray-300 font-medium">Type</th>
                        <th className="w-24 p-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCampaigns.map((campaign) => (
                        <tr key={campaign.id} className="border-t border-gray-800 hover:bg-gray-800/50">
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={selectedCampaigns.includes(campaign.id)}
                              onChange={() => toggleCampaignSelection(campaign.id)}
                              className="accent-[#c2831f]"
                            />
                          </td>
                          <td className="p-4">
                            <div>
                              <div className="font-medium text-white">{campaign.campaignName}</div>
                              <div className="text-sm text-gray-400 truncate">{campaign.subject}</div>
                              {campaign.error && (
                                <div className="text-xs text-red-400 mt-1">{campaign.error}</div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center text-gray-300">
                              <Users size={16} className="mr-2" />
                             {campaign.recipients || campaign.sentCount || 0}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-white">
                              {campaign.scheduledDateTime ? formatDateTime(campaign.scheduledDateTime) : 'N/A'}
                            </div>
                            {campaign.recurringFrequency && (
                              <div className="text-xs text-gray-400 mt-1">
                                Recurring {campaign.recurringFrequency}
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                              {getStatusIcon(campaign.status)}
                              {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-sm text-gray-400">
                              {campaign.recurringFrequency ? 'Recurring' : 'One-time'}
                            </span>
                          </td>
                          
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {filteredCampaigns.length === 0 && (
                  <div className="text-center py-12">
                    <Calendar className="mx-auto text-gray-600 mb-4" size={48} />
                    <h3 className="text-gray-400 font-medium mb-2">No scheduled campaigns</h3>
                    <p className="text-gray-500 mb-4">Create your first scheduled campaign to see it here</p>
                    <button
                      onClick={() => window.location.href = '/send-campaign'}
                      className="px-4 py-2 bg-[#c2831f] text-white rounded-lg hover:bg-[#d09025]"
                    >
                      Schedule Campaign
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div className="bg-gray-900 border border-gray-800 rounded-lg">
              <div className="p-6 border-b border-gray-800">
                <h3 className="text-lg font-semibold text-white">Activity Logs</h3>
                <p className="text-gray-400 text-sm mt-1">Real-time updates on campaign activities</p>
              </div>
              <div className="divide-y divide-gray-800 max-h-96 overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index} className="p-4 hover:bg-gray-800/50">
                    <div className="flex items-start space-x-4">
                      <div className={`flex-shrink-0 p-2 rounded-lg mt-1 ${getStatusColor(log.status)}`}>
                        {getStatusIcon(log.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-white">{log.campaignName}</p>
                          <span className="text-xs text-gray-500">{formatDateTime(log.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">{log.message}</p>
                        {log.error && (
                          <div className="mt-2 p-2 bg-red-900/30 border border-red-700 rounded text-xs text-red-300">
                            <div className="font-medium">Error:</div>
                            <div>{log.error}</div>
                          </div>
                        )}
                        {log.details && (
                          <p className="text-xs text-gray-500 mt-2">{log.details}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {logs.length === 0 && (
                  <div className="text-center py-12">
                    <Activity className="mx-auto text-gray-600 mb-4" size={48} />
                    <h3 className="text-gray-400 font-medium mb-2">No activity logs</h3>
                    <p className="text-gray-500">Campaign activities will appear here</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}; 

export default Automation;