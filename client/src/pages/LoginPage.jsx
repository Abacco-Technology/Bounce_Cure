// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield, Zap, Users, CheckCircle } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';
const API_URL = import.meta.env.VITE_API_URL;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const ModernLogin = () => {



    // inside component (e.g. ModernLogin or ModernSignup)
    // add useEffect to initialize GIS
    // ✅ Google Sign-In initialization (stable version)
    React.useEffect(() => {
        if (!window.google || !GOOGLE_CLIENT_ID) return;

        try {
            // Initialize Google Identity Services
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleGoogleCredential,
            });

            // Render the Google Sign-In button
            window.google.accounts.id.renderButton(
                document.getElementById("googleSignInDiv"),
                {
                    theme: "outline",
                    size: "large",
                    text: "continue_with",
                    shape: "rectangular",
                    width: 320,
                }
            );

            // Optionally show One Tap (commented for localhost)
            // window.google.accounts.id.prompt();
            console.log("✅ Google Sign-In initialized");
        } catch (err) {
            console.error("Google initialization error:", err);
        }
    }, []);


    // add this function in the component
    const handleGoogleCredential = async (response) => {
        console.log("🟢 Google sign-in credential received:", response);

        if (!response?.credential) {
            toast.error("Google sign-in failed: no credential returned");
            return;
        }

        try {
            const res = await fetch(`${API_URL}/auth/google`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ idToken: response.credential }),
            });

            const data = await res.json().catch(() => ({}));
            console.log("📦 Google backend response:", data);

            if (res.ok && data.token) {
                localStorage.setItem("token", data.token);
                if (data.user) {
                    localStorage.setItem("userId", data.user.id);
                    localStorage.setItem("userName", data.user.name || "");
                    localStorage.setItem("userEmail", data.user.email || "");
                }

                // ✅ Fetch plan info after Google login
                if (data.user?.id) {
                    console.log("🔍 Fetching plan for Google user:", data.user.id);
                    try {
                        const planRes = await fetch(`${API_URL}/user/${data.user.id}/plan`);
                        const planData = await planRes.json();
                        console.log("📊 Google user plan fetched:", planData);

                        localStorage.setItem("planName", planData.planName || "Free");
                        localStorage.setItem(
                            "emailVerificationCredits",
                            planData.emailVerificationCredits ?? 50
                        );
                        localStorage.setItem(
                            "totalEmails",
                            planData.emailSendCredits ?? 50
                        );
                    } catch (err) {
                        console.error("⚠️ Failed to fetch Google user plan:", err);
                    }
                }

                toast.success("Signed in with Google ✔️");
                navigate("/dashboard");
                setTimeout(() => window.location.reload(), 500);
            } else {
                console.warn("⚠️ Google login failed:", data.message);
                toast.error(data.message || "Google sign-in failed");
            }
        } catch (err) {
            console.error("🔥 Google sign-in error:", err);
            toast.error("Google sign-in error");
        }
    };



    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("🚀 Login submitted:", formData);

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json().catch(err => {
                console.error("❌ JSON parse error:", err);
                return {};
            });

            console.log("📦 Backend login response:", data);
            console.log("📡 Status code:", res.status);

            if (res.ok && data.token) {
                // Save basic user + token
                localStorage.setItem("token", data.token);
                if (data.user) {
                    localStorage.setItem("userId", data.user.id);
                    localStorage.setItem("userName", data.user.name || "");
                    localStorage.setItem("userEmail", data.user.email || "");
                }

                // ✅ Fetch user's plan details from backend
                if (data.user?.id) {
                    console.log("🔍 Fetching plan for user ID:", data.user.id);
                    try {
                        const planRes = await fetch(`${API_URL}/user/${data.user.id}/plan`);
                        const planData = await planRes.json();
                        console.log("📊 User plan fetched:", planData);

                        // Save plan details in localStorage
                        localStorage.setItem("planName", planData.planName || "Free");
                        localStorage.setItem(
                            "emailVerificationCredits",
                            planData.emailVerificationCredits ?? 50
                        );
                        localStorage.setItem(
                            "totalEmails",
                            planData.emailSendCredits ?? 50
                        );
                    } catch (err) {
                        console.error("⚠️ Failed to fetch plan info:", err);
                    }
                } else {
                    console.warn("⚠️ No user ID found in login response");
                }

                toast.success("Login successful 🎉");
                navigate("/dashboard");

                // ✅ Reload to refresh context + navbar
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            } else {
                console.warn("⚠️ Login failed:", data.message);
                localStorage.removeItem("token");
                toast.error(data.message || "Login failed");
            }
        } catch (err) {
            console.error("🔥 Login error:", err);
            toast.error("Something went wrong!");
        }
    };






    const [focusedField, setFocusedField] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [isHovered, setIsHovered] = useState(false);



    const stats = [
        { icon: <Users className="w-6 h-6" />, number: "400K+", label: "Active Users" },
        { icon: <CheckCircle className="w-6 h-6" />, number: "99.9%", label: "Accuracy Rate" },
        { icon: <Zap className="w-6 h-6" />, number: "<2s", label: "Response Time" },
        { icon: <Shield className="w-6 h-6" />, number: "100%", label: "Secure" }
    ];

    const testimonials = [
        {
            quote: "Bounce Cure transformed our email campaigns with 99% accuracy.",
            author: "Sarah Chen",
            company: "TechStart Inc"
        },
        {
            quote: "The fastest and most reliable email validation service we've used.",
            author: "Michael Rodriguez",
            company: "Digital Marketing Pro"
        },
        {
            quote: "Saved us thousands in email costs with precise validation.",
            author: "Emma Thompson",
            company: "E-commerce Solutions"
        }
    ];

    const [currentTestimonial, setCurrentTestimonial] = useState(0);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <PageLayout>
            <div className="min-h-screen mt-[5%] sm:mt-0  flex flex-col md:flex-row w-full ">
                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-white rounded-full mix-blend-difference filter blur-xl opacity-3 animate-pulse"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white rounded-full mix-blend-difference filter blur-xl opacity-3 animate-pulse"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white rounded-full mix-blend-difference filter blur-xl opacity-2 animate-pulse"></div>
                </div>

                {/* Left Side */}
                <div className="flex-1 flex items-center justify-center p-6 sm:p-8 relative z-10 mt-[5%]">
                    <div className="w-full max-w-lg text-center md:text-left">
                        {/* Welcome Section */}
                        <div className="mb-8 sm:mb-12 mt-8 md:mt-0">
                            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-3xl mb-6 sm:mb-8 transform hover:scale-110 transition-transform duration-300">
                                <Mail className="w-8 h-8 sm:w-10 sm:h-10 text-[#dea923]" />
                            </div>
                            <h1 className="text-3xl sm:text-5xl font-bold text-[#c2831f] mb-3 sm:mb-4 leading-tight">
                                Welcome Back to
                                <br />
                                <span className="block mt-2">Bounce Cure</span>
                            </h1>
                            <p className="text-base sm:text-xl text-gray-300 leading-relaxed">
                                The world's most trusted email validation platform. Continue your journey with precision and reliability.
                            </p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                            {stats.map((stat, index) => (
                                <div
                                    key={index}
                                    className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 group"
                                >
                                    <div className="text-[#c2831f] group-hover:scale-110 transition-transform duration-300 mb-3">
                                        {stat.icon}
                                    </div>
                                    <div className="text-xl sm:text-2xl font-bold text-white mb-1">{stat.number}</div>
                                    <div className="text-gray-400 text-sm">{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Testimonial Carousel */}
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/10 relative overflow-hidden">
                            <div className="absolute top-4 right-4">
                                <div className="flex gap-2">
                                    {testimonials.map((_, index) => (
                                        <div
                                            key={index}
                                            className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentTestimonial ? 'bg-white' : 'bg-white/20'}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="transition-all duration-500 ease-in-out">
                                <p className="text-white text-base sm:text-lg mb-4 italic">
                                    "{testimonials[currentTestimonial].quote}"
                                </p>
                                <div className="text-gray-300">
                                    <div className="font-semibold">{testimonials[currentTestimonial].author}</div>
                                    <div className="text-sm text-gray-400">{testimonials[currentTestimonial].company}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side */}
                <div className="flex-1 flex items-center justify-center p-6 sm:p-8 relative z-10">
                    <div className="w-full max-w-md">
                        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl">
                            {/* Header */}
                            <div className="text-center mb-6 sm:mb-8">
                                <h2 className="text-2xl sm:text-3xl font-bold text-[#c2831f] mb-2">
                                    Sign In
                                </h2>
                                <p className="text-gray-300 text-sm sm:text-base">
                                    Access your email validation dashboard
                                </p>
                                <div className="w-12 sm:w-16 h-1 bg-white mx-auto mt-3 sm:mt-4 rounded-full"></div>
                            </div>

                            {/* Google Button */}
                            {/* ✅ Official Google Sign-In Button (rendered by GIS) */}
                            <div className="flex justify-center mb-6">
                                <div id="googleSignInDiv"></div>
                            </div>



                            {/* Divider */}
                            <div className="relative mb-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-600"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-black/50 text-gray-400">or sign in with email</span>
                                </div>
                            </div>

                            {/* Login Form */}
                            {/* Login Form */}
                            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                                <div className="relative group">
                                    <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${focusedField === 'email' ? 'text-white' : 'text-gray-400'}`} />
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Email Address"
                                        value={formData.email}
                                        onChange={handleChange}
                                        onFocus={() => setFocusedField('email')}
                                        onBlur={() => setFocusedField('')}
                                        className="w-full bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl py-2 sm:py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-white focus:bg-white/10 transition-all duration-300"
                                    />
                                </div>

                                <div className="relative group">
                                    <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${focusedField === 'password' ? 'text-white' : 'text-gray-400'}`} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        placeholder="Password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        onFocus={() => setFocusedField('password')}
                                        onBlur={() => setFocusedField('')}
                                        className="w-full bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl py-2 sm:py-3 pl-10 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-white focus:bg-white/10 transition-all duration-300"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-300"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>

                                {/* Remember Me & Forgot Password */}
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={rememberMe}
                                                onChange={(e) => setRememberMe(e.target.checked)}
                                                className="sr-only"
                                            />
                                            <div className={`w-5 h-5 border-2 border-white/20 rounded transition-all duration-300 ${rememberMe ? 'bg-white border-white' : 'group-hover:border-white/40'}`}>
                                                {rememberMe && (
                                                    <CheckCircle className="w-3 h-3 text-black absolute top-0.5 left-0.5" />
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-gray-300 text-sm group-hover:text-white transition-colors duration-300">
                                            Remember me
                                        </span>
                                    </label>

                                    <a href="/forgot-password" className="text-gray-400 hover:text-white text-sm transition-colors duration-300">
                                        Forgot password?
                                    </a>
                                </div>

                                {/* Sign In Button */}
                                <button
                                    type="submit"
                                    className="w-full bg-[#c2831f] text-black font-bold py-2 sm:py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-white/25 hover:bg-gray-100 flex items-center justify-center gap-2 group"
                                >
                                    <span>Sign In</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                                </button>

                            </form>

                            {/* Sign Up Link */}
                            <p className="text-center text-gray-400 mt-6 text-sm sm:text-base">
                                Don't have an account?{' '}
                                <a href="/signup" className="text-[#c2831f] hover:text-gray-300 transition-colors duration-300 underline font-medium">
                                    Create free account
                                </a>
                            </p>
                        </div>

                        {/* Security Badge */}
                        <div className="mt-6 text-center">
                            <div className="inline-flex items-center gap-2 text-gray-400 bg-white/5 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 border border-white/10 text-xs sm:text-sm">
                                <Shield className="w-4 h-4" />
                                <span>256-bit SSL secured</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
};

export default ModernLogin;
