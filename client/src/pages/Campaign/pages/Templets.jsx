// src/pages/TemplatesPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Star, Eye, Heart, Trash2, FileText, Loader2 } from "lucide-react";
import { listSavedTemplates, deleteSavedTemplate, TEMPLATE_TYPES } from "./savedTemplateService";
import { templates, TEMPLATE_CATEGORIES, CATEGORY_ACCENT } from "./campaignTemplateData";

// Enhanced templates with more variety
// Templates now live in campaignTemplateData.js (shared with the other gallery)
const categories = ["All", ...TEMPLATE_CATEGORIES, "Saved"];

const TemplatesPage = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = React.useState("All");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [previewTemplate, setPreviewTemplate] = React.useState(null);
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [loadingSaved,   setLoadingSaved]   = useState(true);

  /* Saved designs come from the shared saved_templates table filtered to
     type="canvas". Their `content` is already canvas elements, not the block
     format the built-ins use — handleSelect branches on isSaved for that. */
  const loadSaved = useCallback(() => {
    setLoadingSaved(true);
    listSavedTemplates(TEMPLATE_TYPES.CANVAS)
      .then((rows) => setSavedTemplates(rows.map((r) => ({
        id:          r.templateId,
        name:        r.name,
        category:    r.category,
        description: `Saved ${new Date(r.updatedAt).toLocaleDateString()}`,
        preview:     r.preview || "",
        rating:      null,
        likes:       null,
        content:     Array.isArray(r.content) ? r.content : [],
        canvasBackgroundColor: r.canvasBackgroundColor || "#FFFFFF",
        isSaved:     true,
      }))))
      .catch(() => setSavedTemplates([]))
      .finally(() => setLoadingSaved(false));
  }, []);

  useEffect(() => { loadSaved(); }, [loadSaved]);

  const removeSaved = async (tpl, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${tpl.name}"? This can't be undone.`)) return;
    setSavedTemplates((rows) => rows.filter((r) => r.id !== tpl.id));   // optimistic
    try { await deleteSavedTemplate(tpl.id); } catch { loadSaved(); }
  };

  // const handleSelect = (template) => {
  //   navigate("/editor", { state: { template: { ...template, fixed: true } } });
  // };
  // Complete updated handleSelect function for Templets.jsx
