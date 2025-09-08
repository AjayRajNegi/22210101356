import "dotenv/config";
import cors from "cors";
import crypto from "crypto";
import express from "express";
import geoip from "geoip-lite";
import { log, logMiddleware } from "./logger.js";

const app = express();
const PORT = process.env.PORT || 3001; // server running on the port 3001

app.use(express.json());
app.use(cors());
app.use(logMiddleware);

const shortUrls = new Map();

function generateCode(length = 6) {
  //generate codes with cryptos
  return crypto.randomBytes(length).toString("base64url").slice(0, length);
}

function normalizeUrl(url) {
  if (!/^https?:\/\//i.test(url)) {
    return `http://${url}`;
  }
  return url;
}

// shortURL route
app.post("/shorturls", (req, res) => {
  let { url, validity = 30, shortcode } = req.body;

  try {
    url = normalizeUrl(url);
    new URL(url);
  } catch {
    log("backend", "error", "handler", "Invalid URL");
    return res.status(400).json({ error: "Invalid URL" });
  }

  let code = shortcode || generateCode();
  while (shortUrls.has(code)) {
    code = generateCode();
  }

  const now = Date.now();
  const expiresAt = now + validity * 60 * 1000;

  shortUrls.set(code, {
    url,
    createdAt: now,
    expiresAt,
    clicks: [],
  });

  log("backend", "info", "controller", `Short URL created: ${code}`);

  res.status(201).json({
    shortcode: code,
    url,
    validity,
    expiresAt,
    shortUrl: `http://localhost:${PORT}/${code}`,
  });
});

//shortcode routes
app.get("/:shortcode", (req, res) => {
  const { shortcode } = req.params;
  const entry = shortUrls.get(shortcode);

  if (!entry) {
    log("backend", "warn", "handler", `Not found: ${shortcode}`);
    return res.status(404).json({ error: "Shortcode not found" });
  }

  if (Date.now() > entry.expiresAt) {
    shortUrls.delete(shortcode);
    log("backend", "warn", "handler", `Expired: ${shortcode}`);
    return res.status(410).json({ error: "Shortcode expired" });
  }

  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress ||
    "";
  const geo = geoip.lookup(ip.replace("::ffff:", ""));
  entry.clicks.push({
    timestamp: Date.now(),
    referrer: req.get("referer") || null,
    location: geo
      ? { country: geo.country, region: geo.region, city: geo.city }
      : null,
  });

  log("backend", "info", "handler", `Redirecting ${shortcode} -> ${entry.url}`);
  res.redirect(entry.url);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  log("backend", "info", "config", `Server started on port ${PORT}`);
});
