import express from "express";
import cors from "cors";
import crypto from "crypto";
import geoip from "geoip-lite";
import { log, logMiddleware } from "./logger.js";
import "dotenv/config";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(express.json());
app.use(cors());
app.use(logMiddleware);
const shortUrls = new Map();

function generateShortcode(length = 6) {
  return crypto.randomBytes(length).toString("base64url").slice(0, length);
}

app.post("/shorturls", (req, res) => {
  const { url, validity = 30, shortcode } = req.body;

  // Normalize URL to include scheme if omitted (e.g., localhost:3000)
  let normalizedUrl = url;
  if (
    typeof normalizedUrl === "string" &&
    !/^https?:\/\//i.test(normalizedUrl)
  ) {
    normalizedUrl = `http://${normalizedUrl}`;
  }

  try {
    new URL(normalizedUrl);
  } catch {
    log("backend", "error", "handler", "Invalid URL format received");
    return res.status(400).json({ error: "Invalid URL format" });
  }

  let code = shortcode || generateShortcode();

  while (shortUrls.has(code)) {
    code = generateShortcode();
  }

  const now = Date.now();
  const expiresAt = now + Number(validity) * 60 * 1000;
  shortUrls.set(code, {
    url: normalizedUrl,
    createdAt: now,
    expiresAt,
    clicks: [],
  });

  log("backend", "info", "controller", `Short URL created: ${code}`);

  return res.status(201).json({
    shortcode: code,
    url: normalizedUrl,
    validity,
    expiresAt,
    shortUrl: `http://localhost:${PORT}/${code}`,
  });
});

app.get("/:shortcode", (req, res) => {
  const { shortcode } = req.params;
  const entry = shortUrls.get(shortcode);

  if (!entry) {
    log("backend", "warn", "handler", `Shortcode not found: ${shortcode}`);
    return res.status(404).json({ error: "Shortcode not found" });
  }

  if (Date.now() > entry.expiresAt) {
    shortUrls.delete(shortcode);
    log("backend", "warn", "handler", `Shortcode expired: ${shortcode}`);
    return res.status(410).json({ error: "Shortcode expired" });
  }

  const referrer = req.get("referer") || null;
  const ip = (
    req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
    req.socket.remoteAddress ||
    ""
  ).replace("::ffff:", "");
  const geo = geoip.lookup(ip) || null;
  entry.clicks.push({
    timestamp: Date.now(),
    referrer,
    location: geo
      ? { country: geo.country, region: geo.region, city: geo.city }
      : null,
  });
  log("backend", "info", "handler", `Redirecting ${shortcode} -> ${entry.url}`);
  return res.redirect(entry.url);
});

// Stats route intentionally omitted for basic version

app.listen(PORT, () => {
  console.log(`🚀 Microservice running at http://localhost:${PORT}`);
  log("backend", "info", "config", `Server started on port ${PORT}`);
});
