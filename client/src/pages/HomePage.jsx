import React, { useState, useEffect, useRef } from "react";
import {
  Mail,
  Phone,
  Activity,
  Database,
  MapPin,
  Shield,
  Users,
  Zap,
  Target,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Eye,
  MousePointer,
} from "lucide-react";
import Footer from "../components/Footer";
import Home from "./Home";
import PageLayout from "../components/PageLayout";
import LandingPage from "./LandingPage";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";
import { Link } from "react-router-dom";

function HomePage() {
  const [activeTab, setActiveTab] = useState("email");
  const [count, setCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    let start = 0;
    const end = 200;
    const duration = 2000;
    const stepTime = Math.abs(Math.floor(duration / end));

    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start === end) clearInterval(timer);
    }, stepTime);

    return () => clearInterval(timer);
  }, []);

  const stats = [
    { number: 99.7, suffix: "%", label: "accuracy rate" },
    { number: 2, suffix: " billion", label: "verifications per month" },
    { number: 200, suffix: "+ billion", label: "emails validated" },
  ];

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  const tabs = [
    {
      id: "email",
      label: "Email Verification",
      icon: Mail,
      content: {
        title: "Email Hygiene + Real-Time Email Verification",
        description:
          "Verify if your emails will deliver and eliminate any email threats that will bounce, disrupt deliverability or harm sender reputation. 99.7% accurate with high speed file processing.",
        stats: "150+ Billion Emails Verified",
      },
    },
    {
      id: "campaign",
      label: "Campaign",
      icon: Target,
      content: {
        title: "Email Campaign Management",
        description:
          "Create, customize, and send email campaigns with professional templates. Upload contacts, verify sender addresses, and manage your campaigns with ease.",
        stats: "10+ Million Campaigns Sent",
      },
    },
    {
      id: "crm",
      label: "CRM Activity",
      icon: Activity,
      content: {
        title: "CRM & Lead Management",
        description:
          "Manage your inbox, email accounts, leads, deals, tasks, and orders all in one place. Reply, forward, and track all customer interactions seamlessly.",
        stats: "5+ Million Leads Managed",
      },
    },
    {
      id: "multimedia",
      label: "Multimedia Campaign",
      icon: Zap,
      content: {
        title: "Multi-Channel Marketing",
        description:
          "Reach your audience across SMS, WhatsApp, Facebook, Instagram, Twitter, LinkedIn, YouTube Ads, and Google Ads. Manage all your marketing channels from one platform.",
        stats: "50+ Million Multi-Channel Messages",
      },
    },
  ];

  const activeTabData = tabs.find((tab) => tab.id === activeTab);
