// server/scripts/checkSendgridIp.js
// Diagnose "no IPs are available for this account".
// Run from the server folder:   node scripts/checkSendgridIp.js
// Uses the same key as campaigns: SENDGRID_CAMPAIGN_API_KEY, else SENDGRID_API_KEY.
import dotenv from "dotenv";
dotenv.config();

const key = process.env.SENDGRID_CAMPAIGN_API_KEY || process.env.SENDGRID_API_KEY;
if (!key) {
  console.error("❌ No SENDGRID_CAMPAIGN_API_KEY / SENDGRID_API_KEY in .env");
  process.exit(1);
}
console.log(`🔑 Checking key ID: ${key.split(".")[1]}\n`);

async function sg(path) {
  const res = await fetch(`https://api.sendgrid.com/v3${path}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  let body;
  try { body = await res.json(); } catch { body = null; }
  return { status: res.status, body };
}

function show(title, r) {
  console.log(`── ${title} (HTTP ${r.status})`);
  console.log(JSON.stringify(r.body, null, 2));
  console.log();
}

const profile = await sg("/user/profile");
const account = await sg("/user/account");
const username = await sg("/user/username");
const ips = await sg("/ips");                 // all IPs on the account + which subusers they serve
const assigned = await sg("/ips/assigned");   // IPs ready for sending
const pools = await sg("/ips/pools");
const subusers = await sg("/subusers");
const warmup = await sg("/ips/warmup");

show("Username (who owns this key)", username);
show("Account type", account);
show("All IPs", ips);
show("Assigned IPs", assigned);
show("IP pools", pools);
show("Subusers", subusers);
show("IPs in warmup", warmup);

// ── Verdict ─────────────────────────────────────────────
console.log("================ VERDICT ================");
const user = username.body?.username;
const ipList = Array.isArray(ips.body) ? ips.body : [];
const assignedList = Array.isArray(assigned.body) ? assigned.body : [];

if (ips.status === 403 || assigned.status === 403) {
  console.log("⚠️  This key lacks 'IP Management' read permission, OR it is a SUBUSER key.");
  console.log("   → Give the key Full Access, or check Subuser Management in the parent account.");
} else if (ipList.length === 0) {
  console.log(`❌ The account "${user}" that owns this key has NO IPs at all.`);
  console.log("   → This key is from a different account/subuser than the one with 167.89.13.79.");
  console.log("   → Create a key in the account that shows the IP and put it in SENDGRID_CAMPAIGN_API_KEY.");
} else {
  for (const ip of ipList) {
    const isAssigned = assignedList.some((a) => a.ip === ip.ip);
    console.log(`IP ${ip.ip}: assigned=${isAssigned} warmup=${ip.warmup} pools=${JSON.stringify(ip.pools)} subusers=${JSON.stringify(ip.subusers)}`);
    if (!isAssigned) console.log("   ❌ Not assigned yet — SendGrid still provisioning it, contact SendGrid support.");
    if (ip.subusers?.length && !ip.subusers.includes(user)) {
      console.log(`   ❌ IP serves subusers ${ip.subusers.join(", ")} but NOT "${user}".`);
    }
  }
  if (process.env.SENDGRID_IP_POOL) {
    console.log(`ℹ️  SENDGRID_IP_POOL="${process.env.SENDGRID_IP_POOL}" is set — make sure that pool contains the IP, or remove the variable.`);
  }
}