const handleSelect = (template) => {
  // A saved design was stored post-conversion, so its content is already a
  // canvas element array. Running it through the block converter again would
  // mangle it (blocks use `value`, elements use `content`).
  if (template.isSaved) {
    navigate("/editor", {
      state: {
        template: {
          id: template.id,
          name: template.name,
          content: template.content,
          canvasBackgroundColor: template.canvasBackgroundColor || "#FFFFFF",
        },
      },
    });
    return;
  }

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

      case "subheading": {
        const subHeight = 40;
        elementConfig = {
          id: crypto.randomUUID(),
          type: "subheading",
          content: block.value || "Subheading",
          x: leftMargin,
          y: currentY,
          width: contentWidth,
          height: subHeight,
          fontSize: block.style?.fontSize || 20,
          color: block.style?.color || "#1f2937",
          backgroundColor: block.style?.backgroundColor || "transparent",
          fontFamily: block.style?.fontFamily || "Arial",
          fontWeight: block.style?.fontWeight || "600",
          textAlign: block.style?.textAlign || "left",
          fontStyle: "normal",
          textDecoration: "none",
          opacity: 1, rotation: 0, borderRadius: 0, borderWidth: 0, borderColor: "#000000"
        };
        currentY += subHeight + 12;   // tighter gap: a subheading owns the block below it
        break;
      }

      case "divider": {
        const ruleHeight = block.style?.height || 1;
        elementConfig = {
          id: crypto.randomUUID(),
          type: "line",
          content: "",
          x: leftMargin,
          y: currentY,
          width: contentWidth,
          height: ruleHeight,
          strokeColor: block.style?.color || "#e5e7eb",
          strokeWidth: ruleHeight,
          backgroundColor: block.style?.color || "#e5e7eb",
          color: block.style?.color || "#e5e7eb",
          fontSize: 16, fontFamily: "Arial", fontWeight: "normal",
          textAlign: "left", fontStyle: "normal", textDecoration: "none",
          opacity: 1, rotation: 0, borderRadius: 0, borderWidth: 0, borderColor: "#000000"
        };
        currentY += ruleHeight + baseSpacing;
        break;
      }

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
  const allTemplates = [...savedTemplates, ...templates];

  const filteredTemplates = allTemplates.filter((template) => {
    const matchesCategory =
      selectedCategory === "All" ||
      (selectedCategory === "Saved"
        ? !!template.isSaved
        : template.category === selectedCategory);
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
                <span className={`ml-2 text-xs ${selectedCategory === category ? "opacity-80" : "text-gray-500"}`}>
                  {category === "All"   ? allTemplates.length
                 : category === "Saved" ? savedTemplates.length
                 : allTemplates.filter((t) => t.category === category).length}
                </span>
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
                  {template.preview ? (
                    <img
                      src={template.preview}
                      alt={template.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      title={`Preview of ${template.name} template`}
                    />
                  ) : (
                    // Saved designs have no thumbnail — show the element count instead
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-gray-900 to-gray-800">
                      <FileText size={30} className="text-[#c2831f]" />
                      <span className="text-xs text-gray-500">
                        {template.content.length} element{template.content.length === 1 ? "" : "s"}
                      </span>
                    </div>
                  )}
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
                  
                  {template.isSaved && (
                    <button
                      onClick={(e) => removeSaved(template, e)}
                      title="Delete this saved template"
                      className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-900/80 text-gray-300 hover:text-red-400 hover:bg-gray-900 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}

                  {/* Category Badge */}
                  <div className="absolute top-4 left-4">
                    <span 
                      className="px-3 py-1 backdrop-blur-sm text-white text-sm font-medium rounded-full"
                      style={{ backgroundColor: CATEGORY_ACCENT[template.category] || "#2563eb" }}
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
                  
                  {/* Stats — built-ins only; saved designs show their date */}
                  {template.isSaved ? (
                    <div className="text-sm text-gray-500">{template.description}</div>
                  ) : (
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <div className="flex items-center space-x-1" title={`Rating: ${template.rating} out of 5 stars`}>
                        <Star size={14} className="text-yellow-400 fill-current" />
                        <span>{template.rating}</span>
                      </div>
                      <div className="flex items-center space-x-1" title={`${template.likes} people liked this template`}>
                        <Heart size={14} />
                        <span>{template.likes}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Preview Content */}
                  <div className="mt-4 space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {template.content.slice(0, 2).map((element, index) => {
                      // Built-ins use block.value, saved elements use .content
                      const text = String(element.value ?? element.content ?? "");
                      const kind = element.type;
                      return (
                        <div key={index} className="text-xs text-gray-500">
                          {(kind === "text" || kind === "heading" || kind === "subheading") &&
                            `📝 ${text.substring(0, 30)}${text.length > 30 ? "…" : ""}`}
                          {kind === "paragraph" &&
                            `📄 ${text.substring(0, 40)}${text.length > 40 ? "…" : ""}`}
                          {kind === "button" && `🔘 ${text}`}
                          {kind === "image" && `🖼️ Image included`}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Loading saved designs */}
          {loadingSaved && filteredTemplates.length === 0 && (
            <div className="flex items-center justify-center gap-2 py-16 text-gray-500">
              <Loader2 size={18} className="animate-spin" /> Loading your saved templates…
            </div>
          )}

          {/* No Results */}
          {!loadingSaved && filteredTemplates.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4" title="No templates found">🔍</div>
              <h3 className="text-2xl font-semibold text-gray-400 mb-2">
                No templates found
              </h3>
              <p className="text-gray-500 mb-6">
                {selectedCategory === "Saved"
                  ? "Designs you save from the editor will show up here."
                  : "Try adjusting your search or category filter"}
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
              {previewTemplate.isSaved && previewTemplate.content.map((el, index) => {
                // Saved rows hold canvas elements: text lives in `content`,
                // styling in flat props rather than a `style` object.
                const style = {
                  fontSize:   el.fontSize,
                  color:      el.color,
                  fontFamily: el.fontFamily,
                  fontWeight: el.fontWeight,
                  textAlign:  el.textAlign,
                  fontStyle:  el.fontStyle,
                  backgroundColor: el.backgroundColor === "transparent" ? undefined : el.backgroundColor,
                  whiteSpace: "pre-line",
                };
                if (el.type === "heading")    return <h2 key={index} style={style}>{el.content}</h2>;
                if (el.type === "subheading") return <h3 key={index} style={style}>{el.content}</h3>;
                if (el.type === "paragraph" || el.type === "blockquote")
                  return <p key={index} style={style} dangerouslySetInnerHTML={{ __html: el.content || "" }} />;
                if (el.type === "button")
                  return (
                    <button key={index} style={{ ...style, padding: "12px 26px", borderRadius: el.borderRadius || 8, border: "none" }}>
                      {el.content}
                    </button>
                  );
                if (el.type === "image")
                  return <img key={index} src={el.src} alt="" className="rounded-lg max-w-full" />;
                if (el.type === "line")
                  return <hr key={index} style={{ borderColor: el.strokeColor || "#e5e7eb" }} />;
                return null;
              })}

              {!previewTemplate.isSaved && previewTemplate.content.map((block, index) => {
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
                if (block.type === "subheading") {
                  return <h4 key={index} style={block.style} title="Subheading element">{block.value}</h4>;
                }
                if (block.type === "divider") {
                  return <hr key={index} style={{ borderColor: block.style?.color || "#e5e7eb" }} />;
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
                {previewTemplate.isSaved ? "Open in Editor" : "Use Template"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatesPage;