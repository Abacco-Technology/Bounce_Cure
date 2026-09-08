// client/src/pages/Campaign/components/editor/CampaignTextEditor.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Bold, Italic, Underline, Strikethrough, Code, Quote, Minus,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Link, Send, Eye, LogOut, Save,
} from 'lucide-react';
import SaveTemplateModal from './SaveTemplate';
import { TEMPLATE_TYPES } from '../../pages/savedTemplateService';
import {
  renderMarkdown, formatToStyle, lineListKind, stripMarker, LIST_MARKERS, toRoman,
} from '../../pages/campaignMarkdown';

const selCls = "bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white";

const Sep = () => <span className="w-px h-6 bg-gray-700 mx-1.5" />;

const TBtn = ({ onClick, title, active, children }) => (
  <button
    onClick={onClick}
    title={title}
    className={`p-2 rounded transition-colors ${active ? 'bg-[#c2831f] text-black' : 'hover:bg-gray-800 text-white'}`}
  >{children}</button>
);

export default function CampaignTextEditor() {
  const navigate = useNavigate();
  const { state } = useLocation();

  // Arrives from the Text Templates gallery; null/absent means blank page
  const tpl = state?.textTemplate || null;

  const [content, setContent] = useState(tpl?.content || '');
  const [subject, setSubject] = useState(tpl?.subject || 'Your Campaign Subject');
  const [showPreview, setShowPreview] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savedNotice, setSavedNotice] = useState('');

  // Paragraph-level styles applied to the whole message
  const [format, setFormat] = useState({
    fontFamily:      tpl?.format?.fontFamily      || 'Arial',
    fontSize:        tpl?.format?.fontSize        || '16px',
    fontWeight:      tpl?.format?.fontWeight      || '400',
    align:           tpl?.format?.align           || 'left',
    lineHeight:      tpl?.format?.lineHeight      || '1.6',
    letterSpacing:   tpl?.format?.letterSpacing   || '0px',
    color:           tpl?.format?.color           || '#000000',
    backgroundColor: tpl?.format?.backgroundColor || 'transparent',
    textTransform:   tpl?.format?.textTransform   || 'none',
    padding:         tpl?.format?.padding         || '24px',
  });

  const setF = (k, v) => setFormat(f => ({ ...f, [k]: v }));

  const applyFormat = (formatType) => {
    const textarea = document.getElementById('editor');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let formattedText = selectedText;
    switch(formatType) {
      case 'bold':        formattedText = `**${selectedText}**`; break;
      case 'italic':      formattedText = `*${selectedText}*`;   break;
      case 'underline':   formattedText = `__${selectedText}__`; break;
      case 'strike':      formattedText = `~~${selectedText}~~`; break;
      case 'code':        formattedText = `\`${selectedText}\``; break;
      case 'h1':          formattedText = `# ${selectedText}`;   break;
      case 'h2':          formattedText = `## ${selectedText}`;  break;
      case 'h3':          formattedText = `### ${selectedText}`; break;
      case 'quote':       formattedText = `> ${selectedText}`;   break;
      case 'rule':        formattedText = `${selectedText}\n---\n`; break;
      case 'link': {
        const url = prompt('Enter URL:');
        if (url) formattedText = `[${selectedText || url}](${url})`;
        break;
      }
      default: break;
    }
    
    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);

    // Restore focus and put the caret after the inserted markup
    requestAnimationFrame(() => {
      textarea.focus();
      const pos = start + formattedText.length;
      textarea.setSelectionRange(pos, pos);
    });
  };

  /**
   * Apply (or remove) a list style across every line the selection touches.
   * Numbered and roman lists are renumbered from 1 each time, so inserting a
   * line in the middle never leaves a broken sequence.
   */
  const applyList = (kind) => {
    const ta = document.getElementById('editor');
    if (!ta) return;

    // Widen the selection to whole lines
    const lineStart = content.lastIndexOf('\n', ta.selectionStart - 1) + 1;
    let lineEnd = content.indexOf('\n', ta.selectionEnd);
    if (lineEnd === -1) lineEnd = content.length;

    const block = content.slice(lineStart, lineEnd);
    const lines = block.split('\n');
    const allSame = lines.every(l => !l.trim() || lineListKind(l) === kind);

    const rebuilt = lines.map((l, i) => {
      const bare = stripMarker(l);
      if (!bare.trim()) return bare;
      return allSame ? bare : LIST_MARKERS[kind].marker(i) + bare;   // toggle off / on
    }).join('\n');

    const next = content.slice(0, lineStart) + rebuilt + content.slice(lineEnd);
    setContent(next);

    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(lineStart, lineStart + rebuilt.length);
    });
  };

  /** Enter continues the current list; Enter on an empty item ends it. */
  const onEditorKeyDown = (e) => {
    if (e.key !== 'Enter' || e.shiftKey) return;
    const ta = e.target;
    const pos = ta.selectionStart;
    if (pos !== ta.selectionEnd) return;

    const lineStart = content.lastIndexOf('\n', pos - 1) + 1;
    const line = content.slice(lineStart, pos);
    const kind = lineListKind(line);
    if (!kind) return;

    e.preventDefault();

    // Empty item — drop the marker and leave the list
    if (!stripMarker(line).trim()) {
      const next = content.slice(0, lineStart) + content.slice(pos);
      setContent(next);
      requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(lineStart, lineStart); });
      return;
    }

    // Work out the next marker by counting back through the run
    let index = 0;
    for (let i = lineStart - 1; i >= 0; ) {
      const prevStart = content.lastIndexOf('\n', i - 1) + 1;
      const prevLine = content.slice(prevStart, i);
      if (lineListKind(prevLine) !== kind) break;
      index++;
      i = prevStart - 1;
      if (prevStart === 0) break;
    }

    const marker = LIST_MARKERS[kind].marker(index + 1);
    const insert = '\n' + marker;
    const next = content.slice(0, pos) + insert + content.slice(pos);
    setContent(next);
    requestAnimationFrame(() => {
      ta.focus();
      const caret = pos + insert.length;
      ta.setSelectionRange(caret, caret);
    });
  };

  const renderPreview = () => renderMarkdown(content);

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
      content: renderPreview(),                 // HTML, lists included
      fontFamily:      format.fontFamily,
      fontSize:        parseInt(format.fontSize, 10),
      fontWeight:      format.fontWeight,
      textAlign:       format.align,
      lineHeight:      parseFloat(format.lineHeight),
      letterSpacing:   format.letterSpacing,
      textTransform:   format.textTransform,
      color:           format.color,
      backgroundColor: format.backgroundColor,
      x: 50,
      y: 50,
      width: 700,
      // Rough height so the send preview isn't clipped on long copy
      height: Math.max(200, content.split(/\r?\n/).length * (parseInt(format.fontSize, 10) * parseFloat(format.lineHeight) + 2)),
    };

    const canvasData = [canvasElement];

    navigate("/send-campaign", {
      state: {
        canvasData,
        subject,
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

        {/* Back to text templates */}
                        <button
                          onClick={() => navigate('/text-templates')}
                          className="w-full px-4 py-2 rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800 transition-all"
                        >
                          Back to Text Templates
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
        <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 space-y-2">

          {/* Row 1 — paragraph styles */}
          <div className="flex items-center gap-2 flex-wrap text-sm">
            <select title="Font family" className={selCls} value={format.fontFamily} onChange={e => setF('fontFamily', e.target.value)}>
              {['Arial','Helvetica','Georgia','Times New Roman','Verdana','Tahoma','Trebuchet MS','Courier New','Garamond','Palatino'].map(f => <option key={f} value={f}>{f}</option>)}
            </select>

            <select title="Font size" className={selCls} value={format.fontSize} onChange={e => setF('fontSize', e.target.value)}>
              {['12px','13px','14px','15px','16px','18px','20px','24px','28px','32px'].map(v => <option key={v} value={v}>{v}</option>)}
            </select>

            <select title="Font weight" className={selCls} value={format.fontWeight} onChange={e => setF('fontWeight', e.target.value)}>
              {[['300','Light'],['400','Normal'],['500','Medium'],['600','Semibold'],['700','Bold'],['800','Extra bold']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>

            <select title="Line height" className={selCls} value={format.lineHeight} onChange={e => setF('lineHeight', e.target.value)}>
              {['1.2','1.4','1.5','1.6','1.8','2.0'].map(v => <option key={v} value={v}>Line {v}</option>)}
            </select>

            <select title="Letter spacing" className={selCls} value={format.letterSpacing} onChange={e => setF('letterSpacing', e.target.value)}>
              {['-0.5px','0px','0.5px','1px','1.5px','2px'].map(v => <option key={v} value={v}>Spacing {v}</option>)}
            </select>

            <select title="Text case" className={selCls} value={format.textTransform} onChange={e => setF('textTransform', e.target.value)}>
              {[['none','Normal case'],['uppercase','UPPERCASE'],['lowercase','lowercase'],['capitalize','Capitalize']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>

            <label className="flex items-center gap-1.5 text-gray-400" title="Text colour">
              Text
              <input type="color" value={format.color} onChange={e => setF('color', e.target.value)}
                     className="w-8 h-7 bg-transparent border border-gray-700 rounded cursor-pointer" />
            </label>

            <label className="flex items-center gap-1.5 text-gray-400" title="Background colour">
              BG
              <input type="color"
                     value={format.backgroundColor === 'transparent' ? '#ffffff' : format.backgroundColor}
                     onChange={e => setF('backgroundColor', e.target.value)}
                     className="w-8 h-7 bg-transparent border border-gray-700 rounded cursor-pointer" />
              <button onClick={() => setF('backgroundColor', 'transparent')}
                      className="text-xs text-gray-500 hover:text-white" title="Clear background">clear</button>
            </label>

            <select title="Padding" className={selCls} value={format.padding} onChange={e => setF('padding', e.target.value)}>
              {['0px','12px','24px','32px','48px'].map(v => <option key={v} value={v}>Pad {v}</option>)}
            </select>
          </div>

          {/* Row 2 — inline marks, blocks, lists, alignment */}
          <div className="flex items-center gap-1 flex-wrap">
            <TBtn onClick={() => applyFormat('bold')}      title="Bold  **text**"><Bold size={16}/></TBtn>
            <TBtn onClick={() => applyFormat('italic')}    title="Italic  *text*"><Italic size={16}/></TBtn>
            <TBtn onClick={() => applyFormat('underline')} title="Underline  __text__"><Underline size={16}/></TBtn>
            <TBtn onClick={() => applyFormat('strike')}    title="Strikethrough  ~~text~~"><Strikethrough size={16}/></TBtn>
            <TBtn onClick={() => applyFormat('code')}      title="Inline code"><Code size={16}/></TBtn>
            <TBtn onClick={() => applyFormat('link')}      title="Insert link"><Link size={16}/></TBtn>

            <Sep />

            <TBtn onClick={() => applyFormat('h1')}    title="Heading 1"><span className="font-bold text-sm">H1</span></TBtn>
            <TBtn onClick={() => applyFormat('h2')}    title="Heading 2"><span className="font-bold text-sm">H2</span></TBtn>
            <TBtn onClick={() => applyFormat('h3')}    title="Heading 3"><span className="font-bold text-sm">H3</span></TBtn>
            <TBtn onClick={() => applyFormat('quote')} title="Block quote"><Quote size={16}/></TBtn>
            <TBtn onClick={() => applyFormat('rule')}  title="Horizontal rule"><Minus size={16}/></TBtn>

            <Sep />

            {/* The three list styles */}
            <TBtn onClick={() => applyList('bullet')} title="Bullet list  -  item"><List size={16}/></TBtn>
            <TBtn onClick={() => applyList('number')} title="Numbered list  1. item"><ListOrdered size={16}/></TBtn>
            <TBtn onClick={() => applyList('roman')}  title="Roman list  I. item"><span className="font-semibold text-xs tracking-tight">I.</span></TBtn>

            <Sep />

            <TBtn onClick={() => setF('align','left')}    active={format.align==='left'}    title="Align left"><AlignLeft size={16}/></TBtn>
            <TBtn onClick={() => setF('align','center')}  active={format.align==='center'}  title="Align centre"><AlignCenter size={16}/></TBtn>
            <TBtn onClick={() => setF('align','right')}   active={format.align==='right'}   title="Align right"><AlignRight size={16}/></TBtn>
            <TBtn onClick={() => setF('align','justify')} active={format.align==='justify'} title="Justify"><AlignJustify size={16}/></TBtn>

            <div className="flex-1"></div>
            <button
              onClick={() => setShowSaveModal(true)}
              disabled={!content.trim()}
              title="Save this as a reusable text template"
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save size={18}/> Save Template
            </button>
            <button onClick={() => setShowPreview(!showPreview)} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm">
              <Eye size={18}/> {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
          </div>
        </div>

        {/* Textarea */}
        <div className="flex-1 p-6 overflow-auto">
          <textarea
            id="editor"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={onEditorKeyDown}
            placeholder={"Start typing your campaign content here...\n\n# Heading\n**bold**  *italic*  __underline__  ~~strike~~\n\n- bullet item\n1. numbered item\nI. roman item"}
            className="w-full h-full bg-gray-900 border border-gray-800 rounded-lg p-6 text-white resize-none focus:outline-none focus:ring-2 focus:ring-[#c2831f]"
            style={{
              fontFamily:    format.fontFamily,
              fontSize:      format.fontSize,
              fontWeight:    format.fontWeight,
              textAlign:     format.align,
              lineHeight:    format.lineHeight,
              letterSpacing: format.letterSpacing,
              textTransform: format.textTransform,
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

      {showSaveModal && (
        <SaveTemplateModal
          type={TEMPLATE_TYPES.TEXT}
          content={content}
          format={format}
          subject={subject}
          defaultName={tpl?.name || subject}
          onClose={() => setShowSaveModal(false)}
          onSaved={(row) => {
            setSavedNotice(`Saved "${row.name}"`);
            setTimeout(() => setSavedNotice(''), 3000);
          }}
        />
      )}

      {savedNotice && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] px-5 py-2.5 rounded-lg bg-[#c2831f] text-black font-semibold text-sm shadow-xl">
          {savedNotice}
        </div>
      )}

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
                className="text-gray-800"
                style={{ ...formatToStyle(format), padding: format.padding }}
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