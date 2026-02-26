// BulkVerification.jsx
import React, { useState } from "react";
import { Upload, CheckCircle, XCircle, AlertTriangle, Shield, BarChart2, FileText, Users, Zap, Mail } from "lucide-react";
import PageLayout from "../components/PageLayout";
import { Link } from "react-router-dom"

const API_URL = import.meta.env.VITE_VRI_URL;
const EmailVerificationPage = () => {
    const [emails, setEmails] = useState([]);
    const [results, setResults] = useState(null);
    const [inputEmail, setInputEmail] = useState("");
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [remainingCount, setRemainingCount] = useState(null);

    const [limitReached, setLimitReached] = useState(false);

    const handleVerify = async () => {
        if (limitReached) return; // Prevent further attempts

        if (!inputEmail) {
            setError("Please enter an email address.");
            return;
        }

        try {
            setError("");
            setResult(null);

            const res = await fetch(`${API_URL}/api/verifi-frontend/verify-single-limit`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email: inputEmail }),
            });

            let data;
            try {
                data = await res.json();
            } catch {
                throw new Error("Unexpected server response — please try again.");
            }

            if (!res.ok) {
                if (res.status === 429) {
                    setLimitReached(true);
                    throw new Error(data.error || "Daily limit reached — try again after 24 hours.");
                }
                throw new Error(data.error || "Verification failed");
            }

            setResult(data.result);
            setRemainingCount(data.remaining);
        } catch (err) {
            console.error("Verification error:", err);
            setError(err.message);
        }
    };



    return (
        <PageLayout>
            <div className="min-h-screen bg-black text-white relative overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-amber-400/20 to-yellow-600/20 rounded-full filter blur-3xl opacity-30 animate-pulse"></div>
                    <div className="absolute top-40 right-20 w-80 h-80 bg-gradient-to-l from-white/10 to-gray-300/10 rounded-full filter blur-3xl opacity-25 animate-pulse"></div>
                    <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 w-[600px] h-96 bg-gradient-to-t from-amber-500/15 to-transparent rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
                </div>

                <div className="relative z-10 px-6 py-12 space-y-16 max-w-7xl mx-auto">
                    {/* Header */}
                    <section className="text-center max-w-4xl mx-auto     p-10 shadow-2xl">
                        <div className="flex justify-center mb-6">
                            <div className="p-4 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-2xl border border-amber-400/30">
                                <Mail className="w-12 h-12 text-amber-400" />
                            </div>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-amber-200 to-yellow-400 bg-clip-text text-transparent leading-tight">
                            Email Verification
                        </h1>
                        <p className="text-xl text-gray-300 leading-relaxed">
                            Validate your entire email list instantly. Identify valid, invalid, and risky addresses to ensure maximum deliverability and protect your sender reputation.
                        </p>
                    </section>

                    {/* Single Email Validation */}
                    <section className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl hover:border-amber-400/30 transition-all duration-500">
                        <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-white to-amber-200 bg-clip-text text-transparent">
                            Single Email Validation
                        </h2>

                        <div className="flex flex-col md:flex-row gap-4 justify-center max-w-3xl mx-auto">
                            <input
                                type="email"
                                value={inputEmail}
                                onChange={(e) => setInputEmail(e.target.value)}
                                placeholder="Enter email address to verify"
                                className="bg-black/20 backdrop-blur-xl border border-white/20 rounded-2xl py-4 px-6 text-white placeholder-gray-400 focus:outline-none focus:border-amber-400/60 focus:bg-black/30 transition-all duration-300 flex-1 text-lg"
                            />
                            <button
                                onClick={handleVerify}
                                disabled={limitReached}
                                className={`bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform ${limitReached
                                        ? "opacity-50 cursor-not-allowed"
                                        : "hover:scale-105 hover:shadow-lg hover:shadow-amber-500/30"
                                    }`}
                            >
                                {limitReached ? "Daily Limit Reached" : "Verify Now"}
                            </button>

                        </div>

                        {/* Display messages */}
                        {/* Display messages */}
                        <div className="mt-6 text-center">
                            {error && (
                                <p className="text-red-400 font-medium">{error}</p>
                            )}

                            {result && (
                                <>
                                    <div className="mt-4">
                                        {result.status === "valid" && (
                                            <p className="text-green-400 text-xl font-semibold">
                                                ✅ This email is valid!
                                            </p>
                                        )}
                                        {result.status === "invalid" && (
                                            <p className="text-red-400 text-xl font-semibold">
                                                ❌ Invalid email address.
                                            </p>
                                        )}
                                        {result.status === "risky" && (
                                            <p className="text-yellow-400 text-xl font-semibold">
                                                ⚠️ This email might be risky or unverifiable.
                                            </p>
                                        )}
                                        {result.status === "unknown" && (
                                            <p className="text-gray-400 text-xl font-semibold">
                                                🤔 Unable to verify — please try again later.
                                            </p>
                                        )}
                                    </div>

                                    {remainingCount !== null && (
                                        <p className="text-gray-400 mt-3">
                                            Remaining verifications today:{" "}
                                            <span className="text-amber-300 font-semibold">
                                                {remainingCount}
                                            </span>
                                        </p>
                                    )}

                                    {/* === 7-LAYER VERIFICATION SUMMARY === */}
                                    <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {[
                                            { title: "Syntax Check", desc: "Validates email format", ok: true },
                                            { title: "Domain Lookup", desc: "Checks domain DNS MX records", ok: true },
                                            { title: "MX Records", desc: "Verifies mail exchanger servers", ok: result.status !== "invalid" },
                                            { title: "SMTP Check", desc: "Connects to mail server", ok: result.status === "valid" },
                                            { title: "Disposable Email", desc: "Detects temp mail services", ok: false },
                                            { title: "Role-Based Filter", desc: "Detects generic addresses", ok: true },
                                            { title: "Final Reputation", desc: "Assesses email risk level", ok: result.status === "valid" },
                                        ].map((layer, i) => (
                                            <div key={i} className={`p-5 rounded-2xl backdrop-blur-xl border shadow-xl transition-all duration-300
                        ${layer.ok ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}
                    `}>
                                                <h4 className="font-bold text-lg mb-2 text-white flex items-center justify-between">
                                                    {layer.title}
                                                    <span>{layer.ok ? "✅" : "❌"}</span>
                                                </h4>
                                                <p className="text-gray-300 text-sm">{layer.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>


                        <p className="text-gray-400 mt-8 text-center text-sm">
                            Free users can verify up to <span className="text-amber-300 font-semibold">5 emails</span> every 24 hours.
                        </p>
                    </section>


                    {/* Results */}
                    {results && (
                        <section className="space-y-8">
                            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-white to-amber-200 bg-clip-text text-transparent">
                                Verification Results
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Valid */}
                                <div className="backdrop-blur-xl bg-green-500/10 p-6 rounded-2xl border border-green-500/30 hover:bg-green-500/15 transition-all duration-300">
                                    <h3 className="flex items-center gap-2 text-green-400 font-bold mb-4 text-lg">
                                        <CheckCircle className="w-6 h-6" /> Valid Emails
                                    </h3>
                                    <ul className="text-gray-300 space-y-2">
                                        {results.valid.map((email, i) => (
                                            <li key={i} className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                                {email}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                {/* Invalid */}
                                <div className="backdrop-blur-xl bg-red-500/10 p-6 rounded-2xl border border-red-500/30 hover:bg-red-500/15 transition-all duration-300">
                                    <h3 className="flex items-center gap-2 text-red-400 font-bold mb-4 text-lg">
                                        <XCircle className="w-6 h-6" /> Invalid Emails
                                    </h3>
                                    <ul className="text-gray-300 space-y-2">
                                        {results.invalid.map((email, i) => (
                                            <li key={i} className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                                {email}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                {/* Risky */}
                                <div className="backdrop-blur-xl bg-yellow-500/10 p-6 rounded-2xl border border-yellow-500/30 hover:bg-yellow-500/15 transition-all duration-300">
                                    <h3 className="flex items-center gap-2 text-yellow-400 font-bold mb-4 text-lg">
                                        <AlertTriangle className="w-6 h-6" /> Risky Emails
                                    </h3>
                                    <ul className="text-gray-300 space-y-2">
                                        {results.risky.map((email, i) => (
                                            <li key={i} className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                                                {email}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Why Email Verification */}
                    <section className="backdrop-blur-xl bg-white/5 p-8 rounded-3xl border border-white/10 shadow-2xl">
                        <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-white to-amber-200 bg-clip-text text-transparent">
                            Why Email Verification Matters
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { icon: Shield, title: "Protect Your Reputation", desc: "Prevent spam complaints and avoid email blacklists by removing invalid addresses." },
                                { icon: Zap, title: "Boost Deliverability", desc: "Ensure your emails reach the inbox and maximize campaign effectiveness." },
                                { icon: BarChart2, title: "Improve ROI", desc: "Focus resources on valid contacts and increase conversion rates." },
                            ].map((item, i) => (
                                <div key={i} className="backdrop-blur-sm bg-white/5 p-6 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-amber-400/30 transition-all duration-300 hover:scale-105 text-center">
                                    <div className="flex justify-center mb-4">
                                        <div className="p-3 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-xl border border-amber-400/30">
                                            <item.icon className="w-8 h-8 text-amber-400" />
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-lg mb-2 text-white">{item.title}</h3>
                                    <p className="text-gray-400">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* How It Works */}
                    <section>
                        <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-white to-amber-200 bg-clip-text text-transparent">
                            How Email Verification Works
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {[
                                { icon: Upload, title: "Upload List", desc: "Import your email list in CSV or TXT format." },
                                { icon: FileText, title: "Deep Analysis", desc: "We verify syntax, domain validity, and mailbox status." },
                                { icon: CheckCircle, title: "Categorize", desc: "Emails sorted into Valid, Invalid, and Risky categories." },
                                { icon: Users, title: "Export Results", desc: "Download your cleaned list ready for campaigns." },
                            ].map((item, i) => (
                                <div key={i} className="backdrop-blur-xl bg-white/5 p-6 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-amber-400/30 transition-all duration-300 hover:scale-105 text-center group">
                                    <div className="flex justify-center mb-4">
                                        <div className="p-3 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-xl border border-amber-400/30 group-hover:scale-110 transition-transform duration-300">
                                            <item.icon className="w-8 h-8 text-amber-400" />
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-lg mb-2 text-white">{item.title}</h3>
                                    <p className="text-gray-400">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Integration CTA */}
                    <section className="backdrop-blur-xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 border border-amber-400/20 rounded-3xl p-10 text-center shadow-2xl">
                        <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-white via-amber-200 to-yellow-400 bg-clip-text text-transparent">
                            Seamless Integration
                        </h2>
                        <p className="mb-6 text-gray-300 text-lg max-w-2xl mx-auto">
                            Connect with your favorite tools including Mailchimp, SendGrid, HubSpot, and more to automate your email verification workflow.
                        </p>

                    </section>

                    {/* Call to Action */}
                    <section className="backdrop-blur-xl bg-white/5 p-10 rounded-3xl border border-white/10 shadow-2xl text-center">
                        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white via-amber-200 to-yellow-400 bg-clip-text text-transparent">
                            Start Verifying Emails Today
                        </h2>
                        <p className="text-gray-300 mb-8 text-lg max-w-2xl mx-auto">
                            Join thousands of businesses using our platform to maintain clean email lists and improve campaign performance.
                        </p>
                        <Link to="/pricing" className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold py-4 px-8 rounded-2xl hover:from-amber-400 hover:to-yellow-400 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/30">
                            Get Started Free
                        </Link>
                    </section>
                </div>
            </div>
        </PageLayout>
    );
};

export default EmailVerificationPage;
