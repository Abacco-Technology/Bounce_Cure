// client/src/pages/Campaign/pages/SendCampaign.jsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CheckCircle, ChevronDown, ChevronUp, Send, Users, Settings,
  FileText, Palette, Check, Clock, Calendar, AlertCircle,
  Mail, RefreshCw, LogOut
} from "lucide-react";
import ShuffleSubjectModal from "../Components/ShuffleSubjectModal";
import { Shuffle } from "lucide-react";
const API_URL = import.meta.env.VITE_VRI_URL;

const steps = [
  {
    id: "recipients",
    title: "To",
    description: "Choose who to send to",
    icon: Users,
  },
  {
    id: "setup",
    title: "From",
    description: "Set up your email",
    icon: Settings,
  },
  {
    id: "template",
    title: "Template",
    description: "Choose a template",
    icon: FileText,
  },
  
  {
    id: "schedule",
    title: "Schedule",
    description: "Schedule your campaign",
    icon: Clock,
  },
  {
    id: "confirm",
    title: "Confirm",
    description: "Review and send",
    icon: Check,
  },
];

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("EmailPreview Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-medium">Preview Error</h3>
          <p className="text-red-600 text-sm mt-1">
            Unable to display email preview. Please check your email design.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Replace the EmailPreview function in SendCampaign.jsx with this:

// ✅ FIXED EmailPreview function in SendCampaign.jsx

function EmailPreview({ pages, activePage, zoomLevel = 1.0, formData, canvasBackgroundColor }) {
    if (!pages || !pages.length || activePage === undefined || activePage >= pages.length) {
    return (
      <div className="flex items-center justify-center h-full bg-white rounded-lg p-8">
        <div className="text-center text-gray-400">
          <div className="text-5xl mb-3">📧</div>
          <p className="text-gray-600 font-medium">No content to preview</p>
        </div>
      </div>
    );
  }

  const currentPage = pages[activePage];
  if (!currentPage || !currentPage.elements || currentPage.elements.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-white rounded-lg p-8">
        <div className="text-center text-gray-400">
          <div className="text-5xl mb-3">📧</div>
          <p className="text-gray-600 font-medium">Empty canvas</p>
        </div>
      </div>
    );
  }

  // ✅ Get background color from location state
  const backgroundColor = canvasBackgroundColor || '#FFFFFF';

  // Normalize elements
const CONTAINER_WIDTH = 600;

const normalized = currentPage.elements.map(e => {
  const x = Number(e.x) || 0;
  const width = Number(e.width) || 300;

  let computedAlign = e.textAlign;

if (!computedAlign) {
    const center = x + width / 2;
    
    // ✅ Updated thresholds to 200-400
    if (center >= 200 && center <= 400) {
      computedAlign = "center";
    } else if (center > 400) {
      computedAlign = "right";
    } else {
      computedAlign = "left";
    }
  }
  return {
    ...e,
    x,
    y: Number(e.y) || 0,
    width,
    height: Number(e.height) || 80,
    fontSize: Number(e.fontSize) || 16,
    textAlign: computedAlign,
  };
});


  // Sort and group elements
  const sorted = [...normalized].sort((a, b) => {
    if (Math.abs(a.y - b.y) > 10) return a.y - b.y;
    return a.x - b.x;
  });

  const groupIntoRows = (elements) => {
    const rows = [];
    const THRESHOLD = 15;
    
    elements.forEach(el => {
      const elMidpoint = el.y + ((el.height || 80) / 2);
      let placed = false;
      
      for (const row of rows) {
        const rowMidpoint = (row[0].y + ((row[0].height || 80) / 2));
        if (Math.abs(elMidpoint - rowMidpoint) < THRESHOLD) {
          row.push(el);
          placed = true;
          break;
        }
      }
      
      if (!placed) rows.push([el]);
    });
    
    rows.forEach(row => row.sort((a, b) => a.x - b.x));
    return rows;
  };

  const rows = groupIntoRows(sorted);

  // ✅ Render element with all types
  const renderElement = (el) => {
    const baseStyle = {
      fontFamily: el.fontFamily || "Arial, sans-serif",
      color: el.color || "#333",
      textAlign: el.textAlign || "left",
    };

    switch (el.type) {
      case "heading":
      case "subheading":
      case "paragraph":
      case "blockquote":
        return (
          <div style={{
            ...baseStyle,
            fontSize: `${el.fontSize || 16}px`,
            fontWeight: el.fontWeight || (el.type === 'heading' ? '700' : 'normal'),
            fontStyle: el.fontStyle || 'normal',
            textDecoration: el.textDecoration || 'none',
            lineHeight: el.lineHeight || 1.4,
            margin: "6px 0",
            backgroundColor: el.backgroundColor || "transparent",
            wordWrap: "break-word",
            whiteSpace: "pre-line",
            ...(el.type === 'blockquote' && {
              borderLeft: `4px solid ${el.borderColor || '#ccc'}`,
              paddingLeft: '12px',
              fontStyle: 'italic'
            })
          }} dangerouslySetInnerHTML={{ __html: el.content || "Text" }} />
        );

      case "image":
        return (
          <div style={{ textAlign: el.textAlign || "center", margin: "8px 0" }}>
            <img
              src={el.src || "https://via.placeholder.com/300x200"}
              alt={el.alt || "Image"}
              style={{
                display: "block",
                margin: "0 auto",
                width: "100%",
                maxWidth: `${el.width || 250}px`,
                height: "auto",
                borderRadius: `${el.borderRadius || 0}px`,
                border: el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor}` : "none",
              }}
            />
          </div>
        );

    case "button":
      // ✅ Compute alignment from element's x position if textAlign not explicitly set
      let buttonAlign = el.textAlign;
      if (!buttonAlign) {
        const center = el.x + el.width / 2;
        
        // ✅ Better thresholds for 600px canvas
        if (center >= 200 && center <= 400) {
          buttonAlign = "center";
        } else if (center > 400) {
          buttonAlign = "right";
        } else {
          buttonAlign = "left";
        }
      }

      return (
        <div
          style={{
            textAlign: buttonAlign,
            margin: "12px 0",
            width: "100%",
            display: "block"
          }}
        >
          
          <a href={el.email ? `mailto:${el.email}` : (el.link || "#")}
            style={{
              display: "inline-block",
              padding: el.padding || "10px 18px",
              background: el.backgroundColor || "#c2831f",
              color: el.color || "#fff",
              borderRadius: `${el.borderRadius || 6}px`,
              textDecoration: "none",
              fontWeight: el.fontWeight || "700",
              fontSize: `${el.fontSize || 16}px`,
              fontFamily: el.fontFamily || "Arial, sans-serif",
            }}
          >
            {el.content || "Click Me"}
          </a>
        </div>
      );
      
      case "line":
        return (
          <hr style={{
            border: "none",
            height: `${el.strokeWidth || 1}px`,
            background: el.strokeColor || "#ddd",
            margin: `${el.marginTop || 12}px 0 ${el.marginBottom || 12}px 0`,
          }} />
        );

      case "rectangle":
        return (
          <div style={{
            width: "100%",
            height: `${el.height || 100}px`,
            backgroundColor: el.backgroundColor || "#4ECDC4",
            border: el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor}` : "none",
            borderRadius: `${el.borderRadius || 4}px`,
            margin: "8px 0",
          }} />
        );

      case "circle":
        const size = Math.min(el.width || 100, el.height || 100);
        return (
          <div style={{
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: el.backgroundColor || "#FF6B6B",
            border: el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor}` : "none",
            borderRadius: "50%",
            margin: "8px auto",
          }} />
        );

      case "triangle":
        return (
          <div style={{
            width: 0,
            height: 0,
            borderLeft: `${(el.width || 50) / 2}px solid transparent`,
            borderRight: `${(el.width || 50) / 2}px solid transparent`,
            borderBottom: `${el.height || 86}px solid ${el.backgroundColor || "#FF9F43"}`,
            margin: "8px auto",
          }} />
        );

      case "star":
        return (
          <div style={{
            textAlign: "center",
            fontSize: `${Math.min(el.width, el.height) || 24}px`,
            color: el.backgroundColor || el.color || "#FFD93D",
            margin: "8px 0",
          }}>★</div>
        );

      case "hexagon":
        return (
          <div style={{
            width: `${el.width || 100}px`,
            height: `${el.height || 100}px`,
            backgroundColor: el.backgroundColor || "#6C5CE7",
            clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            margin: "8px auto",
          }} />
        );

      case "arrow":
        return (
          <div style={{
            textAlign: "center",
            fontSize: `${Math.min(el.width, el.height) || 24}px`,
            color: el.color || "#00CEC9",
            margin: "8px 0",
            transform: `rotate(${el.rotation || 0}deg)`,
          }}>→</div>
        );

      case "social":
        return (
          <a href={el.link || "#"} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", margin: "0 4px" }}>
            <img 
              src={el.src} 
              alt={el.platform} 
              style={{ width: `${el.width || 32}px`, height: `${el.height || 32}px` }} 
            />
          </a>
        );

      case "icon":
        const iconMap = {
          'Star': '★', 'Heart': '♥', 'Check': '✓', 'Arrow': '→',
          'Home': '⌂', 'User': '👤', 'Settings': '⚙', 'Mail': '✉'
        };
        const iconSymbol = iconMap[el.name] || '•';
        
        return (
          <div style={{
            textAlign: "center",
            fontSize: `${el.fontSize || 24}px`,
            color: el.color || "#000000",
            margin: "8px 0",
          }}>
            {el.link ? <a href={el.link} style={{ color: "inherit", textDecoration: "none" }}>{iconSymbol}</a> : iconSymbol}
          </div>
        );

      case "video":
        return (
          <div style={{ textAlign: "center", margin: "12px 0" }}>
            <video controls style={{ width: "100%", maxWidth: `${el.width || 400}px`, height: "auto", borderRadius: `${el.borderRadius || 0}px` }}>
              <source src={el.src} type="video/mp4" />
            </video>
          </div>
        );

      case "audio":
        return (
          <div style={{ textAlign: "center", margin: "12px 0" }}>
            <audio controls style={{ width: "100%", maxWidth: "400px" }}>
              <source src={el.src} type="audio/mpeg" />
            </audio>
          </div>
        );

      case "input":
        return (
          <div style={{
            padding: "12px",
            background: "#f5f5f5",
            border: `1px solid ${el.borderColor || '#ccc'}`,
            borderRadius: `${el.borderRadius || 4}px`,
            margin: "8px 0",
            fontSize: `${el.fontSize || 14}px`,
            color: "#999",
          }}>{el.placeholder || "Input field"}</div>
        );

      case "checkbox":
        return (
          <div style={{ textAlign: "center", margin: "8px 0" }}>
            <span style={{
              display: "inline-block",
              width: "20px",
              height: "20px",
              border: `2px solid ${el.color || '#4299E1'}`,
              borderRadius: "3px",
              background: "white",
            }}></span>
          </div>
        );

      default:
        return null;
    }
  };

  // ✅ Build preview with proper background color
  return (
      <div className="h-full overflow-auto" style={{ background: backgroundColor }}>
        <div className="max-w-2xl mx-auto my-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-8" style={{ maxWidth: "600px", margin: "0 auto", background: backgroundColor }}>  
            {rows.map((row, rowIndex) => {
              if (row.length === 1) {
                return (
                  <div key={`row-${rowIndex}`} style={{ marginBottom: "8px", width: "100%" }}>
                    {renderElement(row[0])}
                  </div>
                );
              }

              return (
                <div key={`row-${rowIndex}`} style={{ display: "flex", gap: "12px", marginBottom: "8px", width: "100%" }}>
                  {row.map((it, i) => (
                    <div key={it.id || `${rowIndex}-${i}`} style={{ flex: 1, minWidth: 0 }}>
                      {renderElement(it)}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          <div className="bg-gray-50 px-8 py-6 border-t border-gray-200 text-center text-sm text-gray-600">
            Email preview – exactly as it will be sent
          </div>
        </div>
      </div>
    </div>
  );
}


export default function CampaignBuilder() {
  const location = useLocation();
  const navigate = useNavigate();

  const [expanded, setExpanded] = useState("setup");
  const [completedSteps, setCompletedSteps] = useState([]);
  const [formData, setFormData] = useState({
    recipients: "",
    fromEmail: "",
    fromName: "",
    replyToEmail: "",
    fromAddress: "",
    subject: "",
    sendTime: "",
    template: "basic",
    designContent: "",
    scheduleType: "immediate",
    scheduledDate: "",
    scheduledTime: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    recurringFrequency: "daily",
    recurringDays: [],
    recurringEndDate: "",
  });

  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [canvasPages, setCanvasPages] = useState([{ id: 1, elements: [] }]);
  const [canvasActivePage, setCanvasActivePage] = useState(0);
  const [canvasZoomLevel, setCanvasZoomLevel] = useState(0.6);
  const [authError, setAuthError] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [credits, setCredits] = useState(0);
  const [recipientError, setRecipientError] = useState("");
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailVerificationStatus, setEmailVerificationStatus] = useState(null);
  const [showShuffleModal, setShowShuffleModal] = useState(false);
  const canvasBackgroundColor = location.state?.canvasBackgroundColor || '#FFFFFF';  // ← ADD THIS LINE
  // Helper function to get auth token  // Helper function to get auth token
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };
const [showExitModal, setShowExitModal] = useState(false);
const [previewWidth, setPreviewWidth] = useState(500);  
const [isDragging, setIsDragging] = useState(false);

  // Calculate recipient count
  const getRecipientCount = () => {
    if (formData.recipients === "all-subscribers") {
      return contacts.length;
    } else if (formData.recipients === "new-customers") {
      return contacts.filter(c => c.type === "new-customer").length;
    } else if (formData.recipients === "vip-clients") {
      return contacts.filter(c => c.type === "vip-client").length;
    } else if (formData.recipients === "manual") {
      return (formData.manualEmails || "")
        .split(/[\n,]+/)
        .filter(e => e.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())).length;
    } else if (formData.recipients === "file") {
      return (formData.bulkFileEmails || []).length;
    }
    return 0;
  };

  useEffect(() => {
  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const newWidth = window.innerWidth - e.clientX;

    if (newWidth > 350 && newWidth < 900) {
      setPreviewWidth(newWidth);
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseup", handleMouseUp);

  return () => {
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  };
}, [isDragging]);

  // Utility: split array into chunks
  const chunkArray = (arr, size) => {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  };

useEffect(() => {
  if (location.state?.canvasData) {
    console.log('✅ Received canvas data:', location.state.canvasData);
    
    // Normalize all numeric values consistently
   const normalizedElements = location.state.canvasData.map(el => ({
    ...el,
    x: Number(el.x) || 0,
    y: Number(el.y) || 0,
    width: Number(el.width) || (el.type === 'image' ? 250 : 300),
    height: Number(el.height) || (el.type === 'paragraph' ? 40 : 80),
    fontSize: Number(el.fontSize) || 16,

    fontFamily: el.fontFamily || "Arial, sans-serif",
    fontWeight: el.fontWeight || "normal",
    fontStyle: el.fontStyle || "normal",
    textDecoration: el.textDecoration || "none",
    color: el.color || "#333",
    backgroundColor: el.backgroundColor || "transparent",

    textAlign: el.textAlign,   // ✅ fixed
    lineHeight: el.lineHeight || 1.6,
    borderRadius: el.borderRadius || 0,
    borderWidth: el.borderWidth || 0,
    borderColor: el.borderColor || "#000",
  }));

    
    setCanvasPages([{ id: 1, elements: normalizedElements }]);
    setCanvasActivePage(0);
    
    if (!completedSteps.includes("design")) {
      setCompletedSteps([...completedSteps, "design"]);
    }
    
    setFormData((prev) => ({
      ...prev,
      subject: location.state.subject || prev.subject,
    }));
  }
}, [location.state]);

  useEffect(() => { 
    fetchContacts(); 
  }, []);

  // Function to fetch contacts from API
  const fetchContacts = async () => {
    try {
      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/campaigncontacts`, {
        headers
      });

      if (response.status === 401) {
        setAuthError(true);
        console.error("Authentication error: Please log in again");
        return;
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const errorText = await response.text();
        throw new Error(`Server returned non-JSON response: ${errorText.substring(0, 100)}...`);
      }

      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      } else {
        console.error("Failed to fetch contacts");
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
    }
  };

  const toggleExpand = (id) => {
    setExpanded(expanded === id ? null : id);
  };

  const markComplete = (id) => {
    if (!completedSteps.includes(id)) {
      setCompletedSteps([...completedSteps, id]);
    }
    setExpanded(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const emails = text
        .split(/\r?\n|,/)
        .map((line) => line.trim())
        .filter((line) => line.includes("@"));
      setFormData((prev) => ({ ...prev, bulkFileEmails: emails }));
    };
    reader.readAsText(file);
  };

  const handleTemplateSelect = (template) => {
    setFormData({ ...formData, template });
    markComplete("template");
  };

  const handleRecurringDaysChange = (day) => {
    const days = formData.recurringDays || [];
    if (days.includes(day)) {
      setFormData({
        ...formData,
        recurringDays: days.filter(d => d !== day)
      });
    } else {
      setFormData({
        ...formData,
        recurringDays: [...days, day]
      });
    }
  };

// ✅ ONLY THE CHANGED PARTS - Replace in your SendCampaign.jsx

// 1️⃣ Update the fetchCredits function (around line 335):
useEffect(() => {
  const fetchCredits = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // ✅ Changed from /api/users/credits to /api/campaigns/credits
      const res = await fetch(`${API_URL}/api/campaigns/credits`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        console.error("Failed to fetch credits:", res.status);
        setCredits(0);
        return;
      }
      
      const data = await res.json();
      console.log("✅ Credits fetched:", data);
      
      // ✅ Use the correct field name from response
      const userCredits = data?.emailSendCredits ?? 0;
      setCredits(userCredits);
      localStorage.setItem("totalEmails", userCredits);

    } catch (err) {
      console.error("❌ Failed to fetch credits:", err);
      setCredits(0);
    }
  };
  fetchCredits();
}, []);


