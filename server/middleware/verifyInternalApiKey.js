// server/middleware/verifyInternalApiKey.js
//
// Guards internal, server-to-server-only routes (like the referral export
// endpoint Abacco Tech pulls from). This is NOT a replacement for real user
// auth — only ever expose read-only, non-sensitive fields behind it.
//
// Requires ABACCO_SYNC_API_KEY to be set in Bounce Cure's .env, and the same
// value to be set as BOUNCE_CURE_SYNC_API_KEY in Abacco Tech's .env.

export const verifyInternalApiKey = (req, res, next) => {
  const key = req.headers["x-internal-api-key"];

  if (!process.env.ABACCO_SYNC_API_KEY) {
    console.error("❌ ABACCO_SYNC_API_KEY is not set — refusing all internal requests");
    return res.status(500).json({ message: "Server misconfigured" });
  }

  if (!key || key !== process.env.ABACCO_SYNC_API_KEY) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  next();
};