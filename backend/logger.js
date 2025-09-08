// logger middleware
import "dotenv/config";
import fetch from "node-fetch";

export async function log(stack, level, pkg, message) {
  try {
    const response = await fetch(
      process.env.LOG_SERVICE_URL ||
        "http://20.244.56.144/evaluation-service/logs",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // added token provided by affordmed
          Authorization: `Bearer ${process.env.LOG_API_KEY || "dummy-key"}`,
        },
        body: JSON.stringify({
          stack,
          level,
          package: pkg,
          message,
        }),
      }
    );

    const data = await response.json();
    console.log("Log sent:", data);
  } catch (err) {
    console.error("Logging error:", err.message);
  }
}

// adding the logging middleware
export function logMiddleware(req, res, next) {
  log("backend", "info", "middleware", `Incoming ${req.method} ${req.url}`);
  next();
}
