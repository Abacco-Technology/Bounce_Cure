// client/src/pages/Campaign/pages/campaignTemplateData.js
//
// Single source of truth for canvas campaign templates.
// Both Templets.jsx (dashboard tab) and AllTemplats.jsx (/all-templates) read
// from here, so a template added once appears in both galleries.
//
// BLOCK SCHEMA — consumed by handleSelect() in those two files:
//   { type: "text",       value, style }  → heading element
//   { type: "subheading", value, style }  → subheading element
//   { type: "paragraph",  value, style }  → paragraph (\n is preserved)
//   { type: "divider",    style }         → horizontal rule
//   { type: "image",      value, style }  → image (value = src)
//   { type: "button",     value, style }  → centred CTA button
//
// LAYOUT RULES followed by every template below, so the canvas and the sent
// email stay visually consistent:
//   · one H1 per template, centred
//   · section subheadings left-aligned
//   · body copy left-aligned (centred only for short hero lines)
//   · lists written as "•" lines inside one paragraph block
//   · exactly one primary CTA button, centred
//   · a divider before the closing/legal block

import {
  Ticket, Calendar, Building2, Store, Briefcase, Award,
  Megaphone, Users, MapPin, BadgeCheck, Presentation, TrendingUp,
} from "lucide-react";

/** Category order shown in the filter bar. "All" is prepended by the pages. */
export const TEMPLATE_CATEGORIES = [
  "Shows",
  "Events",
  "Expo",
  "Member Directory",
  "Suppliers Directory",
  "B2B",
  "Sponsorship",
];

/** Accent colour per category — keeps each group visually coherent. */
export const CATEGORY_ACCENT = {
  "Shows":              "#1d4ed8",
  "Events":             "#7c3aed",
  "Expo":               "#0d9488",
  "Member Directory":   "#c2831f",
  "Suppliers Directory":"#ea580c",
  "B2B":                "#334155",
  "Sponsorship":        "#be185d",
};

/* ── shared style presets ─────────────────────────────────────────────────
   Reused across templates so spacing and alignment never drift.          */
const H1 = (color) => ({
  fontSize: 34, color, fontWeight: "700", textAlign: "center",
  fontFamily: "Georgia", marginBottom: "18px",
});
const H2 = (color) => ({
  fontSize: 20, color, fontWeight: "600", textAlign: "left",
  fontFamily: "Arial", marginBottom: "10px",
});
const LEAD = {
  fontSize: 17, color: "#374151", textAlign: "center",
  lineHeight: "1.6", fontFamily: "Arial", marginBottom: "22px",
};
const BODY = {
  fontSize: 15, color: "#4b5563", textAlign: "left",
  lineHeight: "1.7", fontFamily: "Arial", marginBottom: "18px",
};
const PANEL = (bg, border) => ({
  fontSize: 15, color: "#374151", textAlign: "left", lineHeight: "1.9",
  fontFamily: "Arial", backgroundColor: bg, padding: "18px",
  borderRadius: "10px", borderColor: border, marginBottom: "20px",
});
const FINE = {
  fontSize: 13, color: "#6b7280", textAlign: "center",
  lineHeight: "1.5", fontFamily: "Arial", fontStyle: "italic",
};
const CTA = (bg) => ({
  backgroundColor: bg, color: "#ffffff", fontSize: "16px",
  fontWeight: "600", borderRadius: "8px", padding: "14px 30px",
  fontFamily: "Arial",
});
const IMG = { height: 260, borderRadius: "12px" };
const RULE = { color: "#e5e7eb", height: 1 };

