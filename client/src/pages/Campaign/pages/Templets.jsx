// src/pages/TemplatesPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Star, Eye, Heart, Mail, Megaphone, Share2, Calendar, Rocket, Users, Award, TrendingUp, Gift, Mic  } from "lucide-react";

// Enhanced templates with more variety
const templates = [
  {
    id: 1,
    name: "Professional Welcome Email",
    category: "Email",
    preview: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=300&fit=crop",
    rating: 4.8,
    likes: 324,
    icon: Mail,
    description: "Warm and professional welcome email template perfect for onboarding new customers",
    content: [
      {
        type: "text",
        value: "Welcome to Our Community",
        style: { 
          fontSize: 36, 
          color: "#1e40af", 
          fontWeight: "700", 
          textAlign: "center",
          marginBottom: "20px",
          letterSpacing: "-0.025em"
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
          marginBottom: "30px",
          maxWidth: "600px"
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
          backgroundColor: "#1e40af",
          color: "#ffffff",
          padding: "16px 32px",
          borderRadius: "8px",
          fontSize: "16px",
          fontWeight: "600",
          margin: "20px auto",
          display: "block",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 14px 0 rgba(30, 64, 175, 0.3)"
        },
      },
    ],
  },
  {
    id: 2,
    name: "Marketing Newsletter Campaign",
    category: "Marketing",
    preview: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop",
    rating: 4.9,
    likes: 451,
    icon: Megaphone,
    description: "High-conversion newsletter template with modern design and clear call-to-actions",
    content: [
      {
        type: "text",
        value: "Your Weekly Business Insights",
        style: { 
          fontSize: 32, 
          color: "#111827", 
          fontWeight: "700", 
          textAlign: "center",
          marginBottom: "15px"
        },
      },
      {
        type: "paragraph",
        value: "This week's edition features market trends, growth strategies, and exclusive insights from industry leaders that you won't find anywhere else.",
        style: { 
          fontSize: 18, 
          color: "#4b5563", 
          textAlign: "center",
          lineHeight: "1.6",
          marginBottom: "25px"
        },
      },
     {
        type: "image",
        value: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop",
        style: {
          borderRadius: "8px",
          marginBottom: "25px",
          display: "block",
          marginLeft: "30px",
          marginRight: "auto",
        }
      },
      {
        type: "text",
        value: "Featured This Week",
        style: { 
          fontSize: 24, 
          color: "#059669", 
          fontWeight: "600", 
          textAlign: "left",
          marginBottom: "15px"
        },
      },
      {
        type: "paragraph",
        value: "• 5 proven strategies to increase customer retention\n• Market analysis: Q3 trends every business owner should know\n• Exclusive interview with successful entrepreneurs\n• Tools and resources to streamline your workflow",
        style: { 
          fontSize: 16, 
          color: "#374151", 
          textAlign: "left",
          lineHeight: "1.8",
          marginBottom: "25px"
        },
      },
      {
        type: "button",
        value: "Read Full Newsletter",
        style: {
          backgroundColor: "#059669",
          color: "#ffffff",
          padding: "14px 28px",
          borderRadius: "8px",
          fontWeight: "600",
          display: "block",
          margin: "20px auto",
          fontSize: "16px",
          border: "none",
          cursor: "pointer"
        },
      },
    ],
  },
  {
    id: 3,
    name: "Motivational Social Post",
    category: "Social",
    preview: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=600&fit=crop",
    rating: 4.7,
    likes: 512,
    icon: Share2,
    description: "Inspiring social media template designed to engage and motivate your audience",
    content: [
      {
        type: "image",
        value: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
        style: {
          borderRadius: "12px",
          marginBottom: "20px"
        }
      },
      {
        type: "text",
        value: "Transform Your Dreams Into Reality",
        style: { 
          fontSize: 38, 
          color: "#dc2626", 
          fontWeight: "800", 
          textAlign: "center",
          marginBottom: "20px",
          textShadow: "2px 2px 4px rgba(0,0,0,0.1)"
        },
      },
      {
        type: "paragraph",
        value: "Every successful journey begins with a single step. Whether you're starting a business, learning a new skill, or chasing a personal goal, remember that consistency beats perfection every time.",
        style: { 
          fontSize: 18, 
          color: "#4338ca", 
          textAlign: "center",
          lineHeight: "1.6",
          fontWeight: "500",
          marginBottom: "20px"
        },
      },
      {
        type: "paragraph",
        value: "What small action will you take today to move closer to your dreams?",
        style: { 
          fontSize: 16, 
          color: "#6b7280", 
          textAlign: "center",
          fontStyle: "italic",
          marginBottom: "20px"
        },
      },
      {
        type: "text",
        value: "#MotivationMonday #DreamBig #Success #Inspiration",
        style: { 
          fontSize: 14, 
          color: "#2563eb", 
          textAlign: "center",
          fontWeight: "500"
        },
      },
    ],
  },
  {
    id: 4,
    name: "Corporate Event Invitation",
    category: "Event",
    preview: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&h=400&fit=crop",
    rating: 4.6,
    likes: 298,
    icon: Calendar,
    description: "Elegant invitation template perfect for corporate events, conferences, and networking gatherings",
    content: [
      {
        type: "text",
        value: "You're Cordially Invited",
        style: { 
          fontSize: 36, 
          color: "#7c3aed", 
          fontWeight: "700", 
          textAlign: "center",
          marginBottom: "20px",
          letterSpacing: "-0.02em"
        },
      },
      {
        type: "text",
        value: "Annual Business Summit 2025",
        style: { 
          fontSize: 28, 
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
        value: "Join industry leaders, entrepreneurs, and innovators for two days of insightful presentations, networking opportunities, and collaborative workshops. This year's theme focuses on 'Building Sustainable Business in the Digital Age'.",
        style: { 
          fontSize: 16, 
          color: "#374151", 
          textAlign: "center",
          lineHeight: "1.6",
          marginBottom: "25px",
          maxWidth: "500px"
        },
      },
      {
        type: "paragraph",
        value: "📅 Date: March 15-16, 2025\n📍 Location: Grand Convention Center\n🕒 Time: 9:00 AM - 6:00 PM\n👔 Dress Code: Business Professional",
        style: { 
          fontSize: 16, 
          color: "#4b5563", 
          textAlign: "left",
          lineHeight: "1.8",
          marginBottom: "30px",
          backgroundColor: "#f9fafb",
          padding: "20px",
          borderRadius: "8px",
          borderLeft: "4px solid #7c3aed"
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
          fontWeight: "600",
          display: "block",
          margin: "20px auto",
          fontSize: "16px",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 14px 0 rgba(124, 58, 237, 0.3)"
        },
      },
    ],
  },
  {
    id: 5,
    name: "Product Launch Announcement",
    category: "Marketing",
    preview: "https://images.unsplash.com/photo-1593642532973-d31b6557fa68?w=600&h=400&fit=crop",
    rating: 4.8,
    likes: 387,
    icon: Rocket,
    description: "Dynamic product launch template designed to create buzz and drive pre-orders",
    content: [
      {
        type: "text",
        value: "Revolutionary Innovation Unveiled",
        style: { 
          fontSize: 34, 
          color: "#059669", 
          fontWeight: "800", 
          textAlign: "center",
          marginBottom: "15px",
          textTransform: "uppercase",
          letterSpacing: "0.05em"
        },
      },
      {
        type: "image",
        value: "https://images.unsplash.com/photo-1593642532973-d31b6557fa68?w=600&h=350&fit=crop",
        style: {
          borderRadius: "12px",
          marginBottom: "25px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
        }
      },
      {
        type: "text",
        value: "Introducing the Future of Smart Technology",
        style: { 
          fontSize: 26, 
          color: "#111827", 
          fontWeight: "600", 
          textAlign: "center",
          marginBottom: "20px"
        },
      },
      {
        type: "paragraph",
        value: "After three years of intensive research and development, we're proud to present our groundbreaking solution that will transform how you work, create, and connect. This isn't just another product – it's a paradigm shift.",
        style: { 
          fontSize: 18, 
          color: "#374151", 
          textAlign: "center",
          lineHeight: "1.6",
          marginBottom: "25px",
          maxWidth: "550px"
        },
      },
      {
        type: "paragraph",
        value: "Key Features:\n• AI-powered automation that learns your preferences\n• Seamless integration with 200+ popular tools\n• Enterprise-grade security with end-to-end encryption\n• 99.9% uptime guarantee with 24/7 support\n• Intuitive interface designed for maximum productivity",
        style: { 
          fontSize: 16, 
          color: "#4b5563", 
          textAlign: "left",
          lineHeight: "1.7",
          marginBottom: "25px",
          backgroundColor: "#f8fafc",
          padding: "20px",
          borderRadius: "10px",
          border: "2px solid #e5e7eb"
        },
      },
      {
        type: "text",
        value: "Early Bird Special: 40% Off",
        style: { 
          fontSize: 22, 
          color: "#dc2626", 
          fontWeight: "700", 
          textAlign: "center",
          marginBottom: "15px"
        },
      },
      {
        type: "button",
        value: "Pre-Order Now - Limited Time",
        style: {
          backgroundColor: "#10b981",
          color: "#ffffff",
          padding: "16px 36px",
          borderRadius: "8px",
          fontWeight: "600",
          margin: "20px auto",
          display: "block",
          fontSize: "16px",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 14px 0 rgba(16, 185, 129, 0.4)"
        },
      },
    ],
  },
  {
    id: 6,
    name: "Heartfelt Thank You Message",
    category: "Personal",
    preview: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=600&h=400&fit=crop",
    rating: 4.9,
    likes: 401,
    icon: Heart,
    description: "Elegant thank you template to express genuine gratitude and appreciation",
    content: [
      {
        type: "text",
        value: "With Heartfelt Gratitude",
        style: { 
          fontSize: 34, 
          color: "#dc2626", 
          fontWeight: "600", 
          textAlign: "center",
          marginBottom: "20px",
          fontFamily: "serif"
        },
      },
      {
        type: "image",
        value: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=600&h=300&fit=crop",
        style: {
          borderRadius: "12px",
          marginBottom: "25px"
        }
      },
      {
        type: "paragraph",
        value: "Your kindness and support have made an incredible difference in our journey. From the bottom of our hearts, we want to express how much your trust and partnership mean to us.",
        style: { 
          fontSize: 18, 
          color: "#374151", 
          textAlign: "center",
          lineHeight: "1.7",
          marginBottom: "25px",
          fontStyle: "italic"
        },
      },
      {
        type: "paragraph",
        value: "Whether it was your encouraging words, your business, or simply being part of our community, you've contributed to something special. We're honored to have you with us and look forward to continuing this wonderful relationship.",
        style: { 
          fontSize: 16, 
          color: "#6b7280", 
          textAlign: "center",
          lineHeight: "1.6",
          marginBottom: "20px"
        },
      },
      {
        type: "text",
        value: "Thank you for being amazing!",
        style: { 
          fontSize: 20, 
          color: "#7c3aed", 
          fontWeight: "600", 
          textAlign: "center",
          marginBottom: "20px"
        },
      },
    ],
  },
  {
    id: 7,
    name: "Team Achievement Celebration",
    category: "Corporate",
    preview: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop",
    rating: 4.7,
    likes: 289,
    icon: Award,
    description: "Celebrate team milestones and achievements with this professional template",
    content: [
      {
        type: "text",
        value: "Celebrating Our Success Together",
        style: { 
          fontSize: 32, 
          color: "#1f2937", 
          fontWeight: "700", 
          textAlign: "center",
          marginBottom: "20px"
        },
      },
      {
        type: "image",
        value: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=300&fit=crop",
        style: {
          borderRadius: "10px",
          marginBottom: "25px"
        }
      },
      {
        type: "paragraph",
        value: "We're proud to announce that our team has achieved a remarkable milestone this quarter. Through dedication, collaboration, and innovative thinking, we've exceeded our targets and set new standards of excellence.",
        style: { 
          fontSize: 18, 
          color: "#374151", 
          textAlign: "center",
          lineHeight: "1.6",
          marginBottom: "25px"
        },
      },
      {
        type: "text",
        value: "Key Achievements",
        style: { 
          fontSize: 24, 
          color: "#0f172a", 
          fontWeight: "600", 
          textAlign: "center",
          marginBottom: "15px"
        },
      },
      {
        type: "paragraph",
        value: "• 150% increase in customer satisfaction scores\n• Successful launch of 3 major product features\n• 25% improvement in operational efficiency\n• Recognition as 'Innovation Team of the Year'\n• Zero security incidents maintained for 12 months",
        style: { 
          fontSize: 16, 
          color: "#4b5563", 
          textAlign: "left",
          lineHeight: "1.8",
          marginBottom: "25px",
          backgroundColor: "#fef3c7",
          padding: "20px",
          borderRadius: "8px",
          borderLeft: "4px solid #f59e0b"
        },
      },
      {
        type: "paragraph",
        value: "This success belongs to every team member who contributed their unique skills and unwavering commitment. Here's to continued growth and even greater achievements ahead!",
        style: { 
          fontSize: 16, 
          color: "#374151", 
          textAlign: "center",
          lineHeight: "1.6",
          marginBottom: "25px",
          fontWeight: "500"
        },
      },
    ],
  },
  {
    id: 8,
    name: "Sales Performance Report",
    category: "Business",
    preview: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop",
    rating: 4.8,
    likes: 356,
    icon: TrendingUp,
    description: "Professional sales report template with data visualization and key insights",
    content: [
      {
        type: "text",
        value: "Q3 Sales Performance Report",
        style: { 
          fontSize: 32, 
          color: "#1e40af", 
          fontWeight: "700", 
          textAlign: "center",
          marginBottom: "15px"
        },
      },
      {
        type: "paragraph",
        value: "Comprehensive analysis of our third quarter performance, highlighting key metrics, achievements, and strategic opportunities for continued growth.",
        style: { 
          fontSize: 16, 
          color: "#6b7280", 
          textAlign: "center",
          marginBottom: "25px"
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
        type: "text",
        value: "Executive Summary",
        style: { 
          fontSize: 24, 
          color: "#111827", 
          fontWeight: "600", 
          textAlign: "left",
          marginBottom: "15px"
        },
      },
      {
        type: "paragraph",
        value: "Revenue Growth: $2.4M (up 32% YoY)\nNew Customer Acquisition: 1,847 clients\nCustomer Retention Rate: 94.2%\nAverage Deal Size: $15,600 (up 18%)\nSales Team Performance: 112% of quota achieved",
        style: { 
          fontSize: 16, 
          color: "#374151", 
          textAlign: "left",
          lineHeight: "1.8",
          marginBottom: "25px",
          backgroundColor: "#f0fdf4",
          padding: "20px",
          borderRadius: "8px",
          fontFamily: "monospace"
        },
      },
      {
        type: "paragraph",
        value: "Our strategic focus on enterprise clients and enhanced product offerings has yielded exceptional results. The team's dedication to customer success has established us as a market leader in our sector.",
        style: { 
          fontSize: 16, 
          color: "#4b5563", 
          textAlign: "left",
          lineHeight: "1.6",
          marginBottom: "20px"
        },
      },
    ],
  },
 
 
];
 

const categories = ["All", "Email", "Marketing", "Social", "Event", "Personal"];

const TemplatesPage = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = React.useState("All");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [previewTemplate, setPreviewTemplate] = React.useState(null);

  // const handleSelect = (template) => {
  //   navigate("/editor", { state: { template: { ...template, fixed: true } } });
  // };
  // Complete updated handleSelect function for Templets.jsx
const handleSelect = (template) => {
  let currentY = 60; // Start from top with margin
  const canvasWidth = 800; // Canvas width
  const leftMargin = 80;
  const rightMargin = 80;
  const contentWidth = canvasWidth - leftMargin - rightMargin;

  const elements = template.content.map((block, index) => {
    let elementConfig = {};
    const baseSpacing = 40; // Base spacing between elements

    switch (block.type) {
      case "text":
        // Headers/Headings
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
        // Calculate height based on content length and font size
        const fontSize = block.style?.fontSize || 16;
        const estimatedLines = Math.ceil(block.value.length / 60); // Rough estimate
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
        // Buttons
        const buttonWidth = 220;
        const buttonHeight = 50;
        elementConfig = {
          id: crypto.randomUUID(),
          type: "button",
          content: block.value || "Click Me",
          x: leftMargin + (contentWidth - buttonWidth) / 2, // Center the button
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
        currentY += buttonHeight + baseSpacing + 10; // Extra spacing after buttons
        break;

      case "image":
        // Images
        const imageWidth = Math.min(500, contentWidth);
        const imageHeight = block.style?.height || 300;
        elementConfig = {
          id: crypto.randomUUID(),
          type: "image",
          content: "",
          src: block.value || "https://images.unsplash.com/photo-1557683316-973673baf926?w=500&h=300&fit=crop",
          x: leftMargin + (contentWidth - imageWidth) / 2, // Center the image
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
        // Default fallback
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

  // Navigate to editor with properly formatted template
  navigate("/editor", {
    state: {
      template: {
        id: template.id,
        name: template.name,
        content: elements,
        canvasBackgroundColor: "#FFFFFF",
      },
    },
  });
};
  const filteredTemplates = templates.filter((template) => {
    const matchesCategory =
      selectedCategory === "All" || template.category === selectedCategory;
    const matchesSearch = template.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen to-gray-900 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 "></div>
        <div className="relative px-6 py-16 mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="text-5xl font-bold bg-clip-text text-white mb-6">
              Choose Your Perfect Template
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
              Start with professionally designed templates and customize them to
              match your vision
            </p>
            {/* Search Bar */}
            <div className="max-w-md mx-auto mb-8">
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-6 py-3 bg-gray-800 border border-gray-700 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c2831f] focus:border-transparent"
                title="Search for templates by name"
              />
            </div>
            {/* Create Blank */}
           <button
            onClick={() => {
              localStorage.removeItem("canvasData"); // clear old design
              navigate("/editor", {
                state: {
                  template: {
                    elements: [],              // empty canvas
                  },
                },
              });
            }}
            className="inline-flex items-center space-x-2 px-8 py-4 bg-[#c2831f] text-white rounded-full cursor-pointer"
          >
            <Plus size={20} />
            <span>Start from Blank</span>
          </button>

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
                    ? "bg-[#c2831f] text-white shadow-lg"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
                title={`Filter by ${category} templates`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="group relative bg-gray-800 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
                onClick={() => setPreviewTemplate(template)}
                title="Click to preview template details"
              >
                {/* Preview Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={template.preview}
                    alt={template.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    title={`Preview of ${template.name} template`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Overlay Actions */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button 
                      className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300"
                      title="Preview this template"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewTemplate(template);
                      }}
                    >
                      <Eye size={18} />
                      <span>Preview</span>
                    </button>
                  </div>
                  
                  {/* Category Badge */}
                  <div className="absolute top-4 left-4">
                    <span 
                      className="px-3 py-1 bg-blue-600/90 backdrop-blur-sm text-white text-sm font-medium rounded-full"
                      title={`Category: ${template.category}`}
                    >
                      {template.category}
                    </span>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 
                      className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors duration-200"
                      title={`Template name: ${template.name}`}
                    >
                      {template.name}
                    </h3>
                    <button 
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 hover:bg-gray-700 rounded-full"
                      title="Like this template"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Like functionality would go here
                      }}
                    >
                      <Heart
                        size={18}
                        className="text-gray-400 hover:text-red-400"
                      />
                    </button>
                  </div>
                  
                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <div 
                      className="flex items-center space-x-1"
                      title={`Rating: ${template.rating} out of 5 stars`}
                    >
                      <Star size={14} className="text-yellow-400 fill-current" />
                      <span>{template.rating}</span>
                    </div>
                    <div 
                      className="flex items-center space-x-1"
                      title={`${template.likes} people liked this template`}
                    >
                      <Heart size={14} />
                      <span>{template.likes}</span>
                    </div>
                  </div>
                  
                  {/* Preview Content */}
                  <div className="mt-4 space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {template.content.slice(0, 2).map((element, index) => (
                      <div key={index} className="text-xs text-gray-500">
                        {element.type === "text" &&
                          `📝 ${element.value.substring(0, 30)}...`}
                        {element.type === "paragraph" &&
                          `📄 ${element.value.substring(0, 40)}...`}
                        {element.type === "button" && `🔘 ${element.value}`}
                        {element.type === "image" && `🖼️ Image included`}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* No Results */}
          {filteredTemplates.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4" title="No templates found">🔍</div>
              <h3 className="text-2xl font-semibold text-gray-400 mb-2">
                No templates found
              </h3>
              <p className="text-gray-500 mb-6">
                Try adjusting your search or category filter
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("All");
                }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors duration-200"
                title="Clear all filters and show all templates"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          title="Template preview modal"
        >
          <div className="bg-white rounded-xl shadow-lg p-6 w-[700px] relative text-gray-900 max-h-[90vh] overflow-y-auto">
           <button
            onClick={() => setPreviewTemplate(null)}
            className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center 
                      rounded-full bg-white/90 shadow-md 
                      text-gray-600 hover:bg-red-500 hover:text-white 
                      transition-all duration-300 ease-in-out cursor-pointer"
            title="Close preview"
          >
            X
          </button>

            <h2 className="text-2xl font-bold mb-4" title={`Previewing: ${previewTemplate.name}`}>
              {previewTemplate.name}
            </h2>
            <div className="space-y-4">
              {previewTemplate.content.map((block, index) => {
                if (block.type === "text") {
                  return (
                    <h3 
                      key={index} 
                      style={block.style}
                      title="Text element"
                    >
                      {block.value}
                    </h3>
                  );
                }
                if (block.type === "paragraph") {
                  return (
                    <p 
                      key={index} 
                      style={block.style}
                      title="Paragraph element"
                    >
                      {block.value}
                    </p>
                  );
                }
                if (block.type === "button") {
                  return (
                    <button 
                      key={index} 
                      style={block.style}
                      title="Button element"
                    >
                      {block.value}
                    </button>
                  );
                }
                if (block.type === "image") {
                  return (
                    <img
                      key={index}
                      src={block.value}
                      alt="content"
                      className="rounded-lg"
                      title="Image element"
                    />
                  );
                }
                return null;
              })}
            </div>
            <div className="mt-6 text-right">
              <button
                onClick={() => handleSelect(previewTemplate)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium"
                title="Use this template in the editor"
              >
                Use Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatesPage;