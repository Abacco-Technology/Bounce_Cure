// EditorPage.jsx
import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import CanvasArea from "../Components/Editor/CanvasArea";
import Toolbox from "../Components/Editor/Toolbox";
import PropertiesPanel from "../Components/Editor/PropertiesPanel";

const EditorPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const template = location.state?.template;

  // Shared state for pages
  const [pages, setPages] = useState([{ id: 1, elements: [] }]);
  const [activePage, setActivePage] = useState(0);
  const [selectedElement, setSelectedElement] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Add state for canvas background color
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState('#FFFFFF');

  // Load template if provided
//  useEffect(() => {
//   if (template && template.elements) {
//     const templateElements = Object.entries(template.elements).map(
//       ([key, value], index) => {
//         const fontSize =
//           (typeof value === "object" && value.style?.fontSize) || 20;

//         return {
//           id: `${key}-${template.id || index}`,
//           type: "heading",
//           content: value || "",
//           src: null,
//           x: 80,
//           y: 100 + index * (fontSize + 20), // ✅ space depends on font size
//           width: 300,
//           height: fontSize + 10,
//           style: {
//             fontSize,
//             color: "#000000",
//             backgroundColor: "transparent",
//             ...(typeof value === "object" ? value.style : {}),
//           },
//           fontSize,
//           color:
//             (typeof value === "object" && value.style?.color) || "#000000",
//           backgroundColor:
//             (typeof value === "object" &&
//               value.style?.backgroundColor) ||
//             "transparent",
//           fontFamily: "Arial",
//           rotation: 0,
//           opacity: 1,
//         };
//       }
//     );

//     const updatedPages = [...pages];
//     updatedPages[0] = {
//       ...updatedPages[0],
//       elements: templateElements,
//     };
//     setPages(updatedPages);

//     if (template.canvasBackgroundColor) {
//       setCanvasBackgroundColor(template.canvasBackgroundColor);
//     }
//   }
// }, [template]);


//template page
useEffect(() => {
  if (template) {
    // Handle new format (array of pre-formatted elements)
    if (template.content && Array.isArray(template.content) && template.content[0]?.id) {
      const updatedPages = [...pages];
      updatedPages[0] = {
        ...updatedPages[0],
        elements: template.content,
      };
      setPages(updatedPages);

      if (template.canvasBackgroundColor) {
        setCanvasBackgroundColor(template.canvasBackgroundColor);
      }
      return;
    }
    
    // Handle old format (needs conversion)
    if (template.content && Array.isArray(template.content)) {
      const templateElements = template.content.map((item, index) => {
        const fontSize = item.style?.fontSize || 20;
        let mappedType = item.type;
        
        if (item.type === "text") {
          mappedType = "heading";
        }

        return {
          id: crypto.randomUUID(),
          type: mappedType,
          content: mappedType === "image" ? "" : item.value || "",
          src: mappedType === "image" ? item.value : null,
          x: 80,
          y: 100 + index * (fontSize + 30),
          width: item.style?.width || (mappedType === "image" ? 400 : 300),
          height: item.style?.height || (mappedType === "image" ? 200 : fontSize + 20),
          fontSize,
          color: item.style?.color || "#000000",
          backgroundColor: item.style?.backgroundColor || "transparent",
          fontFamily: item.style?.fontFamily || "Arial",
          fontWeight: item.style?.fontWeight || "normal",
          textAlign: item.style?.textAlign || "left",
          rotation: 0,
          opacity: 1,
        };
      });

      const updatedPages = [...pages];
      updatedPages[0] = {
        ...updatedPages[0],
        elements: templateElements,
      };
      setPages(updatedPages);
    }

    if (template.canvasBackgroundColor) {
      setCanvasBackgroundColor(template.canvasBackgroundColor);
    }
  }
}, [template]);


