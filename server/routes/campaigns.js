// server/routes/campaigns.js
import express from "express";
import sgMail from "@sendgrid/mail";
import { prisma } from "../prisma/prismaClient.js";
import { protect } from "../middleware/authMiddleware.js";

// ================================================================
// 📮 DEDICATED SENDGRID CLIENT FOR CAMPAIGNS
// ----------------------------------------------------------------
// The default `sgMail` export is ONE shared object for the whole app.
// Other files (mailer.js, services/emailService.js, imapSync.js…) call
// sgMail.setApiKey() with DIFFERENT keys, so whichever ran last decided
// which SendGrid account a campaign was sent from. With a dedicated IP,
// sending from an account/subuser that has no IP assigned gives:
//   deferred: "no IPs are available for this account"
// This private client always uses the campaign key, nothing can swap it.
//
// Env vars:
//   SENDGRID_CAMPAIGN_API_KEY  (optional) key from the account that owns
//                              the dedicated IP. Falls back to SENDGRID_API_KEY.
//   SENDGRID_IP_POOL           (optional) IP pool name. Only set this if the
//                              pool exists in SendGrid AND contains your IP.
// ================================================================
const campaignMailer = new sgMail.MailService();
let campaignMailerKey = null;

function getCampaignApiKey() {
  return process.env.SENDGRID_CAMPAIGN_API_KEY || process.env.SENDGRID_API_KEY || null;
}

function initCampaignMailer() {
  const key = getCampaignApiKey();
  if (!key) return false;
  if (key !== campaignMailerKey) {
    campaignMailer.setApiKey(key);
    campaignMailerKey = key;
    // Log only the public key ID (middle part) so you can match it in
    // SendGrid → Settings → API Keys. Never log the full key.
    const keyId = key.split(".")[1] || "unknown";
    console.log(`📮 Campaign SendGrid key ID: ${keyId}${process.env.SENDGRID_IP_POOL ? ` | IP pool: ${process.env.SENDGRID_IP_POOL}` : ""}`);
  }
  return true;
}

async function sendCampaignMail(msg) {
  if (!initCampaignMailer()) throw new Error("SendGrid campaign API key not configured");
  const pool = process.env.SENDGRID_IP_POOL;
  return campaignMailer.send(pool ? { ...msg, ipPoolName: pool } : msg);
}

const router = express.Router();
router.use(protect);

// ================================================================
// 📦 BATCH CONFIGURATION
// ================================================================
const BATCH_SIZE        = 2000;           // emails per batch
const BATCH_DURATION_MS = 30 * 60 * 1000; // 30 minutes per batch

export async function resumeStuckCampaigns() {
  try {
    const stuck = await prisma.campaign.findMany({
      where: { status: { in: ["sending", "processing"] } },
    });
    if (stuck.length === 0) { console.log("✅ Startup: no stuck campaigns"); return; }
    console.log(`🔄 Startup: resuming ${stuck.length} stuck campaign(s)`);
    for (const c of stuck) {
      _sendInBatches(c, null).catch((e) =>
        console.error(`❌ Resume error campaign ${c.id}:`, e.message)
      );
    }
  } catch (e) {
    console.error("❌ resumeStuckCampaigns:", e.message);
  }
}

async function _sendInBatches(campaign, buildMessage) {
  if (!initCampaignMailer()) {
    console.error(`❌ Campaign ${campaign.id}: SendGrid campaign API key not configured`);
    return;
  }

  let recipients = [];
  try { recipients = JSON.parse(campaign.recipientsJson || "[]"); } catch { return; }

  const totalRecipients = recipients.length;
  const totalBatches    = Math.ceil(totalRecipients / BATCH_SIZE);

  // Resume from batch in DB — default to 1 (not 0) since batches are 1-indexed
  const startBatch = Math.max(1, campaign.currentBatch || 1);
  let   totalSent  = campaign.sentCount || 0;

  console.log(`🚀 Campaign ${campaign.id} | ${totalRecipients} recipients | ${totalBatches} batches | Starting at batch ${startBatch}`);

  // ── Initialize batch metadata in DB ───────────────────────────
  await prisma.campaign.update({
    where: { id: campaign.id },
    data: {
      totalBatches: totalBatches,
      currentBatch: startBatch, 
      pending:      totalRecipients - totalSent,  // ✅ use pending field
      status:       "sending",
    },
  });

  for (let batchNum = startBatch; batchNum <= totalBatches; batchNum++) {
    const batchStart  = (batchNum - 1) * BATCH_SIZE;
    const batchEnd    = Math.min(batchStart + BATCH_SIZE, totalRecipients);
    const batchEmails = recipients.slice(batchStart, batchEnd);
    const batchCount  = batchEmails.length;

    // ✅ Spread batchCount emails evenly over 30 minutes
    // 2000 emails → 900ms delay each = exactly 30 min
    //  500 emails → 3600ms delay each = exactly 30 min
const delayPerEmail = batchCount < 50 
  ? 2000  // small batch: 2s max delay
  : Math.floor(BATCH_DURATION_MS / batchCount);
    console.log(`\n📦 Batch ${batchNum}/${totalBatches} | emails ${batchStart + 1}–${batchEnd} | delay: ${delayPerEmail}ms/email`);

    // Update currentBatch so Analytics shows live progress
    await prisma.campaign.update({
      where: { id: campaign.id },
      data:  { currentBatch: batchNum },
    });

    let batchSent   = 0;
    let batchFailed = 0;

    for (let i = 0; i < batchEmails.length; i++) {
      const r       = batchEmails[i];
      const toEmail = typeof r === "string" ? r : r?.email;
      if (!toEmail) continue;

      const msg = buildMessage
        ? buildMessage(toEmail)
        : {
            to:      toEmail,
            from:    { name: campaign.fromName, email: campaign.fromEmail },
            replyTo: campaign.replyToEmail || campaign.fromEmail,
            subject: campaign.subject,
            html:    `<p>${campaign.subject}</p>`,
            trackingSettings: {
              clickTracking: { enable: true },
              openTracking:  { enable: true },
            },
            customArgs: { campaignId: campaign.id.toString() },
            categories: [`campaign_${campaign.id}`],
          };

      try {
        const response = await sendCampaignMail(msg);
        if (response[0].statusCode >= 200 && response[0].statusCode < 300) {
          batchSent++;
          totalSent++;
        } else {
          batchFailed++;
          console.error(`⚠️  Status ${response[0].statusCode} for ${toEmail}`);
        }
      } catch (e) {
        batchFailed++;
        console.error(`❌ ${toEmail}:`, e.response?.body?.errors?.[0]?.message || e.message);
      }

      // ✅ Save progress + update pending every 50 emails
      // ✅ Fix — also save when it's the last email in a small batch
      const isLastEmail = i === batchEmails.length - 1;
      if ((i + 1) % 50 === 0 || isLastEmail) {
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: {
            sentCount: totalSent,
            pending:   totalRecipients - totalSent,
          },
        });
      }

      // ✅ THE CRITICAL THROTTLE — spaces emails over 30 minutes
      await new Promise((resolve) => setTimeout(resolve, delayPerEmail));
    }

    // Save after each batch finishes
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        sentCount: totalSent,
        pending:   totalRecipients - totalSent,  // ✅
      },
    });

    console.log(`✅ Batch ${batchNum}/${totalBatches} done | sent: ${batchSent} | failed: ${batchFailed} | totalSent: ${totalSent}`);

    // 5s pause between batches
    if (batchNum < totalBatches) {
      console.log(`⏸  Pausing 5s before batch ${batchNum + 1}…`);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  // ── Mark campaign fully complete ───────────────────────────────
  await prisma.campaign.update({
    where: { id: campaign.id },
    data: {
      sentCount:    totalSent,
      currentBatch: totalBatches,
      pending:      0,             // ✅ zero out pending when done
      status:       totalSent > 0 ? "completed" : "failed",
    },
  });

  console.log(`🎉 Campaign ${campaign.id} COMPLETE | ${totalSent}/${totalRecipients} sent across ${totalBatches} batch(es)`);
}
// In server/routes/campaigns.js, replace the entire generateHtmlFromCanvas function with this updated version

