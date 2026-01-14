// client/src/pages/Campaign/pages/CampaignTextEditor.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Link, Send, Eye
} from 'lucide-react';
import { LogOut, CheckCircle } from "lucide-react";

export default function CampaignTextEditor() {
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  
  // Format state
  const [format, setFormat] = useState({
    bold: false,
    italic: false,
    underline: false,
    align: 'left',
    fontSize: '16px',
    fontFamily: 'Arial',
  });

  const applyFormat = (formatType) => {
    const textarea = document.getElementById('editor');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let formattedText = selectedText;
    switch(formatType) {
      case 'bold': formattedText = `**${selectedText}**`; break;
      case 'italic': formattedText = `*${selectedText}*`; break;
      case 'underline': formattedText = `__${selectedText}__`; break;
      case 'heading': formattedText = `# ${selectedText}`; break;
      case 'link':
        const url = prompt('Enter URL:');
        if (url) formattedText = `[${selectedText}](${url})`;
        break;
      default: break;
    }
    
    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);
  };

  const renderPreview = () => {
    let html = content;
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Bold
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');             // Italic
    html = html.replace(/__(.*?)__/g, '<u>$1</u>');              // Underline
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');           // Heading
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');          // Subheading
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>'); // Link
    html = html.replace(/\n/g, '<br/>');                         // Line breaks
    return html;
  };

  const handleSend = () => {
    setShowPreview(true);
  };

  const handleSendCampaign = () => {
    if (!content.trim()) {
      alert('Please add some content before sending the campaign');
      return;
    }

    // ✅ Wrap text into Canvas-compatible element
    const canvasElement = {
      id: `text-${Date.now()}`,
      type: "paragraph",
      content: renderPreview(),   // HTML content
      fontFamily: format.fontFamily,
      fontSize: parseInt(format.fontSize),
      textAlign: format.align,
      color: "#000000",
      x: 50,
      y: 50,
      width: 600,
      height: 200,
    };

    const canvasData = [canvasElement];

    navigate("/send-campaign", {
      state: {
        canvasData,
        subject: "Your Campaign Subject",
        fromTextEditor: true,
      },
    });
  };
const [showExitModal, setShowExitModal] = useState(false);

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Editor Section */}
      <div className={`${showPreview ? 'w-1/2' : 'w-full'} flex flex-col border-r border-gray-800 transition-all`}>
      <div className="bg-black border-b border-gray-800 px-6 py-4 flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold text-[#c2831f]">Campaign Text Editor</h1>
                <div className="text-sm text-gray-400 mt-1">Create and format your email content</div>
            </div>

              {/* Exit Option */}
              <div className="border p-2 border-gray-800">
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
        Exit Campaign Text Editor?
      </h2>

      <p className="text-gray-400 text-sm mb-6">
        Choose where you want to exit. Unsaved progress will be lost.
      </p>

      <div className="flex flex-col gap-3">

        {/* Exit to Dashboard */}
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full px-4 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all"
        >
          Exit to Dashboard
        </button>

        {/* Exit to Campaign Page */}
        <button
          onClick={() => navigate('/send-campaign')}
          className="w-full px-4 py-2 rounded-md bg-[#c2831f] text-black font-semibold hover:bg-[#d99c2b] transition-all"
        >
          Exit to Campaign Page
        </button>

        {/* Cancel */}
        <button
          onClick={() => setShowExitModal(false)}
          className="w-full px-4 py-2 rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800 transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

              </div>
        </div>


        {/* Toolbar */}
        <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-2 flex-wrap">
          {/* Font Family */}
          <select 
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm"
            value={format.fontFamily}
            onChange={(e) => setFormat({...format, fontFamily: e.target.value})}
          >
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
            <option value="Courier New">Courier New</option>
          </select>

          {/* Font Size */}
          <select 
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm"
            value={format.fontSize}
            onChange={(e) => setFormat({...format, fontSize: e.target.value})}
          >
            <option value="12px">12px</option>
            <option value="14px">14px</option>
            <option value="16px">16px</option>
            <option value="18px">18px</option>
            <option value="20px">20px</option>
            <option value="24px">24px</option>
          </select>

          {/* Formatting buttons */}
          <button onClick={() => applyFormat('bold')} className="p-2 hover:bg-gray-800 rounded"><Bold size={18}/></button>
          <button onClick={() => applyFormat('italic')} className="p-2 hover:bg-gray-800 rounded"><Italic size={18}/></button>
          <button onClick={() => applyFormat('underline')} className="p-2 hover:bg-gray-800 rounded"><Underline size={18}/></button>
          <button onClick={() => applyFormat('heading')} className="p-2 hover:bg-gray-800 rounded"><span className="font-bold text-lg">H</span></button>
          <button onClick={() => applyFormat('link')} className="p-2 hover:bg-gray-800 rounded"><Link size={18}/></button>

          <div className="flex-1"></div>
          <button onClick={() => setShowPreview(!showPreview)} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded">
            <Eye size={18}/> {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
        </div>

        {/* Textarea */}
        <div className="flex-1 p-6 overflow-auto">
          <textarea
            id="editor"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start typing your campaign content here..."
            className="w-full h-full bg-gray-900 border border-gray-800 rounded-lg p-6 text-white resize-none focus:outline-none focus:ring-2 focus:ring-[#c2831f]"
            style={{
              fontFamily: format.fontFamily,
              fontSize: format.fontSize,
              textAlign: format.align,
              lineHeight: '1.6'
            }}
          />
        </div>

        {/* Send Button */}
        <div className="bg-black border-t border-gray-800 px-6 py-4">
          <button 
            onClick={handleSend}
            disabled={!content.trim()}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium ${
              content.trim() 
                ? 'bg-[#c2831f] hover:bg-[#d09025] text-white' 
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Send size={18}/> Preview & Send Campaign
          </button>
        </div>
      </div>

      {/* Email Preview */}
      {showPreview && (
        <div className="w-1/2 flex flex-col bg-gray-900">
          <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
            <h2 className="text-xl font-bold">Email Preview</h2>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-xl">
              <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
                <div className="text-sm text-gray-600 mb-1">From: your-email@example.com</div>
                <div className="text-sm text-gray-600">Subject: Your Campaign Subject</div>
              </div>
              <div 
                className="px-8 py-6 text-gray-800"
                style={{
                  fontFamily: format.fontFamily,
                  fontSize: format.fontSize,
                  textAlign: format.align,
                  lineHeight: '1.6'
                }}
                dangerouslySetInnerHTML={{ __html: renderPreview() || '<p style="color: #999;">Your email content will appear here...</p>' }}
              />
              <div className="bg-gray-50 px-8 py-6 border-t border-gray-200 text-center text-sm text-gray-500">
                <p>This is a preview of your email campaign</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-900 border-t border-gray-800 px-6 py-4">
            <button 
              onClick={handleSendCampaign}
              disabled={!content.trim()}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium ${
                content.trim() 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Send size={18}/> Send Campaign Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
