import React, { useState } from 'react';
import { Mail, ArrowRight, Shield, Clock, CheckCircle, ArrowLeft, RefreshCw, Lock } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_VRI_URL; 

const ModernForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [step, setStep] = useState('request');
    const [focusedField, setFocusedField] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateEmail(email)) {
            setError("Please enter a valid email address");
            toast.error("Please enter a valid email address");
            return;
        }
        
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (res.ok) {
                setStep('sent');
                toast.success("If your email is registered, you will receive a reset link shortly.");
            } else {
                setError(data.message || 'Something went wrong.');
                toast.error(data.message || 'Something went wrong.');
            }
        } catch (err) {
            console.error("Request error:", err);
            setError('Server error. Please try again later.');
            toast.error('Server error. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Reset link resent. Please check your inbox.");
            } else {
                setError(data.message || 'Something went wrong.');
                toast.error(data.message || 'Something went wrong.');
            }
        } catch (err) {
            console.error("Resend error:", err);
            setError('Server error. Please try again later.');
            toast.error('Server error. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const securityFeatures = [
        { icon: <Shield className="w-5 h-5" />, text: "Secure password reset link" },
        { icon: <Clock className="w-5 h-5" />, text: "Link expires in 1 hour for security" },
        { icon: <Lock className="w-5 h-5" />, text: "256-bit SSL encryption" },
        { icon: <CheckCircle className="w-5 h-5" />, text: "Account verification required" }
    ];

    const steps = [
        { step: 1, title: "Enter Email", status: step === 'request' ? 'current' : 'completed' },
        { step: 2, title: "Check Inbox", status: step === 'sent' ? 'current' : step === 'request' ? 'upcoming' : 'completed' },
        { step: 3, title: "Reset Password", status: 'upcoming' }
    ];

    return (
        <PageLayout>
            <div className="min-h-screen bg-black flex flex-col md:flex-row w-full">
                {/* Background Effects */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-white rounded-full mix-blend-difference filter blur-xl opacity-30 animate-pulse"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white rounded-full mix-blend-difference filter blur-xl opacity-30 animate-pulse"></div>
                    <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-white rounded-full mix-blend-difference filter blur-xl opacity-20 animate-pulse"></div>
                </div>

                {/* Left Side */}
                <div className="flex-1 flex items-center justify-center p-6 sm:p-8 relative z-10">
                    <div className="w-full max-w-lg text-center md:text-left">
                        {/* Header */}
                        <div className="mb-8 sm:mb-12">
                            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-3xl mb-6 sm:mb-8 transform hover:scale-110 transition-transform duration-300">
                                <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-black" />
                            </div>
                            <h1 className="text-3xl sm:text-5xl font-bold text-white mb-3 sm:mb-4 leading-tight">
                                Password <br />
                                <span className="block mt-1 sm:mt-2">Recovery</span>
                            </h1>
                            <p className="text-base sm:text-xl text-gray-300 leading-relaxed">
                                Secure account recovery made simple. We'll help you regain access to your Bounce Cure dashboard safely.
                            </p>
                        </div>

                        {/* Steps */}
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/10 mb-6 sm:mb-8">
                            <h3 className="text-white font-semibold mb-4 sm:mb-6 text-base sm:text-lg">Recovery Process</h3>
                            <div className="space-y-3 sm:space-y-4">
                                {steps.map((stepItem, index) => (
                                    <div key={index} className="flex items-center gap-3 sm:gap-4">
                                        <div
                                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-300
                                            ${stepItem.status === 'completed'
                                                    ? 'bg-white text-black'
                                                    : stepItem.status === 'current'
                                                        ? 'bg-white/20 text-white border-2 border-white'
                                                        : 'bg-white/10 text-gray-400 border border-white/20'}`}>
                                            {stepItem.status === 'completed'
                                                ? <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                                : stepItem.step}
                                        </div>
                                        <div
                                            className={`transition-colors duration-300 text-sm sm:text-base
                                            ${stepItem.status === 'current'
                                                    ? 'text-white font-medium'
                                                    : stepItem.status === 'completed'
                                                        ? 'text-gray-300'
                                                        : 'text-gray-500'}`}>
                                            {stepItem.title}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Security Features */}
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/10">
                            <h3 className="text-white font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                                <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                                Security First
                            </h3>
                            <div className="space-y-2 sm:space-y-3">
                                {securityFeatures.map((feature, index) => (
                                    <div key={index} className="flex items-center gap-2 sm:gap-3 text-gray-300 hover:text-white transition-colors duration-300">
                                        <div className="text-white">{feature.icon}</div>
                                        <span className="text-xs sm:text-sm">{feature.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side (Form) */}
                <div className="flex-1 flex items-center justify-center p-6 sm:p-8 relative z-10">
                    <div className="w-full max-w-md">
                        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl">
                            {step === 'request' ? (
                                <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                                    <div className="text-center mb-6 sm:mb-8">
                                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
                                            Reset Password
                                        </h2>
                                        <p className="text-gray-300 text-sm sm:text-base">
                                            Enter your email to receive a reset link
                                        </p>
                                    </div>

                                    <div className="relative group">
                                        <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 ${focusedField === 'email' ? 'text-white' : 'text-gray-400'}`} />
                                        <input
                                            type="email"
                                            placeholder="Enter your email address"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                setError('');
                                            }}
                                            onFocus={() => setFocusedField('email')}
                                            onBlur={() => setFocusedField('')}
                                            className="w-full bg-white/5 border border-white/20 rounded-xl py-2.5 pl-9 sm:pl-10 pr-4 text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:border-white focus:bg-white/10 transition-all"
                                            required
                                        />
                                    </div>

                                    {error && (
                                        <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-lg">
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={!email || isLoading}
                                        className="w-full bg-white text-black font-bold py-2.5 sm:py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                Send Reset Link
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            ) : (
                                <div className="text-center">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                                        <CheckCircle className="w-8 h-8 text-green-400" />
                                    </div>
                                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Check Your Email</h2>
                                    <p className="text-gray-300 mb-6">
                                        We've sent a password reset link to <span className="text-white font-semibold">{email}</span>
                                    </p>
                                    
                                    {error && (
                                        <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-lg mb-4">
                                            {error}
                                        </div>
                                    )}
                                    
                                    <button
                                        onClick={handleResend}
                                        disabled={isLoading}
                                        className="w-full bg-white/10 rounded-xl py-2.5 px-4 text-white font-medium flex items-center justify-center gap-2 hover:bg-white/20 transition-all disabled:opacity-50"
                                    >
                                        {isLoading ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                Resending...
                                            </>
                                        ) : (
                                            <>
                                                <RefreshCw className="w-4 h-4" />
                                                Resend Email
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            <div className="mt-6 text-center">
                                <a href="/login" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                                    <ArrowLeft className="w-4 h-4" /> Back to Sign In
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
};

export default ModernForgotPassword;