function generateHtmlFromCanvas(canvasData, subject, fromName, fromEmail, fromAddress, replyToEmail, bgColorOverride) {
  /* ── EMPTY FALLBACK ─────────────────────────────────────────── */
  if (!canvasData || canvasData.length === 0) {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${subject}</title></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#fff;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px;">
<table width="700" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;">
<tr><td style="padding:24px;"><h1 style="color:#333;">${subject}</h1>
<p style="color:#555;">This email was sent from your campaign builder.</p></td></tr>
<tr><td style="padding:14px;text-align:center;font-size:12px;color:#999;border-top:1px solid #eee;">
Sent by <strong>${fromName}</strong> | ${fromAddress} | <a href="mailto:${fromEmail}">${fromEmail}</a>
</td></tr></table></td></tr></table></body></html>`;
  }

  /* ── DIMENSIONS ─────────────────────────────────────────────── */
  const CW = 800;   // canvas width
  const EW = 660;   // email content width (700px table - 20px padding each side)

  // Scale a canvas pixel value to an email pixel value
  const sc = (v) => Math.round((Number(v) || 0) * EW / CW);

  /* ── READ BACKGROUND COLOR ──────────────────────────────────── */
  const sentinel = (canvasData || []).find(e => e.type === '__canvas_bg__');
  const emailBg = bgColorOverride || (sentinel && sentinel.color) || '#ffffff';

  /* ── NORMALIZE ELEMENTS ─────────────────────────────────────── */
  const els = (canvasData || [])
    .filter(e => e && e.type && e.type !== '__canvas_bg__')
    .map(e => ({
      ...e,
      x: Number(e.x) || 0,
      y: Number(e.y) || 0,
      width: Number(e.width) || 80,
      height: Number(e.height) || 40,
    }));

  /* ── ALIGNMENT INFERENCE ────────────────────────────────────── */
  function align(el, inCard, forceLeft, card) {
    if (inCard) {
      if (el.textAlign === 'left' || el.textAlign === 'center' || el.textAlign === 'right')
        return el.textAlign;
      // No explicit alignment: derive it from where the element sits inside
      // the card, not inside the whole canvas.
      if (card && card.width > 0) {
        const r = ((el.x + el.width / 2) - card.x) / card.width;
        if (r < 0.32) return 'left';
        if (r > 0.68) return 'right';
        return 'center';
      }
      return 'left';
    }
    if (forceLeft) {
      if (el.textAlign === 'left' || el.textAlign === 'center' || el.textAlign === 'right')
        return el.textAlign;
      return 'left';
    }
    if (el.textAlign === 'left' || el.textAlign === 'center' || el.textAlign === 'right')
      return el.textAlign;
    const ratio = (el.x + el.width / 2) / CW;
    if (ratio < 0.30) return 'left';
    if (ratio > 0.70) return 'right';
    return 'center';
  }

  /* ── POSITIONAL WRAPPER ─────────────────────────────────────────
     Reproduces the element's canvas X offset using spacer cells.
     Email clients drop `position:absolute`, but table cell widths are
     universally supported, so this is the faithful equivalent.        */
  function positionRow(x, width, innerHtml) {
    const leftPx  = Math.max(0, Math.min(sc(x), EW - 1));
    const bodyPx  = Math.max(1, Math.min(sc(width), EW - leftPx));
    const rightPx = Math.max(0, EW - leftPx - bodyPx);
    const spacer  = (w) => w > 0
      ? `<td class="bc-gutter" width="${w}" style="width:${w}px;font-size:0;line-height:0;">&nbsp;</td>`
      : '';
    return `<table class="bc-row" width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout:fixed;width:100%;">`
      + `<tr>${spacer(leftPx)}`
      + `<td class="bc-cell" width="${bodyPx}" valign="top" style="width:${bodyPx}px;">${innerHtml}</td>`
      + `${spacer(rightPx)}</tr></table>`;
  }

  /* ── ELEMENT RENDERERS ──────────────────────────────────────── */

  /* Inline markup allowlist — mirrors client/.../Editor/richText.js.
     Anything outside <b|strong|i|em|u|s|a|br> is escaped, so pasted or
     tampered content can never inject markup into the email. */
  const INLINE_OK = /^(b|strong|i|em|u|s|br)$/i;
  const LIST_OK   = /^(ul|ol|li)$/i;

  /* Email clients zero out list margins/padding, so state them explicitly.
     `type` is kept alongside list-style-type because Outlook's Word engine
     honours the attribute but ignores the CSS. */
  const listOpenTag = (tag, attrs) => {
    if (/^ul$/i.test(tag)) return '<ul style="margin:6px 0;padding-left:26px;list-style-type:disc;">';
    if (/^li$/i.test(tag)) return '<li style="margin:3px 0;">';
    const m = /type\s*=\s*["']?([1IiAa])["']?/.exec(attrs || '');
    const roman = m && /^i$/i.test(m[1]);
    return `<ol type="${roman ? 'I' : '1'}" style="margin:6px 0;padding-left:26px;list-style-type:${roman ? 'upper-roman' : 'decimal'};">`;
  };

  const escapeHtml = (str) => String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const safeHref = (raw) => {
    const href = String(raw || '').trim();
    if (/^(https?:|mailto:|tel:)/i.test(href)) return href;
    if (/^[\w-]+(\.[\w-]+)+([/?#].*)?$/.test(href)) return `https://${href}`;
    return null;
  };

  function inlineHtml(str, linkColor) {
    if (!str) return '';
    // Drop <script>/<style> blocks including their contents
    const cleaned = String(str).replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, '');

    let out = '';
    let last = 0;
    const linkStack = [];   // tracks whether each open <a> was emitted
    const listStack = [];   // tracks open ul/ol/li so closes always match
    const re = /<\/?([a-zA-Z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
    let m;
    while ((m = re.exec(cleaned)) !== null) {
      out += escapeHtml(cleaned.slice(last, m.index));
      last = re.lastIndex;
      const [full, tag, attrs] = m;
      const closing = full.startsWith('</');
      const t = tag.toLowerCase();

      if (INLINE_OK.test(t)) {
        out += closing ? `</${t}>` : `<${t}>`;
      } else if (LIST_OK.test(t)) {
        if (closing) {
          if (listStack.length && listStack[listStack.length - 1] === t) { listStack.pop(); out += `</${t}>`; }
        } else {
          listStack.push(t);
          out += listOpenTag(t, attrs);
        }
      } else if (t === 'a') {
        if (closing) {
          // Only close a link we actually opened — never leak a stray </a>
          if (linkStack.pop()) out += '</a>';
          continue;
        }
        const hrefMatch = /href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs || '');
        const href = safeHref(hrefMatch ? (hrefMatch[2] ?? hrefMatch[3] ?? hrefMatch[4]) : '');
        linkStack.push(!!href);
        if (href) {
          out += `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" style="color:${linkColor || '#1155cc'};text-decoration:underline;">`;
        }
        // unsafe href: tag dropped, inner text still rendered
      }
      // any other tag: dropped entirely
    }
    out += escapeHtml(cleaned.slice(last));
    while (linkStack.length) { if (linkStack.pop()) out += '</a>'; }  // close anything left open
    while (listStack.length) { out += `</${listStack.pop()}>`; }
    return out
      .replace(/>\s*\r?\n\s*</g, '><')        // newlines between list tags are not <br/>
      .replace(/\r?\n/g, '<br/>');
  }

  const nl2br = (str) => inlineHtml(str);

  /* letter-spacing / text-transform come from the Campaign Text Editor.
     Emitted only when present so untouched templates are unchanged. */
  const extraType = (el) => {
    let css = '';
    if (el.letterSpacing && el.letterSpacing !== '0px') css += `letter-spacing:${el.letterSpacing};`;
    if (el.textTransform && el.textTransform !== 'none') css += `text-transform:${el.textTransform};`;
    return css;
  };

  function renderEl(el, inCard, forceLeft, colWidthPx, card) {
    const a = align(el, inCard, forceLeft, card);

    switch (el.type) {

      case 'heading':
        return `<h1 style="margin:2px 0;font-size:${el.fontSize || 28}px;color:${el.color || '#333'};font-weight:${el.fontWeight || '700'};font-family:${el.fontFamily || 'Arial,sans-serif'};text-align:${a};line-height:1.3;background:${el.backgroundColor || 'transparent'};${extraType(el)}">${nl2br(el.content) || 'Heading'}</h1>`;

      case 'subheading':
        return `<h2 style="margin:2px 0;font-size:${el.fontSize || 20}px;color:${el.color || '#333'};font-weight:${el.fontWeight || '600'};font-family:${el.fontFamily || 'Arial,sans-serif'};text-align:${a};background:${el.backgroundColor || 'transparent'};${extraType(el)}">${nl2br(el.content) || 'Subheading'}</h2>`;

      case 'paragraph': {
        const tag = /<(ul|ol)\b/i.test(el.content || '') ? 'div' : 'p';
        return `<${tag} style="margin:3px 0;font-size:${el.fontSize || 15}px;color:${el.color || '#333'};font-family:${el.fontFamily || 'Arial,sans-serif'};font-weight:${el.fontWeight || 'normal'};font-style:${el.fontStyle || 'normal'};text-decoration:${el.textDecoration || 'none'};line-height:${el.lineHeight || 1.3};text-align:${a};word-break:break-word;background:${el.backgroundColor || 'transparent'};${extraType(el)}">${nl2br(el.content) || ''}</${tag}>`;
      }

      case 'blockquote': {
        // The left rule used to be hardcoded, so quotes gained a bar in the
        // email that isn't on the canvas. Now it only appears if the element
        // actually has a border set in the properties panel.
        const qbw = Number(el.borderWidth) || 0;
        const qRule = qbw > 0
          ? `border-left:${qbw}px ${el.borderStyle && el.borderStyle !== 'none' ? el.borderStyle : 'solid'} ${el.borderColor || el.strokeColor || '#C9A84C'};padding:4px 0 4px 12px;`
          : '';
        return `<div style="margin:3px 0;font-size:${el.fontSize || 15}px;color:${el.color || '#E8D8A0'};font-family:${el.fontFamily || 'Georgia,serif'};font-style:italic;${qRule}text-align:${a};">${nl2br(el.content) || ''}</div>`;
      }

      case 'image': {
        let src = el.src || '';
        if (!src || src.startsWith('blob:') || src.startsWith('data:')) src = 'https://via.placeholder.com/560x200?text=No+Image';
        if (!src.startsWith('http://') && !src.startsWith('https://')) src = `${process.env.API_BASE_URL}${src}`;
        // A radius may be a percentage ("50%" for a circle). Number() turns
        // that into NaN, so the old code silently dropped it and every rounded
        // image came out square.
        const rawR = el.borderRadius;
        const radiusCss = typeof rawR === 'string' && rawR.trim().endsWith('%')
          ? rawR.trim()
          : `${Number(rawR) || 0}px`;

        const bdr = Number(el.borderWidth) > 0
          ? `border:${el.borderWidth}px ${el.borderStyle && el.borderStyle !== 'none' ? el.borderStyle : 'solid'} ${el.borderColor || '#ccc'};`
          : '';

        const elW = Number(el.width) || 1;
        const elH = Number(el.height) || 0;

        // Space this image actually has to fill. Inside a card that's the
        // card's own width minus its 16px padding, not a guess off EW.
        const availPx = colWidthPx
          || (card && card.width ? Math.max(1, sc(card.width) - 32) : EW);
        const naturalPx = sc(elW);
        // Only stretch to 100% when the image really is close to full width.
        // Blowing a small square image up to 100% turns a circle into an
        // ellipse, which is why round images arrived stretched.
        const isWide = naturalPx >= availPx * 0.9;

        if (!isWide) {
          const wPx = Math.min(naturalPx, availPx);
          const hPx = elH > 0 ? Math.round(elH * (wPx / elW)) : 0;   // keep the aspect ratio
          return `<div style="margin:0;font-size:0;line-height:0;text-align:${a};">
            <a href="${el.link || '#'}" target="_blank">
              <img src="${src}" alt="${el.alt || ''}" width="${wPx}"${hPx ? ` height="${hPx}"` : ''}
                style="display:inline-block;width:${wPx}px;${hPx ? `height:${hPx}px;object-fit:cover;` : 'height:auto;'}
                max-width:100%;border-radius:${radiusCss};${bdr}" />
            </a>
          </div>`;
        }

        let scaledH = 0;
        if (forceLeft && elH > 0) {
          const refW = colWidthPx || Math.round((elW / CW) * EW);
          scaledH = Math.round(elH * (refW / elW));
        }
        const heightStyle = scaledH > 0 ? `height:${scaledH}px;object-fit:cover;` : 'height:auto;';
        return `<div style="margin:0;font-size:0;line-height:0;">
            <a href="${el.link || '#'}" target="_blank">
              <img src="${src}" alt="${el.alt || ''}"
                width="100%"
                style="display:block;width:100%;max-width:100%;
                ${heightStyle}
                border-radius:${radiusCss};${bdr}" />
            </a>
          </div>`;  
      }

      case 'button': {
        const ba = align(el, inCard, false, card);
        return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0;"><tr><td align="${ba}"><a href="${el.link || '#'}" style="display:inline-block;padding:${el.padding || '10px 22px'};background-color:${el.backgroundColor || '#C9A84C'};color:${el.color || '#000'};text-decoration:none;border-radius:${el.borderRadius || 6}px;font-weight:${el.fontWeight || '700'};font-size:${el.fontSize || 15}px;font-family:${el.fontFamily || 'Arial,sans-serif'};">${el.content || 'Click Me'}</a></td></tr></table>`;
      }

      case 'line':
        return `<div style="margin:8px 0;font-size:0;line-height:0;"><hr style="border:none;height:${el.strokeWidth || 2}px;background:${el.strokeColor || '#333'};margin:0;"/></div>`;

      /* Rectangle, square, circle and triangle all render through one path.
         They can carry text and an image fill, so each is a sized box with an
         optional background image and centred copy. Triangles have no email-safe
         CSS equivalent — clip-path is stripped by most clients — so they fall
         back to a rounded box and keep their content readable. */
      case 'rectangle':
      case 'square':
      case 'circle':
      case 'triangle': {
        if (inCard && el.type === 'rectangle') return ''; // card background already applied

        const w  = sc(el.width)  || 40;
        const h  = sc(el.height) || 40;
        const bw = Number(el.borderWidth) || 0;
        const bs = el.borderStyle && el.borderStyle !== 'none' ? el.borderStyle : 'solid';
        const radius = el.type === 'circle' ? '50%'
                     : el.type === 'triangle' ? '6px'
                     : `${el.borderRadius ?? 6}px`;

        const bgImage = el.imageSrc
          ? `background-image:url('${escapeHtml(el.imageSrc)}');background-size:${el.imageFit === 'contain' ? 'contain' : 'cover'};background-position:center;background-repeat:no-repeat;`
          : '';

        const border = bw > 0 && el.borderStyle !== 'none'
          ? `border:${bw}px ${bs} ${el.borderColor || '#000'};` : '';

        const valign = el.verticalAlign === 'top' ? 'top'
                     : el.verticalAlign === 'bottom' ? 'bottom' : 'middle';

        const inner = el.content
          ? `<span style="font-family:${el.fontFamily || 'Arial,sans-serif'};font-size:${el.fontSize || 16}px;font-weight:${el.fontWeight || '600'};color:${el.color || '#fff'};line-height:${el.lineHeight || 1.3};">${nl2br(el.content)}</span>`
          : '';

        // A table cell, not a div: Outlook ignores height and vertical centring on divs
        return `<table cellpadding="0" cellspacing="0" border="0" style="width:${w}px;margin:4px 0;"><tr>`
             + `<td align="${a}" valign="${valign}" style="width:${w}px;height:${h}px;background-color:${el.backgroundColor || 'transparent'};${bgImage}${border}border-radius:${radius};text-align:${a};padding:6px 10px;box-sizing:border-box;">`
             + `${inner}</td></tr></table>`;
      }

      case 'star': {
        const sz = Math.max(sc(el.width) || 24, 14);
        const clr = el.backgroundColor || el.color || '#FFD700';
        return `<span style="display:inline-block;font-size:${sz}px;line-height:1;color:${clr};vertical-align:middle;">&#9733;</span>`;
      }

      case 'emoji-icon': {
        const emoji = el.emoji || '⭐';
        const sz = Math.min(sc(el.width) || 32, sc(el.height) || 32, 48);
        const fSize = el.fontSize || Math.round(sz * 0.75);
        return `<div style="display:inline-block;width:${sz}px;height:${sz}px;line-height:${sz}px;text-align:center;font-size:${fSize}px;vertical-align:middle;">${emoji}</div>`;
      }

      case 'social': {
        const sz = Math.min(sc(el.width) || 32, sc(el.height) || 32, 40);
        const cdnIcons = {
          facebook:  'https://cdn-icons-png.flaticon.com/512/733/733547.png',
          twitter:   'https://cdn-icons-png.flaticon.com/512/733/733579.png',
          linkedin:  'https://cdn-icons-png.flaticon.com/512/145/145807.png',
          instagram: 'https://cdn-icons-png.flaticon.com/512/2111/2111463.png',
          youtube:   'https://cdn-icons-png.flaticon.com/512/1384/1384060.png',
          tiktok:    'https://cdn-icons-png.flaticon.com/512/3046/3046126.png',
          whatsapp:  'https://cdn-icons-png.flaticon.com/512/733/733585.png',
          pinterest: 'https://cdn-icons-png.flaticon.com/512/145/145808.png',
        };
        let src = el.src || '';
        if (!src || src.startsWith('blob:') || src.startsWith('data:') || src.startsWith('/')) {
          const platform = (el.platform || '').toLowerCase();
          src = cdnIcons[platform] || cdnIcons['facebook'];
        }
        return `<a href="${el.link || '#'}" target="_blank" style="display:inline-block;vertical-align:middle;margin:0 6px;text-decoration:none;"><img src="${src}" width="${sz}" height="${sz}" alt="${el.platform || 'social'}" style="display:inline;border:0;border-radius:6px;width:${sz}px;height:${sz}px;" /></a>`;
      }

      default: return '';
    }
  }

  /* ── CARD DETECTION ─────────────────────────────────────────── */
  function centerIn(el, r) {
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;
    if (cx >= r.x && cx <= r.x + r.width && cy >= r.y && cy <= r.y + r.height) return true;
    const ix = Math.max(0, Math.min(el.x + el.width, r.x + r.width) - Math.max(el.x, r.x));
    const iy = Math.max(0, Math.min(el.y + el.height, r.y + r.height) - Math.max(el.y, r.y));
    const overlap = ix * iy;
    const elArea = el.width * el.height;
    return elArea > 0 && overlap / elArea > 0.50;
  }

  /* A "card" is a shape other elements sit on top of. Only rectangles used to
     qualify, so a design built on a square, circle or triangle container had
     its background emitted as one unit and every child as separate stacked
     units — the layout fell apart in the inbox.

     Rectangles keep the old rule (always a container, matching existing
     templates). The newer shapes must be large AND actually hold something,
     so a small decorative circle stays a plain element. */
  const CONTAINER_TYPES = ['rectangle', 'square', 'circle', 'triangle'];

  const holdsChildren = (c) => els.some(el =>
    el.id !== c.id && !CONTAINER_TYPES.includes(el.type) && centerIn(el, c));

  const allRects = els.filter(e =>
    e.type === 'rectangle' ||
    (CONTAINER_TYPES.includes(e.type)
      && e.width  >= CW * 0.30
      && e.height >= 120
      && holdsChildren(e))
  );
  const skipRectIds = new Set();
  for (let i = 0; i < allRects.length; i++) {
    for (let j = i + 1; j < allRects.length; j++) {
      const a = allRects[i], b = allRects[j];
      const ix = Math.max(0, Math.min(a.x+a.width, b.x+b.width) - Math.max(a.x, b.x));
      const iy = Math.max(0, Math.min(a.y+a.height, b.y+b.height) - Math.max(a.y, b.y));
      const intersection = ix * iy;
      const aArea = a.width * a.height, bArea = b.width * b.height;
      const smaller = Math.min(aArea, bArea);
      if (smaller > 0 && intersection / smaller > 0.85) {
        const aIsOverlay = !a.backgroundColor || a.backgroundColor === 'transparent';
        const bIsOverlay = !b.backgroundColor || b.backgroundColor === 'transparent';
        if (aIsOverlay) skipRectIds.add(a.id);
        else if (bIsOverlay) skipRectIds.add(b.id);
        else skipRectIds.add(aArea <= bArea ? a.id : b.id);
      }
    }
  }
  const rects = allRects.filter(r => !skipRectIds.has(r.id));
  const cardMap = new Map();
  rects.forEach(r => cardMap.set(r.id, { bg: r, kids: [] }));

  // A shape acting as a card background must not also be placed inside one
  const cardBgIds = new Set(rects.map(r => r.id));

  const orphans = [];
  els.forEach(el => {
    if (el.type === 'rectangle') return;
    if (cardBgIds.has(el.id)) return;
    let best = null, bestA = Infinity;
    rects.forEach(r => {
      if (centerIn(el, r)) {
        const a = r.width * r.height;
        if (a < bestA) { bestA = a; best = r; }
      }
    });
    if (best) cardMap.get(best.id).kids.push(el);
    else orphans.push(el);
  });

  /* ── CARD RENDERER ──────────────────────────────────────────── */
  function renderCard(bg, kids) {
    // Special handling for email footer card
    const hasButton = kids.some(k => k.type === 'button' && k.content && k.content.includes('FIND YOUR VOICE'));
    const hasSocialIcons = kids.some(k => k.type === 'social');
    const hasUnsubscribe = kids.some(k => k.type === 'heading' && k.content === 'Unsubscribe');
    
    if (hasSocialIcons && (hasUnsubscribe || hasButton)) {
      // This is the email footer card - use table-based layout
      const sorted = [...kids].sort((a, b) => a.y - b.y);
      
      // Extract elements
      const button = sorted.find(k => k.type === 'button');
      const networkText = sorted.find(k => k.type === 'paragraph' && k.content && k.content.includes('professional network'));
      const unsubscribe = sorted.find(k => k.type === 'heading' && k.content === 'Unsubscribe');
      const divider1 = sorted.find(k => k.type === 'line' && k.y < 150);
      const phone = sorted.find(k => k.type === 'paragraph' && k.content && (k.content.includes('📞') || k.content.match(/\d{3}[-.\s]\d{3}/)));
      const separator = sorted.find(k => k.type === 'paragraph' && k.content === '|');
      const email = sorted.find(k => k.type === 'paragraph' && k.content && k.content.includes('@'));
      const socialIcons = sorted.filter(k => k.type === 'social');
      const divider2 = sorted.find(k => k.type === 'line' && k.y > 200);
      
      // Build HTML table structure
      let html = `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${bg.backgroundColor || '#1a1008'};border-radius:${bg.borderRadius || 0}px;">`;
      
      // Button row
      if (button) {
        html += `<tr><td style="padding:16px 0 8px;text-align:center;">
          <a href="${button.link || '#'}" style="display:inline-block;padding:${button.padding || '10px 22px'};background-color:${button.backgroundColor || '#c2831f'};color:${button.color || '#ffffff'};text-decoration:none;border-radius:${button.borderRadius || 24}px;font-weight:${button.fontWeight || '700'};font-size:${button.fontSize || 14}px;font-family:${button.fontFamily || 'Arial, sans-serif'};">${button.content || 'Button'}</a>
        </td></tr>`;
      }
      
      // Network text row
      if (networkText) {
        html += `<tr><td style="padding:0 20px 8px;text-align:center;">
          <p style="margin:0;color:${networkText.color || '#d4c9b0'};font-size:${networkText.fontSize || 12}px;font-family:${networkText.fontFamily || 'Arial, sans-serif'};">${networkText.content || ''}</p>
        </td></tr>`;
      }
      
      // Unsubscribe row
      if (unsubscribe) {
        html += `<tr><td style="padding:0 0 8px;text-align:center;">
          <a href="#" style="color:${unsubscribe.color || '#c2831f'};font-size:${unsubscribe.fontSize || 13}px;font-weight:${unsubscribe.fontWeight || '700'};text-decoration:none;">${unsubscribe.content || 'Unsubscribe'}</a>
        </td></tr>`;
      }
      
      // First divider
      if (divider1) {
        html += `<tr><td style="padding:0 20px;">
          <hr style="border:none;height:${divider1.strokeWidth || 1}px;background:${divider1.strokeColor || '#3d2e10'};margin:0;"/>
        </td></tr>`;
      }
      
      // Contact info row
      html += `<tr><td style="padding:8px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>`;
      
      // Phone
      if (phone) {
        html += `<td style="text-align:right;padding-right:10px;">
          <p style="margin:0;color:${phone.color || '#4da6ff'};font-size:${phone.fontSize || 13}px;font-family:${phone.fontFamily || 'Arial, sans-serif'};">${phone.content || ''}</p>
        </td>`;
      }
      
      // Separator
      if (separator) {
        html += `<td style="text-align:center;padding:0 10px;">
          <p style="margin:0;color:${separator.color || '#6b5a3a'};font-size:${separator.fontSize || 14}px;font-family:${separator.fontFamily || 'Arial, sans-serif'};">${separator.content || ''}</p>
        </td>`;
      }
      
      // Email
      if (email) {
        html += `<td style="text-align:left;padding-left:10px;">
          <a href="mailto:${email.content || ''}" style="color:${email.color || '#4da6ff'};font-size:${email.fontSize || 13}px;font-family:${email.fontFamily || 'Arial, sans-serif'};text-decoration:none;">${email.content || ''}</a>
        </td>`;
      }
      
      html += `</tr></table>
      </td></tr>`;
      
      // Social icons row
      if (socialIcons.length > 0) {
        html += `<tr><td style="padding:8px 0 16px;text-align:center;">`;
        
        socialIcons.forEach(icon => {
          const cdnIcons = {
            facebook:  'https://cdn-icons-png.flaticon.com/512/733/733547.png',
            twitter:   'https://cdn-icons-png.flaticon.com/512/733/733579.png',
            linkedin:  'https://cdn-icons-png.flaticon.com/512/145/145807.png',
            instagram: 'https://cdn-icons-png.flaticon.com/512/2111/2111463.png',
            youtube:   'https://cdn-icons-png.flaticon.com/512/1384/1384060.png',
            tiktok:    'https://cdn-icons-png.flaticon.com/512/3046/3046126.png',
            whatsapp:  'https://cdn-icons-png.flaticon.com/512/733/733585.png',
            pinterest: 'https://cdn-icons-png.flaticon.com/512/145/145808.png',
          };
          let iconSrc = icon.src || '';
          if (!iconSrc || iconSrc.startsWith('blob:') || iconSrc.startsWith('data:') || iconSrc.startsWith('/')) {
            const platform = (icon.platform || '').toLowerCase();
            iconSrc = cdnIcons[platform] || cdnIcons['facebook'];
          }
          const iconSz = Math.min(sc(icon.width) || 32, sc(icon.height) || 32, 40);
          html += `<a href="${icon.link || '#'}" target="_blank" style="display:inline-block;margin:0 6px;text-decoration:none;"><img src="${iconSrc}" width="${iconSz}" height="${iconSz}" alt="${icon.platform || 'social'}" style="display:inline;border:0;border-radius:6px;width:${iconSz}px;height:${iconSz}px;vertical-align:middle;" /></a>`;
        });
        
        html += `</td></tr>`;
      }
      
      // Second divider
      if (divider2) {
        html += `<tr><td style="padding:0 20px 16px;">
          <hr style="border:none;height:${divider2.strokeWidth || 2}px;background:${divider2.strokeColor || '#c2831f'};margin:0;"/>
        </td></tr>`;
      }
      
      html += `</table>`;
      return html;
    }
    
    // Regular card rendering (existing code)
    const bgC = bg.backgroundColor && bg.backgroundColor !== 'transparent'
      ? bg.backgroundColor : 'transparent';
    // Circle containers can't be circular in email without clipping the copy,
    // so they render as a heavily rounded box — the nearest safe equivalent.
    const rad = bg.type === 'circle' ? 999 : (Number(bg.borderRadius) || 8);
    const bStyle = bg.borderStyle && bg.borderStyle !== 'none' ? bg.borderStyle : 'solid';
    const bdr = Number(bg.borderWidth) > 0
      ? `border:${bg.borderWidth}px ${bStyle} ${bg.borderColor || '#444'};`
      : '';
    const sorted = [...kids].sort((a, b) => a.y - b.y);

    // Top-image: image whose top edge is within 20px of card top
    const topImg = sorted.find(k => k.type === 'image' && (k.y - bg.y) < 20);
    let rest = sorted.filter(k => k !== topImg);

    // Icon+heading inline pair detection
    let iconEl = null, headEl = null;
    const iIdx = rest.findIndex(k => ['emoji-icon', 'circle', 'star'].includes(k.type));
    if (iIdx !== -1) {
      const ic = rest[iIdx];
      const hIdx = rest.findIndex((k, i) => i !== iIdx
        && ['heading', 'subheading'].includes(k.type)
        && Math.abs((k.y + k.height / 2) - (ic.y + ic.height / 2)) < 32);
      if (hIdx !== -1) {
        iconEl = ic; headEl = rest[hIdx];
        rest = rest.filter((_, i) => i !== iIdx && i !== hIdx);
      }
    }

    /* Row grouping is computed up front because the table's column count is
       set by its widest row, and every earlier row needs to span that many
       columns. Emitting a single-<td> row into a 3-column table is what
       pinned the whole design to the left third of the card. */
    const restSorted = [...rest].sort((a, b) => a.y !== b.y ? a.y - b.y : a.x - b.x);
    const rowGroups = [];
    restSorted.forEach(k => {
      const kMidY = k.y + k.height / 2;
      const existing = rowGroups.find(g =>
        g.some(m => {
          const mMidY = m.y + m.height / 2;
          return Math.abs(kMidY - mMidY) < Math.min(k.height, m.height) * 0.6;
        })
      );
      if (existing) existing.push(k);
      else rowGroups.push([k]);
    });
    /* The card table is deliberately ONE column. Mixing single- and
       multi-cell rows made HTML confine each lone cell to column 1, and that
       column got sized by the narrowest item in the widest row — a social
       icon — so headings, paragraphs and images were crushed to its width.
       Side-by-side groups now live in a nested table inside the single cell,
       so no row can affect any other row's width. colspan is not needed. */

    let rows = '';

    // Full-bleed top image
    if (topImg) {
      let src = topImg.src || '';
      if (!src || src.startsWith('blob:') || src.startsWith('data:')) src = 'https://via.placeholder.com/560x200?text=Image';
      if (!src.startsWith('http://') && !src.startsWith('https://')) src = `${process.env.API_BASE_URL}${src}`;
      rows += `<tr><td style="padding:0;font-size:0;line-height:0;"><img src="${src}" alt="" width="100%" style="display:block;width:100%;height:auto;max-height:280px;object-fit:cover;border-radius:${rad}px ${rad}px 0 0;"/></td></tr>`;
    }

    // Icon + heading side by side
    if (iconEl) {
      rows += `<tr><td style="padding:12px 16px 4px;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td width="44" valign="middle" style="padding-right:8px;">${renderEl(iconEl, true, false, undefined, bg)}</td><td valign="middle">${renderEl(headEl, true, false, undefined, bg)}</td></tr></table></td></tr>`;
    }

    // Body content — sort by Y, group elements at same Y into one row (side-by-side)
    if (rest.length > 0) {
      const topPad = (topImg || iconEl) ? '6' : '16';

      rowGroups.forEach((group, gIdx) => {
        // Y-gap from previous row
        let gapPx = 0;
        if (gIdx > 0) {
          const prevGroup = rowGroups[gIdx - 1];
          const prevBottom = Math.max(...prevGroup.map(m => m.y + m.height));
          const curTop = Math.min(...group.map(m => m.y));
          const canvasGap = Math.max(0, curTop - prevBottom);
          gapPx = Math.round(canvasGap * (EW / CW));
        }
        const padTop = gIdx === 0 ? 6 : Math.min(gapPx, 10);
        const padBot = gIdx === rowGroups.length - 1 ? '16' : '0';

        let inner;
        if (group.length === 1) {
          inner = renderEl(group[0], true, false, undefined, bg);
        } else {
          const sortedByX = [...group].sort((a, b) => a.x - b.x);
          const colW = Math.round(100 / sortedByX.length);
          inner = `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout:fixed;"><tr>`
            + sortedByX.map((k, kIdx) => {
                const lPad = kIdx === 0 ? 0 : 4;
                const rPad = kIdx === sortedByX.length - 1 ? 0 : 4;
                return `<td width="${colW}%" valign="middle" style="padding:0 ${rPad}px 0 ${lPad}px;text-align:center;">`
                     + `${renderEl(k, true, false, undefined, bg)}</td>`;
              }).join('')
            + `</tr></table>`;
        }
        rows += `<tr><td style="padding:${padTop}px 16px ${padBot}px;">${inner}</td></tr>`;
      });
    }

    return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${bgC};border-radius:${rad}px;${bdr}overflow:hidden;">${rows}</table>`;
  }

  /* ── BUILD LAYOUT UNITS ─────────────────────────────────────── */
  const units = [];

  cardMap.forEach(({ bg, kids }) => {
    units.push({
      x: bg.x, y: bg.y, cw: bg.width, ch: bg.height, elType: 'card', origId: bg.id,
      html: kids.length > 0 ? renderCard(bg, kids) : renderEl(bg, false),
    });
  });

  // Group orphan elements that share the same Y band (side-by-side on canvas)
  const orphansSorted = [...orphans].sort((a, b) => a.y !== b.y ? a.y - b.y : a.x - b.x);
  const orphanGroups = [];
  orphansSorted.forEach(el => {
    const elMidY = el.y + el.height / 2;
    const existing = orphanGroups.find(g =>
      g.some(m => Math.abs(elMidY - (m.y + m.height / 2)) < Math.min(el.height, m.height) * 0.6)
    );
    if (existing) existing.push(el);
    else orphanGroups.push([el]);
  });

  orphanGroups.forEach(group => {
    const groupY   = Math.min(...group.map(e => e.y));
    const groupBot = Math.max(...group.map(e => e.y + e.height));
    const groupX   = Math.min(...group.map(e => e.x));
    const groupCW  = Math.max(...group.map(e => e.x + e.width)) - groupX;

    const groupPx = Math.max(1, sc(groupCW));

    let innerHtml;
    if (group.length === 1) {
      // Cell is already the element's exact width, so honour its own textAlign
      innerHtml = renderEl(group[0], false, true, groupPx);
    } else {
      // Side-by-side group — preserve the horizontal gaps between elements too
      const sortedByX = [...group].sort((a, b) => a.x - b.x);
      let cells = '';
      let cursor = groupX;
      sortedByX.forEach(el => {
        const gapPx = Math.max(0, sc(el.x - cursor));
        if (gapPx > 0) cells += `<td width="${gapPx}" style="width:${gapPx}px;font-size:0;line-height:0;">&nbsp;</td>`;
        const cw = Math.max(1, sc(el.width));
        cells += `<td class="bc-col" width="${cw}" valign="top" style="width:${cw}px;">${renderEl(el, false, true, cw)}</td>`;
        cursor = el.x + el.width;
      });
      innerHtml = `<table cellpadding="0" cellspacing="0" border="0" width="${groupPx}" style="width:${groupPx}px;table-layout:fixed;"><tr>${cells}</tr></table>`;
    }

    units.push({ x: groupX, y: groupY, cw: groupCW, ch: groupBot - groupY, elType: 'orphan-group', origId: group[0].id, html: innerHtml });
  });

  // Sort units by Y position
  units.sort((a, b) => a.y !== b.y ? a.y - b.y : a.x - b.x);

  /* ── HTML OUTPUT ────────────────────────────────────────────── */
  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${subject}</title>
  <style type="text/css">
    /* Fixed cell widths reproduce the canvas layout on desktop.
       On narrow screens they would overflow, so collapse to stacked rows. */
    @media only screen and (max-width:620px) {
      .bc-row, .bc-row tr, .bc-cell, .bc-col { display:block !important; width:100% !important; }
      .bc-gutter { display:none !important; width:0 !important; }
      .bc-cell img, .bc-col img { max-width:100% !important; height:auto !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f0f0f0">
<tr><td align="center" style="padding:16px 8px;">
<table width="700" cellpadding="0" cellspacing="0" border="0" bgcolor="${emailBg}"
       style="max-width:700px;width:100%;background:${emailBg};">
<tr><td style="padding:20px;">
`;

  // Render all units — preserve canvas Y-gap spacing between each unit
  units.forEach((unit, idx) => {
    if (idx > 0) {
      const prev = units[idx - 1];
      // Gap = space between bottom of previous unit and top of current unit, scaled to email width
      const canvasGap = Math.max(0, unit.y - (prev.y + prev.ch));
      const emailGap = Math.round(canvasGap * (EW / CW));
      if (emailGap > 2) {
        html += `<div style="height:${emailGap}px;font-size:0;line-height:0;">&nbsp;</div>\n`;
      }
    }
    html += positionRow(unit.x, unit.cw, unit.html);
  });

  html += `</td></tr>
<tr><td style="padding:14px 20px;background:#f8f9fa;border-top:1px solid #e0e0e0;text-align:center;font-size:12px;color:#888;">
<p style="margin:0 0 4px;">Sent by <strong>${fromName}</strong></p>
<p style="margin:4px 0;">${fromAddress}</p>
<p style="margin:0;">Reply to: <a href="mailto:${replyToEmail || fromEmail}" style="color:#007bff;">${replyToEmail || fromEmail}</a></p>
</td></tr>
</table></td></tr></table>
</body></html>`;

  return html;
}

const generatePlainTextFromCanvas = (canvasData, subject, fromName, fromEmail, replyToEmail) => {
  let plainText = `${subject}\n\n`;
  if (!canvasData || canvasData.length === 0) {
    plainText += "This email was sent from your campaign builder.\n\n";
  } else {
    canvasData.forEach((el) => {
      switch (el.type) {
        case "heading":
        case "subheading":
        case "paragraph":
        case "blockquote": {
          // Strip inline markup; surface links as "text (url)"
          const txt = String(el.content || "")
            .replace(/<a\b[^>]*href\s*=\s*["']?([^"'\s>]+)[^>]*>([\s\S]*?)<\/a>/gi, "$2 ($1)")
            .replace(/<li\b[^>]*>/gi, "\n  - ")
            .replace(/<\/(ul|ol)\s*>/gi, "\n")
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<[^>]+>/g, "")
            .replace(/&nbsp;/gi, " ")
            .replace(/&amp;/gi, "&")
            .replace(/&lt;/gi, "<")
            .replace(/&gt;/gi, ">");
          plainText += `${txt}\n\n`;
          break;
        }
        case "image":
          plainText += `[Image: ${el.alt || "Image"}]\n\n`;
          break;
        case "button":
          plainText += `[${el.content || "Button"}] - ${el.link || "#"}\n\n`;
          break;
        case "line":
          plainText += "----------------------------------------\n\n";
          break;
      }
    });
  }
  plainText += `\n\nSent by ${fromName}\nReply To: ${replyToEmail || fromEmail}`;
  return plainText;
};

router.get("/credits", async (req, res) => {
  try {
    console.log("📊 Fetching accumulated credits for user:", req.user.id);

    const payments = await prisma.payment.findMany({
      where: { userId: req.user.id, status: "succeeded" },
      select: { emailSendCredits: true, emailVerificationCredits: true },
    });

    const totalEmailSendCredits = payments.reduce((sum, p) => sum + (p.emailSendCredits || 0), 0);
    const totalEmailVerificationCredits = payments.reduce((sum, p) => sum + (p.emailVerificationCredits || 0), 0);

    // ✅ Return only what’s purchased
    const emailSendCredits = totalEmailSendCredits;
    const emailVerificationCredits = totalEmailVerificationCredits;

    console.log("✅ Payment-based Credits:", { emailSendCredits, emailVerificationCredits });

    res.json({
      success: true,
      emailSendCredits,
      emailVerificationCredits,
      plan: "Based on payments",
    });
  } catch (error) {
    console.error("❌ Error fetching credits:", error);
    res.status(500).json({ success: false, error: "Failed to fetch credits" });
  }
});

router.post("/send", async (req, res) => {
  try {
    console.log("📨 /api/campaigns/send called by user:", req.user?.id);

    // ✅ STEP 0: Destructure FIRST before using any variables
    const {
      recipients,
      fromEmail,
      fromName,
      fromAddress,
      replyToEmail,
      subject,
      canvasData: _cd,
      canvasBackgroundColor: _bg,
      snapshotUrl,
      scheduleType = "immediate",
      scheduledDate,
      scheduledTime,
      timezone,
      recurringFrequency,
      recurringDays,
      recurringEndDate,
    } = req.body;

    // Merge background color as sentinel into canvasData
    const canvasData = _bg
      ? [{ id: '__bg__', type: '__canvas_bg__', color: _bg }, ...(_cd || [])]
      : (_cd || []);

    // 🧩 Basic validation
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: "No recipients specified" });
    }
    if (!fromEmail || !fromName) {
      return res.status(400).json({ error: "Missing sender fields (fromEmail/fromName)" });
    }
    if (!fromAddress) {
      return res.status(400).json({ error: "Sender address is required" });
    }

    const emailSubject = subject?.trim() || "Untitled Campaign";

    // ✅ Now safe to compute batch info (recipients is defined)
    const BATCH_SIZE    = 2000;
    const BATCH_DURATION_MS = 30 * 60 * 1000; // 30 minutes
    const totalBatches  = Math.ceil(recipients.length / BATCH_SIZE);
    const estimatedMinutes = totalBatches * (BATCH_DURATION_MS / 60000);

    // ==========================================================
    // 🧮 STEP 1: Credit Validation
    // ==========================================================
    const payments = await prisma.payment.findMany({
      where: { userId: req.user.id, status: "succeeded" },
      select: { id: true, emailSendCredits: true },
    });

    const totalPaymentCredits = payments.reduce((sum, p) => sum + (p.emailSendCredits || 0), 0);

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { emailLimit: true, plan: true },
    });

    const availableCredits = (user?.emailLimit ?? 0) + totalPaymentCredits;
    const requiredCredits  = recipients.length;

    console.log(`📊 Credits check - Available: ${availableCredits}, Required: ${requiredCredits}`);

    if (availableCredits < requiredCredits) {
      return res.status(403).json({
        error: `Insufficient credits. You need ${requiredCredits} credits but only have ${availableCredits}.`,
        available: availableCredits,
        required: requiredCredits,
        creditLimitReached: true,
      });
    }

    // ==========================================================
    // 🧠 STEP 2: SendGrid setup
    // ==========================================================
    if (!initCampaignMailer()) {
      return res.status(500).json({ error: "SendGrid API key not configured" });
    }

    // ==========================================================
    // 💾 STEP 3: Prepare Scheduled DateTime
    // ==========================================================
    let scheduledDateTime = null;

    if (scheduleType !== "immediate" && scheduledDate && scheduledTime) {
      scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
      const now = new Date();
      if (scheduledDateTime <= now) {
        return res.status(400).json({
          error: "Scheduled time must be in the future (at least 5 minutes from now)",
        });
      }
      console.log(`📅 Campaign scheduled for: ${scheduledDateTime.toISOString()}`);
    }

    // ==========================================================
    // 💾 STEP 4: Create Campaign Record (with batch fields)
    // ==========================================================
    const campaign = await prisma.campaign.create({
      data: {
        userId:            req.user.id,
        name:              emailSubject,
        subject:           emailSubject,
        fromEmail,
        fromName,
        replyToEmail,
        fromAddress,
        scheduleType,
        designJson:        JSON.stringify(canvasData || []),
        recipientsJson:    JSON.stringify(recipients),
        scheduledAt:       scheduledDateTime,
        recurringFrequency: scheduleType === "recurring" ? recurringFrequency : null,
        recurringDays:     scheduleType === "recurring" ? JSON.stringify(recurringDays || []) : null,
        recurringEndDate:  scheduleType === "recurring" && recurringEndDate ? new Date(recurringEndDate) : null,
        status:            scheduleType === "immediate" ? "sending" : "scheduled",
        totalBatches: totalBatches,
        currentBatch: 1,
      },
    });

    console.log(`✅ Campaign ${campaign.id} created | recipients: ${recipients.length} | batches: ${totalBatches} | scheduleType: ${scheduleType}`);

    // ==========================================================
    // 🕒 STEP 5: If scheduled or recurring → Save & return early
    // ==========================================================
    if (scheduleType === "scheduled" || scheduleType === "recurring") {
      await prisma.automationLog.create({
        data: {
          userId:       req.user.id,
          campaignId:   campaign.id,
          campaignName: emailSubject,
          status:       "scheduled",
          message:
            scheduleType === "scheduled"
              ? `Campaign scheduled for ${scheduledDateTime.toLocaleString()}`
              : `Recurring campaign created (${recurringFrequency})`,
        },
      });

      console.log(`✅ Campaign ${campaign.id} scheduled:`);
      console.log(`   📧 Subject: ${emailSubject}`);
      console.log(`   📅 Date: ${scheduledDate} ${scheduledTime}`);
      console.log(`   👥 Recipients: ${recipients.length}`);
      // console.log(`   🎨 Canvas Elements: ${canvasData?.length || 0}`);
      console.log(`   ⏰ Scheduled DateTime: ${scheduledDateTime.toISOString()}`);
      console.log(`   📍 Type: ${scheduleType}`);
      console.log(`   ✉️ From: ${fromName} <${fromEmail}>`);

      return res.status(200).json({
        success: true,
        message:
          scheduleType === "scheduled"
            ? `✅ Campaign scheduled for ${scheduledDate} at ${scheduledTime}.`
            : `✅ Recurring campaign created (${recurringFrequency}).`,
        campaignId:    campaign.id,
        scheduledAt:   scheduledDateTime,
        recipientCount: recipients.length,
        scheduleInfo: {
          date:     scheduledDate,
          time:     scheduledTime,
          timezone: timezone,
          type:     scheduleType,
        },
      });
    }

    // ==========================================================
    // 🚀 STEP 6: Immediate Send — build HTML once, batch in background
    // ==========================================================

    // Build email HTML content once — reused for every recipient in every batch
    let htmlContent;
    if (snapshotUrl) {
      const emailBg = _bg || '#ffffff';
      htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f0f0f0">
<tr><td align="center" style="padding:16px 8px;">
<table width="700" cellpadding="0" cellspacing="0" border="0" bgcolor="${emailBg}"
       style="max-width:700px;width:100%;background:${emailBg};">
<tr><td style="padding:0;font-size:0;line-height:0;">
  <img src="${snapshotUrl}" alt="${subject}" width="600"
       style="display:block;width:100%;max-width:600px;height:auto;border:0;"/>
</td></tr>
<tr><td style="padding:14px 20px;background:#f8f9fa;border-top:1px solid #e0e0e0;text-align:center;font-size:12px;color:#888;">
<p style="margin:0 0 4px;">Sent by <strong>${fromName}</strong></p>
<p style="margin:4px 0;">${fromAddress || ''}</p>
<p style="margin:0;">Reply to: <a href="mailto:${replyToEmail || fromEmail}" style="color:#007bff;">${replyToEmail || fromEmail}</a></p>
</td></tr>
</table></td></tr></table>
</body></html>`;
    } else {
      htmlContent = generateHtmlFromCanvas(
        canvasData,
        subject,
        fromName,
        fromEmail,
        fromAddress,
        replyToEmail
      );
    }

    const plainTextContent = generatePlainTextFromCanvas(
      canvasData,
      subject,
      fromName,
      fromEmail,
      replyToEmail
    );

    // ── Respond immediately so client can navigate to Analytics ──
    // The batch engine runs fully in the background after this response.
    res.status(200).json({
      success:         true,
      message:         totalBatches > 1
        ? `🚀 Campaign started! ${recipients.length.toLocaleString()} emails split into ${totalBatches} batch(es) of ${BATCH_SIZE.toLocaleString()}. Estimated ~${estimatedMinutes} min total.`
        : `🚀 Campaign started! Sending ${recipients.length.toLocaleString()} emails now…`,
      campaignId:      campaign.id,
      recipientCount:  recipients.length,
      batchTotal:      totalBatches,
      batchSize:       BATCH_SIZE,
      estimatedMinutes,
    });

    // ── Message factory — called per recipient inside the batch engine ──
    const buildMessage = (toEmail) => ({
      to:        toEmail,
      from:      { name: fromName, email: fromEmail },
      replyTo:   replyToEmail || fromEmail,
      subject:   emailSubject,
      text:      plainTextContent,
      html:      htmlContent,
      trackingSettings: {
        clickTracking:        { enable: true, enableText: false },
        openTracking:         { enable: true, substitutionTag: '%open-track%' },
        subscriptionTracking: { enable: false },
      },
      mailSettings: {
        bypassListManagement: { enable: false },
      },
      customArgs:  { campaignId: campaign.id.toString() },
      categories:  [`campaign_${campaign.id}`],
    });

    // ── Launch batch engine in background (non-blocking) ────────
    _sendInBatches(campaign, buildMessage)
      .then(async () => {
        // =======================================================
        // 💰 STEP 7: Deduct credits once ALL batches complete
        // =======================================================
        console.log("💰 Deducting credits after all batches complete...");

        const finalCampaign = await prisma.campaign.findUnique({
          where:  { id: campaign.id },
          select: { sentCount: true },
        });
        let remainingToDeduct = finalCampaign?.sentCount || 0;

        // 1️⃣ Deduct from payments first (FIFO)
        const succeededPayments = await prisma.payment.findMany({
          where:   { userId: req.user.id, status: "succeeded" },
          orderBy: { paymentDate: "asc" },
          select:  { id: true, emailSendCredits: true },
        });

        for (const p of succeededPayments) {
          if (remainingToDeduct <= 0) break;
          const current   = p.emailSendCredits || 0;
          const deduct    = Math.min(current, remainingToDeduct);
          const newCredit = Math.max(0, current - deduct);

          await prisma.payment.update({
            where: { id: p.id },
            data:  { emailSendCredits: newCredit },
          });

          remainingToDeduct -= deduct;
          console.log(`🧾 Deducted ${deduct} from payment ${p.id}, remaining: ${remainingToDeduct}`);
        }

        // 2️⃣ Deduct any remainder from user.emailLimit
        const currentUser = await prisma.user.findUnique({
          where:  { id: req.user.id },
          select: { emailLimit: true },
        });
        const finalUserEmailLimit = Math.max(0, (currentUser?.emailLimit ?? 0) - remainingToDeduct);

        await prisma.user.update({
          where: { id: req.user.id },
          data:  { emailLimit: finalUserEmailLimit },
        });

        console.log(`✅ Credits updated — user.emailLimit now ${finalUserEmailLimit}`);

        // 3️⃣ Log completion
        await prisma.automationLog.create({
          data: {
            userId:       req.user.id,
            campaignId:   campaign.id,
            campaignName: emailSubject,
            status:       "completed",
            message:      `Batched campaign complete: ${finalCampaign?.sentCount || 0} sent across ${totalBatches} batch(es)`,
            error:        null,
          },
        });
      })
      .catch((err) => {
        console.error(`❌ Batch engine error for campaign ${campaign.id}:`, err.message);
        // Mark failed in DB so resumeStuckCampaigns can skip it
        prisma.campaign.update({
          where: { id: campaign.id },
          data:  { status: "failed" },
        }).catch(() => {});
      });

  } catch (err) {
    console.error("❌ Campaign send error:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Failed to process campaign",
    });
  }
});


// router.get("/", async (req, res) => {
//   try {
//     const campaigns = await prisma.campaign.findMany({
//       where: { userId: req.user.id },
//       include: { events: true },
//       orderBy: { createdAt: "desc" },
//     });
//     res.json(campaigns);
//   } catch {
//     res.status(500).json({ error: "Failed to fetch campaigns" });
//   }
// });

router.get("/", async (req, res) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { userId: req.user.id },
      select: {
        id: true,
        name: true,
        subject: true,
        status: true,
        sentCount: true,
        pending: true,
        currentBatch: true,
        totalBatches: true,
        createdAt: true,
        fromEmail: true,
        fromName: true,
        fromAddress: true,
        replyToEmail: true,
        scheduleType: true,
        scheduledAt: true,
        // ❌ NO recipientsJson
        // ❌ NO designJson
        // ❌ NO snapshotUrl
        // ❌ NO events  ← REMOVE THIS TOO
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(campaigns);
  } catch {
    res.status(500).json({ error: "Failed to fetch campaigns" });
  }
});
router.get("/:id", async (req, res) => {
  try {
    const campaign = await prisma.campaign.findFirst({
      where: { id: parseInt(req.params.id), userId: req.user.id },
      include: { events: true },
    });
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });
    res.json(campaign);
  } catch {
    res.status(500).json({ error: "Failed to fetch campaign" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const campaign = await prisma.campaign.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });
    await prisma.campaign.delete({ where: { id } });
    res.json({ message: "Campaign deleted successfully" });
  } catch {
    res.status(500).json({ error: "Failed to delete campaign" });
  }
});