const renderEmailValidation = () => (
  <div className="flex flex-col lg:flex-row gap-6 h-[700px]">
    {/* Left Side - Charts, Stats and Key Features */}
    <div className="flex-1 bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-800 text-white flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-lg font-semibold text-gray-100">
            Validation Results
          </h4>
          <p className="text-sm text-gray-400">23,526 Total Records</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-500">19,648</div>
          <div className="text-sm text-gray-300">Valid Emails</div>
        </div>
      </div>

      <div className="flex items-center justify-center mb-4">
        <div className="relative w-32 h-32">
          <svg
            className="w-32 h-32 transform -rotate-90"
            viewBox="0 0 36 36"
          >
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#374151"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeDasharray="83.5, 100"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-gray-100">83.5%</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <span className="flex items-center text-sm text-gray-300">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            Valid List
          </span>
          <span className="text-sm font-medium text-gray-100">19,648</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="flex items-center text-sm text-gray-300">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            Risky
          </span>
          <span className="text-sm font-medium text-gray-100">2,314</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="flex items-center text-sm text-gray-300">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            Invalid
          </span>
          <span className="text-sm font-medium text-gray-100">1,564</span>
        </div>
      </div>

      {/* Key Features Section */}
      <div className="mb-4 p-3 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700">
        <h4 className="font-semibold text-gray-100 mb-2 flex items-center">
          <Shield className="h-4 w-4 mr-2 text-[#c2831f]" />
          Key Features
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center p-2 bg-gray-800 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
            <span className="text-xs text-gray-300">Real-time verification</span>
          </div>
          <div className="flex items-center p-2 bg-gray-800 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
            <span className="text-xs text-gray-300">Syntax validation</span>
          </div>
          <div className="flex items-center p-2 bg-gray-800 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
            <span className="text-xs text-gray-300">Spam trap detection</span>
          </div>
          <div className="flex items-center p-2 bg-gray-800 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
            <span className="text-xs text-gray-300">Deliverability scoring</span>
          </div>
        </div>
      </div>

      <div className="mt-auto">
        <h4 className="text-lg font-semibold text-gray-100 mb-3">
          Detailed Breakdown
        </h4>
        <div className="space-y-2 text-sm text-gray-300">
          <div className="flex justify-between">
            <span className="">Syntax Valid</span>
            <span className="font-medium text-gray-100">4,283 (18.2%)</span>
          </div>
          <div className="flex justify-between">
            <span className="">Domain Valid</span>
            <span className="font-medium text-gray-100">4,174 (17.8%)</span>
          </div>
          <div className="flex justify-between">
            <span className="">MX Record</span>
            <span className="font-medium text-gray-100">3,992 (17.0%)</span>
          </div>
          <div className="flex justify-between">
            <span className="">Disposable</span>
            <span className="font-medium text-gray-100">842 (3.6%)</span>
          </div>
          <div className="flex justify-between">
            <span className="">Role Account</span>
            <span className="font-medium text-gray-100">567 (2.4%)</span>
          </div>
        </div>
      </div>
    </div>

    {/* Right Side - Info */}
    <div className="flex-1 bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-800 flex flex-col">
      <div className="flex items-center mb-4">
        <Mail className="h-12 w-12 text-blue-500 mr-4 p-2 bg-blue-900/30 rounded-xl" />
        <div>
          <h3 className="text-2xl font-bold text-[#c2831f]">
            {activeTabData.content.title}
          </h3>
          <p className="text-blue-400 font-semibold">
            {activeTabData.content.stats}
          </p>
        </div>
      </div>

      <p className="text-gray-300 mb-3 leading-relaxed">
        {activeTabData.content.description}
      </p>

      {/* Verification Options Section */}
      <div className="mb-4">
        <h4 className="font-semibold text-gray-100 mb-2">Verification Options:</h4>
        <div className="grid grid-cols-2 gap-5 mt-3">
          <button className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition-all text-sm flex items-center justify-center">
            <Database className="h-4 w-4 mr-1" />
            Bulk Verification
          </button>
          <button className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition-all text-sm flex items-center justify-center">
            <Mail className="h-4 w-4 mr-1" />
            Single Verification
          </button>
          <button className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition-all text-sm flex items-center justify-center">
            <Users className="h-4 w-4 mr-1" />
            Manual Verification
          </button>
          <button className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition-all text-sm flex items-center justify-center">
            <Zap className="h-4 w-4 mr-1" />
            Real-time API
          </button>
        </div>
      </div>

      {/* Verification Methods Description */}
      <div className="mb-4 p-3 bg-gray-800 rounded-lg border border-gray-700 mt-8">
        <h4 className="font-semibold text-gray-100 mb-2 text-sm">How It Works:</h4>
        <ul className="text-xs text-gray-400 space-y-3">
          <li className="flex items-start">
            <CheckCircle className="h-3 w-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            <span><span className="font-medium text-gray-300">Bulk Verification:</span> Upload CSV files with thousands of emails for batch processing</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="h-3 w-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            <span><span className="font-medium text-gray-300">Single Verification:</span> Check individual email addresses in real-time</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="h-3 w-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            <span><span className="font-medium text-gray-300">Manual Verification:</span> Review and verify emails with our detailed analysis tools</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="h-3 w-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            <span><span className="font-medium text-gray-300">Real-time API:</span> Integrate email verification directly into your applications</span>
          </li>
        </ul>
      </div>

      <div className="mt-auto">
        <Link to="/login" className="group inline-flex items-center px-6 py-3 cursor-pointer bg-[#c2831f] text-white font-semibold rounded-xl hover:from-[#d4a040] hover:to-[#e2b456] transition-all duration-200 transform hover:scale-105 shadow-lg w-full justify-center">
          Learn more
          <ArrowRight
            className="ml-2 h-5 text-20 group-hover:translate-x-1 transition-transform"
            strokeWidth={2}
          />
        </Link>
      </div>
    </div>
  </div>
);

