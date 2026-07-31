const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 8787);
const dataDir = path.join(__dirname, "data");
const dataFile = path.join(dataDir, "sessions.json");

function ensureStore() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, "[]", "utf8");
}

function readSessions() {
  ensureStore();
  try {
    const parsed = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSessions(sessions) {
  ensureStore();
  fs.writeFileSync(dataFile, JSON.stringify(sessions, null, 2), "utf8");
}

function sendJson(res, status, value) {
  res.writeHead(status, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8"
  });
  res.end(JSON.stringify(value));
}

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.url === "/api/health") {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.url === "/api/sessions" && req.method === "GET") {
    sendJson(res, 200, readSessions());
    return;
  }

  if (req.url === "/api/sessions" && req.method === "PUT") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 5_000_000) req.destroy();
    });
    req.on("end", () => {
      try {
        const parsed = JSON.parse(body || "[]");
        if (!Array.isArray(parsed)) {
          sendJson(res, 400, { error: "Expected an array of sessions." });
          return;
        }
        writeSessions(parsed);
        sendJson(res, 200, { ok: true });
      } catch {
        sendJson(res, 400, { error: "Invalid JSON." });
      }
    });
    return;
  }

  sendJson(res, 404, { error: "Not found." });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`PPS shared API running at http://localhost:${PORT}`);
});