router.post("/verify-email", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        verified: false,
        error: 'Email address is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        verified: false,
        error: 'Invalid email format'
      });
    }

    console.log(`🔍 Checking verification status for: ${email}`);

    // Check SendGrid verified senders using fetch
    const response = await fetch('https://api.sendgrid.com/v3/verified_senders', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getCampaignApiKey()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ SendGrid API error:', response.status);
      return res.status(500).json({
        verified: false,
        error: 'Failed to check verification status with SendGrid'
      });
    }

    const data = await response.json();

    // Check if email exists in verified senders list
    const isVerified = data.results?.some(
      sender => sender.from_email?.toLowerCase() === email.toLowerCase() &&
        sender.verified === true
    );

    console.log(`${isVerified ? '✅' : '❌'} Email ${email} verification status: ${isVerified}`);

    return res.json({
      verified: isVerified,
      email: email,
      message: isVerified
        ? 'Email is verified and ready to send campaigns'
        : 'Email is not verified in SendGrid. Please verify it first.'
    });

  } catch (error) {
    console.error('❌ Error verifying email:', error);
    return res.status(500).json({
      verified: false,
      error: 'Internal server error while checking verification'
    });
  }
});

router.post("/send-shuffled", async (req, res) => {
  try {
    console.log("🔀 /api/campaigns/send-shuffled called by user:", req.user?.id);
    console.log("📦 Request body:", JSON.stringify(req.body, null, 2));

    const {
      fromEmail,
      fromName,
      fromAddress,
      canvasData: _cdS,
      canvasBackgroundColor: _bgS,
      distribution, // Array of { subject, emails, count }
      scheduleType = "immediate",
      scheduledDate,
      scheduledTime,
      timezone
    } = req.body;

    const canvasData = _bgS
      ? [{ id: '__bg__', type: '__canvas_bg__', color: _bgS }, ...(_cdS || [])]
      : (_cdS || []);

    // Validation with detailed error messages
    if (!fromEmail) {
      console.error("❌ Missing fromEmail");
      return res.status(400).json({ error: "Missing fromEmail field" });
    }
    if (!fromName) {
      console.error("❌ Missing fromName");
      return res.status(400).json({ error: "Missing fromName field" });
    }
    if (!Array.isArray(distribution)) {
      console.error("❌ distribution is not an array:", typeof distribution);
      return res.status(400).json({ error: "Distribution must be an array" });
    }
    if (distribution.length === 0) {
      console.error("❌ distribution array is empty");
      return res.status(400).json({ error: "No distribution data provided" });
    }

    // Validate distribution structure
    for (let i = 0; i < distribution.length; i++) {
      const item = distribution[i];
      if (!item.subject) {
        console.error(`❌ Distribution item ${i} missing subject`);
        return res.status(400).json({ error: `Distribution item ${i} missing subject` });
      }
      if (!Array.isArray(item.emails)) {
        console.error(`❌ Distribution item ${i} emails is not an array`);
        return res.status(400).json({ error: `Distribution item ${i} emails must be an array` });
      }
      if (item.emails.length === 0) {
        console.error(`❌ Distribution item ${i} has no emails`);
        return res.status(400).json({ error: `Distribution item ${i} has no emails` });
      }
    }

    // Calculate total recipients
    const totalRecipients = distribution.reduce((sum, item) => sum + item.emails.length, 0);

    console.log(`📊 Shuffled campaign - ${distribution.length} subjects, ${totalRecipients} total recipients, scheduleType: ${scheduleType}`);

    // ==========================================================
    // 💰 STEP 1: Credit Validation
    // ==========================================================
    const payments = await prisma.payment.findMany({
      where: { userId: req.user.id, status: "succeeded" },
      select: { id: true, emailSendCredits: true },
    });

    const totalPaymentCredits = payments.reduce((sum, p) => sum + (p.emailSendCredits || 0), 0);

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { emailLimit: true, plan: true },
    });

    const availableCredits = (user?.emailLimit ?? 0) + totalPaymentCredits;
    const requiredCredits = totalRecipients;

    console.log(`💳 Credits check - Available: ${availableCredits}, Required: ${requiredCredits}`);

    if (availableCredits < requiredCredits) {
      return res.status(403).json({
        error: `Insufficient credits. You need ${requiredCredits} credits but only have ${availableCredits}.`,
        available: availableCredits,
        required: requiredCredits,
        creditLimitReached: true,
      });
    }

    // ==========================================================
    // 📧 STEP 2: SendGrid setup
    // ==========================================================
    if (!initCampaignMailer()) {
      return res.status(500).json({ error: "SendGrid API key not configured" });
    }

    // ==========================================================
    // 💾 STEP 3: Prepare Scheduled DateTime
    // ==========================================================
    let scheduledDateTime = null;

    if (scheduleType === "scheduled" && scheduledDate && scheduledTime) {
      scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
      const now = new Date();
      if (scheduledDateTime <= now) {
        return res.status(400).json({
          error: "Scheduled time must be in the future (at least 5 minutes from now)",
        });
      }
      console.log(`📅 Shuffled campaign scheduled for: ${scheduledDateTime.toISOString()}`);
    }

    // ==========================================================
    // 💾 STEP 4: Create Campaign Records for Each Subject Line
    // ==========================================================
    const campaignIds = [];

    for (const item of distribution) {
      const campaign = await prisma.campaign.create({
        data: {
          userId: req.user.id,
          name: `${item.subject} (Shuffled Campaign)`,
          subject: item.subject,
          fromEmail,
          fromName,
          fromAddress,
          scheduleType,
          designJson: JSON.stringify(canvasData || []),
          recipientsJson: JSON.stringify(item.emails),
          scheduledAt: scheduledDateTime,
          status: scheduleType === "immediate" ? "sending" : "scheduled",
          totalBatches:      totalBatches,           // ✅
          currentBatch:      1,                      // ✅ start at 1, not 0
          pending:           recipients.length,      // ✅ all emails pending at start
          snapshotUrl:       snapshotUrl || null,     // ✅ save snapshot URL to DB
        },
      });
      campaignIds.push(campaign.id);
      console.log(`✅ Campaign ${campaign.id} created for subject: "${item.subject}"`);
    }

    // ==========================================================
    // 🕒 STEP 5: If scheduled → Save only and return
    // ==========================================================
    if (scheduleType === "scheduled") {
      // Create automation logs for each campaign
      for (let i = 0; i < campaignIds.length; i++) {
        await prisma.automationLog.create({
          data: {
            userId: req.user.id,
            campaignId: campaignIds[i],
            campaignName: distribution[i].subject,
            status: "scheduled",
            message: `Shuffled campaign scheduled for ${scheduledDateTime.toLocaleString()} - ${distribution[i].emails.length} recipients`,
          },
        });
      }

      return res.status(200).json({
        success: true,
        message: `✅ Shuffled campaign scheduled for ${scheduledDate} at ${scheduledTime}. ${totalRecipients} emails will be sent across ${distribution.length} subject lines.`,
        campaignIds,
        scheduledAt: scheduledDateTime,
        distribution: distribution.map(d => ({
          subject: d.subject,
          count: d.count
        }))
      });
    }

    // ==========================================================
    // 🚀 STEP 6: Immediate Send
    // ==========================================================
    const results = { success: [], failed: [] };
    const distributionResults = [];
    let actualSentCount = 0;

    for (let i = 0; i < distribution.length; i++) {
      const item = distribution[i];
      const { subject, emails } = item;
      const campaignId = campaignIds[i];
      let sentForSubject = 0;
      let failedForSubject = 0;

      console.log(`📤 Sending with subject: "${subject}" to ${emails.length} recipients`);

      const htmlContent = generateHtmlFromCanvas(canvasData, subject, fromName, fromEmail, fromAddress);
      const plainTextContent = generatePlainTextFromCanvas(canvasData, subject, fromName, fromEmail);

      for (const email of emails) {
        if (actualSentCount >= availableCredits) {
          results.failed.push({ email, subject, error: "Credit limit reached" });
          failedForSubject++;
          break;
        }

        const msg = {
          to: email,
          from: { name: fromName, email: fromEmail },
          replyTo: replyToEmail || fromEmail,
          subject: subject,
          text: plainTextContent,
          html: htmlContent,

          // ✅ Campaign identification
          customArgs: {
            campaignId: String(campaignId), // Convert to string
          },

          // ✅ Categories for easier tracking
          categories: [`campaign_${campaignId}`],

          // ✅✅✅ CRITICAL: Enable tracking
          trackingSettings: {
            clickTracking: {
              enable: true,
              enableText: false,
            },
            openTracking: {
              enable: true,
              substitutionTag: '%open-track%',
            },
            subscriptionTracking: {
              enable: false,
            },
          },

          // ✅ Better deliverability
          mailSettings: {
            bypassListManagement: {
              enable: false,
            },
          },
        };


        try {
          const response = await sendCampaignMail(msg);
          if (response[0].statusCode >= 200 && response[0].statusCode < 300) {
            results.success.push({ email, subject });
            actualSentCount++;
            sentForSubject++;
          } else {
            results.failed.push({ email, subject, error: `SendGrid status ${response[0].statusCode}` });
            failedForSubject++;
          }
        } catch (err) {
          const msgErr = err.response?.body?.errors?.[0]?.message || err.message || "Unknown error";
          console.error(`❌ Failed to send to ${email}:`, msgErr);
          results.failed.push({ email, subject, error: msgErr });
          failedForSubject++;
        }

        await new Promise((r) => setTimeout(r, 200)); // Rate limiting
      }

      // Update campaign status
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          sentCount: sentForSubject,
          status: failedForSubject === 0 ? "completed" : "failed",
        },
      });

      // Log for this subject
      await prisma.automationLog.create({
        data: {
          userId: req.user.id,
          campaignId: campaignId,
          campaignName: subject,
          status: failedForSubject === 0 ? "completed" : "failed",
          message: `Shuffled campaign sent: ${sentForSubject} success, ${failedForSubject} failed`,
          error: failedForSubject > 0 ? `${failedForSubject} emails failed` : null,
        },
      });

      distributionResults.push({
        subject,
        sent: sentForSubject,
        failed: failedForSubject,
        total: emails.length
      });
    }

