// Toolbox.jsx
import React, { useState } from "react";
import {
  Type,
  Image,
  Square,
  Circle,
  Minus,
  Upload,
  RotateCcw,
  RotateCw,
  Copy,
  Trash2,
  ZoomIn,
  ZoomOut,
  Grid,
  MousePointer,
  Move,
  Palette,
  Shapes,
  Plus,
  FileImage,
  Camera,
  Link,
  Zap,
  Layers,
  ChevronDown,
  ChevronUp,
  Star,
  Triangle,
  Hexagon,
  ArrowRight,
  PenTool,
  Frame,
  Video,
  Music,
  FileText,
  Hash,
  Heart,
  Home,
  User,
  Settings,
  Mail,
  Check,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  CreditCard,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Toolbox = ({
  onAddElement,
  onUploadImage,
  onSelectStockImage,
  onUpdateElementStyle,
  selectedElement,
  onUndo,
  onRedo,
  onDelete,
  onDuplicate,
  canUndo,
  canRedo,
  zoomLevel,
  setZoomLevel,
  showGrid,
  setShowGrid,
  canvasBackgroundColor,
  setCanvasBackgroundColor,
  onAddLayout,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("elements");
  const [imageUrl, setImageUrl] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    text: true,
    shapes: true,
    interactive: true,
    media: true,
    social: true,
    advanced: false,
    cards: true,
  });

  const [showExitModal, setShowExitModal] = useState(false);

  const handleSaveAndExit = () => {
    // ✅ Add save logic here
    console.log("Saving changes...");
    setShowExitModal(false);
    navigate("/email-campaign");
  };

  const handleExitWithoutSave = () => {
    setShowExitModal(false);
    navigate("/email-campaign");
  };

  const stockImages = [
    "https://images.unsplash.com/photo-1557683316-973673baf926?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1520209759809-a9bcb6cb3241?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=300&h=200&fit=crop",
  ];

  const colorPalette = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
    "#000000",
    "#FFFFFF",
    "#808080",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FFA500",
  ];

  const gradients = [
    "linear-gradient(45deg, #FF6B6B, #4ECDC4)",
    "linear-gradient(45deg, #667eea, #764ba2)",
    "linear-gradient(45deg, #f093fb, #f5576c)",
    "linear-gradient(45deg, #4facfe, #00f2fe)",
    "linear-gradient(45deg, #43e97b, #38f9d7)",
    "linear-gradient(45deg, #fa709a, #fee140)",
  ];

  const patterns = [
    "linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)",
    "radial-gradient(circle, #333 10%, transparent 10%), radial-gradient(circle, #333 10%, transparent 10%)",
    "linear-gradient(90deg, #333 2px, transparent 2px), linear-gradient(#333 2px, transparent 2px)",
  ];

  const animations = [
    { id: "fade", name: "Fade In", icon: Zap },
    { id: "slide", name: "Slide In", icon: Move },
    { id: "bounce", name: "Bounce", icon: ChevronDown },
    { id: "zoom", name: "Zoom", icon: ZoomIn },
    { id: "spin", name: "Spin", icon: RotateCcw },
    { id: "pulse", name: "Pulse", icon: ChevronUp },
  ];

  const icons = [
    { name: "Star", icon: Star },
    { name: "Heart", icon: Heart },
    { name: "Check", icon: Check },
    { name: "Arrow", icon: ArrowRight },
    { name: "Home", icon: Home },
    { name: "User", icon: User },
    { name: "Settings", icon: Settings },
    { name: "Mail", icon: Mail },
  ];