const renderCampaign = () => (
  <div className="flex flex-col lg:flex-row gap-6 h-[700px]">
    {/* Left Side - Template Design Section */}
    <div className="flex-1 bg-gray-900 rounded-xl shadow-xl p-6 border border-gray-800 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xl font-bold text-[#c2831f] flex items-center">
          <Database className="h-6 w-6 mr-2" />
          Template Library
        </h4>
        <button className="text-sm bg-[#c2831f] hover:bg-[#d4a040] text-white px-4 py-2 rounded-lg transition-all">
          + New Template
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { name: "Welcome Series", icon: Mail, color: "blue" },
          { name: "Promotional", icon: TrendingUp, color: "green" },
          { name: "Newsletter", icon: Target, color: "purple" },
          { name: "Event Invite", icon: Zap, color: "orange" },
        ].map((template, idx) => (
          <div 
            key={idx}
            className="group relative overflow-hidden rounded-xl border-2 border-gray-800 hover:border-[#c2831f] transition-all duration-300 cursor-pointer transform hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 opacity-90 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative p-3 h-32 flex flex-col justify-between">
              <div className="flex items-center">
                <div className={`w-8 h-8 bg-${template.color}-900 rounded-lg flex items-center justify-center mr-2`}>
                  <template.icon className={`h-4 w-4 text-${template.color}-400`} />
                </div>
                <h5 className="font-medium text-gray-100 text-sm">{template.name}</h5>
              </div>
              <div className="text-xs text-gray-400">
                <span className="bg-gray-800 px-2 py-1 rounded">Click to edit</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto">
        <h4 className="text-xl font-bold text-[#c2831f] flex items-center mb-3">
          <Zap className="h-6 w-6 mr-2" />
          Visual Editor
        </h4>
        
        <div className="bg-gray-800 rounded-lg border-2 border-dashed border-gray-700 h-48 flex flex-col">
          {/* Toolbar */}
          <div className="flex items-center p-2 bg-gray-800 border-b border-gray-700 space-x-1">
            {['Text', 'Image', 'Button', 'Divider', 'Social'].map((item, idx) => (
              <button 
                key={idx}
                className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-2 py-1 rounded transition-all"
              >
                {item}
              </button>
            ))}
          </div>
          
          {/* Canvas Area */}
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-gray-700 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-gray-500" />
              </div>
              <p className="text-gray-400 text-sm">Drag elements here to build your template</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Right Side - Campaign Setup */}
    <div className="flex-1 bg-gray-900 rounded-xl shadow-xl p-6 border border-gray-800 flex flex-col">
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-[#c2831f] to-[#f9ba55] rounded-xl flex items-center justify-center mr-4">
          <Target className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-100">
            {activeTabData.content.title}
          </h3>
          <p className="text-[#c2831f] font-semibold text-sm">
            {activeTabData.content.stats}
          </p>
        </div>
      </div>

      <p className="text-gray-300 mb-4 leading-relaxed text-sm">
        {activeTabData.content.description}
      </p>

      {/* Campaign Form */}
      <div className="space-y-4 mb-4">
        {/* Campaign Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Campaign Name
          </label>
          <input
            type="text"
            placeholder="Summer Sale 2024"
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:border-[#c2831f] focus:outline-none transition-all"
          />
        </div>

        {/* Sender Information */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Sender Information
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Your Name"
              className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:border-[#c2831f] focus:outline-none transition-all"
            />
            <div className="relative">
              <input
                type="email"
                placeholder="sender@example.com"
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:border-[#c2831f] focus:outline-none transition-all"
              />
              <button className="absolute right-1 top-1 text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition-all">
                Verify
              </button>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Schedule
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button className="p-2 bg-[#c2831f] hover:bg-[#d4a040] text-white rounded-lg transition-all font-medium text-sm">
              Send Now
            </button>
            <button className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-all text-sm">
              Schedule Later
            </button>
          </div>
        </div>
      </div>

      {/* Campaign Metrics */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Campaign Metrics
        </label>
        <div className="grid grid-cols-2 gap-6 mt-5">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-3 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-1">
              <p className="text-gray-400 text-xs">Open Rate</p>
              <Eye className="h-3 w-3 text-[#c2831f]" />
            </div>
            <p className="text-xl font-bold text-gray-100">24.5%</p>
            <p className="text-xs text-green-500 mt-1">↑ 3.2% from last campaign</p>
          </div>
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-3 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-1">
              <p className="text-gray-400 text-xs">Click Rate</p>
              <MousePointer className="h-3 w-3 text-[#c2831f]" />
            </div>
            <p className="text-xl font-bold text-gray-100">3.2%</p>
            <p className="text-xs text-green-500 mt-1">↑ 0.8% from last campaign</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-auto flex space-x-2">
        <button className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-all font-medium text-sm">
          Preview Campaign
        </button>
        <Link to="/login" className="flex-1 py-2 bg-gradient-to-r from-[#c2831f] to-[#f9ba55] hover:from-[#d4a040] hover:to-[#f9ba55] text-white rounded-lg transition-all font-medium flex items-center justify-center text-sm">
          Send Campaign
          <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
    </div>
  </div>
);

const renderCRM = () => (
  <div className="flex flex-col lg:flex-row gap-6 h-[700px]">
    {/* Left Side - Inbox & Email Management */}
    <div className="flex-1 bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-800 flex flex-col">
      {/* Inbox Section */}
      <div className="mb-3">
        <h4 className="text-lg font-semibold text-[#c2831f] mb-2 flex items-center">
          <Mail className="h-5 w-5 mr-2" />
          Inbox Management
        </h4>
        <div className="space-y-4">
          <div className="p-2 bg-blue-900/30 rounded-lg border-l-4 border-blue-500 hover:bg-blue-900/50 cursor-pointer transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-200 text-sm">New Lead Inquiry</p>
                <p className="text-xs text-gray-400">john@example.com</p>
              </div>
              <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">New</span>
            </div>
          </div>
          <div className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-200 text-sm">Follow-up Required</p>
                <p className="text-xs text-gray-400">sarah@example.com</p>
              </div>
              <span className="text-xs bg-yellow-500 text-white px-2 py-1 rounded">Pending</span>
            </div>
          </div>
          <div className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-200 text-sm">Meeting Request</p>
                <p className="text-xs text-gray-400">mike@business.com</p>
              </div>
              <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">Scheduled</span>
            </div>
          </div>
        </div>
      </div>

      {/* Email Account Management */}
      <div className="mb-3">
        <h4 className="text-lg font-semibold text-[#c2831f] mb-2">
          Email Accounts
        </h4>
        <div className="space-y-6">
          <div className="flex items-center justify-between p-2 bg-gray-800 rounded-lg">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-900/30 rounded-full flex items-center justify-center mr-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <p className="font-medium text-gray-200 text-sm">sales@company.com</p>
                <p className="text-xs text-gray-400">Connected</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-2 bg-gray-800 rounded-lg">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-900/30 rounded-full flex items-center justify-center mr-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <p className="font-medium text-gray-200 text-sm">support@company.com</p>
                <p className="text-xs text-gray-400">Connected</p>
              </div>
            </div>
          </div>
          <button className="w-full p-2 border-2 border-dashed border-gray-700 rounded-lg text-gray-400 hover:border-[#c2831f] hover:text-[#c2831f] transition-all text-sm">
            + Add Email Account
          </button>
        </div>
      </div>

      {/* Reply & Forward Actions */}
      <div className="mt-auto">
        <h4 className="text-lg font-semibold text-[#c2831f] mb-2">
          Quick Actions
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <button className="p-2 bg-blue-900/30 text-blue-300 rounded-lg hover:bg-blue-900/50 transition-all flex items-center justify-center text-sm">
            <ArrowRight className="h-4 w-4 mr-1" />
            Reply
          </button>
          <button className="p-2 bg-purple-900/30 text-purple-300 rounded-lg hover:bg-purple-900/50 transition-all flex items-center justify-center text-sm">
            <ArrowRight className="h-4 w-4 mr-1" />
            Forward
          </button>
          <button className="p-2 bg-green-900/30 text-green-300 rounded-lg hover:bg-green-900/50 transition-all flex items-center justify-center text-sm">
            <Users className="h-4 w-4 mr-1" />
            Add Lead
          </button>
          <button className="p-2 bg-orange-900/30 text-orange-300 rounded-lg hover:bg-orange-900/50 transition-all flex items-center justify-center text-sm">
            <TrendingUp className="h-4 w-4 mr-1" />
            New Deal
          </button>
        </div>
      </div>
    </div>

    {/* Right Side - Leads, Deals, Tasks, Orders */}
    <div className="flex-1 bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-800 flex flex-col">
      <div className="flex items-center mb-4">
        <Activity className="h-10 w-10 text-blue-500 mr-3 p-2 bg-blue-900/30 rounded-xl" />
        <div>
          <h3 className="text-xl font-bold text-[#c2831f]">
            {activeTabData.content.title}
          </h3>
          <p className="text-blue-400 font-semibold text-sm">
            {activeTabData.content.stats}
          </p>
        </div>
      </div>

      <p className="text-gray-300 mb-4 leading-relaxed text-sm">
        {activeTabData.content.description}
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Leads Information */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700 p-3">
          <h4 className="font-semibold text-[#c2831f] mb-2 flex items-center text-sm">
            <Users className="h-4 w-4 mr-1" />
            Leads
          </h4>
          <div className="space-y-1">
            <div className="flex justify-between items-center p-2 bg-gray-800 rounded-lg">
              <span className="text-xs text-gray-300">New Leads</span>
              <span className="font-bold text-blue-400">247</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-800 rounded-lg">
              <span className="text-xs text-gray-300">Qualified Leads</span>
              <span className="font-bold text-green-400">189</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-800 rounded-lg">
              <span className="text-xs text-gray-300">Conversion Rate</span>
              <span className="font-bold text-yellow-400">76.5%</span>
            </div>
          </div>
        </div>

        {/* Deals */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700 p-3">
          <h4 className="font-semibold text-[#c2831f] mb-2 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 mr-1" />
            Deals
          </h4>
          <div className="space-y-1">
            <div className="flex justify-between items-center p-2 bg-gray-800 rounded-lg">
              <span className="text-xs text-gray-300">Open Deals</span>
              <span className="font-bold text-orange-400">45</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-800 rounded-lg">
              <span className="text-xs text-gray-300">Closed Won</span>
              <span className="font-bold text-green-400">$125K</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-800 rounded-lg">
              <span className="text-xs text-gray-300">Win Rate</span>
              <span className="font-bold text-purple-400">68%</span>
            </div>
          </div>
        </div>

        {/* Tasks */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700 p-3">
          <h4 className="font-semibold text-[#c2831f] mb-2 flex items-center text-sm">
            <CheckCircle className="h-4 w-4 mr-1" />
            Tasks
          </h4>
          <div className="space-y-1">
            <div className="flex justify-between items-center p-2 bg-gray-800 rounded-lg">
              <span className="text-xs text-gray-300">Pending Tasks</span>
              <span className="font-bold text-yellow-400">32</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-800 rounded-lg">
              <span className="text-xs text-gray-300">Completed</span>
              <span className="font-bold text-green-400">156</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-800 rounded-lg">
              <span className="text-xs text-gray-300">Overdue</span>
              <span className="font-bold text-red-400">5</span>
            </div>
          </div>
        </div>

        {/* Orders */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700 p-3">
          <h4 className="font-semibold text-[#c2831f] mb-2 flex items-center text-sm">
            <Database className="h-4 w-4 mr-1" />
            Orders
          </h4>
          <div className="space-y-1">
            <div className="flex justify-between items-center p-2 bg-gray-800 rounded-lg">
              <span className="text-xs text-gray-300">New Orders</span>
              <span className="font-bold text-blue-400">78</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-800 rounded-lg">
              <span className="text-xs text-gray-300">Processing</span>
              <span className="font-bold text-yellow-400">24</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-800 rounded-lg">
              <span className="text-xs text-gray-300">Completed</span>
              <span className="font-bold text-green-400">$42.5K</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="mb-4">
        <h4 className="font-semibold text-gray-100 mb-2 text-sm">Performance Metrics</h4>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gray-800 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-400">Response Time</p>
            <p className="text-sm font-bold text-green-400">2.4 hrs</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-400">Deal Size</p>
            <p className="text-sm font-bold text-blue-400">$2.8K</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-400">Order Value</p>
            <p className="text-sm font-bold text-purple-400">$545</p>
          </div>
        </div>
      </div>

      <Link to="/login" className="group inline-flex items-center px-4 py-2 w-full justify-center bg-[#c2831f] hover:bg-[#d4a040] text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg mt-auto text-sm">
        View CRM Dashboard
        <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  </div>
);

const renderMultimedia = () => (
  <div className="flex flex-col lg:flex-row gap-6 h-[700px]">
    {/* Left Side - SMS & WhatsApp Information */}
    <div className="flex-1 bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-800 flex flex-col">
      <h4 className="text-lg font-semibold text-[#c2831f] mb-3 flex items-center">
        <Phone className="h-5 w-5 mr-2" />
        SMS Campaign Performance
      </h4>
      
      <div className="p-3 bg-gray-800 rounded-lg border border-gray-700 mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-300">Total Sent</span>
          <span className="text-lg font-bold text-gray-100">12,450</span>
        </div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-300">Delivery Rate</span>
          <span className="text-lg font-bold text-green-500">98.2%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-300">Response Rate</span>
          <span className="text-lg font-bold text-blue-500">40.7%</span>
        </div>
      </div>
      
      <div className="p-3 bg-gray-800 rounded-lg border border-gray-700 mb-3">
        <h5 className="text-sm font-medium text-gray-300 mb-1">Recent Campaigns</h5>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Summer Sale</span>
            <span className="text-gray-100">98.5% delivery</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Flash Sale</span>
            <span className="text-gray-100">97.8% delivery</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">New Product</span>
            <span className="text-gray-100">98.3% delivery</span>
          </div>
        </div>
      </div>
      
      <div className="mt-auto">
        <h4 className="text-lg font-semibold text-[#c2831f] mb-3 flex items-center">
          <Zap className="h-5 w-5 mr-2" />
          WhatsApp Campaign Performance
        </h4>
        
        <div className="p-3 bg-gray-800 rounded-lg border border-gray-700 mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-300">Total Sent</span>
            <span className="text-lg font-bold text-gray-100">8,230</span>
          </div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-300">Open Rate</span>
            <span className="text-lg font-bold text-green-500">87.4%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-300">Click Rate</span>
            <span className="text-lg font-bold text-blue-500">42.3%</span>
          </div>
        </div>
        
        <div className="p-3 bg-gray-800 rounded-lg border border-gray-700 mb-3">
          <h5 className="text-sm font-medium text-gray-300 mb-1">Popular Templates</h5>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Welcome Message</span>
              <span className="text-gray-100">92% open rate</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Order Update</span>
              <span className="text-gray-100">89% open rate</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Promotional Offer</span>
              <span className="text-gray-100">85% open rate</span>
            </div>
          </div>
        </div>
         
      </div>
    </div>

    {/* Right Side - Social Media Campaigns */}
    <div className="flex-1 bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-800 flex flex-col">
      <div className="flex items-center mb-4">
        <Zap className="h-10 w-10 text-blue-500 mr-3 p-2 bg-blue-900/30 rounded-xl" />
        <div>
          <h3 className="text-xl font-bold text-[#c2831f]">
            {activeTabData.content.title}
          </h3>
          <p className="text-blue-400 font-semibold text-sm">
            {activeTabData.content.stats}
          </p>
        </div>
      </div>

      <p className="text-gray-300 mb-4 leading-relaxed text-sm">
        {activeTabData.content.description}
      </p>

      <div className="mb-4">
        <h4 className="font-semibold text-[#c2831f] mb-3 text-sm">Social Media Campaigns:</h4>
        
        <div className="grid grid-cols-2 gap-6">
          {/* Facebook */}
          <div className="p-2 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-700 transition-all">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 bg-blue-900/30 rounded-full flex items-center justify-center mr-2">
                <span className="text-white font-bold text-xs">f</span>
              </div>
              <h5 className="font-medium text-gray-100 text-sm">Facebook</h5>
            </div>
            <p className="text-xs text-gray-400 mb-2">Targeted ads</p>
            <button className="text-xs text-blue-400 hover:text-blue-300">Create</button>
          </div>

          {/* Instagram */}
          <div className="p-2 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-700 transition-all">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 bg-pink-900/30 rounded-full flex items-center justify-center mr-2">
                <span className="text-white font-bold text-xs">IG</span>
              </div>
              <h5 className="font-medium text-gray-100 text-sm">Instagram</h5>
            </div>
            <p className="text-xs text-gray-400 mb-2">Visual content</p>
            <button className="text-xs text-pink-400 hover:text-pink-300">Create</button>
          </div>

          {/* Twitter */}
          <div className="p-2 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-700 transition-all">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 bg-blue-800/30 rounded-full flex items-center justify-center mr-2">
                <span className="text-white font-bold text-xs">X</span>
              </div>
              <h5 className="font-medium text-gray-100 text-sm">Twitter</h5>
            </div>
            <p className="text-xs text-gray-400 mb-2">Tweets & trends</p>
            <button className="text-xs text-blue-400 hover:text-blue-300">Create</button>
          </div>

          {/* LinkedIn */}
          <div className="p-2 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-700 transition-all">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 bg-blue-700/30 rounded-full flex items-center justify-center mr-2">
                <span className="text-white font-bold text-xs">in</span>
              </div>
              <h5 className="font-medium text-gray-100 text-sm">LinkedIn</h5>
            </div>
            <p className="text-xs text-gray-400 mb-2">Professionals</p>
            <button className="text-xs text-blue-400 hover:text-blue-300">Create</button>
          </div>

          {/* YouTube Ads */}
          <div className="p-2 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-700 transition-all">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 bg-red-900/30 rounded-full flex items-center justify-center mr-2">
                <span className="text-white font-bold text-xs">YT</span>
              </div>
              <h5 className="font-medium text-gray-100 text-sm">YouTube</h5>
            </div>
            <p className="text-xs text-gray-400 mb-2">Video ads</p>
            <button className="text-xs text-red-400 hover:text-red-300">Create</button>
          </div>

          {/* Google Ads */}
          <div className="p-2 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-700 transition-all">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 bg-green-900/30 rounded-full flex items-center justify-center mr-2">
                <span className="text-white font-bold text-xs">G</span>
              </div>
              <h5 className="font-medium text-gray-100 text-sm">Google</h5>
            </div>
            <p className="text-xs text-gray-400 mb-2">Search ads</p>
            <button className="text-xs text-green-400 hover:text-green-300">Create</button>
          </div>
        </div>
      </div>

      <Link to="/MultiMediaCampaign" className="group inline-flex items-center px-4 py-2 w-full justify-center bg-[#c2831f] hover:bg-[#d4a040] text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg mt-auto text-sm">
        Manage All Campaigns
        <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  </div>
);

  const renderTabContent = () => {
    switch (activeTab) {
      case "email":
        return renderEmailValidation();
      case "campaign":
        return renderCampaign();
      case "crm":
        return renderCRM();
      case "multimedia":
        return renderMultimedia();
      default:
        return renderEmailValidation();
    }
  };

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <PageLayout>
      {/* Home Section */}
      <LandingPage />

      {/* EmailOversight */}
      <div className="min-h-screen">
        {/* Add video here so it appears below this section */}
        <div className="bg-black min-h-screen flex items-center justify-center">
          <div className="container mx-auto px-4 py-8 mt-12">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-[#c2831f] mb-4">
                How to Create Email Campaigns in Bounce Cure (Demo)
              </h1>
              <p className="text-lg text-gray-100 max-w-3xl mx-auto leading-relaxed">
                "Bounce Cure is your all-in-one platform for creating and
                managing email campaigns. Easily design and customize your
                campaigns, send them to your audience, and track their
                performance. Stay connected with your clients and grow your
                reach effortlessly."
              </p>
            </div>
            <div className="pt-10 transform transition-all duration-500 hover:-translate-y-3 hover:scale-105 cursor-pointer relative w-full flex justify-center">
              <video
                ref={videoRef}
                controls={isPlaying}
                className="w-[70%] rounded-xl shadow-2xl border-2 border-yellow-400 hover:border-yellow-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.8)] transition-all duration-500 hover:shadow-yellow-400/20"
              >
                <source src="/Videos/Bounce.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>

              {!isPlaying && (
                <button
                  onClick={handlePlay}
                  className="absolute inset-0 flex flex-col items-center cursor-pointer justify-center bg-black bg-opacity-100 rounded-xl hover:bg-opacity-70 transition-opacity duration-300 p-4"
                >
                  <div className="w-20 h-20 bg-[#c2831f] hover:bg-[#f9ba55] rounded-full flex items-center justify-center shadow-lg mb-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <p className="text-white text-lg text-center">Click this button for Demo</p>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Shield className="h-12 w-12 text-blue-600 mr-3" />
                <h1 className="text-4xl font-bold text-white">EmailOversight</h1>
              </div>
              <h2 className="text-3xl font-bold text-[#c2831f] mb-4">
                {count}+ Billion Emails Verified and Counting
              </h2>
              <p className="text-lg text-white max-w-4xl mx-auto leading-relaxed">
                EmailOversight provides a smarter way to validate emails through
                our multi-method validation approach. We combine both real-time
                email verification, validation and email hygiene, which
                identifies more hard bounces and email threats such as
                spamtraps, complainers, bots, litigators and more. By simply
                removing these harmful email addresses, it will increase email
                deliverability performance, help create conversions, increase
                website traffic, raise engagement rates, and improve sender
                reputation.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex overflow-x-auto scrollbar-hide ml-4 sm:ml-6 md:ml-8 lg:ml-45 gap-4">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-6 text-[#c2831f] py-4 whitespace-nowrap border-b-2 font-medium text-sm transition-all duration-200 
                      ${
                        activeTab === tab.id
                          ? "border-[#c2831f] text-[#c2831f] bg-opacity-160 backdrop-blur-md shadow-md cursor-pointer"
                          : "border-transparent hover:cursor-pointer"
                      }`}
                    style={{
                      borderRadius: "8px",
                    }}
                  >
                    <IconComponent
                      className={`h-5 w-5 mr-2 ${
                        activeTab === tab.id
                          ? "text-[#c2831f]"
                          : "text-gray-400"
                      }`}
                    />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {renderTabContent()}
        </div>
      </div>

      {/* ----end---- */}
      {/* Statistics Section */}

      <div className="py-12">
        <div
          ref={ref}
          className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {stats.map(({ number, suffix, label }, idx) => (
            <div
              key={idx}
              className="group rounded-2xl p-10 text-center transition-all duration-300 transform hover:-translate-y-2 hover:scale-105"
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                boxShadow: "0 4px 30px rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
              }}
            >
              <p className="text-4xl font-bold text-[#c2831f] transition-transform duration-300 group-hover:scale-125">
                {inView ? (
                  <CountUp
                    start={0}
                    end={number}
                    duration={2.5}
                    decimals={number % 1 !== 0 ? 1 : 0}
                  />
                ) : (
                  0
                )}
                {suffix}
              </p>
              <p className="text-base text-white mt-3 transition-transform duration-300 group-hover:scale-110">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <Home />
    </PageLayout>
  );
}

export default HomePage;