if (scheduleType === "immediate") {

  let remainingToDeduct = actualSentCount;

  const succeededPayments = await prisma.payment.findMany({
    where: { userId: req.user.id, status: "succeeded" },
    select: { emailSendCredits: true },
  });

  const remainingPaymentCredits = succeededPayments.reduce(
    (sum, p) => sum + (p.emailSendCredits || 0),
    0
  );

  const finalUserEmailLimit = Math.max(
    0,
    (user.emailLimit ?? 0) - remainingToDeduct
  );

  await prisma.user.update({
    where: { id: req.user.id },
    data: { emailLimit: finalUserEmailLimit },
  });

  const totalRemainingCredits =
    remainingPaymentCredits + finalUserEmailLimit;

  return res.status(200).json({
    success: true,
    message: `Sent: ${results.success.length}, Failed: ${results.failed.length}`,
    results,
    distribution: distributionResults,
    creditsUsed: actualSentCount,
    creditsRemaining: totalRemainingCredits,
  });
}

// If scheduled
return res.status(200).json({
  success: true,
  message: "Shuffled campaign scheduled successfully",
  distribution: distributionResults,
});

    // Deduct remaining from user.emailLimit
    const finalUserEmailLimit = Math.max(0, (user.emailLimit ?? 0) - remainingToDeduct);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { emailLimit: finalUserEmailLimit },
    });

    console.log(`✅ Credits updated – user.emailLimit now ${finalUserEmailLimit}`);

    // Calculate total remaining credits
    const remainingPaymentCredits = succeededPayments.reduce((sum, p) => sum + (p.emailSendCredits || 0), 0);
    const totalRemainingCredits = remainingPaymentCredits + finalUserEmailLimit;

    // ==========================================================
    // 📤 STEP 8: Response
    // ==========================================================
    console.log(`✅ Shuffled campaign complete - Success: ${results.success.length}, Failed: ${results.failed.length}`);

    res.status(200).json({
      success: true,
      message: `Sent: ${results.success.length}, Failed: ${results.failed.length}`,
      results,
      distribution: distributionResults,
      creditsUsed: actualSentCount,
      creditsRemaining: totalRemainingCredits,
    });
  } catch (err) {
    console.error("❌ Shuffled campaign error:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Failed to process shuffled campaign",
    });
  }
});