const socialIcons = [
  { 
    name: "Facebook", 
    src: "https://cdn-icons-png.flaticon.com/512/733/733547.png", 
    color: "#1877F2" 
  },
  { 
    name: "Twitter", 
    src: "https://cdn-icons-png.flaticon.com/512/733/733579.png", 
    color: "#1DA1F2" 
  },
  { 
    name: "Instagram", 
    src: "https://cdn-icons-png.flaticon.com/512/2111/2111463.png", 
    color: "#E4405F" 
  },
  { 
    name: "LinkedIn", 
    src: "https://cdn-icons-png.flaticon.com/512/145/145807.png", 
    color: "#0077B5" 
  },
  { 
    name: "YouTube", 
    src: "https://cdn-icons-png.flaticon.com/512/1384/1384060.png", 
    color: "#FF0000"
  }
];

 
 

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        onUploadImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlSubmit = () => {
    if (imageUrl.trim()) {
      onSelectStockImage(imageUrl);
      setImageUrl("");
    }
  };

  const handleStockImageSelect = (imageSrc) => {
    onAddElement("image", { src: imageSrc });
  };

  const handleColorSelect = (color) => {
    if (selectedElement) {
      const styleUpdates = {};

      switch (selectedElement.type) {
        case "rectangle":
        case "circle":
        case "card":
          styleUpdates.backgroundColor = color;
          break;
        case "heading":
        case "paragraph":
        case "button":
          styleUpdates.color = color;
          break;
        case "line":
          styleUpdates.stroke = color;
          break;
        default:
          styleUpdates.color = color;
      }

      onUpdateElementStyle(selectedElement.id, styleUpdates);
    } else {
      onAddElement("card", {
        style: { backgroundColor: color },
      });
    }
  };

  const handleGradientSelect = (gradient) => {
    if (selectedElement) {
      const styleUpdates = {};

      if (
        selectedElement.type === "rectangle" ||
        selectedElement.type === "circle" ||
        selectedElement.type === "card"
      ) {
        styleUpdates.background = gradient;
        styleUpdates.backgroundColor = "black";
      }

      onUpdateElementStyle(selectedElement.id, styleUpdates);
    } else {
      onAddElement("card", {
        style: { background: gradient },
      });
    }
  };

  const handlePatternSelect = (pattern) => {
    if (selectedElement) {
      const styleUpdates = {};

      if (
        selectedElement.type === "rectangle" ||
        selectedElement.type === "circle" ||
        selectedElement.type === "card"
      ) {
        styleUpdates.background = pattern;
        styleUpdates.backgroundColor = "transparent";
      }

      onUpdateElementStyle(selectedElement.id, styleUpdates);
    } else {
      onAddElement("card", {
        style: { background: pattern },
      });
    }
  };

  const handleCustomColor = (e) => {
    handleColorSelect(e.target.value);
  };

  const handleAddIcon = (iconName) => {
    onAddElement("icon", {
      name: iconName,
      color: "#000000",
      fontSize: 24,
      link: null,
    });
  };

  const handleAddSocialIcon = (socialName, socialColor) => {
    const link = prompt(`Enter link for ${socialName} (optional):`, "");

  onAddElement("social", {
    type: "social",
    platform: icon.name,
    src: icon.src,   // ✅ proper image URL
    link: "#"
  });


  };

  const handleAddCard = (cardStyle) => {
    onAddElement("card", {
      ...cardStyle.style,
      content: "This is a card element. You can edit this text.",
      width: 300,
      height: 200,
    });
  };

  const handleAnimationSelect = (animationId) => {
    if (selectedElement) {
      onUpdateElementStyle(selectedElement.id, {
        animation: animationId,
        animationDuration: 1,
        animationDelay: 0,
        animationTiming: "ease",
      });
    }
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleCanvasBackgroundChange = (color) => {
    setCanvasBackgroundColor(color);
  };

  const tabs = [
    { id: "elements", label: "Elements", icon: Shapes },
    
    { id: "images", label: "Images", icon: FileImage },
    { id: "colors", label: "Colors", icon: Palette },
  ];

  return (
    <div className="w-80 bg-black border-r border-[#c2831f] flex flex-col h-full">
      {/* Header */}
      <div className="h-16 p-4 border-b border-[#c2831f]">
        <h2
          className="text-2xl font-bold text-[#c2831f] flex items-center gap-2 px-10"
          title="Design Tools"
        >
          <Layers size={24} />
          Design Tools
        </h2>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-[#c2831f]">
        <h3 className="text-sm font-medium text-gray-100 mb-3">
          Quick Actions
        </h3>
        <div className="grid grid-cols-4 gap-2 mb-4">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-80 disabled:cursor-not-allowed rounded-lg transition-colors"
            title="Undo last action"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-80 disabled:cursor-not-allowed rounded-lg transition-colors"
            title="Redo last action"
          >
            <RotateCw size={16} />
          </button>
          <button
            onClick={onDuplicate}
            disabled={!selectedElement}
            className="p-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-80 disabled:cursor-not-allowed rounded-lg transition-colors"
            title="Duplicate selected element"
          >
            <Copy size={16} />
          </button>
          <button
            onClick={onDelete}
            disabled={!selectedElement}
            className="p-3 bg-red-600 hover:bg-red-700 disabled:opacity-80 disabled:cursor-not-allowed rounded-lg transition-colors"
            title="Delete selected element"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-100">Zoom</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoomLevel((prev) => Math.max(prev - 0.1, 0.1))}
              className="p-1 bg-gray-700 hover:bg-gray-600 rounded"
              title="Zoom out"
            >
              <ZoomOut size={14} />
            </button>
            <span className="text-xs font-mono min-w-12 text-center text-gray-300">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((prev) => Math.min(prev + 0.1, 3))}
              className="p-1 bg-gray-700 hover:bg-gray-600 rounded"
              title="Zoom in"
            >
              <ZoomIn size={14} />
            </button>
          </div>
        </div>

        {/* Grid Toggle */}
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
            showGrid
              ? "bg-[#c2831f] text-white cursor-pointer"
              : "bg-gray-700 hover:bg-gray-600 "
          }`}
          title="Toggle grid display"
        >
          <span className="text-sm">Show Grid</span>
          <Grid size={16} />
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-[#c2831f]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-[#c2831f] text-white"
                : "text-white hover:text-gray-200 hover:bg-gray-700"
            }`}
            title={`View ${tab.label}`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Elements Tab */}
        {activeTab === "elements" && (
          <div className="space-y-4 ">
            {/* Text Elements */}
            <div className="bg-gray-700/50 rounded-lg p-3">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleSection("text")}
                title="Toggle text elements section"
              >
                <h3 className="text-sm font-medium text-gray-300">
                  Text Elements
                </h3>
                {expandedSections.text ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </div>

              {expandedSections.text && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button
                    onClick={() => onAddElement("heading")}
                    className="flex flex-col items-center gap-2 p-3 bg-transparent hover:bg-gray-600 rounded-lg transition-colors group"
                    title="Add heading text"
                  >
                    <Type size={20} className="text-blue-400" />
                    <span className="text-xs text-gray-300 group-hover:text-white cursor-pointer">
                      Heading
                    </span>
                  </button>
                  <button
                    onClick={() => onAddElement("paragraph")}
                    className="flex flex-col items-center gap-2 cursor-pointer p-3 bg-transparent hover:bg-gray-600 rounded-lg transition-colors group"
                    title="Add paragraph text"
                  >
                    <Type size={16} className="text-green-400" />
                    <span className="text-xs text-gray-300 group-hover:text-white cursor-pointer">
                      Paragraph
                    </span>
                  </button>
                  <button
                    onClick={() => onAddElement("subheading")}
                    className="flex flex-col items-center gap-2 p-3 bg-transparent  hover:bg-gray-600 rounded-lg transition-colors group"
                    title="Add subheading text"
                  >
                    <Type size={18} className="text-purple-400 " />
                    <span className="text-xs text-gray-300 group-hover:text-white cursor-pointer">
                      Subheading
                    </span>
                  </button>
                  <button
                    onClick={() => onAddElement("blockquote")}
                    className="flex flex-col items-center gap-2 p-3 bg-transparent hover:bg-gray-600 rounded-lg transition-colors group"
                    title="Add blockquote text"
                  >
                    <FileText size={16} className="text-yellow-400 " />
                    <span className="text-xs text-gray-300 group-hover:text-white cursor-pointer">
                      Quote
                    </span>
                  </button>
                </div>
              )}
            </div>

             

            {/* Shapes */}
            <div className="bg-gray-700/50 rounded-lg p-3">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleSection("shapes")}
                title="Toggle shapes section"
              >
                <h3 className="text-sm font-medium text-gray-300">Shapes</h3>
                {expandedSections.shapes ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </div>

              {expandedSections.shapes && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <button
                    onClick={() => onAddElement("rectangle")}
                    className="flex flex-col items-center gap-2 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors group"
                    title="Add rectangle shape"
                  >
                    <Square size={20} className="text-purple-400" />
                    <span className="text-xs text-gray-300 group-hover:text-white">
                      Rectangle
                    </span>
                  </button>
                  <button
                    onClick={() => onAddElement("circle")}
                    className="flex flex-col items-center gap-2 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors group"
                    title="Add circle shape"
                  >
                    <Circle size={20} className="text-pink-400" />
                    <span className="text-xs text-gray-300 group-hover:text-white">
                      Circle
                    </span>
                  </button>
                  <button
                    onClick={() => onAddElement("triangle")}
                    className="flex flex-col items-center gap-2 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors group"
                    title="Add triangle shape"
                  >
                    <Triangle size={20} className="text-green-400" />
                    <span className="text-xs text-gray-300 group-hover:text-white">
                      Triangle
                    </span>
                  </button>
                  <button
                    onClick={() => onAddElement("star")}
                    className="flex flex-col items-center gap-2 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors group"
                    title="Add star shape"
                  >
                    <Star size={20} className="text-yellow-400" />
                    <span className="text-xs text-gray-300 group-hover:text-white">
                      Star
                    </span>
                  </button>
                  <button
                    onClick={() => onAddElement("hexagon")}
                    className="flex flex-col items-center gap-2 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors group"
                    title="Add hexagon shape"
                  >
                    <Hexagon size={20} className="text-blue-400" />
                    <span className="text-xs text-gray-300 group-hover:text-white">
                      Hexagon
                    </span>
                  </button>
                  <button
                    onClick={() => onAddElement("arrow")}
                    className="flex flex-col items-center gap-2 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors group"
                    title="Add arrow shape"
                  >
                    <ArrowRight size={20} className="text-red-400" />
                    <span className="text-xs text-gray-300 group-hover:text-white">
                      Arrow
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Interactive Elements */}
            <div className="bg-gray-700/50 rounded-lg p-3">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleSection("interactive")}
                title="Toggle interactive elements section"
              >
                <h3 className="text-sm font-medium text-gray-300">
                  Interactive
                </h3>
                {expandedSections.interactive ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </div>

              {expandedSections.interactive && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button
                    onClick={() => {
                      const link = prompt("Enter button link (optional):", "");
                      onAddElement("button", { link: link || null });
                    }}
                    className="flex flex-col items-center gap-2 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors group"
                    title="Add button element"
                  >
                    <Square size={16} className="text-orange-400" />
                    <span className="text-xs text-gray-300 group-hover:text-white">
                      Button
                    </span>
                  </button>
                  <button
                    onClick={() => onAddElement("input")}
                    className="flex flex-col items-center gap-2 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors group"
                    title="Add input field"
                  >
                    <PenTool size={16} className="text-indigo-400" />
                    <span className="text-xs text-gray-300 group-hover:text-white">
                      Input
                    </span>
                  </button>
                  <button
                    onClick={() => onAddElement("checkbox")}
                    className="flex flex-col items-center gap-2 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors group"
                    title="Add checkbox"
                  >
                    <Hash size={16} className="text-teal-400" />
                    <span className="text-xs text-gray-300 group-hover:text-white">
                      Checkbox
                    </span>
                  </button>
                  <button
                    onClick={() => onAddElement("line")}
                    className="flex flex-col items-center gap-2 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors group"
                    title="Add line element"
                  >
                    <Minus size={20} className="text-yellow-400" />
                    <span className="text-xs text-gray-300 group-hover:text-white">
                      Line
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Media Elements */}
            <div className="bg-gray-700/50 rounded-lg p-3">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleSection("media")}
                title="Toggle media elements section"
              >
                <h3 className="text-sm font-medium text-gray-300">Media</h3>
                {expandedSections.media ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </div>

              {expandedSections.media && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button
                    onClick={() => onAddElement("image")}
                    className="flex flex-col items-center gap-2 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors group"
                    title="Add image element"
                  >
                    <Image size={20} className="text-blue-400" />
                    <span className="text-xs text-gray-300 group-hover:text-white">
                      Image
                    </span>
                  </button>
                  <button
                    onClick={() => onAddElement("video")}
                    className="flex flex-col items-center gap-2 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors group"
                    title="Add video element"
                  >
                    <Video size={20} className="text-red-400" />
                    <span className="text-xs text-gray-300 group-hover:text-white">
                      Video
                    </span>
                  </button>
                  <button
                    onClick={() => onAddElement("audio")}
                    className="flex flex-col items-center gap-2 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors group"
                    title="Add audio element"
                  >
                    <Music size={20} className="text-green-400" />
                    <span className="text-xs text-gray-300 group-hover:text-white">
                      Audio
                    </span>
                  </button>
                  <button
                    onClick={() => onAddElement("frame")}
                    className="flex flex-col items-center gap-2 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors group"
                    title="Add frame element"
                  >
                    <Frame size={20} className="text-purple-400" />
                    <span className="text-xs text-gray-300 group-hover:text-white">
                      Frame
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Social Icons */}
            <div className="bg-gray-700/50 rounded-lg p-3">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleSection("social")}
                title="Toggle social icons section"
              >
                <h3 className="text-sm font-medium text-gray-300">
                  Social Icons
                </h3>
                {expandedSections.social ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </div>

              {expandedSections.social && (
                <div className="grid grid-cols-5 gap-2 mt-3">
                  {socialIcons.map((item, index) => (
                    <div
                      key={index}
                      className="p-2 cursor-pointer"
                      onClick={() => onAddElement("social", {
                        type: "social",
                        platform: item.name,
                        src: item.src,
                        link: "#"
                      })}
                    >
                      <img
                        src={item.src}
                        alt={item.name}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 4
                        }}
                      />
                    </div>
                  ))}

                </div>
              )}
            </div>

            {/* Icons */}
            <div className="bg-gray-700/50 rounded-lg p-3">
              <h3
                className="text-sm font-medium text-gray-300 mb-3"
                title="Basic icons"
              >
                Icons
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {icons.map((icon, index) => (
                  <button
                    key={index}
                    onClick={() => handleAddIcon(icon.name)}
                    className="flex flex-col items-center gap-1 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors group"
                    title={`Add ${icon.name} icon`}
                  >
                    <icon.icon size={18} className="text-blue-400" />
                    <span className="text-xs text-gray-300 group-hover:text-white">
                      {icon.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

         
        

        {/* Images Tab */}
        {/* Images Tab */}
        {activeTab === "images" && (
          <div className="space-y-4">
            {/* Upload Image */}
            <div className="bg-gray-700/50 rounded-lg p-3">
              <h3 className="text-sm font-medium text-gray-300 mb-3">
                Upload Image
              </h3>
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="block w-full text-sm text-gray-300 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              />
            </div>

            {/* Image from URL */}
            <div className="bg-gray-700/50 rounded-lg p-3">
              <h3 className="text-sm font-medium text-gray-300 mb-3">
                From URL
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Paste image URL"
                  className="flex-1 p-2 rounded bg-gray-800 text-gray-300"
                />
                <button
                  onClick={handleUrlSubmit}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Stock Images */}
            <div className="bg-gray-700/50 rounded-lg p-3">
              <h3 className="text-sm font-medium text-gray-300 mb-3">
                Stock Images
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {stockImages.map((src, idx) => (
                  <img
                    key={idx}
                    src={src}
                    alt="stock"
                    className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80"
                    onClick={() => handleStockImageSelect(src)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Colors Tab */}
        {activeTab === "colors" && (
          <div className="space-y-4">
            {/* Page Background Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3">
                Page Background
              </h3>
              <div className="grid grid-cols-5 gap-3 mb-4">
                {colorPalette.map((color, index) => (
                  <button
                    key={index}
                    className={`w-10 h-10 rounded-lg border-2 hover:border-white transition-colors hover:scale-110 transform ${
                      canvasBackgroundColor === color
                        ? "border-white ring-2 ring-blue-500"
                        : "border-gray-600"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleCanvasBackgroundChange(color)}
                    title={`Set background to ${color}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={canvasBackgroundColor}
                  onChange={(e) => handleCanvasBackgroundChange(e.target.value)}
                  className="w-12 h-10 bg-gray-700 border border-gray-600 rounded cursor-pointer"
                  title="Custom background color"
                />
                <input
                  type="text"
                  value={canvasBackgroundColor}
                  onChange={(e) => handleCanvasBackgroundChange(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="#FFFFFF"
                  title="Enter custom color code"
                />
              </div>
            </div>
 
          </div>
        )}

        {/* Animations Tab */}
        {activeTab === "animations" && (
          <div className="space-y-4">
            <div className="p-3 bg-gray-700 rounded-lg">
              <p
                className="text-xs text-gray-300"
                title="Animation instructions"
              >
                {selectedElement
                  ? `Applying animations to selected ${selectedElement.type}`
                  : "Select an element to apply animations"}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3">
                Animations
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {animations.map((animation) => (
                  <button
                    key={animation.id}
                    onClick={() => handleAnimationSelect(animation.id)}
                    className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex flex-col items-center gap-2"
                    title={`Apply ${animation.name} animation`}
                  >
                    <animation.icon size={20} className="text-blue-400" />
                    <span className="text-xs text-gray-300">
                      {animation.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3">
                Animation Settings
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Duration
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="5"
                    step="0.1"
                    defaultValue="1"
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    title="Set animation duration"
                  />
                  <div className="text-sm text-gray-400 text-center mt-1">
                    1.0s
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Delay
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    defaultValue="0"
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    title="Set animation delay"
                  />
                  <div className="text-sm text-gray-400 text-center mt-1">
                    0.0s
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Easing
                  </label>
                  <select
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="Select animation easing"
                  >
                    <option>Linear</option>
                    <option>Ease In</option>
                    <option>Ease Out</option>
                    <option>Ease In Out</option>
                    <option>Bounce</option>
                    <option>Elastic</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Exit Button */}

      <div className="p-4 border-t border-gray-700 text-xs text-gray-400 flex justify-between items-center">
        <button
          onClick={() => setShowExitModal(true)}
          className="px-13 py-4 rounded-md bg-[#c4221f] text-white hover:bg-[#d09025] text-sm"
        >
          Exit
        </button>
        <button
          onClick={() => navigate("/texteditor")}
          className="px-5 py-4 rounded-md bg-green-500 text-white hover:bg-green-600 text-sm"
        >
          Text Editor Page
        </button>
      </div>

      {/* Exit Modal */}
      {showExitModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-80 text-center">
            <h3 className="text-lg font-medium text-white mb-4">
              Do you want to exit?
            </h3>
            <div className="flex justify-center gap-4">
              {/* ❌ Exit Without Saving */}
              <button
                onClick={handleExitWithoutSave}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                Exit
              </button>

              {/* 🔙 Cancel */}
              <button
                onClick={() => setShowExitModal(false)}
                className="px-4 py-2 rounded-md bg-gray-700 text-white hover:bg-gray-600"
              >
                Don’t Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Toolbox;
