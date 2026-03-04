// server/routes/campaigns.js
import express from "express";
import sgMail from "@sendgrid/mail";
import { prisma } from "../prisma/prismaClient.js";
import { protect } from "../middleware/authMiddleware.js";

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
  if (!process.env.SENDGRID_API_KEY) return;
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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
    const delayPerEmail = Math.floor(BATCH_DURATION_MS / batchCount);

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
        const response = await sgMail.send(msg);
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
      if ((i + 1) % 50 === 0) {
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: {
            sentCount: totalSent,
            pending:   totalRecipients - totalSent,  // ✅ keep pending in sync
          },
        });
        console.log(`   💾 batch ${batchNum} | ${i + 1}/${batchCount} | totalSent: ${totalSent} | pending: ${totalRecipients - totalSent}`);
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
const generateHtmlFromCanvas = (canvasData, subject, fromName, fromEmail, fromAddress, replyToEmail, bgColorOverride) => {

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
  /* The canvas editor uses 800px width.                           */
  /* The email content area is 560px (600px − 40px padding).      */
  const CW = 800;   // canvas width
  const EW = 560;   // email content width

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
  // Uses ratio of element center to canvas width (not hardcoded px).
  // When inside a card (inCard=true), ALWAYS trust the element's textAlign
  // because card children are positioned relative to the card, not the canvas,
  // so position-based detection wrongly centers left-aligned card text.
function align(el, inCard, forceLeft) {
  // 1️⃣ Inside a card: always trust the stored textAlign directly.
  if (inCard) return el.textAlign || 'left';

  // 2️⃣ forceLeft: companion column beside an image — skip position-based
  //    detection, but still respect whatever the user explicitly set.
  if (forceLeft) {
    if (el.textAlign === 'left' || el.textAlign === 'center' || el.textAlign === 'right')
      return el.textAlign;
    return 'left'; // default for companion columns with no explicit alignment
  }

  // 3️⃣ Trust explicit alignment set in the editor.
  if (el.textAlign === 'left' || el.textAlign === 'center' || el.textAlign === 'right')
    return el.textAlign;

  // 4️⃣ Fall back to position-based detection (only when textAlign is not set).
  const ratio = (el.x + el.width / 2) / CW;
  if (ratio < 0.30) return 'left';
  if (ratio > 0.70) return 'right';
  return 'center';
}

  /* ── ELEMENT RENDERERS ──────────────────────────────────────── */
  // Convert \n to <br/> so multi-line canvas text renders correctly in email clients
  const nl2br = (str) => (str || '').replace(/\n/g, '<br/>');

  function renderEl(el, inCard, forceLeft, colWidthPx) {
    const a = align(el, inCard, forceLeft);

    switch (el.type) {

      case 'heading':
        return `<h1 style="margin:4px 0;font-size:${el.fontSize || 28}px;color:${el.color || '#333'};font-weight:${el.fontWeight || '700'};font-family:${el.fontFamily || 'Arial,sans-serif'};text-align:${a};line-height:1.3;background:${el.backgroundColor || 'transparent'};">${nl2br(el.content) || 'Heading'}</h1>`;

      case 'subheading':
        return `<h2 style="margin:4px 0;font-size:${el.fontSize || 20}px;color:${el.color || '#333'};font-weight:${el.fontWeight || '600'};font-family:${el.fontFamily || 'Arial,sans-serif'};text-align:${a};background:${el.backgroundColor || 'transparent'};">${nl2br(el.content) || 'Subheading'}</h2>`;

      case 'paragraph':
        return `<p style="margin:5px 0;font-size:${el.fontSize || 15}px;color:${el.color || '#333'};font-family:${el.fontFamily || 'Arial,sans-serif'};font-weight:${el.fontWeight || 'normal'};font-style:${el.fontStyle || 'normal'};text-decoration:${el.textDecoration || 'none'};line-height:${el.lineHeight || 1.6};text-align:${a};word-break:break-word;background:${el.backgroundColor || 'transparent'};">${nl2br(el.content) || ''}</p>`;

      case 'blockquote':
        return `<div style="margin:8px 0;font-size:${el.fontSize || 15}px;color:${el.color || '#E8D8A0'};font-family:${el.fontFamily || 'Georgia,serif'};font-style:italic;border-left:4px solid ${el.borderColor || el.strokeColor || '#C9A84C'};padding:4px 0 4px 12px;text-align:${a};">${nl2br(el.content) || ''}</div>`;

      case 'image': {
        let src = el.src || '';
        if (!src || src.startsWith('blob:') || src.startsWith('data:')) src = 'https://via.placeholder.com/560x200?text=No+Image';
        if (!src.startsWith('http://') && !src.startsWith('https://')) src = `${process.env.API_BASE_URL}${src}`;
        const br = Number(el.borderRadius) || 0;
        const bdr = el.borderWidth ? `border:${el.borderWidth}px solid ${el.borderColor || '#ccc'};` : '';
        // inCard or forceLeft = image is inside a side-by-side column cell → fill column width
        // Wide standalone (>= 55% canvas width) → full email width
        // Small standalone → scale proportionally based on canvas size
        const isWide = inCard || forceLeft || (Number(el.width) || 0) / CW >= 0.55;
        const maxW = isWide ? '100%' : `${sc(el.width)}px`;
        // Preserve exact canvas height in side-by-side column.
        // colWidthPx = actual pixel width of this column in the email (passed from multi-col renderer)
        // Scale height = canvas_height * (colWidthPx / canvas_el_width)
        const elH = Number(el.height) || 0;
        const elW = Number(el.width) || 1;
        let scaledH = 0;
        if (forceLeft && elH > 0) {
          const refW = colWidthPx || Math.round((elW / CW) * EW);
          scaledH = Math.round(elH * (refW / elW));
        }
        const heightStyle = scaledH > 0
          ? `height:${scaledH}px;object-fit:cover;`
          : 'height:auto;';
        return `<div style="margin:0;font-size:0;line-height:0;"><img src="${src}" alt="${el.alt || ''}" width="100%" style="display:block;width:100%;max-width:${maxW};${heightStyle}border-radius:${br}px;${bdr}"/></div>`;
      }

      case 'button': {
        const ba = align(el, inCard);
        return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:10px 0;"><tr><td align="${ba}"><a href="${el.link || '#'}" style="display:inline-block;padding:${el.padding || '10px 22px'};background-color:${el.backgroundColor || '#C9A84C'};color:${el.color || '#000'};text-decoration:none;border-radius:${el.borderRadius || 6}px;font-weight:${el.fontWeight || '700'};font-size:${el.fontSize || 15}px;font-family:${el.fontFamily || 'Arial,sans-serif'};">${el.content || 'Click Me'}</a></td></tr></table>`;
      }

      case 'line':
        return `<div style="margin:8px 0;font-size:0;line-height:0;"><hr style="border:none;height:${el.strokeWidth || 2}px;background:${el.strokeColor || '#333'};margin:0;"/></div>`;

      case 'rectangle': {
        if (inCard) return ''; // card background already applied — skip
        const w = `${sc(el.width)}px`;
        return `<div style="width:${w};height:${sc(el.height) || 40}px;background:${el.backgroundColor || '#4ECDC4'};border-radius:${el.borderRadius || 4}px;${el.borderWidth ? `border:${el.borderWidth}px solid ${el.borderColor || '#000'};` : ''}display:block;margin:4px 0;"></div>`;
      }

      case 'circle': {
        const sz = Math.min(sc(el.width) || 36, sc(el.height) || 36);
        return `<div style="display:inline-block;width:${sz}px;height:${sz}px;background:${el.backgroundColor || '#FF6B6B'};border-radius:50%;${el.borderWidth ? `border:${el.borderWidth}px solid ${el.borderColor || '#000'};` : ''}vertical-align:middle;"></div>`;
      }

      case 'star': {
        const sz = Math.max(sc(el.width) || 24, 14);
        const clr = el.backgroundColor || el.color || '#FFD700';
        return `<span style="display:inline-block;font-size:${sz}px;line-height:1;color:${clr};vertical-align:middle;">&#9733;</span>`;
      }

      case 'triangle': {
        const w = sc(el.width) || 28, h = sc(el.height) || 28;
        return `<div style="display:inline-block;width:0;height:0;border-left:${Math.round(w / 2)}px solid transparent;border-right:${Math.round(w / 2)}px solid transparent;border-bottom:${h}px solid ${el.backgroundColor || '#FF9F43'};vertical-align:middle;"></div>`;
      }

      case 'emoji-icon': {
        const emoji = el.emoji || '⭐';
        const sz = Math.min(sc(el.width) || 32, sc(el.height) || 32, 48);
        const fSize = el.fontSize || Math.round(sz * 0.75);
        return `<div style="display:inline-block;width:${sz}px;height:${sz}px;line-height:${sz}px;text-align:center;font-size:${fSize}px;vertical-align:middle;">${emoji}</div>`;
      }

      case 'social': {
        const sz = Math.min(sc(el.width) || 30, sc(el.height) || 30, 40);
        return `<a href="${el.link || '#'}" target="_blank" style="display:inline-block;vertical-align:middle;margin:0 3px;"><img src="${el.src || ''}" width="${sz}" height="${sz}" alt="${el.platform || ''}" style="display:inline-block;border:0;border-radius:6px;width:${sz}px;height:${sz}px;"/></a>`;
      }

      default: return '';
    }
  }

  /* ── CARD DETECTION ─────────────────────────────────────────── */
  // A "card" is a rectangle that contains other elements.
  // Any element whose CENTER falls within a rectangle's bounds
  // is treated as a child of that rectangle.
  function centerIn(el, r) {
    // Primary: element center is inside the rect
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;
    if (cx >= r.x && cx <= r.x + r.width && cy >= r.y && cy <= r.y + r.height) return true;
    // Fallback: element significantly overlaps the rect (>50% of element area)
    const ix = Math.max(0, Math.min(el.x + el.width, r.x + r.width) - Math.max(el.x, r.x));
    const iy = Math.max(0, Math.min(el.y + el.height, r.y + r.height) - Math.max(el.y, r.y));
    const overlap = ix * iy;
    const elArea = el.width * el.height;
    return elArea > 0 && overlap / elArea > 0.50;
  }

  // Deduplicate overlapping rects: skip transparent grid overlays sharing same bounds
  const allRects = els.filter(e => e.type === 'rectangle');
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

  const orphans = [];
  els.forEach(el => {
    if (el.type === 'rectangle') return;
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
    const bgC = bg.backgroundColor || '#1A1A1A';
    const rad = Number(bg.borderRadius) || 8;
    const bdr = bg.borderWidth ? `border:${bg.borderWidth}px solid ${bg.borderColor || '#444'};` : '';
    const sorted = [...kids].sort((a, b) => a.y - b.y);

    /* ── SIDE-BY-SIDE SPLIT DETECTION ──────────────────────────
       Detect split layout: image on RIGHT side of card (left-edge
       starts past 45% of card width) and not a full-bleed top image.
       ALL other children go to the left column.

       BULLET ROW LOGIC:
       Each feature bullet can be made of up to 3 elements at the same Y:
         - A circle (background shape)
         - A paragraph used as emoji/icon (small width, same x as circle)
         - A paragraph with the feature text (further right, e.g. x+62)
       We group all elements that share the same Y "row band" into bullet rows,
       render them as icon+text pairs, and never render anything twice.  */
    const cardRight2 = bg.x + bg.width;

    // ── Shared band builder ────────────────────────────────────────────────
    function buildBands(items) {
      const used = new Set();
      const bands = [];
      for (let i = 0; i < items.length; i++) {
        if (used.has(i)) continue;
        const el = items[i];
        const band = [{ idx: i, el }];
        used.add(i);
        let bTop = el.y, bBot = el.y + el.height;
        let changed = true;
        while (changed) {
          changed = false;
          for (let j = 0; j < items.length; j++) {
            if (used.has(j)) continue;
            const k = items[j];
            if (k.y < bBot + 10 && k.y + k.height > bTop - 10) {
              band.push({ idx: j, el: k }); used.add(j);
              bTop = Math.min(bTop, k.y); bBot = Math.max(bBot, k.y + k.height);
              changed = true;
            }
          }
        }
        bands.push(band);
      }
      return bands;
    }

    // ── Shared band renderer ───────────────────────────────────────────────
    function renderBands(bands) {
      let html = '';
      for (const band of bands) {
        const bandEls = band.map(b => b.el);
        const iconEls = bandEls.filter(e =>
          ['circle','emoji-icon','star'].includes(e.type) ||
          (e.type === 'paragraph' && e.width <= 50)
        );
        const textEls = bandEls.filter(e =>
          ['paragraph','heading','subheading'].includes(e.type) && e.width > 50
        );
        if (iconEls.length > 0 && textEls.length > 0) {
          const emojiEl  = iconEls.find(e => e.type === 'paragraph');
          const circleEl = iconEls.find(e => e.type === 'circle');
          const emojiIconEl = iconEls.find(e => e.type === 'emoji-icon');
          const starEl   = iconEls.find(e => e.type === 'star');

          let iconHtml = '';
          if (emojiEl && circleEl) {
            // Render emoji inside its circle badge — preserves the coloured badge + emoji
            const bgColor  = circleEl.backgroundColor || '#FFF8E0';
            const bdColor  = circleEl.borderColor || '#C9A84C';
            const bdWidth  = circleEl.borderWidth  || 2;
            const sz       = Math.min(sc(circleEl.width) || 28, 36);
            const emoji    = emojiEl.content || '';
            const fSize    = Math.round(sz * 0.55);
            iconHtml = `<div style="display:inline-block;width:${sz}px;height:${sz}px;line-height:${sz}px;text-align:center;background:${bgColor};border:${bdWidth}px solid ${bdColor};border-radius:50%;font-size:${fSize}px;vertical-align:middle;box-sizing:border-box;">${emoji}</div>`;
          } else if (emojiEl) {
            // Emoji without a circle — render it simply
            const emoji  = emojiEl.content || '';
            const fSize  = emojiEl.fontSize || 18;
            iconHtml = `<span style="display:inline-block;font-size:${fSize}px;line-height:1;vertical-align:middle;">${emoji}</span>`;
          } else if (emojiIconEl) {
            const eEmoji = emojiIconEl.emoji || '⭐';
            const eFSize = emojiIconEl.fontSize || 24;
            iconHtml = `<span style="display:inline-block;font-size:${eFSize}px;line-height:1;vertical-align:middle;">${eEmoji}</span>`;
          } else if (starEl) {
            iconHtml = renderEl(starEl, true);
          } else if (circleEl) {
            iconHtml = renderEl(circleEl, true);
          }

          const textHtml = textEls.sort((a,b) => a.y - b.y).map(e => renderEl(e, true)).join('');
          html += '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 10px 0;border-collapse:collapse;"><tr>'
            + '<td width="36" valign="middle" style="padding-right:10px;vertical-align:middle;">' + iconHtml + '</td>'
            + '<td valign="middle" style="vertical-align:middle;">' + textHtml + '</td>'
            + '</tr></table>';
        } else {
          const nonCircle = bandEls.filter(e => !['circle','star'].includes(e.type));
          (nonCircle.length > 0 ? nonCircle : []).forEach(e => { html += renderEl(e, true); });
        }
      }
      return html;
    }

    // Image RIGHT: left-edge >= 45% of card width (all coords relative to card)
    const sideImg = sorted.find(k =>
      k.type === 'image' &&
      (k.x - bg.x) >= bg.width * 0.45 &&
      (k.y - bg.y) >= 15
    );

    // Image LEFT: starts in left 25% of card, right-edge within left 60% of card
    const sideImgLeft = !sideImg && sorted.find(k =>
      k.type === 'image' &&
      (k.x - bg.x) >= 0 &&
      (k.x - bg.x) < bg.width * 0.25 &&
      (k.x + k.width - bg.x) <= bg.width * 0.60 &&
      (k.y - bg.y) >= 15
    );

    if (sideImgLeft) {
      /* ── IMAGE LEFT, TEXT RIGHT ── */
      let src = sideImgLeft.src || '';
      if (!src || src.startsWith('blob:') || src.startsWith('data:')) src = 'https://via.placeholder.com/260x220?text=Image';
      if (!src.startsWith('http://') && !src.startsWith('https://')) src = `${process.env.API_BASE_URL}${src}`;

      const rightSorted = sorted.filter(k => k !== sideImgLeft).sort((a, b) => a.y - b.y);
      const rightHtml = renderBands(buildBands(rightSorted));
      const imgColPct = Math.round(((sideImgLeft.x + sideImgLeft.width - bg.x) / bg.width) * 100);
      const textColPct = 100 - imgColPct;
      // Use the card's actual height for the image (not just the image element height)
      // so both columns fill the full card
      const imgHeightPx = Math.round((bg.height / bg.height) * (sc(bg.height) || 220));

      return '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:' + bgC + ';border-radius:' + rad + 'px;' + bdr + 'overflow:hidden;border-collapse:collapse;">'
        + '<tr>'
        + '<td width="' + imgColPct + '%" valign="middle" style="padding:0;vertical-align:middle;font-size:0;line-height:0;">'
        + '<img src="' + src + '" alt="" width="100%" style="display:block;width:100%;height:auto;min-height:' + Math.round(sc(sideImgLeft.height)) + 'px;object-fit:cover;border-radius:' + rad + 'px 0 0 ' + rad + 'px;"/>'
        + '</td>'
        + '<td width="' + textColPct + '%" valign="top" style="padding:16px 16px 16px 14px;vertical-align:top;">' + rightHtml + '</td>'
        + '</tr>'
        + '</table>';
    }

    if (sideImg) {
      /* ── TEXT LEFT, IMAGE RIGHT ── */
      let src = sideImg.src || '';
      if (!src || src.startsWith('blob:') || src.startsWith('data:')) src = 'https://via.placeholder.com/260x220?text=Image';
      if (!src.startsWith('http://') && !src.startsWith('https://')) src = `${process.env.API_BASE_URL}${src}`;

      const leftSorted = sorted.filter(k => k !== sideImg).sort((a, b) => a.y - b.y);
      const leftHtml = renderBands(buildBands(leftSorted));
      const imgColPct = Math.round(((cardRight2 - sideImg.x) / bg.width) * 100);
      const textColPct = 100 - imgColPct;
      const imgHeightPx = Math.round((sideImg.height / bg.height) * 220);

      return '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:' + bgC + ';border-radius:' + rad + 'px;' + bdr + 'overflow:hidden;border-collapse:collapse;">'
        + '<tr>'
        + '<td width="' + textColPct + '%" valign="top" style="padding:16px 14px 16px 16px;vertical-align:top;">' + leftHtml + '</td>'
        + '<td width="' + imgColPct + '%" valign="middle" style="padding:0;vertical-align:middle;font-size:0;line-height:0;">'
        + '<img src="' + src + '" alt="" width="100%" style="display:block;width:100%;height:' + imgHeightPx + 'px;max-height:' + imgHeightPx + 'px;object-fit:cover;border-radius:0 ' + rad + 'px ' + rad + 'px 0;"/>'
        + '</td>'
        + '</tr>'
        + '</table>';
    }

        /* ── ORIGINAL STACKED LAYOUT (unchanged for other card types) ── */

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
      rows += `<tr><td style="padding:12px 16px 4px;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td width="44" valign="middle" style="padding-right:8px;">${renderEl(iconEl, true)}</td><td valign="middle">${renderEl(headEl, true)}</td></tr></table></td></tr>`;
    }

    // Body content — sort by Y, render each element in its own <tr> with gap spacing
    if (rest.length > 0) {
      const restSorted = [...rest].sort((a, b) => a.y - b.y);
      const topPad = (topImg || iconEl) ? '6' : '16';
      restSorted.forEach((k, idx) => {
        // Calculate Y-gap from previous element to preserve canvas spacing
        let gapPx = 0;
        if (idx > 0) {
          const prev = restSorted[idx - 1];
          const canvasGap = Math.max(0, k.y - (prev.y + prev.height));
          gapPx = Math.round(canvasGap * (EW / CW));
        }
        const padTop = idx === 0 ? topPad : (gapPx > 2 ? gapPx : 4);
        const padBot = idx === restSorted.length - 1 ? '16' : '0';
        rows += `<tr><td style="padding:${padTop}px 16px ${padBot}px;">${renderEl(k, true)}</td></tr>`;
      });
    }

    return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${bgC};border-radius:${rad}px;${bdr}overflow:hidden;">${rows}</table>`;
  }

  /* ── BUILD LAYOUT UNITS ─────────────────────────────────────── */
  // Each "unit" = one rendered block with its canvas x/y/width
  // so we can position it correctly in the email layout.
  const units = [];

  cardMap.forEach(({ bg, kids }) => {
    units.push({
      x: bg.x, y: bg.y, cw: bg.width, ch: bg.height, elType: 'card', origId: bg.id,
      html: kids.length > 0 ? renderCard(bg, kids) : renderEl(bg, false),
    });
  });

  orphans.forEach(el => {
    units.push({ x: el.x, y: el.y, cw: el.width, ch: el.height, elType: el.type, origId: el.id, _el: el, html: renderEl(el, false) });
  });

  // ── PRE-MERGE: Fix image + stacked-text side-by-side layout ────────────────
  // Problem: image (left) + two paragraphs (right, stacked vertically).
  // groupRows correctly groups Para1 with the image (Y overlap), but Para2
  // also Y-overlaps the image yet X-overlaps Para1 → gets rejected into its
  // own new row → renders full-width below the image.
  //
  // Fix: for each image unit, find ALL non-image units whose X range does NOT
  // overlap the image AND whose Y range overlaps the image. Merge those
  // companion units into one combined "column unit" so groupRows sees only
  // 2 units (image + merged column) and places them side-by-side.
  (function mergeImageCompanions() {
    const imgUnits  = units.filter(u => u.elType === 'image');
    const nonImgIds = new Set(units.filter(u => u.elType !== 'image').map(u => u.origId));

    imgUnits.forEach(img => {
      const imgTop = img.y, imgBot = img.y + img.ch;
      const imgL   = img.x, imgR   = img.x + img.cw;

      // Find companion units: Y overlaps image, X does NOT overlap image
      const companions = units.filter(u =>
        u.origId !== img.origId &&
        u.elType !== 'image' &&
        // Y overlap with image
        u.y < imgBot && (u.y + u.ch) > imgTop &&
        // X does NOT overlap image (they are side-by-side)
        (u.x + u.cw <= imgL || u.x >= imgR)
      );

      if (companions.length < 1) return; // nothing to fix

      // Group companions by which X side they're on (left or right of image)
      const leftComps  = companions.filter(u => u.x + u.cw <= imgL);
      const rightComps = companions.filter(u => u.x >= imgR);

      [leftComps, rightComps].forEach(group => {
        if (group.length === 0) return;

        // Remove individual units from the units array
        group.forEach(u => {
          const idx = units.indexOf(u);
          if (idx !== -1) units.splice(idx, 1);
        });

        if (group.length === 1) {
          // Single companion — just re-render with forceLeft to fix alignment
          const u = group[0];
          units.push({
            ...u,
            html: u._el ? renderEl(u._el, false, true) : u.html,
          });
          return;
        }

        // Merge into one tall column unit, re-rendering each el with forceLeft=true
        // so text on the right side of canvas doesn't get wrongly right-aligned
        const sorted = [...group].sort((a, b) => a.y - b.y);
        const minY  = sorted[0].y;
        const maxBot2 = Math.max(...sorted.map(u => u.y + u.ch));
        const minX  = Math.min(...sorted.map(u => u.x));
        const maxR  = Math.max(...sorted.map(u => u.x + u.cw));
        units.push({
          x: minX, y: minY,
          cw: maxR - minX, ch: maxBot2 - minY,
          elType: sorted[0].elType,
          origId: sorted[0].origId,
          // Preserve the canvas Y-gap between stacked companion elements as margin-top.
          // Scale: gap_px * (EW / CW) converts canvas pixels → email pixels.
          html: sorted.map((u, idx) => {
            const baseHtml = u._el ? renderEl(u._el, false, true) : u.html;
            if (idx === 0) return baseHtml;
            const prevBot = sorted[idx - 1].y + sorted[idx - 1].ch;
            const gapPx   = Math.max(0, u.y - prevBot);
            const emailGap = Math.round(gapPx * (EW / CW));
            if (emailGap <= 2) return baseHtml;
            return `<div style="margin-top:${emailGap}px;">${baseHtml}</div>`;
          }).join(''),
        });
      });
    });
  })();

  // Sort: top-to-bottom, left-to-right
  units.sort((a, b) => a.y !== b.y ? a.y - b.y : a.x - b.x);

  /* ── ROW GROUPING ───────────────────────────────────────────── */
  // Two units belong to the same "row" (side-by-side columns) if their
  // Y ranges OVERLAP — i.e. they are visually beside each other on the canvas.
  // This correctly handles elements of different heights placed side-by-side.
  function groupRows(units) {
    // Attach height to each unit (use ch property if set, else fall back to elType defaults)
    const withH = units.map(u => ({ ...u, ch: u.ch || 40 }));

    const rows = [];
    withH.forEach(u => {
      const uTop = u.y;
      const uBot = u.y + u.ch;
      let placed = false;

      for (const row of rows) {
        // Compute the vertical span already occupied by this row
        const rowTop = Math.min(...row.map(r => r.y));
        const rowBot = Math.max(...row.map(r => r.y + r.ch));

        // Does u overlap the row's vertical range?
        const yOverlap = uTop < rowBot && uBot > rowTop;
        if (!yOverlap) continue;

        // Only group if X ranges do NOT overlap (they must be side-by-side)
        const xOverlap = row.some(r => !(u.x + u.cw <= r.x || u.x >= r.x + r.cw));
        if (xOverlap) continue;

        row.push(u); placed = true; break;
      }
      if (!placed) rows.push([u]);
    });

    // Sort each row left-to-right, then rows top-to-bottom
    rows.forEach(r => r.sort((a, b) => a.x - b.x));
    rows.sort((a, b) => Math.min(...a.map(r => r.y)) - Math.min(...b.map(r => r.y)));
    return rows;
  }

  const rows = groupRows(units);

  /* ── HTML OUTPUT ────────────────────────────────────────────── */
  let html = `<!DOCTYPE html>
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
<tr><td style="padding:20px;">
`;

  rows.forEach(row => {

    if (row.length === 1) {
      // Single unit: respect its canvas width proportion
      const u = row[0];
      const pct = u.cw / CW;                     // fraction of canvas width
      // Text-type elements should always fill 100% to preserve readability
      const isTextEl = ['heading','subheading','paragraph','blockquote','button'].includes(u.elType);
      const colW = (pct >= 0.50 || isTextEl) ? '100%' : `${sc(u.cw)}px`;
      const cx = (u.x + u.cw / 2) / CW;
      // Cards and wide elements always use 'left' on the outer wrapper —
      // the card itself controls internal text alignment via renderCard/renderEl.
      // Only small standalone elements (images, shapes) use position-based alignment.
      const tdA = (u.elType === 'card' || colW === '100%') ? 'left'
        : cx < 0.30 ? 'left' : cx > 0.70 ? 'right' : 'center';

      html += `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">
<tr><td align="${tdA}">
<table width="${colW}" cellpadding="0" cellspacing="0" border="0">
<tr><td>${u.html}</td></tr>
</table></td></tr></table>\n`;

    } else {
      // Multiple units side-by-side
      // Recalculate column widths so they sum to 100% and match canvas proportions.
      // Re-render image units with forceLeft=true so they fill their column cell.
      const totalCW = row.reduce((s, u) => s + u.cw, 0);
      // Normalise widths to sum to 100
      const pcts = row.map(u => Math.round((u.cw / totalCW) * 100));
      // Correct rounding drift on last column
      const drift = 100 - pcts.reduce((a, b) => a + b, 0);
      pcts[pcts.length - 1] += drift;

      html += `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">
<tr>\n`;
      // Find the tallest unit in the row (usually the image) to detect vertical alignment
      const rowH = Math.max(...row.map(u => u.ch));
      const rowTop = Math.min(...row.map(u => u.y));

      row.forEach((u, i) => {
        const pct = pcts[i];
        const pad = i < row.length - 1 ? 'padding-right:8px;' : '';
        // Re-render images with forceLeft so max-width:100% fills the column
        // Pass colWidthPx so image height scales correctly to column width
        const colWidthPx = Math.round((pct / 100) * EW);
        const cellHtml = (u.elType === 'image' && u._el)
          ? renderEl(u._el, false, true, colWidthPx)
          : u.html;
        // Detect vertical alignment: if this unit's Y center is in the middle 
        // 40% of the row height → middle-align; otherwise top-align
        const uCenterRatio = u.ch < rowH
          ? ((u.y - rowTop) + u.ch / 2) / rowH
          : 0;
        const va = (u.elType !== 'image' && uCenterRatio > 0.25 && uCenterRatio < 0.75)
          ? 'middle' : 'top';
        html += `<td width="${pct}%" valign="${va}" style="${pad}vertical-align:${va};">${cellHtml}</td>\n`;
      });
      html += `</tr></table>\n`;
    }
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
};

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
          plainText += `${el.content || ""}\n\n`;
          break;
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
    if (!process.env.SENDGRID_API_KEY) {
      return res.status(500).json({ error: "SendGrid API key not configured" });
    }
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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
      console.log(`   🎨 Canvas Elements: ${canvasData?.length || 0}`);
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


router.get("/", async (req, res) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { userId: req.user.id },
      include: { events: true },
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
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
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
    if (!process.env.SENDGRID_API_KEY) {
      return res.status(500).json({ error: "SendGrid API key not configured" });
    }
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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
          const response = await sgMail.send(msg);
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
    // ==========================================================
    // 💰 STEP 7: Deduct Credits (ONLY for immediate sends)
    // ==========================================================
    // if (scheduleType === "immediate") {
    //   console.log("💰 Deducting credits after shuffled campaign...");
    //   let remainingToDeduct = actualSentCount;

    //   // Deduct from payments first (FIFO)
    //   const succeededPayments = await prisma.payment.findMany({
    //     where: { userId: req.user.id, status: "succeeded" },
    //     orderBy: { paymentDate: "asc" },
    //     select: { id: true, emailSendCredits: true },
    //   });

    //   for (const p of succeededPayments) {
    //     if (remainingToDeduct <= 0) break;
    //     const current = p.emailSendCredits || 0;
    //     const deduct = Math.min(current, remainingToDeduct);
    //     const newCredit = Math.max(0, current - deduct);

    //     await prisma.payment.update({
    //       where: { id: p.id },
    //       data: { emailSendCredits: newCredit },
    //     });

    //     remainingToDeduct -= deduct;
    //     console.log(`💳 Deducted ${deduct} from payment ${p.id}, remaining: ${remainingToDeduct}`);
    //   }

    //   // Deduct remaining from user.emailLimit
    //   const finalUserEmailLimit = Math.max(0, (user.emailLimit ?? 0) - remainingToDeduct);

    //   await prisma.user.update({
    //     where: { id: req.user.id },
    //     data: { emailLimit: finalUserEmailLimit },
    //   });

    //   console.log(`✅ Credits updated – user.emailLimit now ${finalUserEmailLimit}`);

    //   // Calculate total remaining credits
    //   const updatedPayments = await prisma.payment.findMany({
    //     where: { userId: req.user.id, status: "succeeded" },
    //     select: { emailSendCredits: true },
    //   });
    //   const remainingPaymentCredits = updatedPayments.reduce((sum, p) => sum + (p.emailSendCredits || 0), 0);
    //   const totalRemainingCredits = remainingPaymentCredits + finalUserEmailLimit;

    //   // ==========================================================
    //   // 📤 STEP 8: Response for IMMEDIATE send
    //   // ==========================================================
    //   console.log(`✅ Shuffled campaign complete - Success: ${results.success.length}, Failed: ${results.failed.length}`);

    //   return res.status(200).json({
    //     success: true,
    //     message: `Sent: ${results.success.length}, Failed: ${results.failed.length}`,
    //     results,
    //     distribution: distributionResults,
    //     creditsUsed: actualSentCount,
    //     creditsRemaining: totalRemainingCredits,
    //   });
    // }
    // Only deduct credits if this was immediate send
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