// CanvasArea.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Rnd } from "react-rnd";
import { 
  Send, Save, Trash2, FileText, Eye, X, Plus, Download, Play, Layers, Eraser, 
  Type, Square, Circle, Minus, Image, Video, Music, Frame, Star, Triangle, Hexagon, 
  ArrowRight, PenTool, Hash, ChevronDown, ChevronUp, Zap, Move, ZoomIn, RotateCcw, 
  Heart, Home, User, Settings, Mail, Check, Facebook, Twitter, Instagram, Linkedin, 
  Youtube, CreditCard, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, 
  Palette 
} from 'lucide-react';
import { api } from "../../../../api";

const TextStylePanel = ({ selectedElement, onUpdateElementStyle, onClose, zoomLevel }) => {
  const [fontSize, setFontSize] = useState(selectedElement?.fontSize || 16);
  const [fontFamily, setFontFamily] = useState(selectedElement?.fontFamily || 'Arial');
  const [color, setColor] = useState(selectedElement?.color || '#000000');
  const [backgroundColor, setBackgroundColor] = useState(selectedElement?.backgroundColor || 'transparent');
  const [fontWeight, setFontWeight] = useState(selectedElement?.fontWeight || 'normal');
  const [fontStyle, setFontStyle] = useState(selectedElement?.fontStyle || 'normal');
  const [textDecoration, setTextDecoration] = useState(selectedElement?.textDecoration || 'none');
  const [textAlign, setTextAlign] = useState(selectedElement?.textAlign || 'left');
  const [lineHeight, setLineHeight] = useState(selectedElement?.lineHeight || 1.4);

  const fontFamilies = ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 'Trebuchet MS', 'Impact', 'Comic Sans MS', 'Courier New', 'Lucida Console', 'Palatino', 'Garamond'];
  const colorPalette = ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000', '#FF69B4', '#4169E1', '#32CD32', '#FFD700', '#FF6347', '#9370DB', '#20B2AA'];

  useEffect(() => {
    if (selectedElement) {
      setFontSize(selectedElement.fontSize || 16);
      setFontFamily(selectedElement.fontFamily || 'Arial');
      setColor(selectedElement.color || '#000000');
      setBackgroundColor(selectedElement.backgroundColor || 'transparent');
      setFontWeight(selectedElement.fontWeight || 'normal');
      setFontStyle(selectedElement.fontStyle || 'normal');
      setTextDecoration(selectedElement.textDecoration || 'none');
      setTextAlign(selectedElement.textAlign || 'left');
      setLineHeight(selectedElement.lineHeight || 1.4);
    }
  }, [selectedElement]);

  const handleStyleChange = (property, value) => {
    const updates = { [property]: value };
    onUpdateElementStyle(selectedElement.id, updates);
    switch(property) {
      case 'fontSize': setFontSize(value); break;
      case 'fontFamily': setFontFamily(value); break;
      case 'color': setColor(value); break;
      case 'backgroundColor': setBackgroundColor(value); break;
      case 'fontWeight': setFontWeight(value); break;
      case 'fontStyle': setFontStyle(value); break;
      case 'textDecoration': setTextDecoration(value); break;
      case 'textAlign': setTextAlign(value); break;
      case 'lineHeight': setLineHeight(value); break;
    }
  };

  const toggleBold = () => handleStyleChange('fontWeight', fontWeight === 'bold' ? 'normal' : 'bold');
  const toggleItalic = () => handleStyleChange('fontStyle', fontStyle === 'italic' ? 'normal' : 'italic');
  const toggleUnderline = () => handleStyleChange('textDecoration', textDecoration === 'underline' ? 'none' : 'underline');

  if (!selectedElement || !['heading', 'paragraph', 'subheading', 'blockquote'].includes(selectedElement.type)) return null;

};

const EditableTextElement = ({ 
  element, 
  isSelected, 
  zoomLevel, 
  onFocus, 
  onBlur, 
  onDoubleClick,
  onUpdateElement 
}) => {
  const contentEditableRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  function getDefaultContent(type) {
    switch(type) {
      case "heading": return "Heading";
      case "subheading": return "Subheading";
      case "blockquote": return "Blockquote";
      default: return "Paragraph text";
    }
  }

  useEffect(() => {
    if (!isEditing && !isFocused && contentEditableRef.current) {
      contentEditableRef.current.innerHTML = element.content || getDefaultContent(element.type);
    }
  }, [element.content, isEditing, isFocused, element.type]);

  const handleFocus = (e) => {
    setIsEditing(true);
    setIsFocused(true);
    onFocus(e);
  };

  const handleBlur = (e) => {
    setIsEditing(false);
    setIsFocused(false);
    const newContent = e.currentTarget.innerHTML;
    onUpdateElement(element.id, { content: newContent });
    onBlur(e);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const br = document.createElement('br');
        range.deleteContents();
        range.insertNode(br);
        
        const newRange = document.createRange();
        newRange.setStartAfter(br);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    }
  };

  return (
    <div
      ref={contentEditableRef}
      contentEditable={isSelected}
      suppressContentEditableWarning
      className={`w-full h-full p-2 outline-none overflow-hidden ${
        element.type === "heading" ? "font-bold" :
        element.type === "subheading" ? "font-semibold" :
        element.type === "blockquote" ? "italic pl-4 border-l-4 border-gray-300" : ""
      } ${isSelected ? 'ring-2 ring-blue-400' : ''}`}
      style={{
        fontSize: `${(element.fontSize || 16) * zoomLevel}px`,
        fontFamily: element.fontFamily || 'Arial',
        color: element.color || '#000000',
        fontWeight: element.fontWeight || 'normal',
        fontStyle: element.fontStyle || 'normal',
        textDecoration: element.textDecoration || 'none',
        textAlign: element.textAlign || 'left',
        lineHeight: element.lineHeight || '1.4',
        wordWrap: 'break-word',
        backgroundColor: element.backgroundColor || 'transparent',
        minHeight: '1.4em',
        whiteSpace: 'pre-wrap'
      }}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onDoubleClick={onDoubleClick}
    />
  );
};

