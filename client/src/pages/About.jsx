import React from 'react';
import { Shield, Zap, Lock, TrendingUp, CheckCircle, Users, Star, Mail, ArrowRight, Globe, Target, Award, Sparkles, BarChart3, Clock, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageLayout from '../components/PageLayout';

export default function About() {
  return (
    <PageLayout>
      <div>

        <div className=" text-white font-sans min-h-screen overflow-hidden">

          {/* Hero Section */}
          <section className="text-center px-4 sm:px-6 lg:px-8 relative flex flex-col justify-start pt-16 sm:pt-12 lg:pt-8 pb-12 overflow-hidden">
            {/* Animated Background Elements */}
           
            {/* Floating Particles */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1  rounded-full opacity-30"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`,
                    animation: `float ${3 + Math.random() * 2}s ease-in-out infinite alternate`
                  }}
                />
              ))}
            </div>

            <div className="relative z-10 mt-8 sm:mt-6 lg:mt-4">
              <h1 className="text-4xl sm:text-6xl lg:text-6xl font-bold mb-6 text-[#c2831f] animate-fade-in">
                Empowering Email Verification
              </h1>

              <p className="text-gray-300 max-w-3xl mx-auto mb-6 text-base sm:text-lg lg:text-xl leading-relaxed px-2">
                Reach real people, reduce bounces, and protect your sender reputation with our cutting-edge verification technology.
              </p>
              <Link
                to="/get-started"
                className="group inline-flex items-center bg-black text-[#c2831f] px-6 sm:px-8 py-3 sm:py-4 rounded-full font-medium hover:bg-black hover:text-white border-2 border-white transition-all duration-300 hover:scale-105 hover:shadow-2xl mb-8 lg:mb-0"
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
              </Link>
            </div>
          </section>



          {/* Stats Section */}
          <section>
            <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { number: "99.9%", label: "Accuracy Rate", icon: <Target className="w-8 h-8 mx-auto mb-2 text-[#c2831f]" /> },
                { number: "10M+", label: "Emails Verified", icon: <Mail className="w-8 h-8 mx-auto mb-2 text-[#c2831f]" /> },
                { number: "50K+", label: "Happy Customers", icon: <Users className="w-8 h-8 mx-auto mb-2 text-[#c2831f]" /> },
                { number: "<100s", label: "Response Time", icon: <Clock className="w-8 h-8 mx-auto mb-2 text-[#c2831f]" /> }
              ].map((stat, i) => (
                <div key={i} className="group hover:scale-110 transition-all duration-300 cursor-pointer">
                  <div className="bg-[#c2831f]/5  rounded-xl p-6 border border-[#c2831f]/40 hover:border-white/30 hover:bg-[#c2831f]/10 transition-all duration-300">
                    {stat.icon}
                    <div className="text-3xl font-bold mb-2 group-hover:text-white transition-colors duration-300">{stat.number}</div>
                    <div className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Timeline / Milestones */}
          <section className="max-w-5xl mx-auto px-4 py-16 space-y-12">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Our Journey</h2>
              <p className="text-gray-400 text-lg">Building the future of email verification</p>
            </div>

            {[
              {
                icon: <Shield className="w-6 h-6 text-[#c2831f]" />,
                title: "Founded in 2023",
                desc: "Solving real issues for real marketers with innovative solutions.",
                image: "/AboutFeatures/Foundedin.png"
              },
              {
                icon: <Zap className="w-6 h-6 text-[#c2831f]" />,
                title: "Lightning-Fast API",
                desc: "Verify thousands of emails in milliseconds with our advanced infrastructure.",
                image: "/AboutFeatures/LightningAPI.png"
              },
              {
                icon: <Lock className="w-6 h-6 text-[#c2831f]" />,
                title: "Security First",
                desc: "Built for compliance and privacy by default, protecting your data.",
                image: "/AboutFeatures/Security.png"
              }
            ].map((item, i) => (
              <div key={i} className="group">
                <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8 hover:scale-[1.02] transition-all duration-500">

                  {/* Image */}
                  <div className="md:w-1/2 flex justify-center">
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.title}
                      className="w-[150px] h-[150px] rounded-xl object-contain transition-all duration-500 hover:scale-105"
                    />
                  </div>

                  {/* Text + Icon */}
                  <div className="md:w-1/2">
                    <div className="flex items-start space-x-5">
                      <div className="w-12 h-12 bg-white/10 rounded-full flex justify-center items-center group-hover:bg-white group-hover:text-[#c2831f] transition-all duration-300">
                        {item.icon}
                      </div>
                      <div>
                        <h3 className="text-3xl font-semibold mb-3 group-hover:text-white transition-colors duration-300">
                          {item.title}
                        </h3>
                        <p className="text-gray-400 text-lg leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </section>


          {/* Core Values - Updated to match dark theme */}
          <section>

            <div className="relative z-10">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-4 text-white">Our Core Values</h2>
                <p className="text-gray-400 text-lg">The principles that drive everything we do</p>
              </div>

              <div className="max-w-6xl mx-auto grid gap-10 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                {[
                  {
                    icon: <TrendingUp className="w-10 h-10 text-[#c2831f]" />,
                    title: "Growth",
                    desc: "Fuel your campaigns with verified contacts and watch your business soar.",
                    image: "/AboutFeatures/Rename.png?height=150&width=200&text=Growth+Chart"
                  },
                  {
                    icon: <Users className="w-10 h-10 text-[#c2831f]" />,
                    title: "Trust",
                    desc: "We earn it every time you send an email, building lasting relationships.",
                    image: "/AboutFeatures/Trust.png?height=150&width=200&text=Trust+Network"
                  },
                  {
                    icon: <CheckCircle className="w-10 h-10 text-[#c2831f]" />,
                    title: "Accuracy",
                    desc: "Every result. Every time. No compromise on quality or precision.",
                    image: "/AboutFeatures/Accuracy.png?height=150&width=200&text=Accuracy+Target"
                  }
                ].map((val, i) => (
                  <div key={i} className="group bg-white/5 border-2 border-white/10 rounded-2xl p-8 hover:shadow-2xl hover:scale-[1.05] hover:border-white/30 hover:bg-white/10 transition-all duration-500 cursor-pointer">
                    <div className="mb-4">
                      <img
                        src={val.image || "/placeholder.svg"}
                        alt={val.title}
                        className="w-full h-32 object-cover rounded-lg mb-4 group-hover:scale-110 transition-transform duration-500 border border-white/20"
                      />
                    </div>
                    <div className="mb-4 flex justify-center group-hover:scale-110 transition-transform duration-300">
                      {val.icon}
                    </div>
                    <h4 className="font-bold text-2xl mb-3 text-white group-hover:text-white transition-colors duration-300">{val.title}</h4>
                    <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300 leading-relaxed">{val.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Technology Section */}
          <section className="py-18 px-4 ">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-4">Cutting-Edge Technology</h2>
                <p className="text-gray-400 text-lg">Powered by advanced algorithms and machine learning</p>
              </div>

              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <img
                    src="/AboutFeatures/Tech.png?height=600&width=700&text=AI+Technology+Dashboard"
                    alt="Technology Dashboard"
                    className="w-full border-white/20 hover:border-white/40 transition-all duration-500 hover:scale-105"
                  />
                </div>
                <div className="space-y-6">
                  {[
                    {
                      icon: <Database className="w-6 h-6 text-[#c2831f]" />,
                      title: "Real-time Processing",
                      desc: "Process millions of emails instantly with our distributed architecture."
                    },
                    {
                      icon: <BarChart3 className="w-6 h-6 text-[#c2831f]" />,
                      title: "Machine Learning",
                      desc: "AI-powered algorithms that learn and improve with every verification."
                    },
                    {
                      icon: <Globe className="w-6 h-6 text-[#c2831f]" />,
                      title: "Global Infrastructure",
                      desc: "Worldwide network ensuring fast response times from anywhere."
                    }
                  ].map((tech, i) => (
                    <div key={i} className="group flex items-start space-x-4 p-4 rounded-lg hover:bg-white/5 transition-all duration-300">
                      <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-300">
                        {tech.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2 group-hover:text-white transition-colors duration-300">{tech.title}</h3>
                        <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">{tech.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Why Choose Us */}
          <section className="py-16 px-4 text-center">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-5xl font-bold mb-4">Why Choose Us?</h2>
              <p className="text-gray-400 mb-16 text-xl">Experience the difference with our premium features</p>

              <div className="grid gap-8 grid-cols-1 md:grid-cols-3 mb-16">
                {[
                  {
                    icon: <Star className="w-10 h-10 text-[#c2831f]" />,
                    title: "5-Star Accuracy",
                    desc: "Trusted results backed by powerful algorithms and real-time validation.",

                  },
                  {
                    icon: <Mail className="w-10 h-10 text-[#c2831f]" />,
                    title: "Inbox Ready",
                    desc: "Protect your sender score and reduce spam flags with verified contacts.",

                  },
                  {
                    icon: <Zap className="w-10 h-10 text-[#c2831f]" />,
                    title: "Blazing Speed",
                    desc: "Results returned in milliseconds via our optimized API infrastructure.",

                  }
                ].map((item, i) => (
                  <div key={i} className="group p-8 border border-[#c2831f]/50 rounded-2xl hover:bg-black hover:text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer">
                    <div className="mb-6">

                    </div>
                    <div className="mb-4 flex justify-center group-hover:scale-110 transition-transform duration-300">
                      {item.icon}
                    </div>
                    <h3 className="text-2xl font-semibold mt-4 mb-3 group-hover:text-white transition-colors duration-300">{item.title}</h3>
                    <p className="text-gray-400 group-hover:text-gray-700 transition-colors duration-300 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>

              {/* Feature Showcase */}
              <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="text-left">
                    <h3 className="text-3xl font-bold mb-4">Advanced Analytics Dashboard</h3>
                    <p className="text-gray-400 mb-6 text-lg">
                      Get detailed insights into your email verification results with our comprehensive analytics platform.
                    </p>
                    <ul className="space-y-3 text-gray-300">
                      <li className="flex items-center">
                        <CheckCircle className="w-5 h-5 mr-3 text-[#c2831f]" />
                        Real-time verification status
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-5 h-5 mr-3 text-[#c2831f]" />
                        Detailed bounce analysis
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-5 h-5 mr-3 text-[#c2831f]" />
                        Campaign performance metrics
                      </li>
                    </ul>
                  </div>
                  <div>
                    <img
                      src="/AboutFeatures/Dashboard.png?height=300&width=400&text=Analytics+Dashboard"
                      alt="Analytics Dashboard"
                      className="w-full  border-white/20 hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Final CTA - Updated to match dark theme */}
          <section className="text-center py-17 px-4 relative overflow-hidden">

            <div className="relative z-10">
              <div className="mb-8">
                <Sparkles className="w-16 h-16 mx-auto mb-4 animate-pulse text-[#c2831f]" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Ready to clean your email list?</h2>
              <p className="text-gray-400 mb-8 text-xl max-w-2xl mx-auto">
                Start verifying now with our free trial and experience the difference quality makes.
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