const checkEmailVerification = async (email) => {
  if (!email || !email.includes('@')) {
    setEmailVerificationStatus(null);
    return;
  }

  setIsCheckingEmail(true);
  setEmailVerificationStatus(null);

  try {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/api/campaigns/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (response.ok) {
      setEmailVerificationStatus(data.verified === true);
    } else {
      setEmailVerificationStatus(false);
    }
  } catch (error) {
    console.error('Error checking email verification:', error);
    setEmailVerificationStatus(false);
  } finally {
    setIsCheckingEmail(false);
  }
};

const handleEmailBlur = (e) => {
  if (e.target.name === 'fromEmail') {
    checkEmailVerification(e.target.value);
  }
};


// 2️⃣ Update handleSendCampaign function (around line 360):
// ✅ FIXED: Replace your handleSendCampaign function in SendCampaign.jsx

const handleSendCampaign = async () => {
  setIsSending(true);
  setSendStatus(null);
  
  try {
    const token = getAuthToken();
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    };

    // ✅ Check credits
    const creditsNum = Number(credits);
    console.log("🔍 Current credits:", creditsNum);
    
    if (creditsNum <= 0) {
      setSendStatus({
        success: false,
        message: "⚠️ You have 0 email credits remaining. Please upgrade your plan before sending a campaign.",
      });
      setIsSending(false);
      return;
    }

    // Prepare recipients
    const contactsResponse = await fetch(`${API_URL}/api/campaigncontacts`, { headers });
    if (!contactsResponse.ok) throw new Error("Failed to fetch contacts");
    const contactsData = await contactsResponse.json();

    let recipientsList = [];
    if (formData.recipients === "all-subscribers") {
      recipientsList = contactsData;
    } else if (formData.recipients === "new-customers") {
      recipientsList = contactsData.filter(c => c.type === "new-customer");
    } else if (formData.recipients === "vip-clients") {
      recipientsList = contactsData.filter(c => c.type === "vip-client");
    } else if (formData.recipients === "manual") {
      recipientsList = (formData.manualEmails || "")
        .split(/[\n,]+/)
        .map(email => ({ email: email.trim() }))
        .filter(c => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email));
    } else if (formData.recipients === "file") {
      recipientsList = (formData.bulkFileEmails || [])
        .map(email => ({ email }))
        .filter(c => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email));
    }

    if (recipientsList.length === 0) {
      setSendStatus({ success: false, message: "❌ No valid recipients found." });
      setIsSending(false);
      return;
    }

    // ✅ Check if user has enough credits for recipients
    if (recipientsList.length > creditsNum) {
      setSendStatus({
        success: false,
        message: `❌ Insufficient credits. You need ${recipientsList.length} credits but only have ${creditsNum}.`,
      });
      setIsSending(false);
      return;
    }

    // ✅ PREPARE PAYLOAD WITH PROPER SCHEDULING DATA
    const payload = {
      campaignName: formData.subject,
      subject: formData.subject,
      fromEmail: formData.fromEmail,
      fromName: formData.fromName,
      replyToEmail: formData.replyToEmail,
      fromAddress: formData.fromAddress,
      recipients: recipientsList,
      canvasData: canvasPages[0].elements,
      scheduleType: formData.scheduleType,
    };

    // ✅ ADD SCHEDULING DETAILS BASED ON TYPE
    if (formData.scheduleType === "scheduled") {
      // Combine date and time properly
      payload.scheduledDate = formData.scheduledDate;
      payload.scheduledTime = formData.scheduledTime;
      payload.timezone = formData.timezone;
      
      // Create full datetime for validation
      const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
      const now = new Date();
      
      // ✅ Validate scheduled time is in future
      if (scheduledDateTime <= now) {
        setSendStatus({
          success: false,
          message: "❌ Scheduled time must be in the future (at least 5 minutes from now).",
        });
        setIsSending(false);
        return;
      }
    } else if (formData.scheduleType === "recurring") {
      payload.scheduledDate = formData.scheduledDate;
      payload.scheduledTime = formData.scheduledTime;
      payload.timezone = formData.timezone;
      payload.recurringFrequency = formData.recurringFrequency;
      payload.recurringDays = formData.recurringDays || [];
      payload.recurringEndDate = formData.recurringEndDate || null;
    }

    console.log("📤 Sending payload:", payload);

    const url = `${API_URL}/api/campaigns/send`;
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    let data;
    try {
      data = await response.json();
    } catch (err) {
      data = null;
    }

    if (!response.ok) {
      const errMsg = data?.error || data?.message || `Server returned ${response.status}`;
      
      if (data?.creditLimitReached || response.status === 403) {
        setSendStatus({ 
          success: false, 
          message: `⚠️ ${errMsg}. Please upgrade your plan.` 
        });
        setCredits(data?.available ?? 0);
        setIsSending(false);
        return;
      }
      
      setSendStatus({ success: false, message: `❌ Error: ${errMsg}` });
      setIsSending(false);
      return;
    }

    // ✅ HANDLE SUCCESS BASED ON SCHEDULE TYPE
    if (formData.scheduleType === "immediate") {
      // Immediate send - show results
      const finalMessage = data.results?.failed?.length === 0
        ? `✅ Campaign sent successfully! Sent: ${data.results.success.length}`
        : `⚠️ Campaign finished. Sent: ${data.results.success.length}, Failed: ${data.results.failed.length}.`;

      setSendStatus({
        success: data.results?.failed?.length === 0,
        message: finalMessage,
        results: data.results,
      });

      // Update credits after immediate send
      if (data.creditsRemaining !== undefined) {
        setCredits(data.creditsRemaining);
        localStorage.setItem("totalEmails", data.creditsRemaining);
      }

      setTimeout(() => {
        navigate("/analytics");
      }, 3000);

    }  else {
  // Scheduled or Recurring - just confirm it's scheduled
  const scheduleMessage = formData.scheduleType === "scheduled"
    ? `✅ Campaign scheduled successfully!\n\n` +
      `📅 Scheduled Date: ${formData.scheduledDate}\n` +
      `🕐 Time: ${formData.scheduledTime}\n` +
      `🌍 Timezone: ${formData.timezone}\n\n` +
      `Your campaign will be sent automatically at the scheduled time. ` +
      `The email will use the same template design you see in the preview.`
    : `✅ Recurring campaign created (${formData.recurringFrequency}). ` +
      `It will be sent automatically based on your schedule.`;

  setSendStatus({
    success: true,
    message: scheduleMessage,
  });

  // Show success message for 4 seconds before redirecting
  setTimeout(() => {
    navigate("/automation");
  }, 4000);
}

  } catch (err) {
    console.error("❌ Error sending campaign:", err);
    setSendStatus({ success: false, message: `❌ Error: ${err.message}` });
  } finally {
    setIsSending(false);
    setBatchProgress({ current: 0, total: 0 });
  }
};

  // Get minimum date for scheduling (current date + 5 minutes)
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return now.toISOString().slice(0, 16);
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  };

  // Handle authentication error
  if (authError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6">
        <div className="max-w-md w-full bg-gray-900 rounded-lg p-8 border border-gray-800">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Authentication Error</h2>
          <p className="text-gray-300 mb-6">
            You need to be logged in to access this feature. Please log in again.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 bg-[#c2831f] hover:bg-[#d09025] text-white rounded-md font-medium"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-black border-b border-gray-800 px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left Side - Title */}
          <h1 className="text-2xl font-bold text-white">Send Campaign</h1>

          {/* Middle - Shuffle Button */}
          <div className="flex items-right ml-125">
            <button
              onClick={() => setShowShuffleModal(true)}
              className="flex items-right gap-2 px-4 py-2 text-sm font-medium text-white 
                        bg-[#c2831f] rounded-md cursor-pointer transition-all shadow-md hover:shadow-lg">
              <Shuffle size={16} />
              Shuffle Subject Lines & To: Mails
            </button>
          </div>

          {/* Shuffle Modal */}
          <ShuffleSubjectModal
            isOpen={showShuffleModal}
            onClose={() => setShowShuffleModal(false)}
            canvasPages={canvasPages}
            fromEmail={formData.fromEmail}
            fromName={formData.fromName}
            fromAddress={formData.fromAddress} 
            credits={credits}
            onCreditsUpdate={(newCredits) => {
              setCredits(newCredits);
              localStorage.setItem("totalEmails", newCredits);
            }}
          />

          {/* Right Side - Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Credits Info */}
            <span className="text-sm text-gray-300 bg-gray-900 px-3 py-1.5 rounded-md border border-gray-700">
              Send Email: <span className="text-[#d99c2b] font-semibold">{credits || 0}</span>
            </span>

            {/* Navigation Buttons */}
            <button
              onClick={() => navigate("/texteditor")}
              className="px-4 py-2 text-sm text-white bg-transparent border border-[#d99c2b] rounded-md 
                        hover:bg-[#d99c2b] hover:text-black transition-all duration-300"
            >
              Text Editor Page
            </button>

            <button
              onClick={() => navigate("/all-templates")}
              className="px-4 py-2 text-sm text-white bg-transparent border border-[#d99c2b] rounded-md 
                        hover:bg-[#d99c2b] hover:text-black transition-all duration-300"
            >
              Choose Templates
            </button>

            {/* Send / Schedule Button */}
            <button
              onClick={handleSendCampaign}
              disabled={
                credits <= 0 ||
                !completedSteps.includes("recipients") ||
                !completedSteps.includes("setup") ||
                !completedSteps.includes("template") ||
                !completedSteps.includes("schedule") ||
                isSending
              }
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md 
                transition-all duration-300 shadow-md 
                ${!completedSteps.includes("recipients") ||
                  !completedSteps.includes("setup") ||
                  !completedSteps.includes("template") ||
                  !completedSteps.includes("schedule") ||
                  isSending
                  ? "bg-gray-800 cursor-not-allowed text-gray-500 border border-gray-700"
                  : "bg-[#c2831f] hover:bg-[#d99c2b] text-black shadow-lg hover:shadow-[#d99c2b]/30"
                }`}
            >
              {formData.scheduleType === "immediate" ? (
                <Send size={16} />
              ) : (
                <Calendar size={16} />
              )}
              {isSending
                ? "Processing..."
                : formData.scheduleType === "immediate"
                  ? "Send Now"
                  : "Schedule Campaign"}
            </button>
          </div>
        </div>
      </header>


      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Step Tracker */}
        <div className="w-64 bg-black border-r border-gray-800 p-6 overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-gray-400  tracking-wider">
              Campaign Steps
            </h2>
          </div>
          <div className="relative">
            <div className="absolute left-5 top-8 bottom-0 w-0.5 bg-gray-700"></div>
            <div className="space-y-8">
              {steps.map(({ id, title, description, icon: Icon }, index) => {
                const isCompleted = completedSteps.includes(id);
                const isExpanded = expanded === id;
                return (
                  <div key={id} className="relative flex items-start">
                    <div
                      className={`relative z-10 flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full ${isCompleted ? "bg-[#c2831f]" : "bg-gray-800"
                        }`}
                    >
                      {isCompleted ? (
                        <CheckCircle size={20} className="text-white" />
                      ) : (
                        <Icon size={18} className="text-gray-400" />
                      )}
                    </div>
                    <div className="ml-4 pt-1">
                      <button
                        onClick={() => toggleExpand(id)}
                        className={`text-left ${isExpanded ? "text-[#c2831f]" : "hover:text-gray-300"
                          }`}
                      >
                        <div className="font-medium">{title}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {description}
                        </div>
                      </button>
                      {isCompleted && (
                        <div className="mt-2 text-xs text-[#c2831f] flex items-center">
                          <div className="w-2 h-2 rounded-full bg-[#c2831f] mr-1"></div>
                          Completed
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Exit Option */}
          <div className="mt-20 pt-6 border-t border-gray-800">
            <button
              onClick={() => setShowExitModal(true)}
              className="flex items-center gap-2 text-gray-400 hover:text-[#c2831f] transition-colors duration-300"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">Exit Campaign</span>
            </button>
            {/* Exit Confirmation Modal */}
            {showExitModal && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                <div className="bg-[#111] border border-gray-800 rounded-xl p-8 w-[90%] max-w-md text-center shadow-xl">
                  <h2 className="text-lg font-semibold text-white mb-3">
                    Exit Campaign Setup?
                  </h2>
                  <p className="text-gray-400 text-sm mb-6">
                    Are you sure you want to exit? All unsaved progress will be lost.
                  </p>
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => setShowExitModal(false)}
                      className="px-4 py-2 rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="px-4 py-2 rounded-md bg-[#c2831f] text-black font-semibold hover:bg-[#d99c2b] transition-all"
                    >
                      Yes, Exit
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-black">
          <div className="max-w-3xl mx-auto">
            {steps.map(({ id, title, description }) => {
              const isExpanded = expanded === id;
              const isCompleted = completedSteps.includes(id);
              return (
                <div
                  key={id}
                  className={`mb-8 border border-gray-800 rounded-lg overflow-hidden transition-all ${isExpanded ? "shadow-lg" : ""
                    }`}
                >
                  <button
                    onClick={() => toggleExpand(id)}
                    className="flex justify-between items-center w-full px-6 py-4 bg-black hover:bg-gray-900 focus:outline-none"
                  >
                    <div className="flex items-center">
                      <div
                        className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full ${isCompleted
                          ? "bg-[#c2831f]/20 text-[#c2831f]"
                          : "bg-gray-800 text-gray-400"
                          }`}
                      >
                        {isCompleted ? (
                          <CheckCircle size={16} />
                        ) : (
                          <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                        )}
                      </div>
                      <div className="ml-4 text-left">
                        <div className="text-lg font-medium text-white">
                          {title}
                        </div>
                        <div className="text-sm text-gray-400">
                          {description}
                        </div>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="text-gray-400" />
                    ) : (
                      <ChevronDown className="text-gray-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-6 py-5 bg-gray-900 border-t border-gray-800">
                      {id === "recipients" && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              Choose an audience
                            </label>
                            <select
                              name="recipients"
                              className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c2831f] text-white"
                              value={formData.recipients}
                              onChange={(e) => {
                                handleChange(e);
                                setRecipientError(""); // Clear error when changing selection
                              }}
                            >
                              <option value="">Select an option</option>
                              <option value="manual">Manual (paste emails)</option>
                              <option value="file">Upload File (CSV)</option>
                            </select>

                            {formData.recipients === "manual" && (
                              <div className="mt-3">
                                <label className="block text-sm text-gray-300 mb-1">
                                  Paste emails (comma or newline separated)
                                </label>
                                <textarea
                                  rows={4}
                                  className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white"
                                  value={formData.manualEmails}
                                  onChange={(e) => {
                                    setFormData({
                                      ...formData,
                                      manualEmails: e.target.value,
                                    });
                                    setRecipientError(""); // Clear error when typing
                                  }}
                                  placeholder="example1@email.com, example2@email.com"
                                />
                              </div>
                            )}

                            {formData.recipients === "file" && (
                              <div className="mt-3">
                                <label className="block text-sm text-gray-300 mb-1">
                                  Upload CSV file (with "email" column)
                                </label>
                                <input
                                  type="file"
                                  accept=".csv"
                                  className="block w-full text-gray-300"
                                  onChange={(e) => {
                                    handleFileUpload(e);
                                    setRecipientError(""); // Clear error when uploading
                                  }}
                                />
                              </div>
                            )}
                          </div>

                          {/* ✅ CREDIT AND RECIPIENT COUNT DISPLAY */}
                          {formData.recipients && (
                            <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-400">Recipients selected:</span>
                                <span className="text-lg font-bold text-white">
                                  {getRecipientCount()}
                                </span>
                              </div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-400">Available credits:</span>
                                <span className={`text-lg font-bold ${credits >= getRecipientCount() ? 'text-green-400' : 'text-red-400'}`}>
                                  {credits}
                                </span>
                              </div>
                              <div className="h-px bg-gray-700 my-2"></div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-400">Credits needed:</span>
                                <span className="text-lg font-bold text-[#c2831f]">
                                  {getRecipientCount()}
                                </span>
                              </div>
                              
                              {/* ✅ CREDIT VALIDATION MESSAGE */}
                              {getRecipientCount() > credits && (
                                <div className="mt-3 p-3 bg-red-900/30 border border-red-700 rounded-md">
                                  <div className="flex items-start gap-2">
                                    <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={18} />
                                    <div>
                                      <p className="text-red-400 font-medium text-sm">
                                        Insufficient Credits
                                      </p>
                                      <p className="text-red-300 text-xs mt-1">
                                        You need <strong>{getRecipientCount()}</strong> credits but only have <strong>{credits}</strong>. 
                                        Please reduce recipients or{" "}
                                        <a href="/pricing" className="underline hover:text-red-200">
                                          purchase more credits
                                        </a>.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {credits === 0 && (
                                <div className="mt-3 p-3 bg-yellow-900/30 border border-yellow-700 rounded-md">
                                  <div className="flex items-start gap-2">
                                    <AlertCircle className="text-yellow-400 flex-shrink-0 mt-0.5" size={18} />
                                    <div>
                                      <p className="text-yellow-400 font-medium text-sm">
                                        No Credits Available
                                      </p>
                                      <p className="text-yellow-300 text-xs mt-1">
                                        You have 0 credits remaining.{" "}
                                        <a href="/pricing" className="underline hover:text-yellow-200">
                                          Upgrade your plan
                                        </a>{" "}
                                        to send campaigns.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* ✅ ERROR MESSAGE */}
                          {recipientError && (
                            <div className="mt-3 p-3 bg-red-900/30 border border-red-700 rounded-md">
                              <p className="text-red-400 text-sm">{recipientError}</p>
                            </div>
                          )}

                          {/* ✅ SAVE BUTTON WITH VALIDATION */}
                          <button
                            onClick={() => {
                              // Validate recipient count
                              const count = getRecipientCount();
                              
                              if (!formData.recipients) {
                                setRecipientError("Please select an audience type");
                                return;
                              }
                              
                              if (count === 0) {
                                setRecipientError("Please add at least one valid email address");
                                return;
                              }
                              
                              // ✅ CHECK CREDITS BEFORE ALLOWING TO PROCEED
                              if (count > credits) {
                                setRecipientError(
                                  `You don't have enough credits. You need ${count} credits but only have ${credits}. Please reduce recipients or purchase more credits.`
                                );
                                return;
                              }
                              
                              if (credits === 0) {
                                setRecipientError(
                                  "You have 0 credits remaining. Please upgrade your plan to send campaigns."
                                );
                                return;
                              }
                              
                              // All validations passed
                              setRecipientError("");
                              markComplete(id);
                            }}
                            className="mt-2 px-4 py-2 rounded-md bg-[#c2831f] hover:bg-[#d09025] text-white transition-colors"
                          >
                            Save and Continue
                          </button>
                        </div>
                      )}

                    {id === "setup" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            From Email Address
                          </label>
                          <div className="relative">
                            <input
                              type="email"
                              name="fromEmail"
                              required
                              value={formData.fromEmail}
                              onChange={handleChange}
                              onBlur={handleEmailBlur}
                              className={`w-full bg-gray-800 border rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 text-white ${
                                emailVerificationStatus === true
                                  ? 'border-green-500 focus:ring-green-500'
                                  : emailVerificationStatus === false
                                  ? 'border-red-500 focus:ring-red-500'
                                  : 'border-gray-700 focus:ring-[#c2831f]'
                              }`}
                              placeholder="Enter verified sender email"
                            />
                            
                            {/* Loading Spinner */}
                            {isCheckingEmail && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <RefreshCw className="animate-spin text-gray-400" size={18} />
                              </div>
                            )}
                            
                            {/* Verification Status Icons */}
                            {!isCheckingEmail && emailVerificationStatus === true && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <CheckCircle className="text-green-500" size={20} />
                              </div>
                            )}
                            
                            {!isCheckingEmail && emailVerificationStatus === false && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <AlertCircle className="text-red-500" size={20} />
                              </div>
                            )}
                          </div>

                          {/* Verification Messages */}
                          {emailVerificationStatus === true && (
                            <div className="mt-2 p-3 bg-green-900/30 border border-green-700 rounded-md">
                              <div className="flex items-start gap-2">
                                <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={18} />
                                <div>
                                  <p className="text-green-400 font-medium text-sm">
                                    Email Verified ✓
                                  </p>
                                  <p className="text-green-300 text-xs mt-1">
                                    This email is verified and ready to send campaigns.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {emailVerificationStatus === false && (
                            <div className="mt-2 p-3 bg-red-900/30 border border-red-700 rounded-md">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={18} />
                                <div>
                                  <p className="text-red-400 font-medium text-sm">
                                    Email Not Verified ✗
                                  </p>
                                  <p className="text-red-300 text-xs mt-1">
                                    This email is not verified. Only verified emails can send campaigns.{" "}
                                    <a
                                      href="/email-campaign"
                                      className="text-[#c2831f] underline hover:text-[#d09025] font-medium"
                                    >
                                      Click here to request verification
                                    </a>
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {!emailVerificationStatus && !isCheckingEmail && formData.fromEmail && (
                            <p className="text-xs text-gray-400 mt-2">
                              ⚠️ Only verified emails can be used.{" "}
                              <a
                                href="/email-campaign"
                                className="text-[#c2831f] underline hover:text-[#d09025]"
                              >
                                Click here to request verification
                              </a>
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            From Name
                          </label>
                          <input
                            type="text"
                            name="fromName"
                            required
                            value={formData.fromName}
                            onChange={handleChange}
                            className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c2831f] text-white"
                            placeholder="Your sender name"
                          />
                        </div>
                        <div className="mt-4">
                        <label className="block text-sm text-gray-400 mb-1">
                            Reply To Email
                          </label>

                          <input
                            type="email"
                            name="replyToEmail"
                            value={formData.replyToEmail}
                            onChange={handleChange}
                            placeholder="reply@yourdomain.com"
                            className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c2831f] text-white"
                          />
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Sender Address
                          </label>
                          <input
                            type="text"
                            name="fromAddress"
                            placeholder="Example: 151 14th St NW #2143, Atlanta, GA 30318 USA"
                            value={formData.fromAddress || ""}
                            onChange={handleChange}
                            className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2
                                      focus:outline-none focus:ring-2 focus:ring-[#c2831f] text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Subject Line
                          </label>
                          <input
                            type="text"
                            name="subject"
                            required
                            value={formData.subject}
                            onChange={handleChange}
                            className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c2831f] text-white"
                            placeholder="Enter your email subject"
                          />
                        </div>

                        <button
                          onClick={() => {
                            // Validate email verification before allowing to continue
                            if (!formData.fromEmail || !formData.fromName) {
                              return;
                            }
                            
                            if (emailVerificationStatus !== true) {
                              // Show error if email is not verified
                              alert('Please use a verified email address. Click "Click here to request verification" to verify your email.');
                              return;
                            }
                            
                            markComplete(id);
                          }}
                          disabled={
                            !formData.fromEmail || 
                            !formData.fromName || 
                            emailVerificationStatus !== true ||
                            isCheckingEmail
                          }
                          className={`mt-4 px-4 py-2 rounded-md ${
                            !formData.fromEmail || 
                            !formData.fromName || 
                            emailVerificationStatus !== true ||
                            isCheckingEmail
                              ? "bg-gray-700 cursor-not-allowed text-gray-400"
                              : "bg-[#c2831f] hover:bg-[#d09025] text-white"
                          }`}
                        >
                          {isCheckingEmail ? "Checking email..." : "Save and Continue"}
                        </button>
                      </div>
                    )}

                      {id === "template" && (
                        <div className="space-y-4">
                          <label className="block text-sm font-medium text-gray-300 mb-3">
                            Choose a template
                          </label>
                          <div className="grid grid-cols-3 gap-4">
                            {["basic", "newsletter", "promotion"].map(
                              (template) => (
                                <div
                                  key={template}
                                  onClick={() => handleTemplateSelect(template)}
                                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${formData.template === template
                                    ? "border-[#c2831f] bg-[#c2831f]/10"
                                    : "border-gray-700 hover:border-gray-600"
                                    }`}
                                >
                                  <div className="h-32 bg-gray-800 rounded mb-2 flex items-center justify-center">
                                    <span className="text-sm text-gray-400">
                                      {template.charAt(0).toUpperCase() +
                                        template.slice(1)}
                                    </span>
                                  </div>
                                  <div className="text-sm font-medium text-center text-white">
                                    {template.charAt(0).toUpperCase() +
                                      template.slice(1)}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                       

                      {id === "schedule" && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-3">
                              When to send
                            </label>
                            <div className="space-y-3">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="scheduleType"
                                  value="immediate"
                                  checked={formData.scheduleType === "immediate"}
                                  onChange={handleChange}
                                  className="mr-3 accent-[#c2831f]"
                                />
                                <div>
                                  <div className="font-medium text-white">Send Immediately</div>
                                  <div className="text-sm text-gray-400">Send as soon as you confirm</div>
                                </div>
                              </label>

                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="scheduleType"
                                  value="scheduled"
                                  checked={formData.scheduleType === "scheduled"}
                                  onChange={handleChange}
                                  className="mr-3 accent-[#c2831f]"
                                />
                                <div>
                                  <div className="font-medium text-white">Schedule for Later</div>
                                  <div className="text-sm text-gray-400">Pick a specific date and time</div>
                                </div>
                              </label>

                              {/* <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="scheduleType"
                                  value="recurring"
                                  checked={formData.scheduleType === "recurring"}
                                  onChange={handleChange}
                                  className="mr-3 accent-[#c2831f]"
                                />
                                <div>
                                  <div className="font-medium text-white">Recurring Campaign</div>
                                  <div className="text-sm text-gray-400">Send automatically on a schedule</div>
                                </div>
                              </label> */}
                            </div>
                          </div>

                          {formData.scheduleType === "scheduled" && (
                            <div className="mt-4 p-4 bg-gray-800 rounded-lg space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Date
                                  </label>
                                  <input
                                    type="date"
                                    name="scheduledDate"
                                    min={getMinDate()}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                                    value={formData.scheduledDate}
                                    onChange={handleChange}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Time
                                  </label>
                                  <input
                                    type="time"
                                    name="scheduledTime"
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                                    value={formData.scheduledTime}
                                    onChange={handleChange}
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Timezone
                                </label>
                                <select
                                  name="timezone"
                                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                                  value={formData.timezone}
                                  onChange={handleChange}
                                >
                                  <option value="America/New_York">Eastern Time</option>
                                  <option value="America/Chicago">Central Time</option>
                                  <option value="America/Denver">Mountain Time</option>
                                  <option value="America/Los_Angeles">Pacific Time</option>
                                  <option value="Europe/London">London</option>
                                  <option value="Europe/Paris">Paris</option>
                                  <option value="Asia/Tokyo">Tokyo</option>
                                  <option value="Asia/Kolkata">India</option>
                                </select>
                              </div>
                            </div>
                          )}

                          {formData.scheduleType === "recurring" && (
                            <div className="mt-4 p-4 bg-gray-800 rounded-lg space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Frequency
                                </label>
                                <select
                                  name="recurringFrequency"
                                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                                  value={formData.recurringFrequency}
                                  onChange={handleChange}
                                >
                                  <option value="daily">Daily</option>
                                  <option value="weekly">Weekly</option>
                                  <option value="monthly">Monthly</option>
                                </select>
                              </div>

                              {formData.recurringFrequency === "weekly" && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Days of the week
                                  </label>
                                  <div className="flex flex-wrap gap-2">
                                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                                      <label key={day} className="flex items-center">
                                        <input
                                          type="checkbox"
                                          checked={formData.recurringDays.includes(day)}
                                          onChange={() => handleRecurringDaysChange(day)}
                                          className="mr-2 accent-[#c2831f]"
                                        />
                                        <span className="text-sm text-white">{day}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Start Date
                                  </label>
                                  <input
                                    type="date"
                                    name="scheduledDate"
                                    min={getMinDate()}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                                    value={formData.scheduledDate}
                                    onChange={handleChange}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-1">
                                    End Date (optional)
                                  </label>
                                  <input
                                    type="date"
                                    name="recurringEndDate"
                                    min={formData.scheduledDate || getMinDate()}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                                    value={formData.recurringEndDate}
                                    onChange={handleChange}
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Time
                                </label>
                                <input
                                  type="time"
                                  name="scheduledTime"
                                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                                  value={formData.scheduledTime}
                                  onChange={handleChange}
                                />
                              </div>
                            </div>
                          )}

                          <button
                            onClick={() => markComplete(id)}
                            disabled={
                              (formData.scheduleType === "scheduled" && (!formData.scheduledDate || !formData.scheduledTime)) ||
                              (formData.scheduleType === "recurring" && (!formData.scheduledDate || !formData.scheduledTime || (formData.recurringFrequency === "weekly" && formData.recurringDays.length === 0)))
                            }
                            className={`mt-2 px-4 py-2 rounded-md ${(formData.scheduleType === "scheduled" && (!formData.scheduledDate || !formData.scheduledTime)) ||
                              (formData.scheduleType === "recurring" && (!formData.scheduledDate || !formData.scheduledTime || (formData.recurringFrequency === "weekly" && formData.recurringDays.length === 0)))
                              ? "bg-gray-700 cursor-not-allowed"
                              : "bg-[#c2831f] hover:bg-[#d09025] text-white"
                              }`}
                          >
                            Save and Continue
                          </button>
                        </div>
                      )}

                      {id === "confirm" && (
                        <div className="space-y-6">
                          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                            <h3 className="font-medium text-white mb-3">
                              Campaign Summary
                            </h3>
                            <div className="space-y-2 text-sm">
                              <div className="flex">
                                <span className="w-32 text-gray-400">
                                  Campaign:
                                </span>
                                <span className="font-medium text-white">
                                  {formData.subject || "Untitled Campaign"}
                                </span>
                              </div>

                              <div className="flex">
                                <span className="w-32 text-gray-400">
                                  Recipients:
                                </span>
                                <span className="font-medium text-white">
                                  {formData.recipients === "all-subscribers" &&
                                    `All Subscribers (${contacts.length} contacts)`}
                                  {formData.recipients === "new-customers" &&
                                    `New Customers (${contacts.filter((c) => c.type === "new-customer").length
                                    } contacts)`}
                                  {formData.recipients === "vip-clients" &&
                                    `VIP Clients (${contacts.filter((c) => c.type === "vip-client").length
                                    } contacts)`}
                                  {formData.recipients === "manual" &&
                                    `Manual Entry (${getRecipientCount()} contacts)`}
                                  {formData.recipients === "file" &&
                                    `File Upload (${getRecipientCount()} contacts)`}
                                  {!formData.recipients && "Not selected"}
                                </span>
                              </div>

                              <div className="flex">
                                <span className="w-32 text-gray-400">
                                  From:
                                </span>
                                <span className="font-medium text-white">
                                  {formData.fromName} &lt;{formData.fromEmail}&gt;
                                </span>
                              </div>

                              <div className="flex">
                                <span className="w-32 text-gray-400">
                                  Subject:
                                </span>
                                <span className="font-medium text-white">
                                  {formData.subject || "Not set"}
                                </span>
                              </div>

                              <div className="flex">
                                <span className="w-32 text-gray-400">
                                  Template:
                                </span>
                                <span className="font-medium text-white">
                                  {formData.template}
                                </span>
                              </div>

                              <div className="flex">
                                <span className="w-32 text-gray-400">
                                  Schedule:
                                </span>
                                <span className="font-medium text-white">
                                  {formData.scheduleType === "immediate" && "Send Immediately"}
                                  {formData.scheduleType === "scheduled" &&
                                    `${formData.scheduledDate} at ${formData.scheduledTime}`}
                                  {formData.scheduleType === "recurring" &&
                                    `${formData.recurringFrequency} ${formData.recurringFrequency === "weekly"
                                      ? `(${formData.recurringDays.join(", ")})`
                                      : ""
                                    } starting ${formData.scheduledDate}`}
                                </span>
                              </div>
                            </div>
                          </div>

                          {sendStatus && (
                            <div className={`mt-4 p-3 rounded ${sendStatus.success
                              ? "bg-green-900/30 text-green-400"
                              : "bg-yellow-900/30 text-yellow-400"
                              }`}>
                              {sendStatus.message}
                            </div>
                          )}

                          {batchProgress.total > 0 && (
                            <div className="mt-2">
                              <div className="w-full bg-gray-700 rounded-full h-2">
                                <div
                                  className="bg-[#c2831f] h-2 rounded-full transition-all"
                                  style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                                />
                              </div>
                              <p className="text-xs text-gray-400 mt-1">
                                Batch {batchProgress.current} of {batchProgress.total}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Preview Section */}
      {/* === PREVIEW SECTION WITH DRAGGABLE WIDTH === */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            height: "100%",
            userSelect: "none",
          }}
        >
          {/* === DRAG HANDLE BETWEEN CONTENT & PREVIEW === */}
          <div
            onMouseDown={() => setIsDragging(true)}
            style={{
              width: "6px",
              cursor: "col-resize",
              background: "#222",
              zIndex: 50,
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.target.style.background = "#444")}
            onMouseLeave={(e) => (e.target.style.background = "#222")}
          ></div>

          {/* === RESIZABLE PREVIEW PANEL === */}
        {/* === DRAGGABLE EMAIL PREVIEW SECTION === */}
        <div
          style={{
            width: previewWidth,
            minWidth: "350px",
            maxWidth: "900px",
            borderLeft: "1px solid #333",
            background: "#1a1a1a",
            display: "flex",
            flexDirection: "column",
            minHeight: "700px",   // 👈 Minimum height
            maxHeight: "100vh",
          }}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-800">
            <h3 className="font-bold text-lg text-white">Email Preview</h3>
          </div>

          {/* Scrollable Email Preview Content */}
          <div
            className="flex-1 p-4"
            style={{ overflowY: "auto" }}   // 👈 Vertical scroll for long emails
          >
            <div className="bg-gray-800 rounded-lg border border-gray-700 h-full overflow-auto">
              <ErrorBoundary>
                <EmailPreview
                  pages={canvasPages}
                  activePage={canvasActivePage}
                  zoomLevel={canvasZoomLevel}
                  formData={formData}
                  canvasBackgroundColor={canvasBackgroundColor}
                />
              </ErrorBoundary>
            </div>
          </div>

          {/* Preview Bottom Button */}
          <div className="p-4 border-t border-gray-800">
            <button
              onClick={handleSendCampaign}
              disabled={
                credits <= 0 ||
                !completedSteps.includes("recipients") ||
                !completedSteps.includes("setup") ||
                !completedSteps.includes("template") ||
                !completedSteps.includes("schedule") ||
                isSending
              }
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-md text-white ${
                !completedSteps.includes("recipients") ||
                !completedSteps.includes("setup") ||
                !completedSteps.includes("template") ||
                !completedSteps.includes("schedule") ||
                isSending
                  ? "bg-gray-800 cursor-not-allowed"
                  : "bg-[#c2831f] hover:bg-[#d09025]"
              }`}
            >
              {formData.scheduleType === "immediate" ? (
                <Send size={16} />
              ) : (
                <Calendar size={16} />
              )}
              {isSending
                ? "Processing..."
                : formData.scheduleType === "immediate"
                ? "Send Now"
                : "Schedule Campaign"}
            </button>
          </div>
        </div>

        {/* === DRAG HANDLE (RESIZER) === */}
        <div
          onMouseDown={() => setIsDragging(true)}
          style={{
            width: "6px",
            cursor: "col-resize",
            background: "#222",
          }}
          onMouseEnter={(e) => (e.target.style.background = "#444")}
          onMouseLeave={(e) => (e.target.style.background = "#222")}
        ></div>


        </div>

      </div>
    </div>
  );
}