// For AllTemplates page
useEffect(() => {
  if (template && template.content && Array.isArray(template.content)) {
    const updatedPages = [...pages];
    updatedPages[0] = {
      ...updatedPages[0],
      elements: template.content, // Direct assignment since it's already formatted
    };
    setPages(updatedPages);

    // Set canvas background if provided
    if (template.canvasBackgroundColor) {
      setCanvasBackgroundColor(template.canvasBackgroundColor);
    }
  }
}, [template]);

  // Add element from Toolbox
  const handleAddElement = (type, options = {}) => {
    const newElement = {
      id: crypto.randomUUID(),
      type,
      content: type === "heading" ? "Heading" : type === "paragraph" ? "Paragraph text" : type === "button" ? "Click Me" : "",
      src: type === "image" ? "https://images.unsplash.com/photo-1557683316-973673baf926?w=300&h=200&fit=crop" : null,
      x: 50 + Math.random() * 100,
      y: 50 + Math.random() * 100,
      width: type === "heading" || type === "paragraph" ? 200 : type === "image" ? 150 : 120,
      height: type === "heading" ? 40 : type === "paragraph" ? 60 : type === "image" ? 100 : 40,
      fontSize: type === "heading" ? 24 : 16,
      fontFamily: 'Arial',
      color: '#000000',
      backgroundColor: 'transparent',
      borderColor: '#000000',
      borderWidth: type === "rectangle" || type === "circle" ? 2 : 0,
      borderRadius: type === "button" ? 6 : type === "rectangle" ? 4 : 0,
      rotation: 0,
      opacity: 1,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'left',
      textDecoration: 'none',
      ...options // Spread any additional options passed
    };

    const updatedPages = [...pages];
    updatedPages[activePage].elements.push(newElement);
    setPages(updatedPages);
    setSelectedElement(newElement.id);
    saveToUndoStack();
  };

  // Add layout
  const handleAddLayout = (layoutId) => {
    // Define layout elements based on layoutId
    let layoutElements = [];

    switch (layoutId) {
      case 1: // Header + Content - Campaign Newsletter
        layoutElements = [
          {
            id: crypto.randomUUID(),
            type: "rectangle",
            x: 0,
            y: 0,
            width: 800,
            height: 100,
            backgroundColor: "#4ECDC4",
            borderRadius: 0,
            borderWidth: 0
          },
          {
            id: crypto.randomUUID(),
            type: "heading",
            x: 100,
            y: 30,
            width: 600,
            height: 50,
            content: "Monthly Campaign Newsletter",
            color: "#FFFFFF",
            fontSize: 28,
            fontWeight: "bold",
            textAlign: "center"
          },
          {
            id: crypto.randomUUID(),
            type: "paragraph",
            x: 100,
            y: 130,
            width: 600,
            height: 80,
            content: "Dear valued customer, we're excited to share our latest campaign updates and exclusive offers with you!",
            fontSize: 16
          },
          {
            id: crypto.randomUUID(),
            type: "heading",
            x: 100,
            y: 230,
            width: 300,
            height: 40,
            content: "Special Offers Inside:",
            color: "#000000",
            fontSize: 20,
            fontWeight: "bold"
          },
          {
            id: crypto.randomUUID(),
            type: "paragraph",
            x: 100,
            y: 280,
            width: 600,
            height: 100,
            content: "• 30% off on all premium products\n• Free shipping on orders over $50\n• Exclusive early access to new collections\n• Limited time bonus gifts with purchase",
            fontSize: 16
          },
          {
            id: crypto.randomUUID(),
            type: "button",
            x: 300,
            y: 400,
            width: 200,
            height: 50,
            content: "Shop Now",
            backgroundColor: "#FF6B6B",
            color: "#FFFFFF",
            borderRadius: 6,
            fontSize: 18,
            fontWeight: "bold",
            link: "https://example.com/shop"
          },
          {
            id: crypto.randomUUID(),
            type: "paragraph",
            x: 100,
            y: 480,
            width: 600,
            height: 60,
            content: "Thank you for being part of our community. We appreciate your continued support!",
            fontSize: 14,
            fontStyle: "italic"
          }
        ];
        break;

      case 2: // Two Columns - Marketing Campaign
        layoutElements = [
          {
            id: crypto.randomUUID(),
            type: "rectangle",
            x: 0,
            y: 0,
            width: 400,
            height: 600,
            backgroundColor: "#F8F9FA",
            borderRadius: 0,
            borderWidth: 1,
            borderColor: "#DEE2E6"
          },
          {
            id: crypto.randomUUID(),
            type: "rectangle",
            x: 400,
            y: 0,
            width: 400,
            height: 600,
            backgroundColor: "#F8F9FA",
            borderRadius: 0,
            borderWidth: 1,
            borderColor: "#DEE2E6"
          },
          {
            id: crypto.randomUUID(),
            type: "heading",
            x: 80,
            y: 30,
            width: 235,
            height: 40,
            content: "Campaign Highlights",
            color: "#000000",
            fontSize: 20,
            fontWeight: "bold",
            textAlign: "center"
          },
          {
            id: crypto.randomUUID(),
            type: "heading",
            x: 456,
            y: 30,
            width: 200,
            height: 40,
            content: "Upcoming Events",
            color: "#000000",
            fontSize: 20,
            fontWeight: "bold",
            textAlign: "center"
          },
          {
            id: crypto.randomUUID(),
            type: "image",
            x: 45,
            y: 90,
            width: 300,
            height: 180,
            src: "https://images.unsplash.com/photo-1557683316-973673baf926?w=300&h=180&fit=crop"
          },
          {
            id: crypto.randomUUID(),
            type: "paragraph",
            x: 50,
            y: 290,
            width: 300,
            height: 80,
            content: "Our summer campaign is live! Enjoy exclusive discounts on all products. Limited time offer - don't miss out!",
            fontSize: 14
          },
          {
            id: crypto.randomUUID(),
            type: "paragraph",
            x: 402,
            y: 90,
            width: 310,
            height: 120,
            content: "Join us for our virtual product launch event on June 15th. Be the first to see our new collection and get special launch discounts.",
            fontSize: 14
          },
          {
            id: crypto.randomUUID(),
            type: "button",
            x: 125,
            y: 390,
            width: 140,
            height: 40,
            content: "View Deals",
            backgroundColor: "#45B7D1",
            color: "#FFFFFF",
            borderRadius: 6,
            fontSize: 16,
            link: "https://example.com/deals"
          },
          {
            id: crypto.randomUUID(),
            type: "button",
            x: 470,
            y: 200,
            width: 140,
            height: 40,
            content: "RSVP Now",
            backgroundColor: "#96CEB4",
            color: "#FFFFFF",
            borderRadius: 6,
            fontSize: 16,
            link: "https://example.com/rsvp"
          },
          {
            id: crypto.randomUUID(),
            type: "paragraph",
            x: 413,
            y: 290,
            width: 310,
            height: 120,
            content: "Thank you to all our customers who participated in our spring campaign. Your support helped us raise $10,000 for local charities!",
            fontSize: 14
          }
        ];
        break;

      case 3: // Three Columns - Marketing Services
        layoutElements = [
          {
            id: crypto.randomUUID(),
            type: "rectangle",
            x: 0,
            y: 0,
            width: 300,
            height: 600,
            backgroundColor: "#F8F9FA",
            borderRadius: 0,
            borderWidth: 1,
            borderColor: "#DEE2E6"
          },
          {
            id: crypto.randomUUID(),
            type: "rectangle",
            x: 300,
            y: 0,
            width: 300,
            height: 600,
            backgroundColor: "#F8F9FA",
            borderRadius: 0,
            borderWidth: 1,
            borderColor: "#DEE2E6"
          },
          {
            id: crypto.randomUUID(),
            type: "rectangle",
            x: 500,
            y: 0,
            width: 300,
            height: 600,
            backgroundColor: "#F8F9FA",
            borderRadius: 0,
            borderWidth: 1,
            borderColor: "#DEE2E6"
          },
          {
            id: crypto.randomUUID(),
            type: "heading",
            x: 12,
            y: 39,
            width: 200,
            height: 40,
            content: "Our Services",
            color: "#000000",
            fontSize: 18,
            fontWeight: "bold",
            textAlign: "center"
          },
          {
            id: crypto.randomUUID(),
            type: "heading",
            x: 271,
            y: 41,
            width: 200,
            height: 40,
            content: "Success Stories",
            color: "#000000",
            fontSize: 18,
            fontWeight: "bold",
            textAlign: "center"
          },
          {
            id: crypto.randomUUID(),
            type: "heading",
            x: 508,
            y: 36,
            width: 200,
            height: 40,
            content: "Contact Us",
            color: "#000000",
            fontSize: 18,
            fontWeight: "bold",
            textAlign: "center"
          },
          {
            id: crypto.randomUUID(),
            type: "paragraph",
            x: 35,
            y: 90,
            width: 200,
            height: 120,
            content: "• Email Marketing Campaigns\n• Social Media Management\n• Content Creation\n• SEO Optimization\n• Analytics & Reporting",
            fontSize: 14
          },
          {
            id: crypto.randomUUID(),
            type: "paragraph",
            x: 281,
            y: 95,
            width: 200,
            height: 160,
            content: "\"Our email campaign with MarketingPro increased our open rates by 45% and conversions by 30%. Thank you for the excellent service!\" - Sarah T.",
            fontSize: 14,
            fontStyle: "italic"
          },
          {
            id: crypto.randomUUID(),
            type: "paragraph",
            x: 528,
            y: 98,
            width: 200,
            height: 120,
            content: "Email: info@marketingpro.com\nPhone: (555) 123-4567\nAddress: 123 Marketing St, Business City",
            fontSize: 14
          },
          {
            id: crypto.randomUUID(),
            type: "button",
            x: 60,
            y: 244,
            width: 100,
            height: 35,
            content: "Learn More",
            backgroundColor: "#6C5CE7",
            color: "#FFFFFF",
            borderRadius: 6,
            fontSize: 14,
            link: "https://example.com/services"
          },
          {
            id: crypto.randomUUID(),
            type: "button",
            x: 320,
            y: 244,
            width: 100,
            height: 35,
            content: "View All",
            backgroundColor: "#FF9F43",
            color: "#FFFFFF",
            borderRadius: 6,
            fontSize: 14,
            link: "https://example.com/case-studies"
          },
          {
            id: crypto.randomUUID(),
            type: "button",
            x: 560,
            y: 244,
            width: 100,
            height: 35,
            content: "Get Quote",
            backgroundColor: "#00CEC9",
            color: "#FFFFFF",
            borderRadius: 6,
            fontSize: 14,
            link: "https://example.com/contact"
          },
          {
            id: crypto.randomUUID(),
            type: "paragraph",
            x: 36,
            y: 300,
            width: 200,
            height: 80,
            content: "Thank you for considering our services. We look forward to helping your business grow!",
            fontSize: 14,
            fontStyle: "italic"
          }
        ];
        break;

      case 4: // Header + Two Columns - Thank You Letter
        layoutElements = [
          {
            id: crypto.randomUUID(),
            type: "rectangle",
            x: 0,
            y: 0,
            width: 800,
            height: 100,
            backgroundColor: "#4ECDC4",
            borderRadius: 0,
            borderWidth: 0
          },
          {
            id: crypto.randomUUID(),
            type: "heading",
            x: 168,
            y: 7,
            width: 400,
            height: 50,
            content: "Thank You for Your Purchase!",
            color: "#FFFFFF",
            fontSize: 28,
            fontWeight: "bold",
            textAlign: "center"
          },
          {
            id: crypto.randomUUID(),
            type: "rectangle",
            x: 0,
            y: 100,
            width: 400,
            height: 500,
            backgroundColor: "#F8F9FA",
            borderRadius: 0,
            borderWidth: 1,
            borderColor: "#DEE2E6"
          },
          {
            id: crypto.randomUUID(),
            type: "rectangle",
            x: 400,
            y: 100,
            width: 400,
            height: 500,
            backgroundColor: "#F8F9FA",
            borderRadius: 0,
            borderWidth: 1,
            borderColor: "#DEE2E6"
          },
          {
            id: crypto.randomUUID(),
            type: "heading",
            x: 56,
            y: 140,
            width: 300,
            height: 45,
            content: "Order Confirmation",
            color: "#000000",
            fontSize: 20,
            fontWeight: "bold",
            textAlign: "center"
          },
          {
            id: crypto.randomUUID(),
            type: "heading",
            x: 447,
            y: 137,
            width: 200,
            height: 40,
            content: "What's Next?",
            color: "#000000",
            fontSize: 20,
            fontWeight: "bold",
            textAlign: "center"
          },
          {
            id: crypto.randomUUID(),
            type: "paragraph",
            x: 55,
            y: 207,
            width: 300,
            height: 120,
            content: "Dear Customer,\n\nThank you for your recent purchase! Your order has been confirmed and will be processed within 1-2 business days.",
            fontSize: 14
          },
          {
            id: crypto.randomUUID(),
            type: "paragraph",
            x: 408,
            y: 204,
            width: 300,
            height: 160,
            content: "• You'll receive a shipping confirmation email once your order has been dispatched.\n• Track your order using the link in the confirmation email.\n• Contact our support team if you have any questions.\n• Don't forget to check out our loyalty program for exclusive benefits!",
            fontSize: 14
          },
          {
            id: crypto.randomUUID(),
            type: "paragraph",
            x: 50,
            y: 350,
            width: 300,
            height: 80,
            content: "We appreciate your business and hope you enjoy your purchase. Your support helps us continue to provide quality products and services.",
            fontSize: 14,
            fontStyle: "italic"
          },
          {
            id: crypto.randomUUID(),
            type: "image",
            x: 445,
            y: 360,
            width: 200,
            height: 120,
            src: "https://images.unsplash.com/photo-1557683316-973673baf926?w=200&h=120&fit=crop"
          },
          {
            id: crypto.randomUUID(),
            type: "button",
            x: 125,
            y: 450,
            width: 140,
            height: 40,
            content: "View Order",
            backgroundColor: "#45B7D1",
            color: "#FFFFFF",
            borderRadius: 6,
            fontSize: 16,
            link: "https://example.com/order"
          },
          {
            id: crypto.randomUUID(),
            type: "button",
            x: 470,
            y: 504,
            width: 140,
            height: 40,
            content: "Shop Again",
            backgroundColor: "#FF6B6B",
            color: "#FFFFFF",
            borderRadius: 6,
            fontSize: 16,
            link: "https://example.com/shop"
          }
        ];
        break;

      case 5: // Sidebar + Content - Marketing Campaign
        layoutElements = [
          {
            id: crypto.randomUUID(),
            type: "rectangle",
            x: 0,
            y: 0,
            width: 230,
            height: 600,
            backgroundColor: "#E9ECEF",
            borderRadius: 0,
            borderWidth: 1,
            borderColor: "#DEE2E6"
          },
          {
            id: crypto.randomUUID(),
            type: "rectangle",
            x: 210,
            y: 0,
            width: 600,
            height: 600,
            backgroundColor: "#F8F9FA",
            borderRadius: 0,
            borderWidth: 1,
            borderColor: "#DEE2E6"
          },
          {
            id: crypto.randomUUID(),
            type: "heading",
            x: 0,
            y: 30,
            width: 200,
            height: 40,
            content: "Navigation",
            color: "#000000",
            fontSize: 20,
            fontWeight: "bold",
            textAlign: "center"
          },
          {
            id: crypto.randomUUID(),
            type: "heading",
            x: 300,
            y: 30,
            width: 400,
            height: 50,
            content: "Summer Marketing Campaign",
            color: "#000000",
            fontSize: 24,
            fontWeight: "bold",
            textAlign: "center"
          },
          {
            id: crypto.randomUUID(),
            type: "button",
            x: 50,
            y: 90,
            width: 100,
            height: 35,
            content: "Home",
            backgroundColor: "#6C5CE7",
            color: "#FFFFFF",
            borderRadius: 6,
            fontSize: 14,
            link: "https://example.com/home"
          },
          {
            id: crypto.randomUUID(),
            type: "button",
            x: 50,
            y: 140,
            width: 100,
            height: 35,
            content: "Campaigns",
            backgroundColor: "#6C5CE7",
            color: "#FFFFFF",
            borderRadius: 6,
            fontSize: 14,
            link: "https://example.com/campaigns"
          },
          {
            id: crypto.randomUUID(),
            type: "button",
            x: 50,
            y: 190,
            width: 100,
            height: 35,
            content: "Services",
            backgroundColor: "#6C5CE7",
            color: "#FFFFFF",
            borderRadius: 6,
            fontSize: 14,
            link: "https://example.com/services"
          },
          {
            id: crypto.randomUUID(),
            type: "button",
            x: 50,
            y: 240,
            width: 100,
            height: 35,
            content: "Contact",
            backgroundColor: "#6C5CE7",
            color: "#FFFFFF",
            borderRadius: 6,
            fontSize: 14,
            link: "https://example.com/contact"
          },
          {
            id: crypto.randomUUID(),
            type: "image",
            x: 305,
            y: 100,
            width: 400,
            height: 200,
            src: "https://images.unsplash.com/photo-1557683316-973673baf926?w=400&h=200&fit=crop"
          },
          {
            id: crypto.randomUUID(),
            type: "paragraph",
            x: 260,
            y: 320,
            width: 490,
            height: 100,
            content: "Join our exciting summer marketing campaign! We're offering exclusive deals, early access to new products, and special bonuses for our loyal customers.",
            fontSize: 16
          },
          {
            id: crypto.randomUUID(),
            type: "heading",
            x: 260,
            y: 400,
            width: 200,
            height: 40,
            content: "Campaign Benefits:",
            color: "#000000",
            fontSize: 18,
            fontWeight: "bold"
          },
          {
            id: crypto.randomUUID(),
            type: "paragraph",
            x: 260,
            y: 450,
            width: 490,
            height: 60,
            content: "• Up to 40% discount on selected items\n• Free shipping on all orders\n• Exclusive access to limited edition products\n• Double loyalty points on all purchases",
            fontSize: 14
          },
          {
            id: crypto.randomUUID(),
            type: "button",
            x: 405,
            y: 520,
            width: 200,
            height: 40,
            content: "Join Campaign",
            backgroundColor: "#FF6B6B",
            color: "#FFFFFF",
            borderRadius: 6,
            fontSize: 18,
            fontWeight: "bold",
            link: "https://example.com/join-campaign"
          }
        ];
        break;

      case 6: // Hero Section - Product Launch
        layoutElements = [
          {
            id: crypto.randomUUID(),
            type: "rectangle",
            x: 0,
            y: 0,
            width: 800,
            height: 300,
            backgroundColor: "#FF6B6B",
            borderRadius: 0,
            borderWidth: 0
          },
          {
            id: crypto.randomUUID(),
            type: "heading",
            x: 100,
            y: 80,
            width: 600,
            height: 60,
            content: "New Product Launch Campaign",
            color: "#FFFFFF",
            fontSize: 36,
            fontWeight: "bold",
            textAlign: "center"
          },
          {
            id: crypto.randomUUID(),
            type: "paragraph",
            x: 100,
            y: 160,
            width: 600,
            height: 40,
            content: "Be the first to experience our revolutionary new product line",
            color: "#FFFFFF",
            fontSize: 18,
            textAlign: "center"
          },
          {
            id: crypto.randomUUID(),
            type: "button",
            x: 300,
            y: 220,
            width: 200,
            height: 50,
            content: "Pre-Order Now",
            backgroundColor: "#FFFFFF",
            color: "#FF6B6B",
            borderRadius: 6,
            fontSize: 18,
            fontWeight: "bold",
            link: "https://example.com/preorder"
          },
          {
            id: crypto.randomUUID(),
            type: "rectangle",
            x: 0,
            y: 300,
            width: 800,
            height: 300,
            backgroundColor: "#F8F9FA",
            borderRadius: 0,
            borderWidth: 1,
            borderColor: "#DEE2E6"
          },
          {
            id: crypto.randomUUID(),
            type: "heading",
            x: 200,
            y: 350,
            width: 400,
            height: 40,
            content: "Launch Event Details",
            color: "#000000",
            fontSize: 24,
            fontWeight: "bold",
            textAlign: "center"
          },
          {
            id: crypto.randomUUID(),
            type: "paragraph",
            x: 100,
            y: 410,
            width: 600,
            height: 80,
            content: "Join us for our virtual launch event on June 30th at 2:00 PM EST. Get exclusive insights, product demonstrations, and special launch-day discounts.",
            fontSize: 16
          },
          {
            id: crypto.randomUUID(),
            type: "button",
            x: 300,
            y: 510,
            width: 200,
            height: 50,
            content: "RSVP for Event",
            backgroundColor: "#45B7D1",
            color: "#FFFFFF",
            borderRadius: 6,
            fontSize: 18,
            fontWeight: "bold",
            link: "https://example.com/rsvp"
          }
        ];
        break;

      case 7: // Card Layout - Product Showcase
        layoutElements = [
          {
            id: crypto.randomUUID(),
            type: "heading",
            x: 150,
            y: 30,
            width: 500,
            height: 40,
            content: "Featured Campaign Products",
            color: "#000000",
            fontSize: 28,
            fontWeight: "bold",
            textAlign: "center"
          },
          {
            id: crypto.randomUUID(),
            type: "rectangle",
            x: 50,
            y: 90,
            width: 220,
            height: 240,
            backgroundColor: "#FFFFFF",
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "#DEE2E6"
          },
          {
            id: crypto.randomUUID(),
            type: "rectangle",
            x: 290,
            y: 90,
            width: 220,
            height: 240,
            backgroundColor: "#FFFFFF",
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "#DEE2E6"
          },
          {
            id: crypto.randomUUID(),
            type: "rectangle",
            x: 530,
            y: 90,
            width: 220,
            height: 240,
            backgroundColor: "#FFFFFF",
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "#DEE2E6"
          },
          {
            id: crypto.randomUUID(),
            type: "image",
            x: 70,
            y: 100,
            width: 180,
            height: 120,
            src: "https://images.unsplash.com/photo-1557683316-973673baf926?w=180&h=120&fit=crop"
          },
          {
            id: crypto.randomUUID(),
            type: "heading",
            x: 60,
            y: 230,
            width: 200,
            height: 30,
            content: "Premium Headphones",
            color: "#000000",
            fontSize: 16,
            fontWeight: "bold",
            textAlign: "center"
          },
          {
            id: crypto.randomUUID(),
            type: "paragraph",
            x: 90,
            y: 260,
            width: 140,
            height: 20,
            content: "$129.99",
            color: "#FF6B6B",
            fontSize: 16,
            fontWeight: "bold",
            textAlign: "center"
          },
          {
            id: crypto.randomUUID(),
            type: "image",
            x: 310,
            y: 100,
            width: 180,
            height: 120,
            src: "https://images.unsplash.com/photo-1520209759809-a9bcb6cb3241?w=180&h=120&fit=crop"
          },
          {
            id: crypto.randomUUID(),
            type: "heading",
            x: 330,
            y: 230,
            width: 140,
            height: 20,
            content: "Smart Watch",
            color: "#000000",
            fontSize: 16,
            fontWeight: "bold",
            textAlign: "center"
          },
          {
            id: crypto.randomUUID(),
            type: "paragraph",
            x: 330,
            y: 260,
            width: 140,
            height: 20,
            content: "$199.99",
            color: "#FF6B6B",
            fontSize: 16,
            fontWeight: "bold",
            textAlign: "center"
          },
          {
            id: crypto.randomUUID(),
            type: "image",
            x: 550,
            y: 100,
            width: 180,
            height: 120,
            src: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=180&h=120&fit=crop"
          },
          {
            id: crypto.randomUUID(),
            type: "heading",
            x: 540,
            y: 230,
            width: 200,
            height: 30,
            content: "Wireless Earbuds",
            color: "#000000",
            fontSize: 16,
            fontWeight: "bold",
            textAlign: "center"
          },
          {
            id: crypto.randomUUID(),
            type: "paragraph",
            x: 570,
            y: 260,
            width: 140,
            height: 20,
            content: "$79.99",
            color: "#FF6B6B",
            fontSize: 16,
            fontWeight: "bold",
            textAlign: "center"
          },
          {
            id: crypto.randomUUID(),
            type: "button",
            x: 110,
            y: 290,
            width: 100,
            height: 30,
            content: "Buy Now",
            backgroundColor: "#45B7D1",
            color: "#FFFFFF",
            borderRadius: 6,
            fontSize: 14,
            link: "https://example.com/product1"
          },
          {
            id: crypto.randomUUID(),
            type: "button",
            x: 350,
            y: 290,
            width: 100,
            height: 30,
            content: "Buy Now",
            backgroundColor: "#45B7D1",
            color: "#FFFFFF",
            borderRadius: 6,
            fontSize: 14,
            link: "https://example.com/product2"
          },
          {
            id: crypto.randomUUID(),
            type: "button",
            x: 590,
            y: 290,
            width: 100,
            height: 30,
            content: "Buy Now",
            backgroundColor: "#45B7D1",
            color: "#FFFFFF",
            borderRadius: 6,
            fontSize: 14,
            link: "https://example.com/product3"
          },
          {
            id: crypto.randomUUID(),
            type: "paragraph",
            x: 100,
            y: 350,
            width: 600,
            height: 60,
            content: "Thank you for supporting our campaign! All purchases during this event include a donation to our chosen charity.",
            fontSize: 14,
            fontStyle: "italic",
            textAlign: "center"
          },
          {
            id: crypto.randomUUID(),
            type: "button",
            x: 300,
            y: 430,
            width: 200,
            height: 40,
            content: "View All Products",
            backgroundColor: "#FF6B6B",
            color: "#FFFFFF",
            borderRadius: 6,
            fontSize: 16,
            fontWeight: "bold",
            link: "https://example.com/all-products"
          },
          {
            id: crypto.randomUUID(),
            type: "button",
            x: 300,
            y: 490,
            width: 200,
            height: 40,
            content: "Learn About Our Cause",
            backgroundColor: "#96CEB4",
            color: "#FFFFFF",
            borderRadius: 6,
            fontSize: 16,
            fontWeight: "bold",
            link: "https://example.com/charity"
          }
        ];
        break;

      case 8: // Newsletter - Marketing Signup
        layoutElements = [
          {
            id: crypto.randomUUID(),
            type: "rectangle",
            x: 0,
            y: 0,
            width: 800,
            height: 150,
            backgroundColor: "#45B7D1",
            borderRadius: 0,
            borderWidth: 0
          },
          {
            id: crypto.randomUUID(),
            type: "heading",
            x: 180,
            y: 35,
            width: 500,
            height: 40,
            content: "Join Our Marketing Community",
            color: "#FFFFFF",
            fontSize: 28,
            fontWeight: "bold",
            textAlign: "center"
          },
          {
            id: crypto.randomUUID(),
            type: "rectangle",
            x: 0,
            y: 120,
            width: 800,
            height: 500,
            backgroundColor: "#F8F9FA",
            borderRadius: 0,
            borderWidth: 1,
            borderColor: "#DEE2E6"
          },
          {
            id: crypto.randomUUID(),
            type: "paragraph",
            x: 50,
            y: 150,
            width: 700,
            height: 80,
            content: "Subscribe to our newsletter and get exclusive marketing tips, campaign strategies, and special offers delivered straight to your inbox.",
            fontSize: 16
          },
          {
            id: crypto.randomUUID(),
            type: "heading",
            x: 200,
            y: 250,
            width: 400,
            height: 40,
            content: "What You'll Receive:",
            color: "#000000",
            fontSize: 20,
            fontWeight: "bold",
            textAlign: "center"
          },
          {
            id: crypto.randomUUID(),
            type: "paragraph",
            x: 100,
            y: 300,
            width: 550,
            height: 80,
            content: "• Weekly marketing insights and trends\n• Exclusive campaign templates and resources\n• Early access to new tools and features\n• Special discounts on marketing services",
            fontSize: 14
          },
          {
            id: crypto.randomUUID(),
            type: "input",
            x: 200,
            y: 400,
            width: 400,
            height: 40,
            placeholder: "Enter your email address",
            backgroundColor: "#FFFFFF",
            borderColor: "#CED4DA",
            borderRadius: 4
          },
          {
            id: crypto.randomUUID(),
            type: "button",
            x: 300,
            y: 460,
            width: 200,
            height: 40,
            content: "Subscribe Now",
            backgroundColor: "#28A745",
            color: "#FFFFFF",
            borderRadius: 6,
            fontSize: 16,
            fontWeight: "bold",
            link: "https://example.com/subscribe"
          }
        ];
        break;

      case 9: // Product Showcase - Campaign Special
        layoutElements = [
          {
            id: crypto.randomUUID(),
            type: "rectangle",
            x: 0,
            y: 0,
            width: 500,
            height: 600,
            backgroundColor: "#F8F9FA",
            borderRadius: 0,
            borderWidth: 1,
            borderColor: "#DEE2E6"
          },
          {
            id: crypto.randomUUID(),
            type: "rectangle",
            x: 420,
            y: 0,
            width: 380,
            height: 600,
            backgroundColor: "#FFFFFF",
            borderRadius: 0,
            borderWidth: 1,
            borderColor: "#DEE2E6"
          },
          {
            id: crypto.randomUUID(),
            type: "image",
            x: 50,
            y: 50,
            width: 300,
            height: 300,
            src: "https://images.unsplash.com/photo-1557683316-973673baf926?w=300&h=300&fit=crop"
          },
          {
            id: crypto.randomUUID(),
            type: "heading",
            x: 500,
            y: 50,
            width: 300,
            height: 40,
            content: "Campaign Special",
            color: "#000000",
            fontSize: 24,
            fontWeight: "bold"
          },
          {
            id: crypto.randomUUID(),
            type: "paragraph",
            x: 440,
            y: 110,
            width: 340,
            height: 80,
            content: "Limited time offer on our premium marketing toolkit. Get everything you need to run successful campaigns at a special price!",
            fontSize: 16
          },
          {
            id: crypto.randomUUID(),
            type: "heading",
            x: 510,
            y: 210,
            width: 200,
            height: 40,
            content: "Only $99.99",
            color: "#FF6B6B",
            fontSize: 28,
            fontWeight: "bold"
          },
          {
            id: crypto.randomUUID(),
            type: "paragraph",
            x: 440,
            y: 270,
            width: 340,
            height: 100,
            content: "• Email campaign templates\n• Social media content calendar\n• Analytics dashboard\n• Customer segmentation tools\n• A/B testing framework",
            fontSize: 14
          },
          {
            id: crypto.randomUUID(),
            type: "button",
            x: 520,
            y: 390,
            width: 180,
            height: 40,
            content: "Get the Toolkit",
            backgroundColor: "#007BFF",
            color: "#FFFFFF",
            borderRadius: 6,
            fontSize: 16,
            fontWeight: "bold",
            link: "https://example.com/toolkit"
          },
          {
            id: crypto.randomUUID(),
            type: "button",
            x: 520,
            y: 450,
            width: 180,
            height: 35,
            content: "View Demo",
            backgroundColor: "#6C757D",
            color: "#FFFFFF",
            borderRadius: 6,
            fontSize: 14,
            link: "https://example.com/demo"
          },
          {
            id: crypto.randomUUID(),
            type: "heading",
            x: 100,
            y: 360,
            width: 200,
            height: 30,
            content: "Customer Reviews",
            color: "#000000",
            fontSize: 18,
            fontWeight: "bold",
            textAlign: "center"
          },
          {
            id: crypto.randomUUID(),
            type: "paragraph",
            x: 100,
            y: 400,
            width: 200,
            height: 20,
            content: "★★★★★ (4.9 out of 5)",
            color: "#FFD700",
            fontSize: 16,
            textAlign: "center"
          },
          {
            id: crypto.randomUUID(),
            type: "paragraph",
            x: 50,
            y: 430,
            width: 300,
            height: 60,
            content: "\"This toolkit transformed our marketing strategy. Thank you for creating such a valuable resource!\"",
            fontSize: 12,
            fontStyle: "italic",
            textAlign: "center"
          },
          {
            id: crypto.randomUUID(),
            type: "paragraph",
            x: 100,
            y: 480,
            width: 200,
            height: 20,
            content: "- Marketing Director, TechCorp",
            fontSize: 12,
            textAlign: "center"
          },
          {
            id: crypto.randomUUID(),
            type: "paragraph",
            x: 50,
            y: 520,
            width: 300,
            height: 40,
            content: "Thank you for supporting our campaign! 10% of all proceeds go to marketing education programs.",
            fontSize: 12,
            fontStyle: "italic",
            textAlign: "center"
          }
        ];
        break;

      case 10: // Testimonial - Customer Appreciation
        layoutElements = [
          {
            id: crypto.randomUUID(),
            type: "rectangle",
            x: 0,
            y: 0,
            width: 800,
            height: 600,
            backgroundColor: "#F8F9FA",
            borderRadius: 0,
            borderWidth: 1,
            borderColor: "#DEE2E6"
          },
          {
            id: crypto.randomUUID(),
            type: "heading",
            x: 150,
            y: 50,
            width: 500,
            height: 40,
            content: "Customer Appreciation Campaign",
            color: "#000000",
            fontSize: 28,
            fontWeight: "bold",
            textAlign: "center"
          },
          {
            id: crypto.randomUUID(),
            type: "paragraph",
            x: 100,
            y: 110,
            width: 600,
            height: 40,
            content: "We're grateful for our amazing customers and their continued support!",
            color: "#666666",
            fontSize: 16,
            textAlign: "center"
          },
          {
            id: crypto.randomUUID(),
            type: "rectangle",
            x: 100,
            y: 170,
            width: 600,
            height: 200,
            backgroundColor: "#FFFFFF",
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "#DEE2E6"
          },
          {
            id: crypto.randomUUID(),
            type: "paragraph",
            x: 100,
            y: 190,
            width: 600,
            height: 120,
            content: "This campaign has been incredible! The results exceeded our expectations and the team's dedication was outstanding. Thank you for helping us achieve our marketing goals and for the exceptional service throughout the process.",
            fontSize: 16,
            fontStyle: "italic"
          },
          {
            id: crypto.randomUUID(),
            type: "heading",
            x: 300,
            y: 270,
            width: 200,
            height: 30,
            content: "Sarah Johnson",
            color: "#000000",
            fontSize: 18,
            fontWeight: "bold",
            textAlign: "center"
          },
          {
            id: crypto.randomUUID(),
            type: "paragraph",
            x: 300,
            y: 300,
            width: 200,
            height: 20,
            content: "Marketing Director, GrowthCo",
            fontSize: 14,
            textAlign: "center"
          },
          {
            id: crypto.randomUUID(),
            type: "rectangle",
            x: 100,
            y: 400,
            width: 180,
            height: 100,
            backgroundColor: "#FFFFFF",
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "#DEE2E6"
          },
          {
            id: crypto.randomUUID(),
            type: "rectangle",
            x: 310,
            y: 400,
            width: 180,
            height: 100,
            backgroundColor: "#FFFFFF",
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "#DEE2E6"
          },
          {
            id: crypto.randomUUID(),
            type: "rectangle",
            x: 520,
            y: 400,
            width: 180,
            height: 100,
            backgroundColor: "#FFFFFF",
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "#DEE2E6"
          },
          {
            id: crypto.randomUUID(),
            type: "paragraph",
            x: 110,
            y: 400,
            width: 150,
            height: 60,
            content: "\"Outstanding results and professional service!\"",
            fontSize: 12,
            fontStyle: "italic",
            textAlign: "center"
          },
          {
            id: crypto.randomUUID(),
            type: "paragraph",
            x: 130,
            y: 460,
            width: 100,
            height: 20,
            content: "- Mike T.",
            fontSize: 12,
            textAlign: "center"
          },
          {
            id: crypto.randomUUID(),
            type: "paragraph",
            x: 320,
            y: 400,
            width: 150,
            height: 60,
            content: "\"Exceeded all our expectations!\"",
            fontSize: 12,
            fontStyle: "italic",
            textAlign: "center"
          },
          {
            id: crypto.randomUUID(),
            type: "paragraph",
            x: 320,
            y: 460,
            width: 150,
            height: 20,
            content: "- Lisa K.",
            fontSize: 12,
            textAlign: "center"
          },
          {
            id: crypto.randomUUID(),
            type: "paragraph",
            x: 530,
            y: 400,
            width: 150,
            height: 60,
            content: "\"Highly recommend their services!\"",
            fontSize: 12,
            fontStyle: "italic",
            textAlign: "center"
          },
          {
            id: crypto.randomUUID(),
            type: "paragraph",
            x: 560,
            y: 460,
            width: 100,
            height: 20,
            content: "- John D.",
            fontSize: 12,
            textAlign: "center"
          },
          {
            id: crypto.randomUUID(),
            type: "button",
            x: 300,
            y: 540,
            width: 200,
            height: 40,
            content: "Start Your Campaign",
            backgroundColor: "#FF6B6B",
            color: "#FFFFFF",
            borderRadius: 6,
            fontSize: 16,
            fontWeight: "bold",
            link: "https://example.com/start-campaign"
          }
        ];
        break;

      default:
        // Default to a simple layout
        layoutElements = [
          {
            id: crypto.randomUUID(),
            type: "heading",
            x: 400,
            y: 50,
            width: 200,
            height: 40,
            content: "Marketing Campaign",
            color: "#000000",
            fontSize: 24,
            fontWeight: "bold",
            textAlign: "center"
          },
          {
            id: crypto.randomUUID(),
            type: "paragraph",
            x: 100,
            y: 150,
            width: 600,
            height: 80,
            content: "Thank you for your interest in our marketing services. We look forward to helping you achieve your business goals.",
            fontSize: 16
          }
        ];
    }

    const updatedPages = [...pages];
    updatedPages[activePage].elements = [...updatedPages[activePage].elements, ...layoutElements];
    setPages(updatedPages);
    saveToUndoStack();
  };

  // Upload image
  const handleUploadImage = (src) => {
    const newElement = {
      id: crypto.randomUUID(),
      type: "image",
      src,
      x: 50 + Math.random() * 100,
      y: 50 + Math.random() * 100,
      width: 150,
      height: 100,
      rotation: 0,
      opacity: 1,
      borderRadius: 0
    };

    const updatedPages = [...pages];
    updatedPages[activePage].elements.push(newElement);
    setPages(updatedPages);
    setSelectedElement(newElement.id);
    saveToUndoStack();
  };

  // Update elements after drag/resize/edit
  const handleUpdate = (updatedElements) => {
    const updatedPages = [...pages];
    updatedPages[activePage].elements = updatedElements;
    setPages(updatedPages);
  };

  // Update single element
  const updateElement = (id, updates) => {
    const updatedPages = [...pages];
    updatedPages[activePage].elements = updatedPages[activePage].elements.map(el =>
      el.id === id ? { ...el, ...updates } : el
    );
    setPages(updatedPages);
  };

  // Undo/Redo functionality
  const saveToUndoStack = () => {
    setUndoStack(prev => [...prev.slice(-19), JSON.parse(JSON.stringify(pages))]);
    setRedoStack([]);
  };

  const undo = () => {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1];
      setRedoStack(prev => [JSON.parse(JSON.stringify(pages)), ...prev.slice(0, 19)]);
      setPages(previousState);
      setUndoStack(prev => prev.slice(0, -1));
      setSelectedElement(null);
    }
  };

  const redo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack[0];
      setUndoStack(prev => [...prev.slice(-19), JSON.parse(JSON.stringify(pages))]);
      setPages(nextState);
      setRedoStack(prev => prev.slice(1));
      setSelectedElement(null);
    }
  };

  // Delete selected element
  const deleteElement = () => {
    if (selectedElement) {
      const updatedPages = [...pages];
      updatedPages[activePage].elements = updatedPages[activePage].elements.filter(
        el => el.id !== selectedElement
      );
      setPages(updatedPages);
      setSelectedElement(null);
      saveToUndoStack();
    }
  };

  // Duplicate element
  const duplicateElement = () => {
    if (selectedElement) {
      const element = pages[activePage].elements.find(el => el.id === selectedElement);
      if (element) {
        const duplicated = {
          ...element,
          id: crypto.randomUUID(),
          x: element.x + 20,
          y: element.y + 20
        };
        const updatedPages = [...pages];
        updatedPages[activePage].elements.push(duplicated);
        setPages(updatedPages);
        setSelectedElement(duplicated.id);
        saveToUndoStack();
      }
    }
  };

  
