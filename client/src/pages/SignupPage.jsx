// client/src/pages/SignupPage.jsx
import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, CheckCircle, Shield, Zap, Globe, Clock, Phone } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";

const API_URL = import.meta.env.VITE_VRI_URL;

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const ModernSignup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: ''
    });

    const [focusedField, setFocusedField] = useState('');
    const [isHovered, setIsHovered] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    // ✅ Load Google SDK on mount
    useEffect(() => {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => {
            console.log("✅ Google SDK loaded");

            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: handleGoogleCredential,
            });

            window.google.accounts.id.renderButton(
                document.getElementById("googleSignupButton"),
                { theme: "outline", size: "large", text: "continue_with", width: "300" }
            );
        };

        document.body.appendChild(script);
    }, []);


    // ✅ Handle Google credential response
    const handleGoogleCredential = async (response) => {
        try {
            console.log("🟢 handleGoogleCredential called:", response);
            const idToken = response.credential;
            if (!idToken) return toast.error("Failed to get Google token");

            const res = await fetch(`${API_URL}/api/auth/google`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
            });

            const data = await res.json();
            console.log("Backend response:", data);

            if (res.ok) {
                toast.success("Google signup successful 🎉");
                localStorage.setItem("token", data.token);
                navigate("/dashboard");
            } else {
                toast.error(data.message || "Google signup failed ❌");
            }
        } catch (err) {
            console.error("Google signup error:", err);
            toast.error("Something went wrong with Google signup!");
        }
    };

    // ✅ Trigger Google popup
    const handleGoogleSignupClick = () => {
        if (window.google && window.google.accounts && window.google.accounts.id) {
            // ✅ Render the actual Google button flow, not just the prompt
            window.google.accounts.id.renderButton(
                document.getElementById("googleSignupButton"), // hidden div we'll render into
                {
                    theme: "outline",
                    size: "large",
                    text: "continue_with",
                    shape: "rectangular",
                    width: 320,
                }
            );
            // Immediately trigger One Tap
            window.google.accounts.id.prompt();
        } else {
            toast.error("Google SDK not loaded yet");
        }
    };



    // Handle input change
    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            console.log('Server response:', res.status, data);

            if (res.ok) {
                toast.success("Signup successful! 🎉 Please check your email for verification.");

                // Optional: auto-login the user
                // const loginRes = await fetch(`${API_URL}/auth/login`, {
                //     method: "POST",
                //     headers: { "Content-Type": "application/json" },
                //     body: JSON.stringify({ email: formData.email, password: formData.password })
                // });
                // const loginData = await loginRes.json();
                // if (loginRes.ok) {
                //     localStorage.setItem("token", loginData.token);
                //     navigate("/dashboard");
                //     return;
                // }

                navigate("/login"); // Redirect to login page
            } else {
                toast.error(data.message || "Signup failed ❌");
            }

        } catch (err) {
            console.error('Error submitting form:', err);
            toast.error("Something went wrong!");
        }
    };

    // Benefits for display
    const benefits = [
        { icon: <CheckCircle className="w-5 h-5" />, text: "100 free credits every month" },
        { icon: <Mail className="w-5 h-5" />, text: "Email Provider Integrations" },
        { icon: <Zap className="w-5 h-5" />, text: "Real-Time Results" },
        { icon: <Globe className="w-5 h-5" />, text: "Full API Access with Sandbox" },
        { icon: <Phone className="w-5 h-5" />, text: "24/7 support by phone, email & chat" },
        { icon: <Shield className="w-5 h-5" />, text: "Access to our Deliverability Toolkit" }
    ];

    const companies = [
        { name: "Amazon" },
        { name: "Netflix" },
        { name: "Disney" },
        { name: "HubSpot" }
    ];

    return (
        <PageLayout>
            <div className="min-h-screen mt-[2%] flex flex-col md:flex-row w-full">
                {/* Background effects */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-white rounded-full mix-blend-difference filter blur-xl opacity-5 animate-pulse hidden sm:block"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white rounded-full mix-blend-difference filter blur-xl opacity-5 animate-pulse hidden sm:block"></div>
                    <div className="absolute top-40 left-40 w-60 h-60 bg-white rounded-full mix-blend-difference filter blur-xl opacity-5 animate-pulse hidden sm:block"></div>
                </div>

                {/* Signup form */}
                <div className="flex-1 flex items-center justify-center p-6 sm:p-8 relative z-10">
                    <div className="w-full max-w-md md:max-w-lg">
                        <div className="text-center mt-20 mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-6 transform hover:scale-110 transition-transform duration-300">
                                <Mail className="w-8 h-8 text-[#c2831f] " />
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-[#c2831f] mb-2">Bounce Cure</h1>
                            <p className="text-gray-400 text-base sm:text-lg">Create your free account in seconds</p>
                            <div className="w-20 h-1 bg-white mx-auto mt-4 rounded-full"></div>
                        </div>

                        {/* Google signup button */}
                        <div id="googleSignupButton" className="flex justify-center mt-4"></div>



                        {/* Divider */}
                        <div className="relative mb-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-600"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-black text-gray-400">or continue with email</span>
                            </div>
                        </div>

                        {/* Signup form */}
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="relative group">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white" />
                                    <input
                                        type="text"
                                        name="firstName"
                                        placeholder="First Name"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        className="w-full bg-white/5 border border-white/20 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-white focus:bg-white/10 transition-all duration-300"
                                    />
                                </div>
                                <div className="relative group">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        name="lastName"
                                        placeholder="Last Name"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        className="w-full bg-white/5 border border-white/20 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-white focus:bg-white/10 transition-all duration-300"
                                    />
                                </div>
                            </div>

                            <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Email Address"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full bg-white/5 border border-white/20 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-white focus:bg-white/10 transition-all duration-300"
                                />
                            </div>

                        <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="Create Password"
                                value={formData.password}
                                onChange={handleInputChange}
                                className="w-full bg-white/5 border border-white/20 rounded-xl py-3 pl-10 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-white focus:bg-white/10 transition-all duration-300"
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>


                            <button
                                type="submit"
                                className="w-full bg-[#c2831f] text-black font-bold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-1xl hover:shadow-white/25 hover:bg-[#c2831f] cursor-pointer"
                            >
                                Create Free Account
                            </button>
                        </form>

                        <p className="text-center text-gray-400 mt-6">
                            Already have an account?{' '}
                            <a href="/login" className="text-white hover:text-gray-300 transition-colors duration-300 underline">
                                Sign in here
                            </a>
                        </p>
                    </div>
                </div>

                {/* Right side benefits panel */}
                <div className="flex-1 flex items-center justify-center p-6 sm:p-8 relative z-10">
                    <div className="w-full max-w-lg">
                        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl">
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-4 border border-white/20">
                                    <Shield className="w-5 h-5 text-[#c2831f]" />
                                    <span className="text-[#c2831f] font-medium text-sm sm:text-base">Premium Business Account</span>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold text-[#c2831f] mb-2">Unlock Premium Features</h3>
                                <p className="text-gray-300 text-sm sm:text-base">Get everything you need to validate emails at scale</p>
                            </div>

                            <div className="space-y-4 mb-8">
                                {benefits.map((benefit, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-3 text-white hover:bg-white/5 p-3 rounded-xl transition-all duration-300 group border border-transparent hover:border-white/10"
                                        style={{ animationDelay: `${index * 100}ms` }}
                                    >
                                        <div className="text-white group-hover:scale-110 transition-transform duration-300">{benefit.icon}</div>
                                        <span className="group-hover:translate-x-1 transition-transform duration-300 text-sm sm:text-base">{benefit.text}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-white/10 pt-6">
                                <p className="text-white font-semibold mb-4 text-center text-sm sm:text-base">
                                    Trusted by 400,000+ clients worldwide
                                </p>
                                <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6">
                                    {companies.map((company, index) => (
                                        <div
                                            key={index}
                                            className="font-bold text-base sm:text-lg text-gray-300 hover:text-white hover:scale-110 transition-all duration-300 cursor-default"
                                        >
                                            {company.name}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-6 text-center">
                                <div className="inline-flex items-center gap-2 text-gray-400 bg-white/5 rounded-full px-4 py-2 border border-white/10 text-xs sm:text-sm">
                                    <Clock className="w-4 h-4" />
                                    <span>Setup takes less than 2 minutes</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
};

export default ModernSignup;
