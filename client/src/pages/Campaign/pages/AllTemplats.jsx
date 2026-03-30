import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, Star, Eye, Heart, Mail, Megaphone, Share2, Calendar, 
  Rocket, Users, Award, TrendingUp, Gift, FileText, Briefcase,
  ImageIcon, Monitor, Presentation, PartyPopper, ShoppingBag, Filter,
  Grid, List, X, Trash2, Pencil, Check
} from "lucide-react";
const API_URL = import.meta.env.VITE_VRI_URL;

const templates = [
  {
    id: 1,
    name: "Professional Welcome Email",
    category: "Email",
    preview: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=300&fit=crop",
    rating: 4.8,
    likes: 324,
    icon: Mail,
    description: "Warm welcome email template for new customers and subscribers",
    tags: ["welcome", "onboarding", "professional"],
    content: [
      {
        type: "text",
        value: "Welcome to Our Community!",
        style: { 
          fontSize: 36, 
          color: "#2563eb", 
          fontWeight: "700", 
          textAlign: "center",
          marginBottom: "20px"
        },
      },
      {
        type: "paragraph",
        value: "We're excited to have you join thousands of satisfied customers who trust us with their business needs. Your journey starts here, and we're committed to providing you with exceptional service every step of the way.",
        style: { 
          fontSize: 18, 
          color: "#374151", 
          textAlign: "center",
          lineHeight: "1.6",
          marginBottom: "30px"
        },
      },
      {
        type: "image",
        value: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=300&fit=crop",
        style: {
          borderRadius: "12px",
          marginBottom: "30px"
        }
      },
      {
        type: "paragraph",
        value: "Here's what you can expect: 24/7 customer support, exclusive member benefits, and access to our premium resources. If you have any questions, our team is always ready to help.",
        style: { 
          fontSize: 16, 
          color: "#6b7280", 
          textAlign: "center",
          lineHeight: "1.5",
          marginBottom: "25px"
        },
      },
      {
        type: "button",
        value: "Get Started Now",
        style: {
          backgroundColor: "#2563eb",
          color: "#ffffff",
          padding: "16px 32px",
          borderRadius: "8px",
          fontSize: "16px",
          fontWeight: "600"
        },
      },
    ],
  },
  {
    id: 2,
    name: "Summer Sale Landing Page",
    category: "Landing Page",
    preview: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop",
    rating: 4.9,
    likes: 567,
    icon: ShoppingBag,
    description: "High-converting summer sale landing page with bold CTAs",
    tags: ["sale", "promotion", "ecommerce"],
    content: [
      {
        type: "text",
        value: "Summer Sale Extravaganza",
        style: { 
          fontSize: 42, 
          color: "#dc2626", 
          fontWeight: "800", 
          textAlign: "center",
          marginBottom: "15px"
        },
      },
      {
        type: "text",
        value: "Up to 70% OFF Everything!",
        style: { 
          fontSize: 28, 
          color: "#f59e0b", 
          fontWeight: "700", 
          textAlign: "center",
          marginBottom: "25px"
        },
      },
      {
        type: "image",
        value: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=350&fit=crop",
        style: {
          borderRadius: "12px",
          marginBottom: "25px"
        }
      },
      {
        type: "paragraph",
        value: "Don't miss out on the hottest deals of the season! Limited time offer with free shipping on all orders over $50. Shop your favorite brands at unbeatable prices.",
        style: { 
          fontSize: 18, 
          color: "#374151", 
          textAlign: "center",
          lineHeight: "1.6",
          marginBottom: "30px"
        },
      },
      {
        type: "button",
        value: "Shop Now - Limited Time",
        style: {
          backgroundColor: "#dc2626",
          color: "#ffffff",
          padding: "18px 36px",
          borderRadius: "8px",
          fontSize: "18px",
          fontWeight: "700"
        },
      },
    ],
  },
  {
    id: 3,
    name: "Product Launch Newsletter",
    category: "Email",
    preview: "https://images.unsplash.com/photo-1593642532973-d31b6557fa68?w=600&h=400&fit=crop",
    rating: 4.7,
    likes: 445,
    icon: Rocket,
    description: "Exciting product launch announcement newsletter template",
    tags: ["launch", "product", "newsletter"],
    content: [
      {
        type: "text",
        value: "Revolutionary Product Launch",
        style: { 
          fontSize: 34, 
          color: "#059669", 
          fontWeight: "800", 
          textAlign: "center",
          marginBottom: "20px"
        },
      },
      {
        type: "image",
        value: "https://images.unsplash.com/photo-1593642532973-d31b6557fa68?w=600&h=300&fit=crop",
        style: {
          borderRadius: "10px",
          marginBottom: "25px"
        }
      },
      {
        type: "paragraph",
        value: "After months of intensive development, we're thrilled to introduce our game-changing innovation that will transform your workflow forever. This isn't just another product - it's the future.",
        style: { 
          fontSize: 16, 
          color: "#4b5563", 
          textAlign: "center",
          lineHeight: "1.6",
          marginBottom: "25px"
        },
      },
      {
        type: "button",
        value: "Pre-Order Now - 40% Off",
        style: {
          backgroundColor: "#059669",
          color: "#ffffff",
          padding: "16px 32px",
          borderRadius: "8px",
          fontWeight: "600"
        },
      },
    ],
  },
  {
    id: 4,
    name: "Instagram Story Promo",
    category: "Social",
    preview: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=600&h=400&fit=crop",
    rating: 4.6,
    likes: 389,
    icon: Share2,
    description: "Eye-catching Instagram story template for promotions",
    tags: ["instagram", "story", "social media"],
    content: [
      {
        type: "text",
        value: "FLASH SALE",
        style: { 
          fontSize: 48, 
          color: "#ec4899", 
          fontWeight: "900", 
          textAlign: "center",
          marginBottom: "15px"
        },
      },
      {
        type: "text",
        value: "24 Hours Only!",
        style: { 
          fontSize: 24, 
          color: "#1f2937", 
          fontWeight: "600", 
          textAlign: "center",
          marginBottom: "20px"
        },
      },
      {
        type: "image",
        value: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=600&h=400&fit=crop",
        style: {
          borderRadius: "15px",
          marginBottom: "20px"
        }
      },
      {
        type: "paragraph",
        value: "Swipe up now for exclusive deals you won't find anywhere else! Don't wait - these prices disappear at midnight!",
        style: { 
          fontSize: 16, 
          color: "#374151", 
          textAlign: "center",
          fontWeight: "500",
          marginBottom: "20px"
        },
      },
    ],
  },
  {
    id: 5,
    name: "Corporate Event Invitation",
    category: "Event",
    preview: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&h=400&fit=crop",
    rating: 4.8,
    likes: 298,
    icon: Calendar,
    description: "Elegant corporate event invitation template",
    tags: ["corporate", "event", "invitation"],
    content: [
      {
        type: "text",
        value: "You're Cordially Invited",
        style: { 
          fontSize: 32, 
          color: "#7c3aed", 
          fontWeight: "700", 
          textAlign: "center",
          marginBottom: "20px"
        },
      },
      {
        type: "text",
        value: "Annual Business Summit 2025",
        style: { 
          fontSize: 26, 
          color: "#111827", 
          fontWeight: "600", 
          textAlign: "center",
          marginBottom: "25px"
        },
      },
      {
        type: "image",
        value: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&h=300&fit=crop",
        style: {
          borderRadius: "10px",
          marginBottom: "25px"
        }
      },
      {
        type: "paragraph",
        value: "Join industry leaders, entrepreneurs, and innovators for two days of insightful presentations, networking opportunities, and collaborative workshops. March 15-16, 2025 at Grand Convention Center.",
        style: { 
          fontSize: 16, 
          color: "#374151", 
          textAlign: "center",
          lineHeight: "1.6",
          marginBottom: "25px"
        },
      },
      {
        type: "button",
        value: "RSVP Now - Limited Seats",
        style: {
          backgroundColor: "#7c3aed",
          color: "#ffffff",
          padding: "16px 32px",
          borderRadius: "8px",
          fontWeight: "600"
        },
      },
    ],
  },
  {
    id: 6,
    name: "Team Achievement Poster",
    category: "Poster",
    preview: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop",
    rating: 4.7,
    likes: 234,
    icon: Award,
    description: "Celebrate team achievements with this motivational poster",
    tags: ["team", "achievement", "celebration"],
    content: [
      {
        type: "text",
        value: "TEAM EXCELLENCE AWARD",
        style: { 
          fontSize: 40, 
          color: "#1f2937", 
          fontWeight: "800", 
          textAlign: "center",
          marginBottom: "20px"
        },
      },
      {
        type: "image",
        value: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=300&fit=crop",
        style: {
          borderRadius: "12px",
          marginBottom: "25px"
        }
      },
      {
        type: "paragraph",
        value: "Congratulations on exceeding all quarterly targets and setting new standards of excellence in our industry! Your dedication and teamwork have made this achievement possible.",
        style: { 
          fontSize: 18, 
          color: "#374151", 
          textAlign: "center",
          lineHeight: "1.6",
          marginBottom: "25px"
        },
      },
    ],
  },
  {
    id: 7,
    name: "Holiday Marketing Email",
    category: "Email",
    preview: "https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=600&h=400&fit=crop",
    rating: 4.9,
    likes: 456,
    icon: Gift,
    description: "Festive holiday marketing email with seasonal offers",
    tags: ["holiday", "christmas", "marketing"],
    content: [
      {
        type: "text",
        value: "Holiday Wishes & Special Offers",
        style: { 
          fontSize: 34, 
          color: "#dc2626", 
          fontWeight: "700", 
          textAlign: "center",
          marginBottom: "20px"
        },
      },
      {
        type: "image",
        value: "https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=600&h=300&fit=crop",
        style: {
          borderRadius: "12px",
          marginBottom: "25px"
        }
      },
      {
        type: "paragraph",
        value: "Spread joy this holiday season with up to 50% off on all gift items. Free shipping included on orders over $75! Perfect gifts for everyone on your list.",
        style: { 
          fontSize: 16, 
          color: "#374151", 
          textAlign: "center",
          lineHeight: "1.6",
          marginBottom: "25px"
        },
      },
      {
        type: "button",
        value: "Shop Holiday Deals",
        style: {
          backgroundColor: "#dc2626",
          color: "#ffffff",
          padding: "16px 32px",
          borderRadius: "8px",
          fontWeight: "600"
        },
      },
    ],
  },
  {
    id: 8,
    name: "Webinar Registration Page",
    category: "Landing Page",
    preview: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&h=400&fit=crop",
    rating: 4.6,
    likes: 267,
    icon: Monitor,
    description: "Professional webinar registration landing page",
    tags: ["webinar", "registration", "education"],
    content: [
      {
        type: "text",
        value: "Free Webinar: Digital Marketing Mastery",
        style: { 
          fontSize: 30, 
          color: "#1e40af", 
          fontWeight: "700", 
          textAlign: "center",
          marginBottom: "20px"
        },
      },
      {
        type: "image",
        value: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&h=300&fit=crop",
        style: {
          borderRadius: "10px",
          marginBottom: "25px"
        }
      },
      {
        type: "paragraph",
        value: "Learn cutting-edge strategies from industry experts. Join marketing professionals Sarah Johnson and Michael Chen as they reveal the secrets to successful digital campaigns. September 15, 2025 at 2:00 PM EST. Limited seats available!",
        style: { 
          fontSize: 16, 
          color: "#4b5563", 
          textAlign: "center",
          lineHeight: "1.6",
          marginBottom: "25px"
        },
      },
      {
        type: "button",
        value: "Register Free Now",
        style: {
          backgroundColor: "#1e40af",
          color: "#ffffff",
          padding: "16px 32px",
          borderRadius: "8px",
          fontWeight: "600"
        },
      },
    ],
  },
  {
    id: 9,
    name: "Customer Testimonial Social Post",
    category: "Social",
    preview: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&h=400&fit=crop",
    rating: 4.8,
    likes: 378,
    icon: Users,
    description: "Social media post template featuring customer testimonials",
    tags: ["testimonial", "customer", "review"],
    content: [
      {
        type: "text",
        value: "What Our Customers Say",
        style: { 
          fontSize: 28, 
          color: "#0f172a", 
          fontWeight: "700", 
          textAlign: "center",
          marginBottom: "20px"
        },
      },
      {
        type: "image",
        value: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&h=300&fit=crop",
        style: {
          borderRadius: "12px",
          marginBottom: "25px"
        }
      },
      {
        type: "paragraph",
        value: "\"This service has completely transformed our business operations. The customer support is outstanding and the results speak for themselves. Highly recommended!\" - Sarah Johnson, CEO of TechCorp",
        style: { 
          fontSize: 16, 
          color: "#374151", 
          textAlign: "center",
          lineHeight: "1.6",
          fontStyle: "italic",
          marginBottom: "25px"
        },
      },
    ],
  },
  {
    id: 10,
    name: "Business Proposal Cover",
    category: "Business",
    preview: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop",
    rating: 4.7,
    likes: 189,
    icon: Briefcase,
    description: "Professional business proposal cover page template",
    tags: ["proposal", "business", "professional"],
    content: [
      {
        type: "text",
        value: "Business Proposal",
        style: { 
          fontSize: 42, 
          color: "#1f2937", 
          fontWeight: "700", 
          textAlign: "center",
          marginBottom: "30px"
        },
      },
      {
        type: "text",
        value: "Strategic Partnership Opportunity",
        style: { 
          fontSize: 22, 
          color: "#6b7280", 
          fontWeight: "500", 
          textAlign: "center",
          marginBottom: "40px"
        },
      },
      {
        type: "image",
        value: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=250&fit=crop",
        style: {
          borderRadius: "8px",
          marginBottom: "40px"
        }
      },
      {
        type: "paragraph",
        value: "Prepared for: ABC Corporation\nDate: March 2025\nPresented by: Strategic Solutions Inc.\n\nA comprehensive proposal for mutual growth and success.",
        style: { 
          fontSize: 16, 
          color: "#374151", 
          textAlign: "center",
          lineHeight: "1.8",
          marginBottom: "25px"
        },
      },
    ],
  },
  {
    id: 11,
    name: "Birthday Party Invitation",
    category: "Event",
    preview: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=600&h=400&fit=crop",
    rating: 4.8,
    likes: 445,
    icon: PartyPopper,
    description: "Fun and colorful birthday party invitation template",
    tags: ["birthday", "party", "celebration"],
    content: [
      {
        type: "text",
        value: "You're Invited!",
        style: { 
          fontSize: 38, 
          color: "#ec4899", 
          fontWeight: "800", 
          textAlign: "center",
          marginBottom: "20px"
        },
      },
      {
        type: "text",
        value: "Sarah's 25th Birthday Bash",
        style: { 
          fontSize: 24, 
          color: "#7c3aed", 
          fontWeight: "600", 
          textAlign: "center",
          marginBottom: "25px"
        },
      },
      {
        type: "image",
        value: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=600&h=300&fit=crop",
        style: {
          borderRadius: "15px",
          marginBottom: "25px"
        }
      },
      {
        type: "paragraph",
        value: "Join us for an unforgettable celebration! Saturday, August 12th at 7:00 PM. The Grand Ballroom, 789 Party Avenue. Cocktail attire recommended.",
        style: { 
          fontSize: 16, 
          color: "#374151", 
          textAlign: "center",
          lineHeight: "1.6",
          marginBottom: "25px"
        },
      },
      {
        type: "button",
        value: "RSVP by August 5th",
        style: {
          backgroundColor: "#ec4899",
          color: "#ffffff",
          padding: "14px 28px",
          borderRadius: "25px",
          fontWeight: "600"
        },
      },
    ],
  },
  {
    id: 12,
    name: "Sales Report Dashboard",
    category: "Business",
    preview: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
    rating: 4.6,
    likes: 234,
    icon: TrendingUp,
    description: "Professional sales performance report template",
    tags: ["sales", "report", "analytics"],
    content: [
      {
        type: "text",
        value: "Q3 Sales Performance Report",
        style: { 
          fontSize: 32, 
          color: "#1e40af", 
          fontWeight: "700", 
          textAlign: "center",
          marginBottom: "20px"
        },
      },
      {
        type: "image",
        value: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=250&fit=crop",
        style: {
          borderRadius: "8px",
          marginBottom: "25px"
        }
      },
      {
        type: "paragraph",
        value: "Executive Summary:\n• Revenue Growth: $2.4M (up 32% YoY)\n• New Customer Acquisition: 1,847 clients\n• Customer Retention Rate: 94.2%\n• Average Deal Size: $15,600 (up 18%)",
        style: { 
          fontSize: 16, 
          color: "#374151", 
          textAlign: "left",
          lineHeight: "1.8",
          marginBottom: "25px"
        },
      },
    ],
  },
  {
    id: 13,
    name: "Motivational Quote Poster",
    category: "Poster",
    preview: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    rating: 4.9,
    likes: 512,
    icon: Share2,
    description: "Inspiring motivational quote poster for social sharing",
    tags: ["motivation", "quote", "inspiration"],
    content: [
      {
        type: "text",
        value: "Dream Big, Work Hard",
        style: { 
          fontSize: 42, 
          color: "#dc2626", 
          fontWeight: "800", 
          textAlign: "center",
          marginBottom: "30px"
        },
      },
      {
        type: "image",
        value: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=350&fit=crop",
        style: {
          borderRadius: "12px",
          marginBottom: "30px"
        }
      },
      {
        type: "paragraph",
        value: "Success is not just about reaching your destination, but about who you become during the journey. Every challenge is an opportunity to grow stronger.",
        style: { 
          fontSize: 18, 
          color: "#4338ca", 
          textAlign: "center",
          lineHeight: "1.6",
          fontWeight: "500",
          marginBottom: "20px"
        },
      },
    ],
  },
  {
    id: 14,
    name: "Company Newsletter Header",
    category: "Email",
    preview: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop",
    rating: 4.5,
    likes: 178,
    icon: FileText,
    description: "Professional company newsletter header template",
    tags: ["newsletter", "company", "header"],
    content: [
      {
        type: "text",
        value: "Monthly Business Insights",
        style: { 
          fontSize: 34, 
          color: "#111827", 
          fontWeight: "700", 
          textAlign: "center",
          marginBottom: "15px"
        },
      },
      {
        type: "text",
        value: "March 2025 Edition",
        style: { 
          fontSize: 18, 
          color: "#6b7280", 
          fontWeight: "500", 
          textAlign: "center",
          marginBottom: "25px"
        },
      },
      {
        type: "image",
        value: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=300&fit=crop",
        style: {
          borderRadius: "8px",
          marginBottom: "25px"
        }
      },
      {
        type: "paragraph",
        value: "This month's highlights include market trends, success stories, and exclusive insights from industry leaders. Don't miss our featured article on emerging technologies and their impact on business growth.",
        style: { 
          fontSize: 16, 
          color: "#4b5563", 
          textAlign: "center",
          lineHeight: "1.6",
          marginBottom: "25px"
        },
      },
    ],
  },
  {
    id: 15,
    name: "Conference Speaker Poster",
    category: "Poster",
    preview: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&h=400&fit=crop",
    rating: 4.7,
    likes: 189,
    icon: Presentation,
    description: "Professional conference speaker announcement poster",
    tags: ["conference", "speaker", "event"],
    content: [
      {
        type: "text",
        value: "Keynote Speaker",
        style: { 
          fontSize: 36, 
          color: "#7c3aed", 
          fontWeight: "700", 
          textAlign: "center",
          marginBottom: "20px"
        },
      },
      {
        type: "text",
        value: "Dr. Sarah Williams",
        style: { 
          fontSize: 28, 
          color: "#1f2937", 
          fontWeight: "600", 
          textAlign: "center",
          marginBottom: "15px"
        },
      },
      {
        type: "image",
        value: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&h=300&fit=crop",
        style: {
          borderRadius: "10px",
          marginBottom: "25px"
        }
      },
      {
        type: "paragraph",
        value: "\"The Future of AI in Business\" - March 20th, 2025 at Tech Summit. Join us for this groundbreaking presentation that will reshape how we think about artificial intelligence in the workplace.",
        style: { 
          fontSize: 16, 
          color: "#374151", 
          textAlign: "center",
          lineHeight: "1.6",
          marginBottom: "25px"
        },
      },
    ],
  },
  {
    id: 16,
    name: "Thank You Card Design",
    category: "Social",
    preview: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=600&h=400&fit=crop",
    rating: 4.8,
    likes: 367,
    icon: Heart,
    description: "Heartfelt thank you card template for appreciation",
    tags: ["thank you", "gratitude", "appreciation"],
    content: [
      {
        type: "text",
        value: "Thank You",
        style: { 
          fontSize: 44, 
          color: "#dc2626", 
          fontWeight: "600", 
          textAlign: "center",
          marginBottom: "30px"
        },
      },
      {
        type: "image",
        value: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=600&h=300&fit=crop",
        style: {
          borderRadius: "12px",
          marginBottom: "25px"
        }
      },
      {
        type: "paragraph",
        value: "Your support means the world to us. We're grateful for your trust and partnership in our journey together. Thank you for believing in our vision and helping us grow.",
        style: { 
          fontSize: 16, 
          color: "#374151", 
          textAlign: "center",
          lineHeight: "1.7",
          fontStyle: "italic",
          marginBottom: "25px"
        },
      },
    ],
  },
  {
    id: 17,
    name: "Product Feature Showcase",
    category: "Landing Page",
    preview: "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=600&h=400&fit=crop",
    rating: 4.6,
    likes: 298,
    icon: Monitor,
    description: "Product feature showcase landing page template",
    tags: ["product", "features", "showcase"],
    content: [
      {
        type: "text",
        value: "Introducing Revolutionary Features",
        style: { 
          fontSize: 32, 
          color: "#059669", 
          fontWeight: "700", 
          textAlign: "center",
          marginBottom: "20px"
        },
      },
      {
        type: "image",
        value: "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=600&h=300&fit=crop",
        style: {
          borderRadius: "10px",
          marginBottom: "25px"
        }
      },
      {
        type: "paragraph",
        value: "Experience next-generation technology with AI-powered automation, seamless integrations, and enterprise-grade security. Transform your workflow with features designed for modern businesses.",
        style: { 
          fontSize: 16, 
          color: "#374151", 
          textAlign: "center",
          lineHeight: "1.6",
          marginBottom: "25px"
        },
      },
      {
        type: "button",
        value: "Try Free Demo",
        style: {
          backgroundColor: "#059669",
          color: "#ffffff",
          padding: "16px 32px",
          borderRadius: "8px",
          fontWeight: "600"
        },
      },
    ],
  },
  {
    id: 18,
    name: "Job Posting Template",
    category: "Business",
    preview: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&h=400&fit=crop",
    rating: 4.4,
    likes: 167,
    icon: Users,
    description: "Professional job posting template for hiring",
    tags: ["hiring", "job", "recruitment"],
    content: [
      {
        type: "text",
        value: "We're Hiring!",
        style: { 
          fontSize: 38, 
          color: "#1e40af", 
          fontWeight: "800", 
          textAlign: "center",
          marginBottom: "20px"
        },
      },
      {
        type: "text",
        value: "Senior Software Engineer",
        style: { 
          fontSize: 24, 
          color: "#1f2937", 
          fontWeight: "600", 
          textAlign: "center",
          marginBottom: "25px"
        },
      },
      {
        type: "image",
        value: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&h=300&fit=crop",
        style: {
          borderRadius: "8px",
          marginBottom: "25px"
        }
      },
      {
        type: "paragraph",
        value: "Join our innovative team! We're looking for a passionate software engineer to help build the next generation of our platform. Remote-friendly position with competitive salary, excellent benefits, and growth opportunities.",
        style: { 
          fontSize: 16, 
          color: "#4b5563", 
          textAlign: "center",
          lineHeight: "1.6",
          marginBottom: "25px"
        },
      },
      {
        type: "button",
        value: "Apply Now",
        style: {
          backgroundColor: "#1e40af",
          color: "#ffffff",
          padding: "16px 32px",
          borderRadius: "8px",
          fontWeight: "600"
        },
      },
    ],
  },
  {
    id: 19,
    name: "Contest Announcement Social",
    category: "Social",
    preview: "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=600&h=400&fit=crop",
    rating: 4.7,
    likes: 423,
    icon: Gift,
    description: "Exciting contest announcement for social media engagement",
    tags: ["contest", "giveaway", "social"],
    content: [
      {
        type: "text",
        value: "BIG GIVEAWAY ALERT!",
        style: { 
          fontSize: 36, 
          color: "#f59e0b", 
          fontWeight: "900", 
          textAlign: "center",
          marginBottom: "20px"
        },
      },
      {
        type: "text",
        value: "Win $1000 Gift Card",
        style: { 
          fontSize: 28, 
          color: "#dc2626", 
          fontWeight: "700", 
          textAlign: "center",
          marginBottom: "25px"
        },
      },
      {
        type: "image",
        value: "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=600&h=300&fit=crop",
        style: {
          borderRadius: "15px",
          marginBottom: "25px"
        }
      },
      {
        type: "paragraph",
        value: "Like, Follow, and Tag 3 friends to enter! Contest ends March 31st. Winner announced April 1st. Must be 18+ to enter. Good luck everyone!",
        style: { 
          fontSize: 16, 
          color: "#374151", 
          textAlign: "center",
          lineHeight: "1.6",
          marginBottom: "20px"
        },
      },
    ],
  },
  {
    id: 20,
    name: "App Download Landing Page",
    category: "Landing Page",
    preview: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=400&fit=crop",
    rating: 4.8,
    likes: 334,
    icon: Monitor,
    description: "Mobile app download landing page with app store buttons",
    tags: ["app", "download", "mobile"],
    content: [
      {
        type: "text",
        value: "Download Our App Today",
        style: { 
          fontSize: 38, 
          color: "#1f2937", 
          fontWeight: "700", 
          textAlign: "center",
          marginBottom: "20px"
        },
      },
      {
        type: "paragraph",
        value: "Experience the future of productivity on your mobile device",
        style: { 
          fontSize: 18, 
          color: "#6b7280", 
          textAlign: "center",
          marginBottom: "25px"
        },
      },
      {
        type: "image",
        value: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=350&fit=crop",
        style: {
          borderRadius: "12px",
          marginBottom: "25px"
        }
      },
      {
        type: "paragraph",
        value: "• Seamless synchronization across all devices\n• Offline functionality for uninterrupted work\n• Advanced security features and encryption\n• 4.9★ rating with 50,000+ downloads\n• Regular updates and new features",
        style: { 
          fontSize: 16, 
          color: "#374151", 
          textAlign: "left",
          lineHeight: "1.8",
          marginBottom: "30px"
        },
      },
      {
        type: "button",
        value: "Download Free App",
        style: {
          backgroundColor: "#10b981",
          color: "#ffffff",
          padding: "16px 32px",
          borderRadius: "8px",
          fontWeight: "600"
        },
      },
    ],
  },
  
];