const handleSendCampaign = () => {
  const currentElements = pages[activePage].elements;
  
  // ✅ Ensure all elements have proper numeric values
  const normalizedElements = currentElements.map(el => ({
    ...el,
    x: Number(el.x) || 0,
    y: Number(el.y) || 0,
    width: Number(el.width) || (el.type === 'image' ? 250 : 300),
    height: Number(el.height) || (el.type === 'paragraph' ? 40 : 80),
    fontSize: Number(el.fontSize) || 16,
    rotation: Number(el.rotation) || 0,
    opacity: Number(el.opacity) || 1,
  }));
  
  navigate('/send-campaign', { 
    state: { 
      canvasData: normalizedElements,
      subject: "",
      canvasBackgroundColor: canvasBackgroundColor,  // ✅ CORRECT - use the state variable from EditorPage
      timestamp: Date.now() // Force refresh
    } 
  });
};
  

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Toolbox */}
      <Toolbox
        onAddElement={handleAddElement}
        onUploadImage={handleUploadImage}
        onSelectStockImage={handleUploadImage}
        selectedElement={selectedElement}
        onUndo={undo}
        onRedo={redo}
        onDelete={deleteElement}
        onDuplicate={duplicateElement}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        zoomLevel={zoomLevel}
        setZoomLevel={setZoomLevel}
        showGrid={showGrid}
        setShowGrid={setShowGrid}
        canvasBackgroundColor={canvasBackgroundColor}
        setCanvasBackgroundColor={setCanvasBackgroundColor}
        onAddLayout={handleAddLayout}
      />

      {/* Canvas */}
      <div className="flex-1 overflow-hidden">
        <CanvasArea
          pages={pages}
          setPages={setPages}
          activePage={activePage}
          setActivePage={setActivePage}
          onUpdate={handleUpdate}
          selectedElement={selectedElement}
          setSelectedElement={setSelectedElement}
          updateElement={updateElement}
          zoomLevel={zoomLevel}
          showGrid={showGrid}
          canvasBackgroundColor={canvasBackgroundColor}
          onSendCampaign={handleSendCampaign}
        />
      </div>

      {/* Properties Panel */}
      <PropertiesPanel
        elements={pages[activePage].elements}
        selectedElement={selectedElement}
        setSelectedElement={setSelectedElement}
        updateElement={updateElement}
        setElements={(updatedElements) => handleUpdate(updatedElements)}
      />
    </div>
  );
};

export default EditorPage;