export const templates = [
  /* ══════════════════════════ SHOWS ══════════════════════════ */
  {
    id: "shows-announcement",
    name: "Show Announcement",
    category: "Shows",
    icon: Ticket,
    rating: 4.9,
    likes: 412,
    tags: ["show", "announcement", "dates", "registration"],
    preview: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=300&fit=crop",
    description: "Opens the season: dates, venue and a single registration CTA.",
    content: [
      { type: "text", value: "The 2026 Show Season Opens", style: H1("#1d4ed8") },
      { type: "paragraph", value: "Three days of live demonstrations, new product launches and the buyers you have been trying to reach all year — under one roof.", style: LEAD },
      { type: "image", value: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=300&fit=crop", style: IMG },
      { type: "subheading", value: "The essentials", style: H2("#1d4ed8") },
      { type: "paragraph", value: "• Dates —  March 12 to 14, 2026\n• Venue —  Las Vegas Convention Center, West Hall\n• Hours —  9:00 AM to 5:00 PM daily\n• Expected attendance —  18,000+ verified trade buyers", style: PANEL("#eff6ff", "#bfdbfe") },
      { type: "subheading", value: "Why attend", style: H2("#1d4ed8") },
      { type: "paragraph", value: "Registration includes full floor access, all keynote sessions and the opening-night reception. Badges collected before February 1 skip the on-site queue entirely.", style: BODY },
      { type: "button", value: "Register Free", style: CTA("#1d4ed8") },
      { type: "divider", style: RULE },
      { type: "paragraph", value: "Free registration closes February 1. On-site badges are $95.", style: FINE },
    ],
  },
  {
    id: "shows-exhibitor-invite",
    name: "Exhibitor Booth Invitation",
    category: "Shows",
    icon: MapPin,
    rating: 4.8,
    likes: 356,
    tags: ["exhibitor", "booth", "floor plan", "sales"],
    preview: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&h=300&fit=crop",
    description: "Sells floor space — booth tiers, foot traffic and a booking deadline.",
    content: [
      { type: "text", value: "Reserve Your Booth", style: H1("#1d4ed8") },
      { type: "paragraph", value: "Prime floor space is allocated in the order it is booked. Here is what is still open.", style: LEAD },
      { type: "subheading", value: "Booth packages", style: H2("#1d4ed8") },
      { type: "paragraph", value: "• Standard  10x10  —  $3,200  ·  pipe, drape, listing\n• Premium   10x20  —  $5,900  ·  corner placement, carpet\n• Island    20x20  —  $11,500 ·  four-sided access, banner\n• Startup   6x6    —  $1,400  ·  first-time exhibitors only", style: PANEL("#eff6ff", "#bfdbfe") },
      { type: "image", value: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&h=300&fit=crop", style: IMG },
      { type: "subheading", value: "What exhibitors reported last year", style: H2("#1d4ed8") },
      { type: "paragraph", value: "Median booth traffic was 240 scanned visitors over three days. Sixty-one percent of exhibitors rebooked on site before the show closed.", style: BODY },
      { type: "button", value: "View Floor Plan", style: CTA("#1d4ed8") },
      { type: "divider", style: RULE },
      { type: "paragraph", value: "Early-bird pricing ends December 15. Contracts require a 25% deposit.", style: FINE },
    ],
  },

  /* ══════════════════════════ EVENTS ══════════════════════════ */
  {
    id: "events-invitation",
    name: "Event Invitation",
    category: "Events",
    icon: Calendar,
    rating: 4.9,
    likes: 468,
    tags: ["invitation", "agenda", "rsvp"],
    preview: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=600&h=300&fit=crop",
    description: "Formal invite with a clear agenda block and RSVP call to action.",
    content: [
      { type: "text", value: "You're Invited", style: H1("#7c3aed") },
      { type: "paragraph", value: "An evening of short talks and long conversations with the people building what comes next in our industry.", style: LEAD },
      { type: "image", value: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=600&h=300&fit=crop", style: IMG },
      { type: "subheading", value: "Agenda", style: H2("#7c3aed") },
      { type: "paragraph", value: "6:00 PM  —  Doors open, welcome reception\n6:45 PM  —  Opening keynote\n7:30 PM  —  Panel: what changed this year\n8:15 PM  —  Open networking and dinner\n9:30 PM  —  Close", style: PANEL("#f5f3ff", "#ddd6fe") },
      { type: "subheading", value: "Details", style: H2("#7c3aed") },
      { type: "paragraph", value: "Thursday, April 9  ·  The Foundry, 240 West Broadway, New York\n\nSeating is limited to 120. Dietary requirements can be noted on the RSVP form.", style: BODY },
      { type: "button", value: "RSVP Now", style: CTA("#7c3aed") },
      { type: "divider", style: RULE },
      { type: "paragraph", value: "Please respond by April 2. Invitations are transferable but not resellable.", style: FINE },
    ],
  },
  {
    id: "events-last-call",
    name: "Event Reminder / Last Call",
    category: "Events",
    icon: Megaphone,
    rating: 4.7,
    likes: 291,
    tags: ["reminder", "urgency", "last call"],
    preview: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=300&fit=crop",
    description: "Short urgency send for the final days before registration closes.",
    content: [
      { type: "text", value: "Last Call — Doors Close Friday", style: H1("#7c3aed") },
      { type: "paragraph", value: "Fewer than 30 seats remain, and registration closes at midnight on Friday.", style: LEAD },
      { type: "subheading", value: "What you'd be walking into", style: H2("#7c3aed") },
      { type: "paragraph", value: "• Nine sessions across two tracks\n• A workshop block capped at 20 people\n• Roundtables grouped by company size\n• Recordings sent to every attendee afterwards", style: PANEL("#f5f3ff", "#ddd6fe") },
      { type: "paragraph", value: "If your schedule shifted and you can no longer make it, replying to this email releases your seat to the waitlist — no penalty, and it genuinely helps.", style: BODY },
      { type: "button", value: "Confirm My Seat", style: CTA("#7c3aed") },
      { type: "divider", style: RULE },
      { type: "paragraph", value: "Registration closes Friday at 11:59 PM ET. No on-site sales.", style: FINE },
    ],
  },

  /* ══════════════════════════ EXPO ══════════════════════════ */
  {
    id: "expo-preview",
    name: "Expo Preview",
    category: "Expo",
    icon: Presentation,
    rating: 4.8,
    likes: 402,
    tags: ["expo", "preview", "floor", "sessions"],
    preview: "https://images.unsplash.com/photo-1560439514-4e9645039924?w=600&h=300&fit=crop",
    description: "Pre-show orientation: halls, sessions and how to plan the day.",
    content: [
      { type: "text", value: "Your Expo Floor Guide", style: H1("#0d9488") },
      { type: "paragraph", value: "Four halls, 320 exhibitors and 40 sessions. Here is how to cover it without losing a day.", style: LEAD },
      { type: "image", value: "https://images.unsplash.com/photo-1560439514-4e9645039924?w=600&h=300&fit=crop", style: IMG },
      { type: "subheading", value: "The halls", style: H2("#0d9488") },
      { type: "paragraph", value: "• Hall A  —  Manufacturing and automation\n• Hall B  —  Packaging and materials\n• Hall C  —  Logistics and fulfilment\n• Hall D  —  Startup pavilion and demo stage", style: PANEL("#f0fdfa", "#99f6e4") },
      { type: "subheading", value: "Plan before you arrive", style: H2("#0d9488") },
      { type: "paragraph", value: "The exhibitor directory opens two weeks ahead of the show. Shortlist the booths that matter, book meetings directly from their listing, and the app will route you hall by hall.", style: BODY },
      { type: "button", value: "Browse Exhibitors", style: CTA("#0d9488") },
      { type: "divider", style: RULE },
      { type: "paragraph", value: "Floor plans are subject to change. Check the app on the morning of your visit.", style: FINE },
    ],
  },
  {
    id: "expo-follow-up",
    name: "Post-Expo Follow-Up",
    category: "Expo",
    icon: TrendingUp,
    rating: 4.9,
    likes: 375,
    tags: ["follow-up", "post-show", "leads", "recap"],
    preview: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=300&fit=crop",
    description: "Sent within 48 hours of close — recap, resources and next step.",
    content: [
      { type: "text", value: "Thanks for Stopping By", style: H1("#0d9488") },
      { type: "paragraph", value: "It was good to meet you on the floor. Everything we discussed is gathered below so you don't have to dig through a tote bag.", style: LEAD },
      { type: "subheading", value: "What we promised to send", style: H2("#0d9488") },
      { type: "paragraph", value: "• The product sheet for the model you looked at\n• Pricing for the volumes we talked through\n• Two customer references in your sector\n• A recording of the demo-stage session", style: PANEL("#f0fdfa", "#99f6e4") },
      { type: "subheading", value: "The obvious next step", style: H2("#0d9488") },
      { type: "paragraph", value: "A 20-minute call is usually enough to work out whether this is a fit. If it isn't, we'll say so and stop emailing.", style: BODY },
      { type: "button", value: "Book 20 Minutes", style: CTA("#0d9488") },
      { type: "divider", style: RULE },
      { type: "paragraph", value: "You received this because we scanned your badge at booth 412.", style: FINE },
    ],
  },

  /* ═══════════════════ MEMBER DIRECTORY ═══════════════════ */
  {
    id: "member-listing-invite",
    name: "Directory Listing Invitation",
    category: "Member Directory",
    icon: Users,
    rating: 4.8,
    likes: 344,
    tags: ["directory", "membership", "listing", "join"],
    preview: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&h=300&fit=crop",
    description: "Invites a prospect to claim their listing in the member directory.",
    content: [
      { type: "text", value: "Claim Your Directory Listing", style: H1("#c2831f") },
      { type: "paragraph", value: "Buyers search the member directory 14,000 times a month. Right now they can't find you in it.", style: LEAD },
      { type: "image", value: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&h=300&fit=crop", style: IMG },
      { type: "subheading", value: "What a listing includes", style: H2("#c2831f") },
      { type: "paragraph", value: "• Company profile with logo and description\n• Up to eight product or service categories\n• Direct contact routing to your sales inbox\n• Verified-member badge on every listing\n• Quarterly report of who viewed your profile", style: PANEL("#fffbeb", "#fde68a") },
      { type: "subheading", value: "Getting listed", style: H2("#c2831f") },
      { type: "paragraph", value: "The application takes about ten minutes. Listings are reviewed within two business days and go live immediately on approval.", style: BODY },
      { type: "button", value: "Start My Listing", style: CTA("#c2831f") },
      { type: "divider", style: RULE },
      { type: "paragraph", value: "Membership runs annually from the date of approval.", style: FINE },
    ],
  },
  {
    id: "member-renewal",
    name: "Membership Renewal",
    category: "Member Directory",
    icon: BadgeCheck,
    rating: 4.7,
    likes: 318,
    tags: ["renewal", "membership", "retention"],
    preview: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=300&fit=crop",
    description: "Renewal notice that leads with the member's own usage numbers.",
    content: [
      { type: "text", value: "Your Membership Renews Soon", style: H1("#c2831f") },
      { type: "paragraph", value: "Before it does, here is what your listing actually did over the past twelve months.", style: LEAD },
      { type: "subheading", value: "Your year in the directory", style: H2("#c2831f") },
      { type: "paragraph", value: "• 1,847 profile views\n• 96 direct contact requests\n• Ranked in the top 15% of your category\n• Listed in 4 buyer shortlists", style: PANEL("#fffbeb", "#fde68a") },
      { type: "subheading", value: "What's changing next year", style: H2("#c2831f") },
      { type: "paragraph", value: "Category listings expand from eight to twelve, and every member gets access to the new buyer-intent report. Renewal pricing is unchanged.", style: BODY },
      { type: "button", value: "Renew Membership", style: CTA("#c2831f") },
      { type: "divider", style: RULE },
      { type: "paragraph", value: "Listings lapse 30 days after the renewal date and are removed from search.", style: FINE },
    ],
  },

  /* ═══════════════════ SUPPLIERS DIRECTORY ═══════════════════ */
  {
    id: "supplier-onboarding",
    name: "Supplier Onboarding",
    category: "Suppliers Directory",
    icon: Store,
    rating: 4.8,
    likes: 297,
    tags: ["supplier", "onboarding", "vendor", "listing"],
    preview: "https://images.unsplash.com/photo-1553413077-190dd305871c?w=600&h=300&fit=crop",
    description: "Walks a new supplier through getting listed and verified.",
    content: [
      { type: "text", value: "Get Listed as a Verified Supplier", style: H1("#ea580c") },
      { type: "paragraph", value: "Procurement teams filter this directory by verified status first. Verification is free and takes about a week.", style: LEAD },
      { type: "image", value: "https://images.unsplash.com/photo-1553413077-190dd305871c?w=600&h=300&fit=crop", style: IMG },
      { type: "subheading", value: "The four steps", style: H2("#ea580c") },
      { type: "paragraph", value: "1.  Submit company details and trade references\n2.  Upload certifications and insurance documents\n3.  Confirm capacity, lead times and minimum order\n4.  Review call with our sourcing team", style: PANEL("#fff7ed", "#fed7aa") },
      { type: "subheading", value: "Why verification matters", style: H2("#ea580c") },
      { type: "paragraph", value: "Verified suppliers appear above unverified ones in every category and receive roughly four times as many quote requests.", style: BODY },
      { type: "button", value: "Begin Verification", style: CTA("#ea580c") },
      { type: "divider", style: RULE },
      { type: "paragraph", value: "Verification is re-checked annually. Documents must remain current.", style: FINE },
    ],
  },
  {
    id: "supplier-spotlight",
    name: "Verified Supplier Spotlight",
    category: "Suppliers Directory",
    icon: Award,
    rating: 4.9,
    likes: 331,
    tags: ["spotlight", "newsletter", "supplier", "feature"],
    preview: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=300&fit=crop",
    description: "Recurring newsletter featuring newly verified suppliers to buyers.",
    content: [
      { type: "text", value: "New Suppliers This Month", style: H1("#ea580c") },
      { type: "paragraph", value: "Eleven suppliers cleared verification since the last issue. These four are worth a look.", style: LEAD },
      { type: "subheading", value: "This month's additions", style: H2("#ea580c") },
      { type: "paragraph", value: "• Precision components  —  Midwest, 3-week lead time\n• Sustainable packaging  —  Pacific Northwest, FSC certified\n• Contract assembly  —  Southeast, ISO 9001\n• Cold-chain logistics  —  National coverage, FDA registered", style: PANEL("#fff7ed", "#fed7aa") },
      { type: "image", value: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=300&fit=crop", style: IMG },
      { type: "subheading", value: "Sourcing something specific?", style: H2("#ea580c") },
      { type: "paragraph", value: "Post a requirement and matching verified suppliers respond directly. Most requirements receive their first quote within 48 hours.", style: BODY },
      { type: "button", value: "Post a Requirement", style: CTA("#ea580c") },
      { type: "divider", style: RULE },
      { type: "paragraph", value: "You receive this because you subscribe to sourcing updates.", style: FINE },
    ],
  },

  /* ══════════════════════════ B2B ══════════════════════════ */
  {
    id: "b2b-outreach",
    name: "B2B Introduction",
    category: "B2B",
    icon: Briefcase,
    rating: 4.7,
    likes: 386,
    tags: ["outreach", "cold email", "intro", "sales"],
    preview: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&h=300&fit=crop",
    description: "Short first-touch email built around one specific, testable claim.",
    content: [
      { type: "text", value: "A Quick, Specific Question", style: H1("#334155") },
      { type: "paragraph", value: "Most teams in your position are sending to lists they inherited, and roughly one address in five no longer works.", style: LEAD },
      { type: "subheading", value: "Why that matters", style: H2("#334155") },
      { type: "paragraph", value: "Above a 5% bounce rate, mailbox providers start filtering the whole domain — including the mail your customers actually asked for. The damage shows up weeks after the send that caused it.", style: BODY },
      { type: "subheading", value: "What we'd do", style: H2("#334155") },
      { type: "paragraph", value: "• Verify the list before the next send\n• Flag traps, catch-alls and role addresses\n• Report the true deliverable count up front\n• No change to your existing sending setup", style: PANEL("#f8fafc", "#e2e8f0") },
      { type: "button", value: "See a Sample Report", style: CTA("#334155") },
      { type: "divider", style: RULE },
      { type: "paragraph", value: "Not relevant? Reply with \"no\" and you won't hear from us again.", style: FINE },
    ],
  },
  {
    id: "b2b-case-study",
    name: "B2B Results / Case Study",
    category: "B2B",
    icon: Building2,
    rating: 4.9,
    likes: 421,
    tags: ["case study", "proof", "results", "b2b"],
    preview: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=300&fit=crop",
    description: "Proof-led follow-up with before/after numbers and a soft CTA.",
    content: [
      { type: "text", value: "From 22% Bounces to 1.4%", style: H1("#334155") },
      { type: "paragraph", value: "A trade association with a 90,000-record directory list, cleaned before their spring campaign.", style: LEAD },
      { type: "image", value: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=300&fit=crop", style: IMG },
      { type: "subheading", value: "The problem", style: H2("#334155") },
      { type: "paragraph", value: "Their directory had been collected over nine years of show registrations. Two sends in, their ESP threatened suspension and their domain reputation had already dropped.", style: BODY },
      { type: "subheading", value: "The numbers", style: H2("#334155") },
      { type: "paragraph", value: "• Bounce rate  —  22.1%  →  1.4%\n• Deliverable records  —  70,200 of 90,000\n• Spam traps removed  —  318\n• Open rate, next campaign  —  11%  →  27%", style: PANEL("#f8fafc", "#e2e8f0") },
      { type: "button", value: "Read the Full Study", style: CTA("#334155") },
      { type: "divider", style: RULE },
      { type: "paragraph", value: "Figures published with the client's permission.", style: FINE },
    ],
  },

  /* ══════════════════════ SPONSORSHIP ══════════════════════ */
  {
    id: "sponsorship-prospectus",
    name: "Sponsorship Prospectus",
    category: "Sponsorship",
    icon: Award,
    rating: 4.8,
    likes: 268,
    tags: ["sponsorship", "packages", "prospectus"],
    preview: "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=600&h=300&fit=crop",
    description: "Tiered sponsorship packages with audience numbers and a deadline.",
    content: [
      { type: "text", value: "Sponsorship Opportunities", style: H1("#be185d") },
      { type: "paragraph", value: "Reach 18,000 verified trade buyers across three days and twelve months of follow-on coverage.", style: LEAD },
      { type: "image", value: "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=600&h=300&fit=crop", style: IMG },
      { type: "subheading", value: "Packages", style: H2("#be185d") },
      { type: "paragraph", value: "• Title       —  $45,000 ·  naming rights, keynote intro, main stage\n• Platinum    —  $24,000 ·  hall banner, session slot, lounge\n• Gold        —  $12,000 ·  registration branding, directory feature\n• Supporting  —  $4,500  ·  signage, programme listing", style: PANEL("#fdf2f8", "#fbcfe8") },
      { type: "subheading", value: "Who attends", style: H2("#be185d") },
      { type: "paragraph", value: "Sixty-two percent of attendees hold budget authority. The largest segments are procurement, operations and product development.", style: BODY },
      { type: "button", value: "Request the Deck", style: CTA("#be185d") },
      { type: "divider", style: RULE },
      { type: "paragraph", value: "Title and Platinum are exclusive. Packages are confirmed on signature.", style: FINE },
    ],
  },
  {
    id: "sponsorship-thanks",
    name: "Sponsor Recap & Thanks",
    category: "Sponsorship",
    icon: Megaphone,
    rating: 4.7,
    likes: 244,
    tags: ["sponsor", "recap", "thank you", "renewal"],
    preview: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&h=300&fit=crop",
    description: "Post-event report to sponsors, ending with a rebooking option.",
    content: [
      { type: "text", value: "Thank You — Here's How It Went", style: H1("#be185d") },
      { type: "paragraph", value: "The show closed Friday. Your delivery report is below, and the full media pack follows next week.", style: LEAD },
      { type: "subheading", value: "Your impressions", style: H2("#be185d") },
      { type: "paragraph", value: "• Hall banner  —  est. 16,400 impressions\n• Session slot  —  312 attendees, 84% stayed to close\n• Directory feature  —  1,120 profile views\n• Social mentions  —  47 tagged posts", style: PANEL("#fdf2f8", "#fbcfe8") },
      { type: "subheading", value: "Next year", style: H2("#be185d") },
      { type: "paragraph", value: "Returning sponsors get first refusal on their tier until January 31, at this year's rate. After that, packages open to the waitlist.", style: BODY },
      { type: "button", value: "Hold My Package", style: CTA("#be185d") },
      { type: "divider", style: RULE },
      { type: "paragraph", value: "Impression estimates are based on badge-scan traffic through each zone.", style: FINE },
    ],
  },
];

/** Templates for one category, or all of them. */
export function templatesByCategory(category) {
  return category === "All" ? templates : templates.filter((t) => t.category === category);
}

/** Category → template count, for badges in the filter bar. */
export const CATEGORY_COUNTS = TEMPLATE_CATEGORIES.reduce((acc, c) => {
  acc[c] = templates.filter((t) => t.category === c).length;
  return acc;
}, {});

export default templates;