const categories = ["All", "Email", "Landing Page", "Social", "Event", "Poster", "Business", "Saved"];

const AllTemplates = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [userCreatedTemplates, setUserCreatedTemplates] = useState([]);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

// Load saved templates from database on component mount
useEffect(() => {
  const fetchSavedTemplates = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    try {
      const response = await fetch(`${API_URL}/api/saved-templates/${userId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      
      const data = await response.json();

      // Extract saved template IDs
      setSavedTemplates(data.map(t => t.templateId));

      // Convert DB saved templates into UI structure
      const formatted = data.map(t => ({
        id: t.templateId,
        name: t.name,
        preview: t.preview || "https://images.unsplash.com/photo-1557683316-973673baf926?w=600&h=400&fit=crop",
        category: "Saved",
        description: t.description || "Custom saved template",
        tags: t.tags || ["custom", "saved"],
        rating: 4.5,
        likes: 0,
        content: typeof t.content === 'string' ? JSON.parse(t.content) : t.content
      }));

      setUserCreatedTemplates(formatted);
      console.log('Loaded saved templates:', formatted.length);
    } catch (err) {
      console.error("Error loading saved templates:", err);
    }
  };

  fetchSavedTemplates();
}, []);

  const handleExit = () => {
    navigate("/email-campaign");
  };

  const toggleSaveTemplate = (templateId) => {
    if (savedTemplates.includes(templateId)) {
      setSavedTemplates(savedTemplates.filter(id => id !== templateId));
    } else {
      setSavedTemplates([...savedTemplates, templateId]);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    try {
      const response = await fetch(`${API_URL}/api/saved-templates/${userId}/${templateId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Delete failed");
      setUserCreatedTemplates(prev => prev.filter(t => t.id !== templateId));
      setSavedTemplates(prev => prev.filter(id => id !== templateId));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error("Error deleting template:", err);
    }
  };

  const handleRenameTemplate = async (templateId) => {
    const userId = localStorage.getItem("userId");
    if (!userId || !renameValue.trim()) return;
    try {
      const response = await fetch(`${API_URL}/api/saved-templates/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, templateId, name: renameValue.trim() }),
      });
      if (!response.ok) throw new Error("Rename failed");
      setUserCreatedTemplates(prev =>
        prev.map(t => t.id === templateId ? { ...t, name: renameValue.trim() } : t)
      );
      setRenamingId(null);
      setRenameValue("");
    } catch (err) {
      console.error("Error renaming template:", err);
    }
  };

  // Convert template content to editor format
  const handleSelect = (template) => {
    // Check if the template content is in raw elements format (has x, y properties)
    const isRawElements = template.content && template.content.length > 0 && 
      template.content[0].hasOwnProperty('x') && template.content[0].hasOwnProperty('y');

    let elements;
    if (isRawElements) {
      // Use the raw elements directly
      elements = template.content;
    } else {
      // Convert the structured blocks to raw elements
      let currentY = 60;
      const canvasWidth = 800;
      const leftMargin = 80;
      const rightMargin = 80;
      const contentWidth = canvasWidth - leftMargin - rightMargin;
      const baseSpacing = 40;

      elements = template.content.map((block, index) => {
        let elementConfig = {};

        switch (block.type) {
          case "text":
            const headingHeight = 50;
            elementConfig = {
              id: crypto.randomUUID(),
              type: "heading",
              content: block.value || "Heading",
              x: leftMargin,
              y: currentY,
              width: contentWidth,
              height: headingHeight,
              fontSize: block.style?.fontSize || 32,
              color: block.style?.color || "#1f2937",
              backgroundColor: block.style?.backgroundColor || "transparent",
              fontFamily: block.style?.fontFamily || "Arial",
              fontWeight: block.style?.fontWeight || "bold",
              textAlign: block.style?.textAlign || "center",
              fontStyle: block.style?.fontStyle || "normal",
              textDecoration: block.style?.textDecoration || "none",
              opacity: 1,
              rotation: 0,
              borderRadius: 0,
              borderWidth: 0,
              borderColor: "#000000"
            };
            currentY += headingHeight + baseSpacing;
            break;

          case "paragraph":
            const fontSize = block.style?.fontSize || 16;
            const estimatedLines = Math.ceil(block.value.length / 60);
            const paragraphHeight = Math.max(60, estimatedLines * (fontSize + 4));
            
            elementConfig = {
              id: crypto.randomUUID(),
              type: "paragraph",
              content: block.value || "Paragraph text",
              x: leftMargin,
              y: currentY,
              width: contentWidth,
              height: paragraphHeight,
              fontSize: fontSize,
              color: block.style?.color || "#4b5563",
              backgroundColor: block.style?.backgroundColor || "transparent",
              fontFamily: block.style?.fontFamily || "Arial",
              fontWeight: block.style?.fontWeight || "normal",
              textAlign: block.style?.textAlign || "left",
              fontStyle: block.style?.fontStyle || "normal",
              textDecoration: block.style?.textDecoration || "none",
              opacity: 1,
              rotation: 0,
              borderRadius: block.style?.borderRadius || 0,
              borderWidth: 0,
              borderColor: "#000000"
            };
            currentY += paragraphHeight + baseSpacing;
            break;

          case "button":
            const buttonWidth = 220;
            const buttonHeight = 50;
            elementConfig = {
              id: crypto.randomUUID(),
              type: "button",
              content: block.value || "Click Me",
              x: leftMargin + (contentWidth - buttonWidth) / 2,
              y: currentY,
              width: buttonWidth,
              height: buttonHeight,
              fontSize: block.style?.fontSize || 16,
              color: block.style?.color || "#ffffff",
              backgroundColor: block.style?.backgroundColor || "#3b82f6",
              fontFamily: block.style?.fontFamily || "Arial",
              fontWeight: block.style?.fontWeight || "600",
              textAlign: "center",
              fontStyle: "normal",
              textDecoration: "none",
              opacity: 1,
              rotation: 0,
              borderRadius: block.style?.borderRadius || 8,
              borderWidth: 0,
              borderColor: "#000000"
            };
            currentY += buttonHeight + baseSpacing + 10;
            break;

          case "image":
            const imageWidth = Math.min(500, contentWidth);
            const imageHeight = block.style?.height || 300;
            elementConfig = {
              id: crypto.randomUUID(),
              type: "image",
              content: "",
              src: block.value || "https://images.unsplash.com/photo-1557683316-973673baf926?w=500&h=300&fit=crop",
              x: leftMargin + (contentWidth - imageWidth) / 2,
              y: currentY,
              width: imageWidth,
              height: imageHeight,
              fontSize: 16,
              color: "#000000",
              backgroundColor: "transparent",
              fontFamily: "Arial",
              fontWeight: "normal",
              textAlign: "left",
              fontStyle: "normal",
              textDecoration: "none",
              opacity: 1,
              rotation: 0,
              borderRadius: block.style?.borderRadius || 12,
              borderWidth: 0,
              borderColor: "#000000"
            };
            currentY += imageHeight + baseSpacing;
            break;

          default:
            elementConfig = {
              id: crypto.randomUUID(),
              type: "paragraph",
              content: block.value || "Content",
              x: leftMargin,
              y: currentY,
              width: contentWidth,
              height: 60,
              fontSize: 16,
              color: "#374151",
              backgroundColor: "transparent",
              fontFamily: "Arial",
              fontWeight: "normal",
              textAlign: "left",
              fontStyle: "normal",
              textDecoration: "none",
              opacity: 1,
              rotation: 0,
              borderRadius: 0,
              borderWidth: 0,
              borderColor: "#000000"
            };
            currentY += 60 + baseSpacing;
        }

        return elementConfig;
      });
    }

    // Check if this is a user-created template
    const templateId = template.id?.toString() || '';
    const isUserTemplate = templateId.startsWith('user-') || template.category === "Saved";
    
    // Determine if we're editing an existing template
    const isEditingExistingTemplate = isUserTemplate && userCreatedTemplates.some(t => t.id === template.id);

    navigate("/editor", {
      state: {
        template: {
          id: template.id,
          name: template.name,
          content: elements,
          canvasBackgroundColor: template.canvasBackgroundColor || "#FFFFFF",
          category: template.category,
          description: template.description,
          preview: template.preview,
          tags: template.tags,
          rating: template.rating,
          likes: template.likes
        },
        editingTemplateId: isEditingExistingTemplate ? template.id : null,
        isEditingTemplate: isEditingExistingTemplate,
        isUserTemplate: isUserTemplate
      },
    });
  };

  // Combine templates and user-created templates
  const allTemplates = [...templates, ...userCreatedTemplates];

  const filteredTemplates = allTemplates.filter((template) => {
    const matchesCategory =
      selectedCategory === "All" || 
      template.category === selectedCategory ||
      (selectedCategory === "Saved" && (savedTemplates.includes(template.id) || template.category === "Saved"));
    const matchesSearch = 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (template.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

const renderTemplatePreview = (template) => {
  // Check if content is raw HTML string (from saved templates)
  if (typeof template.content === 'string' && template.content.includes('<')) {
    return (
      <div 
        className="relative bg-white border border-gray-200 rounded-lg p-6 overflow-auto"
        style={{
          minHeight: '400px',
          maxHeight: '600px',
          width: '100%'
        }}
      >
        <iframe
          srcDoc={template.content}
          style={{
            width: '100%',
            minHeight: '500px',
            border: 'none',
            backgroundColor: 'white'
          }}
          sandbox="allow-same-origin"
          title="Template Preview"
        />
      </div>
    );
  }

  // Check if content is array of raw elements (has x, y coordinates)
  if (template.content && Array.isArray(template.content) && template.content.length > 0) {
    const hasCoordinates = template.content[0].hasOwnProperty('x') && template.content[0].hasOwnProperty('y');
    
    if (hasCoordinates) {
      return (
        <div 
          className="relative bg-white border border-gray-200 rounded-lg mx-auto overflow-auto" 
          style={{ width: '100%', maxWidth: '800px', height: '600px' }}
        >
          <div style={{ position: 'relative', width: '800px', height: '600px' }}>
            {template.content.map((element) => (
              <div
                key={element.id}
                style={{
                  position: 'absolute',
                  left: element.x,
                  top: element.y,
                  width: element.width,
                  height: element.height,
                  transform: `rotate(${element.rotation || 0}deg)`,
                  opacity: element.opacity || 1,
                  zIndex: element.zIndex || 0,
                }}
              >
                {(element.type === "heading" || element.type === "paragraph" || 
                  element.type === "subheading" || element.type === "blockquote") && (
                  <div
                    style={{
                      fontSize: `${element.fontSize}px`,
                      fontFamily: element.fontFamily || 'Arial',
                      color: element.color || '#000000',
                      fontWeight: element.fontWeight || (element.type === "heading" ? 'bold' : 'normal'),
                      textAlign: element.textAlign || 'left',
                      lineHeight: element.lineHeight || '1.4',
                      backgroundColor: element.backgroundColor || 'transparent',
                      padding: '8px',
                      fontStyle: element.fontStyle || (element.type === "blockquote" ? 'italic' : 'normal'),
                      borderLeft: element.type === "blockquote" ? '4px solid #d1d5db' : 'none',
                      paddingLeft: element.type === "blockquote" ? '16px' : '8px',
                      textDecoration: element.textDecoration || 'none',
                      width: '100%',
                      height: '100%',
                      overflow: 'hidden'
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: element.content || 
                        (element.type === "heading" ? "Heading" : 
                         element.type === "subheading" ? "Subheading" :
                         element.type === "blockquote" ? "Blockquote" : "Paragraph text")
                    }}
                  />
                )}
                
                {element.type === "button" && (
                  <div
                    style={{
                      backgroundColor: element.backgroundColor || "#007bff",
                      color: element.color || "#ffffff",
                      padding: "10px 20px",
                      borderRadius: `${element.borderRadius || 6}px`,
                      fontSize: `${element.fontSize}px`,
                      fontWeight: element.fontWeight || '600',
                      fontFamily: element.fontFamily || 'Arial',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      width: '100%',
                      cursor: 'pointer',
                      border: element.borderWidth ? `${element.borderWidth}px solid ${element.borderColor}` : 'none'
                    }}
                  >
                    {element.content || "Click Me"}
                  </div>
                )}
                
                {element.type === "image" && (
                  <img
                    src={element.src}
                    alt="Template element"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: `${element.borderRadius || 0}px`,
                      border: element.borderWidth ? `${element.borderWidth}px solid ${element.borderColor}` : 'none'
                    }}
                  />
                )}
                
                {element.type === "card" && (
                  <div
                    style={{
                      backgroundColor: element.backgroundColor || "#FFFFFF",
                      borderColor: element.borderColor || "#E2E8F0",
                      borderWidth: `${element.borderWidth || 1}px`,
                      borderStyle: 'solid',
                      borderRadius: `${element.borderRadius || 8}px`,
                      padding: `${element.padding || 16}px`,
                      fontSize: `${element.fontSize || 16}px`,
                      fontFamily: element.fontFamily || 'Arial',
                      color: element.color || '#000000',
                      height: '100%',
                      width: '100%',
                      overflow: 'hidden',
                      boxShadow: element.boxShadow || 'none'
                    }}
                    dangerouslySetInnerHTML={{ __html: element.content || "Card content" }}
                  />
                )}
                
                {element.type === "rectangle" && (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: element.backgroundColor || "#4ECDC4",
                      border: `${element.borderWidth || 2}px solid ${element.borderColor || '#000'}`,
                      borderRadius: `${element.borderRadius || 4}px`
                    }}
                  />
                )}
                
                {element.type === "circle" && (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      backgroundColor: element.backgroundColor || "#FF6B6B",
                      border: `${element.borderWidth || 2}px solid ${element.borderColor || '#000'}`
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }
  }

  // Fallback: render structured content blocks (for predefined templates)
  return (
    <div className="space-y-6">
      {template.content && template.content.length > 0 ? (
        template.content.map((block, index) => {
          if (block.type === "text") {
            return (
              <h3 key={index} style={block.style} className="text-gray-900">
                {block.value}
              </h3>
            );
          }
          if (block.type === "paragraph") {
            return (
              <p key={index} style={block.style} className="text-gray-700 whitespace-pre-line">
                {block.value}
              </p>
            );
          }
          if (block.type === "button") {
            return (
              <button key={index} style={block.style} className="cursor-default">
                {block.value}
              </button>
            );
          }
          if (block.type === "image") {
            return (
              <img
                key={index}
                src={block.value}
                alt="Template content"
                className="rounded-lg max-w-full shadow-lg"
                style={block.style}
              />
            );
          }
          return null;
        })
      ) : (
        <p className="text-gray-500 text-center py-10">No content available for this template</p>
      )}
    </div>
  );
};

  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-600/20 to-gray-600/20"></div>
        <div className="relative px-6 py-16 mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="text-5xl font-bold bg-clip-text text-[#c2831f] bg-gradient-to-r from-blue-400 to-purple-400 mb-6">
              Premium Template Library
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Choose from 20+ professionally designed templates across multiple categories. 
              Each template is fully customizable and optimized for modern design standards.
            </p>
            
            {/* Search and View Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              
              {/* View Mode Toggle */}
              <div className="flex bg-gray-800 border border-gray-700 rounded-full p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-3 rounded-full transition-all duration-200 ${
                    viewMode === "grid"
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Grid size={20} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-3 rounded-full transition-all duration-200 ${
                    viewMode === "list"
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <List size={20} />
                </button>
              </div>
              <div className="p-4 text-xs text-gray-400 flex justify-between items-center ">
                <button
                  onClick={handleExit}
                  className="px-6 py-2 rounded-full bg-[#c2831f] text-white hover:bg-[#d09025] text-sm cursor-pointer"
                >
                  Exit
                </button>
              </div>
            </div>
             
          </div>
        </div>
        
      </div>

      {/* Category Filters */}
      <div className="px-6 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                  selectedCategory === category
                    ? "bg-[#c2831f] text-white shadow-lg transform scale-105"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700 hover:border-gray-600"
                }`}
              >
                {category}
               <span className="ml-2 text-xs bg-gray-600 px-2 py-1 rounded-full">
                {category === "All" 
                  ? allTemplates.length 
                  : category === "Saved" 
                    ? userCreatedTemplates.length 
                    : allTemplates.filter(t => t.category === category).length}
              </span>

              </button>
            ))}
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between mb-8">
            <div className="text-gray-400">
               {searchTerm && (
                <span className="ml-2">
                  for "<span className="text-blue-400">{searchTerm}</span>"
                </span>
              )}
            </div>
            {(searchTerm || selectedCategory !== "All") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("All");
                }}
                className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Templates Grid/List */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="group relative bg-gray-800 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-gray-700 hover:border-blue-500/50"
                >
                  {/* Preview Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={template.preview}
                      alt={template.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Overlay Actions */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex space-x-3">
                        <button 
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300"
                          onClick={() => setPreviewTemplate(template)}
                        >
                          <Eye size={16} />
                          <span>Preview</span>
                        </button>
                        <button 
                          className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300"
                          onClick={() => handleSelect(template)}
                        >
                          <span>Use</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Category Badge */}
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                        template.category === "Saved" ? "bg-purple-600/90" : "bg-blue-600/90"
                      } backdrop-blur-sm text-white`}>
                        {template.category}
                      </span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      {renamingId === template.id ? (
                        <div className="flex items-center gap-2 flex-1 mr-2">
                          <input
                            autoFocus
                            value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter") handleRenameTemplate(template.id);
                              if (e.key === "Escape") { setRenamingId(null); setRenameValue(""); }
                            }}
                            className="flex-1 bg-gray-700 border border-blue-500 text-white rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => handleRenameTemplate(template.id)}
                            className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => { setRenamingId(null); setRenameValue(""); }}
                            className="p-1.5 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <h3 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors duration-200 line-clamp-2">
                          {template.name}
                        </h3>
                      )}
                      <button 
                        onClick={() => toggleSaveTemplate(template.id)}
                        className={`p-2 hover:bg-gray-700 rounded-full transition-colors duration-200 flex-shrink-0 ${
                          savedTemplates.includes(template.id) || template.category === "Saved" ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
                        }`}
                        disabled={template.category === "Saved"}
                      >
                        <Heart size={18} fill={(savedTemplates.includes(template.id) || template.category === "Saved") ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                    
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">{template.description}</p>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {template.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Star size={14} className="text-yellow-400 fill-current" />
                        <span>{template.rating}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Heart size={14} />
                        <span>{template.likes}</span>
                      </div>
                    </div>

                    {/* Saved Template Actions */}
                    {template.category === "Saved" && (
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-700">
                        <button
                          onClick={() => { setRenamingId(template.id); setRenameValue(template.name); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-700 hover:bg-blue-600 text-gray-300 hover:text-white rounded-lg transition-colors duration-200"
                        >
                          <Pencil size={12} />
                          Rename
                        </button>
                        {deleteConfirmId === template.id ? (
                          <div className="flex items-center gap-1.5 ml-auto">
                            <span className="text-xs text-gray-400">Delete?</span>
                            <button
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="px-2.5 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2.5 py-1.5 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(template.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white rounded-lg transition-colors duration-200 ml-auto"
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="space-y-6">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="group bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl"
                >
                  <div className="flex gap-6">
                    {/* Preview Image */}
                    <div className="flex-shrink-0 w-32 h-24 rounded-lg overflow-hidden">
                      <img
                        src={template.preview}
                        alt={template.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-grow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 mr-4">
                          {renamingId === template.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                autoFocus
                                value={renameValue}
                                onChange={e => setRenameValue(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === "Enter") handleRenameTemplate(template.id);
                                  if (e.key === "Escape") { setRenamingId(null); setRenameValue(""); }
                                }}
                                className="flex-1 bg-gray-700 border border-blue-500 text-white rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <button
                                onClick={() => handleRenameTemplate(template.id)}
                                className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={() => { setRenamingId(null); setRenameValue(""); }}
                                className="p-1.5 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <h3 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors duration-200">
                              {template.name}
                            </h3>
                          )}
                          <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                            template.category === "Saved" ? "bg-purple-600/20 text-purple-400" : "bg-blue-600/20 text-blue-400"
                          }`}>
                            {template.category}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Star size={14} className="text-yellow-400 fill-current" />
                            <span>{template.rating}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Heart size={14} />
                            <span>{template.likes}</span>
                          </div>
                          <button 
                            onClick={() => toggleSaveTemplate(template.id)}
                            className={`p-1 hover:bg-gray-700 rounded-full transition-colors duration-200 ${
                              savedTemplates.includes(template.id) || template.category === "Saved" ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
                            }`}
                            disabled={template.category === "Saved"}
                          >
                            <Heart size={16} fill={(savedTemplates.includes(template.id) || template.category === "Saved") ? 'currentColor' : 'none'} />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-gray-400 mb-3">{template.description}</p>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {template.tags.map((tag) => (
                          <span key={tag} className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <button 
                          onClick={() => setPreviewTemplate(template)}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
                        >
                          <Eye size={16} />
                          <span>Preview</span>
                        </button>
                        <button 
                          onClick={() => handleSelect(template)}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200"
                        >
                          <span>Use Template</span>
                        </button>
                        {template.category === "Saved" && (
                          <>
                            <button
                              onClick={() => { setRenamingId(template.id); setRenameValue(template.name); }}
                              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-700 hover:bg-blue-600 text-gray-300 hover:text-white rounded-lg transition-colors duration-200"
                            >
                              <Pencil size={14} />
                              Rename
                            </button>
                            {deleteConfirmId === template.id ? (
                              <div className="flex items-center gap-2 ml-auto">
                                <span className="text-sm text-gray-400">Delete?</span>
                                <button
                                  onClick={() => handleDeleteTemplate(template.id)}
                                  className="px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                >
                                  Yes
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="px-3 py-2 text-sm bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(template.id)}
                                className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white rounded-lg transition-colors duration-200 ml-auto"
                              >
                                <Trash2 size={14} />
                                Delete
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {filteredTemplates.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-6 opacity-50">
                {selectedCategory === "Saved" ? "💾" : "🔍"}
              </div>
              <h3 className="text-3xl font-semibold text-gray-400 mb-4">
                {selectedCategory === "Saved" 
                  ? "No saved templates yet" 
                  : "No templates found"
                }
              </h3>
              <p className="text-gray-500 mb-8 text-lg">
                {selectedCategory === "Saved" 
                  ? "Save your favorite templates by clicking the heart icon on any template or create your own templates in the editor."
                  : "We couldn't find any templates matching your criteria. Try adjusting your search terms or category filter."
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("All");
                  }}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors duration-200"
                >
                  {selectedCategory === "Saved" ? "Browse All Templates" : "Clear All Filters"}
                </button>
                {selectedCategory !== "Saved" && (
                  <button
                    onClick={() => navigate("/editor")}
                    className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-full font-medium transition-colors duration-200"
                  >
                    Start from Blank
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[100vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{previewTemplate.name}</h2>
                <div className="flex items-center space-x-4 mt-2">
                  <span className={`px-3 py-1 text-sm rounded-full ${
                    previewTemplate.category === "Saved" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                  }`}>
                    {previewTemplate.category}
                  </span>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Star size={14} className="text-yellow-500 fill-current" />
                    <span>{previewTemplate.rating}</span>
                    <span>•</span>
                    <Heart size={14} />
                    <span>{previewTemplate.likes}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <X size={24} className="text-gray-500" />
              </button>
            </div>
            
            {/* Modal Content - THIS IS THE UPDATED SECTION */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {renderTemplatePreview(previewTemplate)}
            </div>
            
            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600">{previewTemplate.description}</p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors duration-200"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleSelect(previewTemplate);
                    setPreviewTemplate(null);
                  }}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
                >
                  Use This Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Custom Styles */}
      <style>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        /* Custom scrollbar for modal */
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
        
        /* Hover effects */
        .group:hover .group-hover\\:scale-110 {
          transform: scale(1.1);
        }
        
        .group:hover .group-hover\\:translate-y-0 {
          transform: translateY(0);
        }
        
        .group:hover .group-hover\\:opacity-100 {
          opacity: 1;
        }
        
        /* Animation for template cards */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .grid > div,
        .space-y-6 > div {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        
        /* Stagger animation for grid items */
        .grid > div:nth-child(1) { animation-delay: 0.1s; }
        .grid > div:nth-child(2) { animation-delay: 0.2s; }
        .grid > div:nth-child(3) { animation-delay: 0.3s; }
        .grid > div:nth-child(4) { animation-delay: 0.4s; }
        .grid > div:nth-child(5) { animation-delay: 0.5s; }
        .grid > div:nth-child(6) { animation-delay: 0.6s; }
        .grid > div:nth-child(7) { animation-delay: 0.7s; }
        .grid > div:nth-child(8) { animation-delay: 0.8s; }
        
        /* Modal backdrop blur effect */
        .backdrop-blur-sm {
          backdrop-filter: blur(4px);
        }
        
        /* Gradient text effect */
        .bg-clip-text {
          background-clip: text;
          -webkit-background-clip: text;
        }
        
        /* Loading skeleton for images */
        .img-loading {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
        }
        
        @keyframes loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .grid {
            grid-template-columns: repeat(1, minmax(0, 1fr));
          }
        }
        
        @media (max-width: 1024px) {
          .grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        
        @media (max-width: 1280px) {
          .grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
      `}</style>
    </div>
  );
};

export default AllTemplates;