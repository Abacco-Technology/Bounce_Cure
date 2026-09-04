// client/src/components/Contact.jsx
import React, { useState } from "react";
import {
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaTwitter,
  FaLinkedinIn,
  FaInstagram, 
  FaFacebookF,
  FaPaperPlane,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { Check } from "lucide-react"; // ✅ Add this import at the top with your other icons

const API_URL = import.meta.env.VITE_VRI_URL;

const ContactPage = () => {
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    phone: "",
    service: "general",
    message: "",
    subscribe: true,
  });

  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validate = () => {
    const temp = {};
    if (!formData.fullname.trim()) temp.fullname = "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      temp.email = "Please enter a valid email.";
    if (!formData.message.trim() || formData.message.length < 8)
      temp.message = "Message is too short (minimum 8 characters).";
    setErrors(temp);
    return Object.keys(temp).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setFeedback({ type: "", message: "" });

    try {
      // Replace with your backend URL
      const response = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setFeedback({
          type: "success",
          message: "Message sent successfully! We'll get back to you within 1 business day."
        });
        
        // Reset form
        setFormData({
          fullname: "",
          email: "",
          phone: "",
          service: "general",
          message: "",
          subscribe: false,
        });

        // Clear success message after 5 seconds
        setTimeout(() => {
          setFeedback({ type: "", message: "" });
        }, 5000);
      } else {
        setFeedback({
          type: "error",
          message: data.message || "Failed to send message. Please try again."
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setFeedback({
        type: "error",
        message: "Network error. Please check your connection and try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: FaMapMarkerAlt,
      title: "USA Office",
      content: "3524 SILVERSIDE ROAD, SUITE 35B\nWILMINGTON, DE 19810-4929",
      gradient: "",
    },
    {
      icon: FaPhone,
      title: "Call (USA)",
      content: "+1 771-220-4003",
      link: "tel:+17712204003",
      gradient: "from-purple-500 to-pink-500",
    },
    // {
    //   icon: FaMapMarkerAlt,
    //   title: "India Office",
    //   content:
    //     "3RD FLOOR, 12-4.13,12A, J.B. Kaval,\nMAJOR SANDEEP UNNIKRISHNAN ROAD,\nADITYANAGAR, VIDYARANYAPURA,\nBangalore 560097",
    //   gradient: "from-green-500 to-emerald-500",
    // },
    // {
    //   icon: FaPhone,
    //   title: "Call (India)",
    //   content: "+91 99724 52044",
    //   link: "tel:+919972452044",
    //   gradient: "from-orange-500 to-red-500",
    // },
    {
      icon: FaEnvelope,
      title: "Email",
      content: "support@bouncecure.com",
      link: "mailto:support@bouncecure.com",
      gradient: "from-indigo-500 to-purple-500",
    },
  ];

  return (
    <div className="min-h-screen bg-black  text-white relative overflow-hidden">
      <Navbar />
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(168, 85, 247, 0.4);
          }
          50% {
            box-shadow: 0 0 40px rgba(168, 85, 247, 0.8);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse 3s ease-in-out infinite;
        }

        .card-hover {
          transition: all 0.3s ease;
        }

        .card-hover:hover {
          transform: translateY(-8px);
        }

        .input-field {
          transition: all 0.3s ease;
        }

        .input-field:focus {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(168, 85, 247, 0.3);
        }

        .glassmorphism {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .success-animation {
          animation: slideInRight 0.5s ease-out;
        }

        .error-animation {
          animation: slideInRight 0.5s ease-out;
        }
      `}</style>

      {/* Animated Background Circles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gray-50 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div
          className="absolute top-40 right-10 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute -bottom-32 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16 animate-fadeInUp">
          <h1 className="text-5xl md:text-7xl font-bold text-[#c2831f] mb-6 mt-20">
            Get in Touch
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Questions, feedback or want a demo? Fill the form and we'll get back
            within 1 business day.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Contact Info Cards */}
          <div
            className="space-y-6 animate-fadeInUp"
            style={{ animationDelay: "0.2s" }}
          >
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <div
                  key={index}
                  className="glassmorphism rounded-2xl p-6 card-hover"
                  style={{ animationDelay: `${0.1 * index}s` }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`bg-[#c2831f] ${info.gradient} p-4 rounded-xl animate-pulse-slow`}
                    >
                      <Icon className="text-2xl text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {info.title}
                      </h3>
                      {info.link ? (
                        <a
                          href={info.link}
                          className="text-gray-300 hover:text-white transition-colors duration-300 text-sm"
                        >
                          {info.content}
                        </a>
                      ) : (
                        <p className="text-gray-300 text-sm whitespace-pre-line">
                          {info.content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Contact Form */}
          <div
            className="glassmorphism rounded-3xl p-8 animate-fadeInUp"
            style={{ animationDelay: "0.3s" }}
          >
            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullname"
                    value={formData.fullname}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 input-field"
                  />
                  {errors.fullname && (
                    <p className="text-red-500 text-sm mt-1">{errors.fullname}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="you@domain.com"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 input-field"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 234 567 8900"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Service
                  </label>
                  <select
                    name="service"
                    value={formData.service}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:border-purple-500 input-field"
                  >
                    <option value="general" className="bg-slate-800">
                      General inquiry
                    </option>
                    <option value="support" className="bg-slate-800">
                      Support
                    </option>
                    <option value="sales" className="bg-slate-800">
                      Sales / Demo
                    </option>
                    <option value="enterprise" className="bg-slate-800">
                      Enterprise
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Message *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  placeholder="Tell us about your request..."
                  rows="5"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 input-field resize-none"
                ></textarea>
                  {errors.message && (
                    <p className="text-red-500 text-sm mt-1">{errors.message}</p>
                  )}
              </div>

              <div className="flex items-center gap-3 relative">
                <div className="relative">
                  <input
                    type="checkbox"
                    name="subscribe"
                    id="subscribe"
                    checked={formData.subscribe}
                    onChange={handleChange}
                    className="peer appearance-none w-5 h-5 border border-[#d99c2b] rounded-md cursor-pointer 
                              transition-all duration-300 checked:bg-[#d99c2b] checked:border-[#d99c2b]"
                  />
                  <Check
                    className="absolute w-3.5 h-3.5 text-black pointer-events-none opacity-0 peer-checked:opacity-100 
                              transition-opacity duration-200 left-[3px] top-[3px]"
                  />
                </div>
                <label
                  htmlFor="subscribe"
                  className="text-gray-300 text-sm cursor-pointer select-none hover:text-[#d99c2b] transition-colors"
                >
                  Subscribe to product updates
                </label>
              </div>


              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full text-white font-semibold py-4 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 animate-glow disabled:opacity-70 disabled:cursor-not-allowed"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, #c2831f, #d99c2b)",
                }}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <FaPaperPlane />
                    Send Message
                  </>
                )}
              </button>

              {/* Feedback messages */}
              {feedback.type === "success" && (
                <div className="bg-green-500/20 border border-green-500 rounded-xl p-4 flex items-center gap-3 success-animation">
                  <FaCheckCircle className="text-green-500 text-xl flex-shrink-0" />
                  <p className="text-green-400 text-sm">{feedback.message}</p>
                </div>
              )}
              
              {feedback.type === "error" && (
                <div className="bg-red-500/20 border border-red-500 rounded-xl p-4 flex items-center gap-3 error-animation">
                  <FaExclamationTriangle className="text-red-500 text-xl flex-shrink-0" />
                  <p className="text-red-400 text-sm">{feedback.message}</p>
                </div>
              )}
            </form>
          </div>
        </div>

       
      </div>
      <Footer />
    </div>
  );
};

export default ContactPage;