export default function CanvasArea({
  pages, setPages, activePage, setActivePage, onUpdate, selectedElement, setSelectedElement, updateElement, 
  zoomLevel = 1, setZoomLevel, showGrid = true, canvasBackgroundColor = '#FFFFFF', onSendCampaign, 
  editingTemplateId = null, isEditingTemplate = false
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [preview, setPreview] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [showTextStylePanel, setShowTextStylePanel] = useState(false);
  const [isTextEditing, setIsTextEditing] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [internalCanvasBackgroundColor, setInternalCanvasBackgroundColor] = useState(canvasBackgroundColor);
  const [templateLoaded, setTemplateLoaded] = useState(false);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600 });
  const canvasRef = useRef(null);
  const containerRef = useRef(null); // Ref for the scrollable container
  
  const pagesRef = useRef(pages);
  const activePageRef = useRef(activePage);
  const isEditingTemplateRef = useRef(isEditingTemplate);
  const editingTemplateIdRef = useRef(editingTemplateId);

  useEffect(() => {
    pagesRef.current = pages;
    activePageRef.current = activePage;
    isEditingTemplateRef.current = isEditingTemplate;
    editingTemplateIdRef.current = editingTemplateId;
  }, [pages, activePage, isEditingTemplate, editingTemplateId]);

  const updateCanvasDimensions = useCallback(() => {
    const currentPages = pagesRef.current;
    const currentActivePage = activePageRef.current;
    
    if (!currentPages[currentActivePage] || !currentPages[currentActivePage].elements) {
      setCanvasDimensions({ width: 600, height: 650 });
      return;
    }

    let maxX = 600;
    let maxY = 600;

    currentPages[currentActivePage].elements.forEach(element => {
      const elementRight = (element.x || 0) + (element.width || 0);
      const elementBottom = (element.y || 0) + (element.height || 0);
      
      if (elementRight > maxX) maxX = elementRight;
      if (elementBottom > maxY) maxY = elementBottom;
    });

    maxX += 100;
    maxY += 100;

    setCanvasDimensions({
      width: Math.max(maxX, 800),
      height: Math.max(maxY, 600)
    });
  }, []);

  useEffect(() => {
    updateCanvasDimensions();
  }, [pages[activePage]?.elements, updateCanvasDimensions]);

  useEffect(() => {
    if (location.state?.template && !templateLoaded) {
      const { template, editingTemplateId, isEditingTemplate } = location.state;
      if (template && template.content) {
        if (Array.isArray(template.content)) {
          const firstItem = template.content[0];
          if (firstItem && firstItem.type && firstItem.x !== undefined && firstItem.y !== undefined) {
            setPages([{ id: 1, elements: template.content }]);
            setActivePage(0);
            if (template.canvasBackgroundColor) setInternalCanvasBackgroundColor(template.canvasBackgroundColor);
            setTemplateLoaded(true);
          } else {
            setPages([{ id: 1, elements: [] }]);
            setActivePage(0);
            setTemplateLoaded(true);
          }
        } else {
          setPages([{ id: 1, elements: [] }]);
          setActivePage(0);
          setTemplateLoaded(true);
        }
      }
    } else if (!templateLoaded) {
      const savedData = localStorage.getItem('canvasData');
      if (savedData) {
        try {
          const { pages: savedPages, activePage: savedActivePage, canvasBackgroundColor: savedBg } = JSON.parse(savedData);
          setPages(savedPages);
          setActivePage(savedActivePage);
          setInternalCanvasBackgroundColor(savedBg);
        } catch (error) {
          console.error('Failed to load saved data:', error);
        }
      }
      setTemplateLoaded(true);
    }
  }, [location.state, templateLoaded, setPages, setActivePage]);

  useEffect(() => {
    setInternalCanvasBackgroundColor(canvasBackgroundColor);
  }, [canvasBackgroundColor]);

  useEffect(() => {
    if (document.getElementById('animation-styles')) return;
    const style = document.createElement('style');
    style.id = 'animation-styles';
    style.textContent = `
      @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
      @keyframes slide { from { transform: translateX(-100%); } to { transform: translateX(0); } }
      @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
      @keyframes zoom { from { transform: scale(0); } to { transform: scale(1); } }
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
      .animate-fade { animation: fade 1s ease both; }
      .animate-slide { animation: slide 1s ease both; }
      .animate-bounce { animation: bounce 1s ease both; }
      .animate-zoom { animation: zoom 1s ease both; }
      .animate-spin { animation: spin 1s linear both; }
      .animate-pulse { animation: pulse 1s ease both; }
      .custom-scrollbar::-webkit-scrollbar { width: 10px; height: 10px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.1); border-radius: 5px; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.3); border-radius: 5px; }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.5); }
    `;
    document.head.appendChild(style);
  }, []);

  const updateEditedTemplate = useCallback(() => {
    const currentIsEditing = isEditingTemplateRef.current;
    const currentTemplateId = editingTemplateIdRef.current;
    const currentPages = pagesRef.current;
    const currentActivePage = activePageRef.current;

    if (!currentIsEditing || !currentTemplateId) return;

    const userTemplates = JSON.parse(localStorage.getItem('userCreatedTemplates') || '[]');
    const templateIndex = userTemplates.findIndex(t => t.id === currentTemplateId);
    
    if (templateIndex === -1) return;

    const templateContent = currentPages[currentActivePage].elements.map(element => {
      switch (element.type) {
        case 'heading':
        case 'paragraph':
        case 'subheading':
        case 'blockquote':
          return {
            type: element.type === 'heading' ? 'text' : 'paragraph',
            value: element.content || (element.type === 'heading' ? 'Heading' : 'Text'),
            style: {
              fontSize: element.fontSize || 16,
              color: element.color || '#000000',
              backgroundColor: element.backgroundColor || 'transparent',
              fontFamily: element.fontFamily || 'Arial',
              fontWeight: element.fontWeight || 'normal',
              textAlign: element.textAlign || 'left',
              fontStyle: element.fontStyle || 'normal',
              textDecoration: element.textDecoration || 'none',
              lineHeight: element.lineHeight || 1.4,
              marginBottom: element.style?.marginBottom || '20px'
            }
          };
        case 'button':
          return {
            type: 'button',
            value: element.content || 'Button',
            style: {
              fontSize: element.fontSize || 16,
              color: element.color || '#ffffff',
              backgroundColor: element.backgroundColor || '#3b82f6',
              fontFamily: element.fontFamily || 'Arial',
              fontWeight: element.fontWeight || '600',
              padding: element.style?.padding || '16px 32px',
              borderRadius: element.borderRadius || 8
            }
          };
        case 'image':
          return {
            type: 'image',
            value: element.src || '',
            style: {
              borderRadius: element.borderRadius || 12,
              marginBottom: element.style?.marginBottom || '20px'
            }
          };
        case 'rectangle':
        case 'circle':
        case 'triangle':
        case 'star':
        case 'hexagon':
        case 'arrow':
          return {
            type: 'image',
            value: element.src || 'https://images.unsplash.com/photo-1557683316-973673baf926?w=500&h=300&fit=crop',
            style: {
              borderRadius: element.borderRadius || 12,
              marginBottom: element.style?.marginBottom || '20px'
            }
          };
        default:
          return {
            type: 'paragraph',
            value: 'Unsupported element type',
            style: {}
          };
      }
    });

    userTemplates[templateIndex].content = templateContent;
    localStorage.setItem('userCreatedTemplates', JSON.stringify(userTemplates));
    
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus(''), 2000);
  }, []);

  useEffect(() => {
    if (isEditingTemplate) {
      const timer = setTimeout(() => {
        updateEditedTemplate();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [pages, activePage, isEditingTemplate, updateEditedTemplate]);

  const addPage = () => {
    const newPage = { id: pages.length + 1, elements: [] };
    const updatedPages = [...pages, newPage];
    setPages(updatedPages);
    setActivePage(pages.length);
    saveToLocalStorage(updatedPages, pages.length);
    if (isEditingTemplate) updateEditedTemplate();
  };

  const deletePage = (pageIndex) => {
    if (pages.length > 1) {
      const updatedPages = pages.filter((_, index) => index !== pageIndex);
      setPages(updatedPages);
      if (activePage >= updatedPages.length) {
        const newActivePage = updatedPages.length - 1;
        setActivePage(newActivePage);
        saveToLocalStorage(updatedPages, newActivePage);
      } else {
        saveToLocalStorage(updatedPages, activePage);
      }
      if (isEditingTemplate) updateEditedTemplate();
    }
  };

  const handleElementClick = (elementId, e) => {
    e.stopPropagation();
    setSelectedElement(elementId);
    const element = pages[activePage].elements.find(el => el.id === elementId);
    if (element && ['heading', 'paragraph', 'subheading', 'blockquote'].includes(element.type)) {
      setShowTextStylePanel(true);
    } else {
      setShowTextStylePanel(false);
    }
  };

  const handleCanvasClick = (e) => {
    if (e.target === canvasRef.current || e.target.closest('.canvas-background')) {
      setSelectedElement(null);
      setShowTextStylePanel(false);
    }
  };

  const handleElementUpdate = (elementId, newProps) => {
    updateElement(elementId, newProps);
    const updatedElements = pages[activePage].elements.map(el => el.id === elementId ? { ...el, ...newProps } : el);
    const updatedPages = [...pages];
    updatedPages[activePage] = { ...updatedPages[activePage], elements: updatedElements };
    setPages(updatedPages);
    onUpdate(updatedElements);
    saveToLocalStorage(updatedPages, activePage);
    if (isEditingTemplate) updateEditedTemplate();
  };

  const handleElementUpdateWithStyle = (elementId, updates) => {
    const currentElement = pages[activePage].elements.find(el => el.id === elementId);
    if (currentElement) {
      const preservedStyles = {
        fontSize: currentElement.fontSize, fontFamily: currentElement.fontFamily, color: currentElement.color,
        backgroundColor: currentElement.backgroundColor, fontWeight: currentElement.fontWeight,
        fontStyle: currentElement.fontStyle, textDecoration: currentElement.textDecoration,
        textAlign: currentElement.textAlign, lineHeight: currentElement.lineHeight
      };
      const finalUpdates = { ...preservedStyles, ...updates };
      handleElementUpdate(elementId, finalUpdates);
    }
  };

  const saveToLocalStorage = useCallback((pagesToSave, activePageToSave) => {
    const dataToSave = { pages: pagesToSave, activePage: activePageToSave, canvasBackgroundColor: internalCanvasBackgroundColor };
    try {
      localStorage.setItem('canvasData', JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [internalCanvasBackgroundColor]);

  const handleClear = useCallback(() => {
    const initialPages = [{ id: 1, elements: [] }];
    setPages(initialPages);
    setActivePage(0);
    localStorage.removeItem('canvasData');
    setSaveStatus('');
    if (isEditingTemplate) updateEditedTemplate();
    console.log('Canvas cleared and saved data removed');
  }, [setPages, setActivePage, isEditingTemplate, updateEditedTemplate]);

  const handleSave = useCallback(() => {
    setSaveStatus('saving');
    saveToLocalStorage(pages, activePage);
    if (isEditingTemplate) {
      updateEditedTemplate();
    } else {
      setTimeout(() => {
        setSaveStatus('saved');
        console.log('Save completed successfully');
      }, 1000);
    }
  }, [pages, activePage, saveToLocalStorage, isEditingTemplate, updateEditedTemplate]);

const handleSaveAsNewTemplate = useCallback(async () => {
    if (!templateName.trim()) {
      alert("Please enter a template name");
      return;
    }

    const userId = localStorage.getItem("userId");
    if (!userId) {
      alert("User not logged in");
      return;
    }

    const elements = pages[activePage].elements;
    if (!elements.length) {
      alert("Cannot save an empty template");
      return;
    }

    try {
      const response = await api.post("/saved-templates/save", {
        userId,
        templateId: `user-${Date.now()}`,
        name: templateName,
        category: "Saved",
        preview: "https://images.unsplash.com/photo-1557683316-973673baf926?w=600&h=400&fit=crop",
        content: elements
      });

      alert("Template saved successfully!");
      setShowSaveTemplateModal(false);
      setTemplateName("");

      // Optionally refresh the templates list or navigate back
      // navigate('/all-templates');

    } catch (error) {
      console.error("Save error", error);
      alert(`Error saving template: ${error.response?.data?.error || error.message}`);
    }
  }, [templateName, pages, activePage]);


  const handleSaveAsTemplate = useCallback(async () => {
    if (!templateName.trim()) {
      alert("Please enter template name");
      return;
    }

    const userId = localStorage.getItem("userId");
    if (!userId || !editingTemplateId) {
      alert("Template not found");
      return;
    }

    const elements = pages[activePage].elements;
    if (!elements.length) {
      alert("Cannot save an empty template");
      return;
    }

    try {
      const response = await api.put("/saved-templates/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          templateId: editingTemplateId,
          name: templateName,
          content: elements
        })
      });

      if (!response.ok) {
        throw new Error("Failed to update template");
      }

      alert("Template updated successfully!");
      setShowSaveTemplateModal(false);
      setTemplateName("");

    } catch (error) {
      console.error("Update error", error);
      alert("Error updating template");
    }
  }, [templateName, editingTemplateId, pages, activePage]);

  const renderIcon = (element) => {
    const iconName = element.name || element.iconName || 'Star';
    const color = element.color || element.style?.color || '#000000';
    const size = Math.min(element.width, element.height) * zoomLevel || 24 * zoomLevel;
    const iconMap = {
      'star': Star, 'heart': Heart, 'check': Check, 'arrow': ArrowRight, 'home': Home,
      'user': User, 'settings': Settings, 'mail': Mail, 'facebook': Facebook, 'twitter': Twitter,
      'instagram': Instagram, 'linkedin': Linkedin, 'youtube': Youtube, 'Star': Star, 'Heart': Heart,
      'Check': Check, 'Arrow': ArrowRight, 'Home': Home, 'User': User, 'Settings': Settings,
      'Mail': Mail, 'Facebook': Facebook, 'Twitter': Twitter, 'Instagram': Instagram,
      'LinkedIn': Linkedin, 'YouTube': Youtube
    };
    const IconComponent = iconMap[iconName.toLowerCase()];
    if (IconComponent) return <IconComponent color={color} size={size} />;
    return (
      <div style={{ color, fontSize: size, display: 'flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, fontWeight: 'bold' }}>
        {iconName.charAt(0).toUpperCase()}
      </div>
    );
  };

  const getAnimationStyle = (element) => {
    if (!element.animation || element.animation === 'none') return {};
    const duration = (element.animationDuration || 1) + 's';
    const delay = (element.animationDelay || 0) + 's';
    const timing = element.animationTiming || 'ease';
    return { animation: `${element.animation} ${duration} ${delay} ${timing} both` };
  };

const handleElementClickLink = (element) => {
  const { link, email } = element;

  // Email Link
  if (email) {
    const mailAddress = email.startsWith("mailto:") ? email : `mailto:${email}`;
    window.location.href = mailAddress;
    return;
  }

  // Normal URL link
  if (link) {
    window.open(link, "_blank");
    return;
  }
};


  // Function to scroll to make an element visible
  const scrollToElement = useCallback((element) => {
    const container = containerRef.current;
    if (!container) return;

    // Calculate element position in the container
    const elementTop = element.y * zoomLevel;
    const elementBottom = (element.y + element.height) * zoomLevel;
    
    // Get container dimensions and scroll position
    const containerRect = container.getBoundingClientRect();
    const scrollTop = container.scrollTop;
    const containerHeight = containerRect.height;
    
    // Calculate the element's position relative to the container's scroll position
    const elementRelativeTop = elementTop;
    const elementRelativeBottom = elementBottom;
    
    // Check if element is below the visible area
    if (elementRelativeBottom > scrollTop + containerHeight) {
      // Scroll to show the element at the bottom of the container with some padding
      const newScrollTop = elementRelativeBottom - containerHeight + 50;
      container.scrollTop = newScrollTop;
      console.log('Scrolled down to element. New scrollTop:', newScrollTop);
    }
  }, [zoomLevel]);

  const renderElement = (element) => {
    const isSelected = selectedElement === element.id;
    const isTextElement = ['heading', 'paragraph', 'subheading', 'blockquote'].includes(element.type);
    const defaultWidth = isTextElement ? 200 : element.width || "auto";
    const defaultHeight = isTextElement ? 50 : element.height || "auto";
    
    return (
      <Rnd key={`${element.id}-${zoomLevel}`}
        default={{ x: element.x || 50, y: element.y || 50, width: element.width || defaultWidth, height: element.height || defaultHeight }}
        position={{ x: element.x * zoomLevel, y: element.y * zoomLevel }}
        size={{ width: (element.width || defaultWidth) * zoomLevel, height: (element.height || defaultHeight) * zoomLevel }}
        bounds="parent"
        enableResizing={true}
        minHeight={isTextElement ? 30 * zoomLevel : undefined}
        onDragStop={(e, d) => {
          const newX = d.x / zoomLevel;
          const newY = d.y / zoomLevel;
          handleElementUpdate(element.id, { x: newX, y: newY });
          
          // Use the element's height from the closure
          const elementHeight = element.height || defaultHeight;
          const elementBottom = newY + elementHeight;
          const currentHeight = canvasDimensions.height;
          
          // Expand canvas if element is near or beyond the bottom
          if (elementBottom > currentHeight - 100) {
            const newHeight = Math.max(currentHeight + 200, elementBottom + 100);
            setCanvasDimensions(prev => ({ ...prev, height: newHeight }));
            console.log('Canvas expanded from', currentHeight, 'to', newHeight);
          }
          
          // Scroll to the element after updating position
          setTimeout(() => {
            scrollToElement({ ...element, x: newX, y: newY, height: elementHeight });
          }, 0);
        }}
        onResizeStop={(e, dir, ref, delta, pos) => {
          if (isTextElement) {
            const newWidth = parseInt(ref.style.width) / zoomLevel;
            const newHeight = parseInt(ref.style.height) / zoomLevel;
            handleElementUpdate(element.id, {
              width: newWidth,
              height: newHeight,
              x: pos.x / zoomLevel,
              y: pos.y / zoomLevel,
            });
            
            const newY = pos.y / zoomLevel;
            const elementBottom = newY + newHeight;
            const currentHeight = canvasDimensions.height;
            
            // Expand canvas if element is near or beyond the bottom
            if (elementBottom > currentHeight - 100) {
              const expandedHeight = Math.max(currentHeight + 200, elementBottom + 100);
              setCanvasDimensions(prev => ({ ...prev, height: expandedHeight }));
              console.log('Canvas expanded from', currentHeight, 'to', expandedHeight);
            }
            
            // Scroll to the element after resizing
            setTimeout(() => {
              scrollToElement({ ...element, y: newY, height: newHeight });
            }, 0);
          } else {
            handleElementUpdate(element.id, {
              width: parseInt(ref.style.width) / zoomLevel,
              height: parseInt(ref.style.height) / zoomLevel,
              x: pos.x / zoomLevel,
              y: pos.y / zoomLevel,
            });
            
            const newHeight = parseInt(ref.style.height) / zoomLevel;
            const newY = pos.y / zoomLevel;
            const elementBottom = newY + newHeight;
            const currentHeight = canvasDimensions.height;
            
            // Expand canvas if element is near or beyond the bottom
            if (elementBottom > currentHeight - 100) {
              const expandedHeight = Math.max(currentHeight + 200, elementBottom + 100);
              setCanvasDimensions(prev => ({ ...prev, height: expandedHeight }));
              console.log('Canvas expanded from', currentHeight, 'to', expandedHeight);
            }
            
            // Scroll to the element after resizing
            setTimeout(() => {
              scrollToElement({ ...element, y: newY, height: newHeight });
            }, 0);
          }
        }}
        className={`${isSelected ? 'z-50' : 'z-10'}`}
      >
        <div className={`w-full h-full cursor-pointer border-2 transition-all ${isSelected ? 'border-blue-500 shadow-lg ring-2 ring-blue-500/20' : 'border-transparent hover:border-blue-300/50'}`}
          style={{ transform: `rotate(${element.rotation || 0}deg)`, opacity: element.opacity || 1, ...getAnimationStyle(element) }}
          onClick={(e) => handleElementClick(element.id, e)}
        >
          {isTextElement && (
            <EditableTextElement
              element={element}
              isSelected={isSelected}
              zoomLevel={zoomLevel}
              onFocus={(e) => {
                setIsTextEditing(true);
                setShowTextStylePanel(true);
                e.stopPropagation();
              }}
              onBlur={(e) => {
                setIsTextEditing(false);
                e.stopPropagation();
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setShowTextStylePanel(true);
              }}
              onUpdateElement={handleElementUpdate}
            />
          )}
          {element.type === "button" && (
            <div contentEditable={isSelected ? "true" : undefined} suppressContentEditableWarning={isSelected}
              className="w-full h-full flex items-center justify-center outline-none cursor-pointer"
              style={{
                backgroundColor: element.backgroundColor || "#007bff", color: element.color || "#fff",
                borderRadius: `${(element.borderRadius || 6) * zoomLevel}px`,
                fontSize: `${(element.fontSize || 16) * zoomLevel}px`, fontFamily: element.fontFamily || 'Arial',
                fontWeight: element.fontWeight || 'normal',
                border: element.borderWidth ? `${element.borderWidth * zoomLevel}px solid ${element.borderColor}` : 'none'
              }}
              onInput={(e) => handleElementUpdate(element.id, { content: e.currentTarget.textContent })}
              onBlur={() => setSelectedElement(null)}
              onClick={() =>handleElementClickLink(element)}
            >
              {element.content || "Click Me"}
            </div>
          )}
          {element.type === "card" && (
            <div contentEditable={isSelected ? "true" : undefined} suppressContentEditableWarning={isSelected}
              className="w-full h-full outline-none overflow-hidden"
              style={{
                backgroundColor: element.backgroundColor || "#FFFFFF", borderColor: element.borderColor || "#E2E8F0",
                borderWidth: `${(element.borderWidth || 1) * zoomLevel}px`,
                borderRadius: `${(element.borderRadius || 8) * zoomLevel}px`,
                padding: `${(element.padding || 16) * zoomLevel}px`, fontSize: `${(element.fontSize || 16) * zoomLevel}px`,
                fontFamily: element.fontFamily || 'Arial', color: element.color || '#000000',
                fontWeight: element.fontWeight || 'normal', fontStyle: element.fontStyle || 'normal',
                textDecoration: element.textDecoration || 'none', textAlign: element.textAlign || 'left',
                lineHeight: '1.4', wordWrap: 'break-word', backgroundImage: element.backgroundImage || 'none',
                boxShadow: element.boxShadow || 'none'
              }}
              onInput={(e) => handleElementUpdate(element.id, { content: e.currentTarget.textContent })}
              onBlur={() => setSelectedElement(null)}
            >
              {element.content || "Card content goes here"}
            </div>
          )}
          {element.type === "rectangle" && (
            <div className="w-full h-full" style={{
              backgroundColor: element.backgroundColor || "#4ECDC4",
              border: `${(element.borderWidth || 2) * zoomLevel}px solid ${element.borderColor || '#000'}`,
              borderRadius: `${(element.borderRadius || 4) * zoomLevel}px`
            }} />
          )}
          {element.type === "circle" && (
            <div className="w-full h-full rounded-full" style={{
              backgroundColor: element.backgroundColor || "#FF6B6B",
              border: `${(element.borderWidth || 2) * zoomLevel}px solid ${element.borderColor || '#000'}`
            }} />
          )}
          {element.type === "triangle" && (
            <div className="w-full h-full" style={{
              width: 0, height: 0,
              borderLeft: `${(element.width || 50) * zoomLevel}px solid transparent`,
              borderRight: `${(element.width || 50) * zoomLevel}px solid transparent`,
              borderBottom: `${(element.height || 86) * zoomLevel}px solid ${element.backgroundColor || "#FF9F43"}`,
              backgroundColor: 'transparent'
            }} />
          )}
          {element.type === "star" && (
            <div className="w-full h-full flex items-center justify-center">
              <Star size={Math.min(element.width, element.height) * zoomLevel || 24 * zoomLevel}
                color={element.color || '#FFD93D'} fill={element.backgroundColor || '#FFD93D'}
                style={{ transform: `rotate(${element.rotation || 0}deg)` }} />
            </div>
          )}
          {element.type === "hexagon" && (
            <div className="w-full h-full flex items-center justify-center" style={{
              backgroundColor: element.backgroundColor || "#6C5CE7",
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
            }} />
          )}
          {element.type === "arrow" && (
            <div className="w-full h-full flex items-center justify-center">
              <ArrowRight size={Math.min(element.width, element.height) * zoomLevel || 24 * zoomLevel}
                color={element.color || '#00CEC9'} style={{ transform: `rotate(${element.rotation || 0}deg)` }} />
            </div>
          )}
          {element.type === "line" && (
            <div className="w-full" style={{
              height: `${(element.strokeWidth || 3) * zoomLevel}px`,
              backgroundColor: element.strokeColor || '#000000',
              marginTop: `${((element.height * zoomLevel) - (element.strokeWidth || 3) * zoomLevel) / 2}px`
            }} />
          )}
          {element.type === "image" && (
            <img src={element.src} alt="Canvas element" className="w-full h-full object-cover" style={{
              borderRadius: `${(element.borderRadius || 0) * zoomLevel}px`,
              border: element.borderWidth ? `${element.borderWidth * zoomLevel}px solid ${element.borderColor}` : 'none'
            }} />
          )}
          {element.type === "video" && (
            <video controls className="w-full h-full object-cover" style={{
              borderRadius: `${(element.borderRadius || 0) * zoomLevel}px`,
              border: element.borderWidth ? `${element.borderWidth * zoomLevel}px solid ${element.borderColor}` : 'none'
            }}>
              <source src={element.src || ""} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}
          {element.type === "audio" && (
            <div className="w-full h-full flex items-center justify-center bg-gray-100" style={{
              borderRadius: `${(element.borderRadius || 0) * zoomLevel}px`,
              border: element.borderWidth ? `${element.borderWidth * zoomLevel}px solid ${element.borderColor}` : 'none'
            }}>
              <audio controls className="w-full">
                <source src={element.src || ""} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
          {element.type === "frame" && (
            <div className="w-full h-full border-2 border-dashed flex items-center justify-center" style={{
              borderColor: element.borderColor || '#A0AEC0',
              borderRadius: `${(element.borderRadius || 8) * zoomLevel}px`,
              backgroundColor: element.backgroundColor || 'transparent'
            }}>
              <span className="text-gray-400 text-sm">Frame</span>
            </div>
          )}
          {element.type === "input" && (
            <input type="text" placeholder={element.placeholder || "Enter text..."}
              className="w-full h-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                borderColor: element.borderColor || '#CBD5E0',
                borderRadius: `${(element.borderRadius || 4) * zoomLevel}px`,
                fontSize: `${(element.fontSize || 14) * zoomLevel}px`,
                backgroundColor: element.backgroundColor || '#FFFFFF'
              }}
              readOnly={!isSelected} />
          )}
          {element.type === "checkbox" && (
            <div className="w-full h-full flex items-center justify-center">
              <input type="checkbox" className="w-6 h-6" style={{
                transform: `scale(${zoomLevel})`,
                accentColor: element.color || '#4299E1'
              }} disabled={!isSelected} />
            </div>
          )}
          {element.type === "icon" && (
            <div className="w-full h-full flex items-center justify-center" onClick={() =>handleElementClickLink(element)}>
              {renderIcon(element)}
            </div>
          )}
          {element.type === "social" && (
            <div className="w-full h-full flex items-center justify-center" onClick={() =>handleElementClickLink(element)}>
              {renderIcon(element)}
            </div>
          )}
          {isSelected && !preview && (
            <>
              {isTextElement ? (
                <>
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-n-resize shadow-lg"></div>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-s-resize shadow-lg"></div>
                  <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-w-resize shadow-lg"></div>
                  <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-e-resize shadow-lg"></div>
                  <div className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-nw-resize shadow-lg"></div>
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-ne-resize shadow-lg"></div>
                  <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-sw-resize shadow-lg"></div>
                  <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-se-resize shadow-lg"></div>
                </>
              ) : (
                <>
                  <div className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-nw-resize shadow-lg"></div>
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-ne-resize shadow-lg"></div>
                  <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-sw-resize shadow-lg"></div>
                  <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-se-resize shadow-lg"></div>
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-n-resize shadow-lg"></div>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-s-resize shadow-lg"></div>
                  <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-w-resize shadow-lg"></div>
                  <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-e-resize shadow-lg"></div>
                </>
              )}
            </>
          )}
        </div>
      </Rnd>
    );
  };

  const renderPreviewElement = (element) => {
    const animationStyle = preview ? getAnimationStyle(element) : {};
    return (
      <div key={element.id} className="absolute" style={{
        left: element.x * zoomLevel, top: element.y * zoomLevel,
        width: element.width * zoomLevel, height: element.height * zoomLevel,
        transform: `rotate(${element.rotation || 0}deg)`, opacity: element.opacity || 1,
        zIndex: element.zIndex || 0, ...animationStyle
      }}>
        {(element.type === "heading" || element.type === "paragraph" || element.type === "subheading" || element.type === "blockquote") && (
          <div className={`w-full h-full p-2 ${element.type === "heading" ? "font-bold" : element.type === "subheading" ? "font-semibold" : element.type === "blockquote" ? "italic pl-4 border-l-4 border-gray-300" : ""}`}
            style={{
              fontSize: `${(element.fontSize || 16) * zoomLevel}px`, fontFamily: element.fontFamily || 'Arial',
              color: element.color || '#000000', fontWeight: element.fontWeight || 'normal',
              fontStyle: element.fontStyle || 'normal', textDecoration: element.textDecoration || 'none',
              textAlign: element.textAlign || 'left', lineHeight: '1.4', wordWrap: 'break-word',
              backgroundColor: element.backgroundColor || 'transparent', whiteSpace: 'pre-wrap'
            }}
            dangerouslySetInnerHTML={{ __html: element.content || (element.type === "heading" ? "Heading" : element.type === "subheading" ? "Subheading" : element.type === "blockquote" ? "Blockquote" : "Paragraph text") }}
          />
        )}
        {element.type === "button" && (
          <div className="w-full h-full flex items-center justify-center cursor-pointer" style={{
            backgroundColor: element.backgroundColor || "#007bff", color: element.color || "#fff",
            borderRadius: `${(element.borderRadius || 6) * zoomLevel}px`,
            fontSize: `${(element.fontSize || 16) * zoomLevel}px`, fontFamily: element.fontFamily || 'Arial',
            fontWeight: element.fontWeight || 'normal',
            border: element.borderWidth ? `${element.borderWidth * zoomLevel}px solid ${element.borderColor}` : 'none'
          }} onClick={() =>handleElementClickLink(element)}>
            {element.content || "Click Me"}
          </div>
        )}
        {element.type === "card" && (
          <div className="w-full h-full overflow-hidden" style={{
            backgroundColor: element.backgroundColor || "#FFFFFF", borderColor: element.borderColor || "#E2E8F0",
            borderWidth: `${(element.borderWidth || 1) * zoomLevel}px`,
            borderRadius: `${(element.borderRadius || 8) * zoomLevel}px`,
            padding: `${(element.padding || 16) * zoomLevel}px`, fontSize: `${(element.fontSize || 16) * zoomLevel}px`,
            fontFamily: element.fontFamily || 'Arial', color: element.color || '#000000',
            fontWeight: element.fontWeight || 'normal', fontStyle: element.fontStyle || 'normal',
            textDecoration: element.textDecoration || 'none', textAlign: element.textAlign || 'left',
            lineHeight: '1.4', wordWrap: 'break-word', backgroundImage: element.backgroundImage || 'none',
            boxShadow: element.boxShadow || 'none'
          }}>
            {element.content || "Card content goes here"}
          </div>
        )}
        {element.type === "rectangle" && (
          <div className="w-full h-full" style={{
            backgroundColor: element.backgroundColor || "#4ECDC4",
            border: `${(element.borderWidth || 2) * zoomLevel}px solid ${element.borderColor || '#000'}`,
            borderRadius: `${(element.borderRadius || 4) * zoomLevel}px`
          }} />
        )}
        {element.type === "circle" && (
          <div className="w-full h-full rounded-full" style={{
            backgroundColor: element.backgroundColor || "#FF6B6B",
            border: `${(element.borderWidth || 2) * zoomLevel}px solid ${element.borderColor || '#000'}`
          }} />
        )}
        {element.type === "triangle" && (
          <div className="w-full h-full" style={{
            width: 0, height: 0,
            borderLeft: `${(element.width || 50) * zoomLevel}px solid transparent`,
            borderRight: `${(element.width || 50) * zoomLevel}px solid transparent`,
            borderBottom: `${(element.height || 86) * zoomLevel}px solid ${element.backgroundColor || "#FF9F43"}`,
            backgroundColor: 'transparent'
          }} />
        )}
        {element.type === "star" && (
          <div className="w-full h-full flex items-center justify-center">
            <Star size={Math.min(element.width, element.height) * zoomLevel || 24 * zoomLevel}
              color={element.color || '#FFD93D'} fill={element.backgroundColor || '#FFD93D'} />
          </div>
        )}
        {element.type === "hexagon" && (
          <div className="w-full h-full flex items-center justify-center" style={{
            backgroundColor: element.backgroundColor || "#6C5CE7",
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
          }} />
        )}
        {element.type === "arrow" && (
          <div className="w-full h-full flex items-center justify-center">
            <ArrowRight size={Math.min(element.width, element.height) * zoomLevel || 24 * zoomLevel}
              color={element.color || '#00CEC9'} />
          </div>
        )}
        {element.type === "line" && (
          <div className="w-full" style={{
            height: `${(element.strokeWidth || 3) * zoomLevel}px`,
            backgroundColor: element.strokeColor || '#000000',
            marginTop: `${((element.height * zoomLevel) - (element.strokeWidth || 3) * zoomLevel) / 2}px`
          }} />
        )}
        {element.type === "image" && (
          <img src={element.src} alt="Preview element" className="w-full h-full object-cover" style={{
            borderRadius: `${(element.borderRadius || 0) * zoomLevel}px`,
            border: element.borderWidth ? `${element.borderWidth * zoomLevel}px solid ${element.borderColor}` : 'none'
          }} />
        )}
        {element.type === "video" && (
          <video controls className="w-full h-full object-cover" style={{
            borderRadius: `${(element.borderRadius || 0) * zoomLevel}px`,
            border: element.borderWidth ? `${element.borderWidth * zoomLevel}px solid ${element.borderColor}` : 'none'
          }}>
            <source src={element.src || ""} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}
        {element.type === "audio" && (
          <div className="w-full h-full flex items-center justify-center bg-gray-100" style={{
            borderRadius: `${(element.borderRadius || 0) * zoomLevel}px`,
            border: element.borderWidth ? `${element.borderWidth * zoomLevel}px solid ${element.borderColor}` : 'none'
          }}>
            <audio controls className="w-full">
              <source src={element.src || ""} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
        {element.type === "frame" && (
          <div className="w-full h-full border-2 border-dashed flex items-center justify-center" style={{
            borderColor: element.borderColor || '#A0AEC0',
            borderRadius: `${(element.borderRadius || 8) * zoomLevel}px`,
            backgroundColor: element.backgroundColor || 'transparent'
          }}>
            <span className="text-gray-400 text-sm">Frame</span>
          </div>
        )}
        {element.type === "input" && (
          <input type="text" placeholder={element.placeholder || "Enter text..."}
            className="w-full h-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{
              borderColor: element.borderColor || '#CBD5E0',
              borderRadius: `${(element.borderRadius || 4) * zoomLevel}px`,
              fontSize: `${(element.fontSize || 14) * zoomLevel}px`,
              backgroundColor: element.backgroundColor || '#FFFFFF'
            }} />
        )}
        {element.type === "checkbox" && (
          <div className="w-full h-full flex items-center justify-center">
            <input type="checkbox" className="w-6 h-6" style={{
              transform: `scale(${zoomLevel})`,
              accentColor: element.color || '#4299E1'
            }} />
          </div>
        )}
        {element.type === "icon" && (
          <div className="w-full h-full flex items-center justify-center" onClick={() =>handleElementClickLink(element)}>
            {renderIcon(element)}
          </div>
        )}
        {element.type === "social" && (
          <div className="w-full h-full flex items-center justify-center" onClick={() =>handleElementClickLink(element)}>
            {renderIcon(element)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 bg-gray-700 flex flex-col overflow-hidden relative">
      <div className="h-16 bg-black border-b border-[#c2831f] flex items-center justify-between px-6 p-5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center space-x-1 bg-gray-700 rounded-lg">
            {pages.map((page, idx) => (
              <div key={page.id} className="flex items-center">
                <button onClick={() => setActivePage(idx)} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${idx === activePage ? "bg-[#c2831f] text-white shadow-lg" : "text-gray-300 hover:bg-gray-600 hover:text:white"}`}>
                  Page {page.id}
                </button>
                {pages.length > 1 && (
                  <button onClick={(e) => { e.stopPropagation(); deletePage(idx); }} className="ml-1 p-1 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded">
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button onClick={addPage} className="relative group flex items-center gap-2 px-3 py-2 bg-black border border-[#c2831f] hover:bg-[#c2831f] hover:text:black text-white rounded-lg text-sm font-medium transition-colors shadow-lg cursor-pointer">
            <Plus size={16} /> Add Page
            <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 transition bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap">Add a New Page</span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            {saveStatus === 'saving' && <div className="flex items-center text-yellow-400"><div className="w-2 h-2 rounded-full bg-yellow-400 animate-ping mr-1"></div>Saving...</div>}
            {saveStatus === 'saved' && <div className="flex items-center text-green-400"><div className="w-2 h-2 rounded-full bg-green-400 mr-1"></div>Saved</div>}
            {saveStatus === 'error' && <div className="flex items-center text-red-400"><div className="w-2 h-2 rounded-full bg-red-400 mr-1"></div>Save failed</div>}
            {isEditingTemplate && <div className="flex items-center text-blue-400"><div className="w-2 h-2 rounded-full bg-blue-400 mr-1"></div>Editing Template</div>}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300"><Layers size={16} /><span>{pages[activePage].elements.length} elements</span></div>
          <div className="w-px h-6 bg-gray-600"></div>
          <button onClick={handleClear} className="relative group flex items-center gap-2 px-4 py-2 bg-red-700 border border-[#c2831f] hover:bg-red-800 hover:text:black text-white rounded-lg text-sm font-medium transition-colors shadow-lg cursor-pointer">
            <Eraser size={16} />
            <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 transition bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap">Clear</span>
          </button>
          {/* <button onClick={handleSave} disabled={saveStatus === "saving"} className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors group shadow-lg ${saveStatus === "saving" ? "bg-yellow-600 text-white cursor-not-allowed" : "bg-black border border-[#c2831f] text-white hover:bg-[#c2831f] hover:text:black cursor-pointer"}`}>
            <Save size={16} />
            <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 transition bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap">{isEditingTemplate ? "Update Template" : "Save"}</span>
          </button> */}
          <button onClick={() => { setTemplateName(''); setShowSaveTemplateModal(true); }} className="relative group flex items-center gap-2 px-4 py-2 bg-black border border-[#c2831f] text-white hover:bg-[#c2831f] hover:text:black rounded-lg text-sm font-medium transition-colors shadow-lg cursor-pointer">
            <FileText size={16} /> Save as New Template
            <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 transition bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap">Save as New Template</span>
          </button>
          {isEditingTemplate && (
            <button onClick={() => {
              const userTemplates = JSON.parse(localStorage.getItem('userCreatedTemplates') || '[]');
              const currentTemplate = userTemplates.find(t => t.id === editingTemplateId);
              if (currentTemplate) setTemplateName(currentTemplate.name);
              setShowSaveTemplateModal(true);
            }} className="relative group flex items-center gap-2 px-4 py-2 bg-black border border-[#c2831f] text-white hover:bg-[#c2831f] hover:text:black rounded-lg text-sm font-medium transition-colors shadow-lg cursor-pointer">
              <FileText size={16} /> Update Current Template
              <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 transition bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap">Update Current Template</span>
            </button>
          )}
           
          <button onClick={() => setPreview(!preview)} className="relative group flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg bg-black border border-[#c2831f] text-white hover:bg-[#c2831f] hover:text:black cursor-pointer">
            {preview ? <><X size={16} /> Exit Preview</> : <><Eye size={16} /> Preview</>}
            <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 transition bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap">{preview ? "Exit Preview" : "Preview"}</span>
          </button>
          
          <button onClick={onSendCampaign} className="relative group flex items-center gap-2 px-4 py-2 bg-black border border-[#c2831f] text-white hover:bg-[#c2831f] hover:text:black rounded-lg text-sm font-medium transition-colors shadow-lg cursor-pointer">
            <Send size={16} /> Send
            <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 transition bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap">Send Campaign</span>
          </button>
        </div>
      </div>
      <div
          ref={containerRef}
          className="overflow-auto bg-black p-8"
          style={{ maxHeight: "700px" }}
          onClick={handleCanvasClick}
        >

        <div className="flex justify-center items-start min-w-full min-h-full">
          <div ref={canvasRef} className={`canvas-background relative shadow-2xl rounded-lg overflow-visible ${preview ? "" : "ring-1 ring-gray-400/20"}`} style={{
            width: canvasDimensions.width * zoomLevel, height: canvasDimensions.height * zoomLevel,
            backgroundColor: internalCanvasBackgroundColor,
            backgroundImage: showGrid && !preview ? `linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)` : "none",
            backgroundSize: showGrid && !preview ? `${20 * zoomLevel}px ${20 * zoomLevel}px` : "none",
            boxSizing: "border-box",
          }}>
            {!preview && pages[activePage].elements.map((element) => renderElement(element))}
            {preview && (
              <div className="relative w-full h-full">
                {pages[activePage].elements.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <div className="text-6xl mb-4">📄</div>
                      <p className="text-xl">This page is empty</p>
                      <p className="text-sm mt-2">Add some elements to see them here</p>
                    </div>
                  </div>
                )}
                {pages[activePage].elements.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)).map((element) => renderPreviewElement(element))}
              </div>
            )}
            {!preview && pages[activePage].elements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center text-gray-400">
                  <div className="text-6xl mb-4">🎨</div>
                  <p className="text-xl font-medium">Start Creating</p>
                  <p className="text-sm mt-2">Use the toolbox to add elements to your design</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {TextStylePanel && selectedElement && (
        <TextStylePanel
          selectedElement={pages[activePage].elements.find(el => el.id === selectedElement)}
          onUpdateElementStyle={handleElementUpdateWithStyle}
          onClose={() => setShowTextStylePanel(false)}
          zoomLevel={zoomLevel}
        />
      )}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-black rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-200">{isEditingTemplate ? "Save Template" : "Save as New Template"}</h2>
              <button onClick={() => { setShowSaveTemplateModal(false); setTemplateName(''); }} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-200 mb-2">Template Name</label>
              <input type="text" value={templateName} onChange={(e) => setTemplateName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter template name" />
            </div>
            <div className="flex justify-end space-x-3">
              <button onClick={() => { setShowSaveTemplateModal(false); setTemplateName(''); }} className="px-4 py-2 border border-gray-300 text-gray-200 rounded-lg hover:bg-gray-900">Cancel</button>
              {isEditingTemplate && (
                <button onClick={handleSaveAsNewTemplate} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Save as New Template</button>
              )}
              <button onClick={() => isEditingTemplate ? handleSaveAsTemplate() : handleSaveAsNewTemplate()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                {isEditingTemplate ? "Update Current Template" : "Save Template"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}