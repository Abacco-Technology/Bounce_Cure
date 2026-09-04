// client/src/pages/Campaign/pages/TextTemplates.jsx
//
// Text-campaign counterpart to Templets.jsx.
// Templets.jsx builds canvas elements and navigates to /editor;
// this one carries markdown content and navigates to /texteditor.

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Pencil, Mail, Megaphone, Gift } from "lucide-react";
import { renderMarkdown } from "./campaignMarkdown";

/* Content uses the same markdown that CampaignTextEditor understands:
   **bold**  *italic*  __underline__  # heading  ## subheading  [text](url) */
export const textTemplates = [
  {
    id: "welcome",
    name: "Welcome Email",
    category: "Onboarding",
    icon: Mail,
    accent: "#3b82f6",
    description: "Warm opener for new signups, with a single clear next step.",
    format: { fontFamily: "Georgia", fontSize: "16px", align: "left" },
    content: `# Welcome aboard!

Hi there,

We're glad you joined. Your account is ready, and everything you need to get started is a click away.

Here's what happens next:

1. Complete your profile — takes about two minutes.
2. Explore the dashboard — this is where your campaigns live.
3. Send your first campaign — we'll walk you through it.

If anything is unclear, just reply to this email. A real person reads every message.

[Open your dashboard](https://example.com/dashboard)

Welcome again,
*The Team*`,
  },
  {
    id: "newsletter",
    name: "Monthly Newsletter",
    category: "Marketing",
    icon: Megaphone,
    accent: "#c2831f",
    description: "Roundup format for product news, tips and a closing call to action.",
    format: { fontFamily: "Arial", fontSize: "16px", align: "left" },
    content: `# This Month at a Glance

Hello,

Here's everything worth knowing from the past few weeks.

## What's new

We shipped **inline formatting** in the campaign editor, so you can now add bold text, italics and links without leaving the page.

## Tip of the month

Subject lines under *fifty characters* consistently open better on mobile. Three things that reliably help:

- Lead with the benefit, not the brand
- Skip the exclamation marks
- Test two versions before the full send

## From the community

Readers keep asking how to segment a list properly. We wrote it all up here:

[Read the segmentation guide](https://example.com/guides/segmentation)

That's it for now. See you next month.

__Thanks for reading.__`,
  },
  {
    id: "promotion",
    name: "Promotional Offer",
    category: "Sales",
    icon: Gift,
    accent: "#16a34a",
    description: "Short, urgent announcement built around one offer and one link.",
    format: { fontFamily: "Verdana", fontSize: "18px", align: "center" },
    content: `# Your offer is live

**Save 30% on every plan** — this week only.

No code needed. The discount applies automatically at checkout, and it carries over to your next renewal.

What's included:

I. Every plan tier, no exclusions
II. Applies to your next renewal too
III. Stackable with annual billing

*Offer ends Sunday at midnight.*

[Claim your discount](https://example.com/offer)

Questions? Reply to this email and we'll sort it out.

__Terms apply. One redemption per account.__`,
  },
];

export default function TextTemplates() {
  const navigate = useNavigate();
  const [preview, setPreview] = useState(null);

  /** Hand the template to the text editor via router state. */
  const useTemplate = (tpl) => {
    navigate("/texteditor", {
      state: {
        textTemplate: {
          id: tpl.id,
          name: tpl.name,
          content: tpl.content,
          format: tpl.format,
          subject: tpl.name,
        },
      },
    });
  };

  const startBlank = () => navigate("/texteditor", { state: { textTemplate: null } });

  return (
    <div className="text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Text Campaign Templates</h2>
          <p className="text-gray-400 text-sm mt-1">
            Plain-text campaigns that land in the inbox, not the promotions tab.
            Pick one to edit, or start with a blank page.
          </p>
        </div>
        <button
          onClick={startBlank}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#c2831f] hover:bg-[#d99c2b] text-black font-semibold rounded-lg transition-colors whitespace-nowrap"
        >
          <Plus size={18} />
          Start from Blank
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {textTemplates.map((tpl) => {
          const Icon = tpl.icon;
          return (
            <div
              key={tpl.id}
              className="group bg-[#0a0a0a] border border-gray-800 rounded-2xl overflow-hidden hover:border-[#c2831f] transition-colors flex flex-col"
            >
              {/* Live text preview instead of a stock photo — this is a text
                  campaign, so the type itself is the thumbnail. */}
              <div className="relative h-44 bg-white overflow-hidden">
                <div
                  className="p-5 text-gray-800 pointer-events-none"
                  style={{
                    fontFamily: tpl.format.fontFamily,
                    fontSize: 11,
                    textAlign: tpl.format.align,
                    lineHeight: 1.5,
                  }}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(tpl.content) }}
                />
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
                <span
                  className="absolute top-3 left-3 px-3 py-1 text-xs font-medium rounded-full text-white"
                  style={{ backgroundColor: tpl.accent }}
                >
                  {tpl.category}
                </span>
              </div>

              {/* Meta */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start gap-3 mb-2">
                  <Icon size={18} style={{ color: tpl.accent }} className="mt-0.5 shrink-0" />
                  <h3 className="text-lg font-semibold text-white">{tpl.name}</h3>
                </div>
                <p className="text-sm text-gray-400 flex-1">{tpl.description}</p>

                <div className="flex gap-2 mt-5">
                  <button
                    onClick={() => setPreview(tpl)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Eye size={16} /> View
                  </button>
                  <button
                    onClick={() => useTemplate(tpl)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#c2831f] hover:bg-[#d99c2b] text-black rounded-lg text-sm font-semibold transition-colors"
                  >
                    <Pencil size={16} /> Edit
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setPreview(null)}
          />
          <div className="relative bg-[#111] border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <div>
                <h3 className="text-lg font-semibold text-white">{preview.name}</h3>
                <p className="text-xs text-gray-500">{preview.description}</p>
              </div>
              <button
                onClick={() => setPreview(null)}
                className="text-gray-400 hover:text-white text-xl leading-none px-2"
                aria-label="Close preview"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="bg-white rounded-lg shadow-xl">
                <div className="bg-gray-100 px-6 py-3 border-b border-gray-200 text-sm text-gray-600 rounded-t-lg">
                  Subject: {preview.name}
                </div>
                <div
                  className="px-8 py-6 text-gray-800"
                  style={{
                    fontFamily: preview.format.fontFamily,
                    fontSize: preview.format.fontSize,
                    textAlign: preview.format.align,
                    lineHeight: 1.6,
                  }}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(preview.content) }}
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-800 flex gap-3">
              <button
                onClick={() => setPreview(null)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => useTemplate(preview)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#c2831f] hover:bg-[#d99c2b] text-black font-semibold transition-colors"
              >
                <Pencil size={16} /> Edit this template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}