import React from 'react';
import { Shield, Zap, Lock, TrendingUp, CheckCircle, Users, Star, Mail, ArrowRight, Globe, Target, Award, Sparkles, BarChart3, Clock, Database, Settings, Layers, Cpu, Cloud, FileText, Download, Upload, Eye, Filter, Search, Webhook, Key, Gauge, RefreshCw, AlertTriangle, CheckSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageLayout from '../components/PageLayout';

export default function Features() {
  return (
    <PageLayout>
      <div>


        <div className=" text-white font-sans min-h-screen overflow-hidden">

          {/* Hero Section */}
          <section className="text-center px-4 sm:px-10 lg:px-8 relative flex flex-col justify-start pt-26 sm:pt-20 lg:pt-10 pb-12 bg-black overflow-hidden">

            {/* Floating Particles */}
            <div className="absolute inset-0">
              {[...Array(25)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full opacity-30"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`,
                    animation: `float ${3 + Math.random() * 2}s ease-in-out infinite alternate`
                  }}
                />
              ))}
            </div>

            <div className="relative z-10">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-8 bg-gradient-to-r from-[#c2831f] to-[#c2831f] bg-clip-text text-transparent animate-fade-in">
                Powerful Features
              </h1>

              <p className="text-gray-300 max-w-3xl mx-auto mb-10 text-xl leading-relaxed">
                Discover the comprehensive suite of tools designed to revolutionize your email verification process with unmatched accuracy and speed.
              </p>
              <Link
                to="/get-started"
                className="group inline-flex items-center bg-black text-[#c2831f] px-8 py-4 rounded-full font-medium hover:bg-black hover:text-white border-2 border-white transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              >
                Explore Features
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
              </Link>
            </div>
          </section>

          {/* Core Features Grid */}
          <section className="py-4 px-4 ">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-4">Core Features</h2>
                <p className="text-gray-400 text-lg">
                  Everything you need for professional email verification
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                  {
                    icon: <Zap className="w-8 h-8 text-[#c2831f]" />,
                    title: "Real-time Verification",
                    desc: "Instant email validation with sub-second response times for seamless user experience.",
                  },
                  {
                    icon: <Shield className="w-8 h-8 text-[#c2831f]" />,
                    title: "Advanced Security",
                    desc: "Enterprise-grade security with encrypted data transmission and secure API endpoints.",
                  },
                  {
                    icon: <BarChart3 className="w-8 h-8 text-[#c2831f]" />,
                    title: "Detailed Analytics",
                    desc: "Comprehensive reporting and insights to track verification performance and trends.",
                  },
                  {
                    icon: <Database className="w-8 h-8 text-[#c2831f]" />,
                    title: "Bulk Processing",
                    desc: "Process thousands of emails simultaneously with our high-performance infrastructure.",
                  },
                  {
                    icon: <Globe className="w-8 h-8 text-[#c2831f]" />,
                    title: "Global Coverage",
                    desc: "Worldwide email verification with support for international domains and formats.",
                  },
                  {
                    icon: <Webhook className="w-8 h-8 text-[#c2831f]" />,
                    title: "API Integration",
                    desc: "RESTful API with comprehensive documentation for seamless platform integration.",
                  }
                ].map((feature, i) => (
                  <div
                    key={i}
                    className="group bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all duration-500 hover:scale-105 cursor-pointer"
                  >


                    {/* Centered Icon */}
                    <div className="flex justify-center mb-4">
                      <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-300">
                        {feature.icon}
                      </div>
                    </div>

                    <h3 className="text-xl font-semibold mb-3 text-center group-hover:text-white transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300 leading-relaxed text-center">
                      {feature.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>



          {/* Advanced Features Showcase */}
          <section className="py-20 px-4 bg-gradient-to-b from-black to-gray-900">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-4">Advanced Capabilities</h2>
                <p className="text-gray-400 text-lg">Professional-grade features for enterprise needs</p>
              </div>

              <div className="space-y-20">
                {/* Feature 1 */}
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div>
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mr-4">
                        <Cpu className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-3xl font-bold">AI-Powered Detection</h3>
                    </div>
                    <p className="text-gray-400 text-lg mb-6 leading-relaxed">
                      Our machine learning algorithms continuously learn from billions of email patterns to provide the most accurate verification results in the industry.
                    </p>
                    <div className="space-y-3">
                      {[
                        "Pattern recognition for disposable emails",
                        "Behavioral analysis for catch-all domains",
                        "Risk scoring for suspicious addresses",
                        "Continuous model improvement"
                      ].map((item, i) => (
                        <div key={i} className="flex items-center text-gray-300">
                          <CheckCircle className="w-5 h-5 mr-3 text-[#c2831f]" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <img
                      src="/AboutFeatures/Aidetect.png?height=300&width=400&text=AI+Detection+Engine"
                      alt="AI Detection"
                      className="w-full border-white/20 hover:border-white/40 transition-all duration-500 hover:scale-105"
                    />
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div className="order-2 md:order-1">
                    <img
                      src="/AboutFeatures/Monitor.png?height=400&width=500&text=Real-time+Dashboard"
                      alt="Real-time Dashboard"
                      className="w-full  border-white/20 hover:border-white/40 transition-all duration-500 hover:scale-105"
                    />
                  </div>
                  <div className="order-1 md:order-2">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mr-4">
                        <Gauge className="w-6 h-6 text-[#c2831f]" />
                      </div>
                      <h3 className="text-3xl font-bold">Real-time Monitoring</h3>
                    </div>
                    <p className="text-gray-400 text-lg mb-6 leading-relaxed">
                      Monitor your verification processes in real-time with comprehensive dashboards and instant notifications for critical events.
                    </p>
                    <div className="space-y-3">
                      {[
                        "Live verification status tracking",
                        "Performance metrics and KPIs",
                        "Custom alerts and notifications",
                        "Historical data analysis"
                      ].map((item, i) => (
                        <div key={i} className="flex items-center text-gray-300">
                          <CheckCircle className="w-5 h-5 mr-3 text-[#c2831f]" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div>
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mr-4">
                        <Cloud className="w-6 h-6 text-[#c2831f]" />
                      </div>
                      <h3 className="text-3xl font-bold">Cloud Infrastructure</h3>
                    </div>
                    <p className="text-gray-400 text-lg mb-6 leading-relaxed">
                      Built on enterprise-grade cloud infrastructure with 99.9% uptime guarantee and automatic scaling capabilities.
                    </p>
                    <div className="space-y-3">
                      {[
                        "Auto-scaling based on demand",
                        "Global CDN for low latency",
                        "Redundant data centers",
                        "24/7 system monitoring"
                      ].map((item, i) => (
                        <div key={i} className="flex items-center text-gray-300">
                          <CheckCircle className="w-5 h-5 mr-3 text-[#c2831f]" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <img
                      src="/AboutFeatures/Cloud.png?height=500&width=600&text=Cloud+Infrastructure"
                      alt="Cloud Infrastructure"
                      className="w-full border-white/20 hover:border-white/40 transition-all duration-500 hover:scale-105"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Integration Options */}
          <section className="py-4 px-2 ">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-4">Seamless Integrations</h2>
                <p className="text-gray-400 text-lg">Connect with your favorite tools and platforms</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
                {[
                  { name: "REST API", icon: <Key className="w-8 h-8 text-[#c2831f]" />, desc: "Full-featured API" },
                  { name: "Webhooks", icon: <Webhook className="w-8 h-8 text-[#c2831f]" />, desc: "Real-time notifications" },
                  { name: "CSV Upload", icon: <Upload className="w-8 h-8 text-[#c2831f]" />, desc: "Bulk file processing" },
                  { name: "Export Data", icon: <Download className="w-8 h-8 text-[#c2831f]" />, desc: "Multiple formats" },
                  { name: "Zapier", icon: <Layers className="w-8 h-8 text-[#c2831f]" />, desc: "Workflow automation" },
                  { name: "Custom SDK", icon: <Settings className="w-8 h-8 text-[#c2831f]" />, desc: "Multiple languages" },
                  { name: "Real-time", icon: <RefreshCw className="w-8 h-8 text-[#c2831f]" />, desc: "Live verification" },
                  { name: "Analytics", icon: <Eye className="w-8 h-8 text-[#c2831f]" />, desc: "Detailed insights" }
                ].map((integration, i) => (
                  <div key={i} className="group text-center p-6 bg-white/5 rounded-xl border border-[#c2831f]/40 hover:border-white/30 hover:bg-white/10 transition-all duration-300 hover:scale-105 cursor-pointer">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-white group-hover:text-black transition-all duration-300">
                      {integration.icon}
                    </div>
                    <h3 className="font-semibold mb-2 group-hover:text-white transition-colors duration-300">{integration.name}</h3>
                    <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors duration-300">{integration.desc}</p>
                  </div>
                ))}
              </div>

              {/* Code Example */}
              <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
                <div className="flex items-center mb-6">
                  <FileText className="w-6 h-6 mr-3 text-[#c2831f]" />
                  <h3 className="text-2xl font-bold">Quick Integration Example</h3>
                </div>
                <div className="bg-black/50 rounded-lg p-6 border border-white/20">
                  <pre className="text-gray-300 text-sm overflow-x-auto">
                    <code>{`// Simple API integration
const response = await fetch('https://api.emailverify.com/v1/verify', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com'
  })
});

const result = await response.json();
console.log(result.status); // 'valid', 'invalid', 'risky'`}</code>
                  </pre>
                </div>
              </div>
            </div>
          </section>

          {/* Verification Types */}
          <section className="py-18 px-4 ">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-4">Verification Types</h2>
                <p className="text-gray-400 text-lg">Comprehensive email validation across all scenarios</p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    icon: <CheckSquare className="w-10 h-10 text-[#c2831f]" />,
                    title: "Syntax Validation",
                    desc: "RFC-compliant email format checking with advanced pattern recognition.",
                    features: ["Format validation", "Domain syntax check", "Special character handling", "International domains"]
                  },
                  {
                    icon: <Search className="w-10 h-10 text-[#c2831f]" />,
                    title: "Domain Verification",
                    desc: "Real-time domain and MX record validation for deliverability assurance.",
                    features: ["MX record lookup", "Domain reputation check", "DNS validation", "Catch-all detection"]
                  },
                  {
                    icon: <AlertTriangle className="w-10 h-10 text-[#c2831f]" />,
                    title: "Risk Assessment",
                    desc: "Advanced risk scoring to identify potentially problematic email addresses.",
                    features: ["Disposable email detection", "Role account identification", "Spam trap detection", "Risk scoring"]
                  }
                ].map((type, i) => (
                  <div
                    key={i}
                    className="group bg-white/5 rounded-2xl p-8 border border-[#c2831f]/40 hover:border-white/30 hover:bg-white/10 transition-all duration-500 hover:scale-105 cursor-pointer flex flex-col items-center text-center"
                  >
                    {/* Centered icon */}
                    <div className="mb-6 group-hover:scale-110 transition-transform duration-300">
                      {type.icon}
                    </div>

                    <h3 className="text-2xl font-bold mb-4 group-hover:text-white transition-colors duration-300">
                      {type.title}
                    </h3>
                    <p className="text-gray-400 mb-6 group-hover:text-gray-300 transition-colors duration-300 leading-relaxed">
                      {type.desc}
                    </p>

                    <ul className="space-y-2">
                      {type.features.map((feature, j) => (
                        <li
                          key={j}
                          className="text-gray-300 group-hover:text-gray-200 transition-colors duration-300"
                        >
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>


          {/* Performance Stats */}
          <section className="py-12 px-4 ">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Performance Metrics</h2>
                <p className="text-gray-400">Industry-leading performance you can rely on</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                {[
                  { number: "<50ms", label: "Average Response Time", icon: <Clock className="w-8 h-8 mx-auto mb-2 text-[#c2831f]" /> },
                  { number: "99.9%", label: "Uptime Guarantee", icon: <Shield className="w-8 h-8 mx-auto mb-2 text-[#c2831f]" /> },
                  { number: "1M+", label: "Requests Per Hour", icon: <Zap className="w-8 h-8 mx-auto mb-2 text-[#c2831f]" /> },
                  { number: "24/7", label: "Support Available", icon: <Users className="w-8 h-8 mx-auto mb-2 text-[#c2831f]" /> }
                ].map((stat, i) => (
                  <div key={i} className="group hover:scale-110 transition-all duration-300 cursor-pointer">
                    <div className="bg-white/5 rounded-xl p-6 border border-[#c2831f]/30 hover:border-[#c2831f]/100 hover:bg-white/10 transition-all duration-300">
                      {stat.icon}
                      <div className="text-3xl font-bold mb-2 group-hover:text-white transition-colors duration-300">{stat.number}</div>
                      <div className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Final CTA */}
          <section className="text-center py-16 px-4 relative overflow-hidden">

            <div className="relative z-10">
              <div className="mb-8">
                <Star className="w-16 h-16 mx-auto mb-4 animate-pulse text-[#c2831f]" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Experience These Features Today</h2>
              <p className="text-gray-400 mb-8 text-xl max-w-2xl mx-auto">
                Join thousands of businesses already using our advanced email verification platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/login"
                  className="group bg-white text-black px-8 py-4 rounded-full font-semibold hover:bg-black hover:text-[#c2831f] border-2 border-white transition-all duration-300 hover:scale-105 hover:shadow-xl inline-flex items-center justify-center"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                </Link>
                 
              </div>
            </div>
          </section>

          <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
      `}</style>
        </div>

      </div>
    </PageLayout>
  );
}
