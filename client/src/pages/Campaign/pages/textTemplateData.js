// client/src/pages/Campaign/pages/textTemplateData.js
//
// Plain-text campaign templates, organised into the same categories as
// campaignTemplateData.js so both galleries filter identically.
//
// Content is the markdown that CampaignTextEditor and campaignMarkdown.js
// understand:
//   # H1   ## H2   ### H3
//   **bold**   *italic*   __underline__   ~~strike~~   `code`
//   [label](url)
//   - bullet      1. numbered      I. roman
//   > quote       ---  horizontal rule
//
// Text campaigns work because they read like a person wrote them, so these
// are deliberately shorter and flatter than the canvas templates — no hero
// images, no colour, one ask per email.

import {
  Ticket, Calendar, Building2, Store, Briefcase, Award,
  Megaphone, Users, MapPin, BadgeCheck, Presentation, TrendingUp,
} from "lucide-react";

import { TEMPLATE_CATEGORIES, CATEGORY_ACCENT } from "./campaignTemplateData";
export { TEMPLATE_CATEGORIES, CATEGORY_ACCENT };

const SANS  = { fontFamily: "Arial",   fontSize: "16px", align: "left" };
const SERIF = { fontFamily: "Georgia", fontSize: "16px", align: "left" };

export const textTemplates = [
  /* ───────────────────────── SHOWS ───────────────────────── */
  {
    id: "txt-show-announcement",
    name: "Show Announcement",
    category: "Shows",
    icon: Ticket,
    description: "Dates, venue and one registration link. Nothing else.",
    format: SANS,
    content: `# The 2026 Show Season Opens

Hi ,

Registration is open for our March show, and I wanted you to have the dates before we announce publicly.

- **When** — March 12 to 14, 2026
- **Where** — Las Vegas Convention Center, West Hall
- **Hours** — 9:00 AM to 5:00 PM daily

Last year we had just over 18,000 verified trade buyers on the floor. This year we've added a fourth hall.

Registration is free until February 1, then $95 on site.

[Reserve your badge](https://example.com/register)

See you there,
`,
  },
  {
    id: "txt-show-exhibitor",
    name: "Exhibitor Booth Invitation",
    category: "Shows",
    icon: MapPin,
    description: "Booth tiers as a numbered list, with a booking deadline.",
    format: SANS,
    content: `# Booth space is going fast

Hi ,

About 60% of the floor is spoken for. Here's what's left:

1. Standard 10x10 — $3,200 — pipe, drape and a directory listing
2. Premium 10x20 — $5,900 — corner placement and carpet
3. Island 20x20 — $11,500 — four-sided access and a hanging banner
4. Startup 6x6 — $1,400 — first-time exhibitors only

For context: median booth traffic last year was 240 scanned visitors across three days, and 61% of exhibitors rebooked before the show closed.

Early-bird pricing ends December 15.

[See the floor plan](https://example.com/floorplan)

`,
  },

  /* ───────────────────────── EVENTS ───────────────────────── */
  {
    id: "txt-event-invite",
    name: "Event Invitation",
    category: "Events",
    icon: Calendar,
    description: "Personal invite with the agenda laid out as a timeline.",
    format: SERIF,
    content: `# You're invited

Hi ,

We're hosting an evening of short talks and long conversations on **Thursday, April 9**, and I'd like you there.

## The evening

1. 6:00 PM — Doors open, welcome reception
2. 6:45 PM — Opening keynote
3. 7:30 PM — Panel: what changed this year
4. 8:15 PM — Open networking and dinner
5. 9:30 PM — Close

The Foundry, 240 West Broadway, New York.

Seating is capped at 120, and we're at about 90 already. If you can make it, let me know by April 2.

[RSVP here](https://example.com/rsvp)

`,
  },
  {
    id: "txt-event-lastcall",
    name: "Event Last Call",
    category: "Events",
    icon: Megaphone,
    description: "Final reminder that also makes it easy to decline.",
    format: SANS,
    content: `# Last call — we close Friday

Hi ,

Under 30 seats left, and registration closes Friday at 11:59 PM ET.

What you'd be walking into:

- Nine sessions across two tracks
- A workshop block capped at 20 people
- Roundtables grouped by company size
- Recordings sent to everyone afterwards

If your schedule changed and you can't make it, just reply "can't make it" — that releases your seat to the waitlist and genuinely helps us.

[Confirm my seat](https://example.com/confirm)

`,
  },

  /* ────────────────────────── EXPO ────────────────────────── */
  {
    id: "txt-expo-preview",
    name: "Expo Floor Preview",
    category: "Expo",
    icon: Presentation,
    description: "Orients attendees before they arrive so day one isn't wasted.",
    format: SANS,
    content: `# How to cover the floor in one day

Hi ,

Four halls, 320 exhibitors, 40 sessions. Here's the short version.

## The halls

- Hall A — Manufacturing and automation
- Hall B — Packaging and materials
- Hall C — Logistics and fulfilment
- Hall D — Startup pavilion and demo stage

## Before you arrive

The exhibitor directory opens two weeks out. Shortlist the booths that matter, book meetings straight from their listing, and the app routes you hall by hall.

People who do this before arriving see roughly twice as many exhibitors.

[Browse exhibitors](https://example.com/exhibitors)

`,
  },
  {
    id: "txt-expo-followup",
    name: "Post-Expo Follow-Up",
    category: "Expo",
    icon: TrendingUp,
    description: "Sent within 48 hours, referencing the actual conversation.",
    format: SANS,
    content: `# Following up from booth 412

Hi ,

Good to meet you on Thursday. Everything I said I'd send:

1. Product sheet for the model you looked at
2. Pricing at the volumes we discussed
3. Two customer references in your sector
4. Recording of the demo-stage session

[Grab all four here](https://example.com/followup)

A 20-minute call is usually enough to work out whether this is a fit. If it isn't, I'll say so and stop emailing.

[Book 20 minutes](https://example.com/book)



> You're getting this because we scanned your badge at booth 412.`,
  },

  /* ──────────────────── MEMBER DIRECTORY ──────────────────── */
  {
    id: "txt-member-invite",
    name: "Directory Listing Invitation",
    category: "Member Directory",
    icon: Users,
    description: "Leads with search volume, not with membership benefits.",
    format: SANS,
    content: `# Buyers are searching for you

Hi ,

The member directory gets about 14,000 searches a month. {{company_name}} doesn't come up in any of them.

A listing gets you:

- A company profile with logo and description
- Up to eight product or service categories
- Contact requests routed to your sales inbox
- The verified-member badge
- A quarterly report of who viewed you

The application takes about ten minutes and we review within two business days.

[Start your listing](https://example.com/directory/apply)

`,
  },
  {
    id: "txt-member-renewal",
    name: "Membership Renewal",
    category: "Member Directory",
    icon: BadgeCheck,
    description: "Renewal notice that opens with the member's own numbers.",
    format: SANS,
    content: `# Your listing, the past twelve months

Hi ,

Your membership renews on {{renewal_date}}. Before it does, here's what the listing actually did:

- **1,847** profile views
- **96** direct contact requests
- Top **15%** of your category
- Included in **4** buyer shortlists

## What changes next year

Category listings go from eight to twelve, and every member gets the new buyer-intent report. Pricing is unchanged.

[Renew now](https://example.com/renew)

Listings lapse 30 days after the renewal date and drop out of search, so it's worth doing this week.

`,
  },

  /* ─────────────────── SUPPLIERS DIRECTORY ─────────────────── */
  {
    id: "txt-supplier-onboarding",
    name: "Supplier Onboarding",
    category: "Suppliers Directory",
    icon: Store,
    description: "Four-step verification walkthrough with the payoff up front.",
    format: SANS,
    content: `# Getting verified takes about a week

Hi ,

Procurement teams filter this directory by verified status before anything else. Verified suppliers appear above unverified ones in every category and get roughly four times as many quote requests.

Verification is free. Four steps:

1. Submit company details and trade references
2. Upload certifications and insurance documents
3. Confirm capacity, lead times and minimum order
4. Review call with our sourcing team

[Begin verification](https://example.com/verify)

Verification is re-checked annually, so keep your documents current.

`,
  },
  {
    id: "txt-supplier-spotlight",
    name: "Supplier Spotlight",
    category: "Suppliers Directory",
    icon: Award,
    description: "Recurring digest of newly verified suppliers, sent to buyers.",
    format: SANS,
    content: `# New suppliers this month

Hi ,

Eleven suppliers cleared verification since the last issue. These four stood out:

- **Precision components** — Midwest, 3-week lead time
- **Sustainable packaging** — Pacific Northwest, FSC certified
- **Contract assembly** — Southeast, ISO 9001
- **Cold-chain logistics** — National, FDA registered

[See all eleven](https://example.com/suppliers/new)

## Sourcing something specific?

Post a requirement and matching verified suppliers respond directly. Most requirements get a first quote inside 48 hours.

[Post a requirement](https://example.com/rfq)

`,
  },

  /* ─────────────────────────── B2B ─────────────────────────── */
  {
    id: "txt-b2b-intro",
    name: "B2B Introduction",
    category: "B2B",
    icon: Briefcase,
    description: "Cold first touch — one claim, one link, an easy way out.",
    format: SANS,
    content: `# One in five of your addresses is dead

Hi ,

Most teams sending to inherited lists are working with about 20% dead addresses, and they don't find out until the damage is done.

Above a 5% bounce rate, mailbox providers start filtering your whole domain — including the mail your customers actually asked for. It shows up weeks after the send that caused it.

What we'd do:

- Verify the list before your next send
- Flag traps, catch-alls and role addresses
- Report the true deliverable count up front
- Change nothing about your sending setup

[See a sample report](https://example.com/sample)

Not relevant? Reply "no" and you won't hear from me again.

`,
  },
  {
    id: "txt-b2b-proof",
    name: "B2B Results",
    category: "B2B",
    icon: Building2,
    description: "Second touch built entirely on one customer's numbers.",
    format: SANS,
    content: `# 22% bounces down to 1.4%

Hi ,

Following up with something concrete rather than another pitch.

A trade association came to us with a 90,000-record directory list collected over nine years of show registrations. Two sends in, their ESP threatened suspension.

After cleaning:

- Bounce rate — 22.1% to **1.4%**
- Deliverable records — 70,200 of 90,000
- Spam traps removed — 318
- Open rate on the next campaign — 11% to **27%**

The 20,000 records they lost were never going to convert. They just hadn't been told yet.

[Read the full study](https://example.com/case-study)

`,
  },

  /* ────────────────────── SPONSORSHIP ────────────────────── */
  {
    id: "txt-sponsor-prospectus",
    name: "Sponsorship Prospectus",
    category: "Sponsorship",
    icon: Award,
    description: "Tiers as a roman list, with audience quality up front.",
    format: SERIF,
    content: `# Sponsorship for the March show

Hi ,

Sixty-two percent of our attendees hold budget authority — mostly procurement, operations and product development. That's the room.

## Packages

I. **Title** — $45,000 — naming rights, keynote intro, main stage
II. **Platinum** — $24,000 — hall banner, session slot, lounge
III. **Gold** — $12,000 — registration branding, directory feature
IV. **Supporting** — $4,500 — signage and programme listing

Title and Platinum are exclusive and usually go by December.

[Request the deck](https://example.com/sponsorship)

Happy to walk through it on a call if that's easier.

`,
  },
  {
    id: "txt-sponsor-recap",
    name: "Sponsor Recap",
    category: "Sponsorship",
    icon: Megaphone,
    description: "Post-show delivery report that ends with first refusal.",
    format: SANS,
    content: `# How your sponsorship performed

Hi ,

The show closed Friday. Your numbers:

- Hall banner — est. **16,400** impressions
- Session slot — **312** attendees, 84% stayed to close
- Directory feature — **1,120** profile views
- Social mentions — **47** tagged posts

Full media pack with photography follows next week.

## Next year

Returning sponsors get first refusal on their tier until January 31, at this year's rate. After that it opens to the waitlist.

[Hold my package](https://example.com/rebook)

Thanks for backing this one.

`,
  },
];

/** Templates for one category, or all. */
export function textTemplatesByCategory(category) {
  return category === "All" ? textTemplates : textTemplates.filter((t) => t.category === category);
}

export const TEXT_CATEGORY_COUNTS = TEMPLATE_CATEGORIES.reduce((acc, c) => {
  acc[c] = textTemplates.filter((t) => t.category === c).length;
  return acc;
}, {});

export default textTemplates;