router.get("/:id/batch-progress", async (req, res) => {
  try {
    const campaign = await prisma.campaign.findFirst({
      where:  { id: parseInt(req.params.id), userId: req.user.id },
      select: {
        id:            true,
        status:        true,
        sentCount:     true,
        pending:       true,     // ✅
        currentBatch:  true,
        totalBatches:  true,
        recipientsJson: true,
      },
    });
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });

    let totalRecipients = 0;
    try { totalRecipients = JSON.parse(campaign.recipientsJson || "[]").length; } catch {}

    const batchTotal      = campaign.totalBatches  || Math.ceil(totalRecipients / BATCH_SIZE);
    const batchCurrent    = campaign.currentBatch  || 1;
    const sentCount       = campaign.sentCount     || 0;
    const pendingCount    = campaign.pending       ?? (totalRecipients - sentCount);
    const batchesLeft     = Math.max(0, batchTotal - batchCurrent);

    res.json({
      success:                   true,
      status:                    campaign.status,
      sentCount,
      pendingCount,                                        // ✅
      totalRecipients,
      batchCurrent,
      batchTotal,
      batchSizeLimit:            BATCH_SIZE,
      batchDurationMin:          BATCH_DURATION_MS / 60000,
      estimatedMinutesRemaining: batchesLeft * (BATCH_DURATION_MS / 60000),
      percentComplete:           totalRecipients > 0
        ? Math.round((sentCount / totalRecipients) * 100)
        : 0,
    });
  } catch (err) {
    console.error("❌ batch-progress error:", err);
    res.status(500).json({ error: "Failed to fetch batch progress" });
  }
});

export { router };