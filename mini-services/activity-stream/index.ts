// v71.0 Section C — وَصَل Activity Stream (real-time via Socket.io)
// Mini-service on port 3003. Pushes live events to subscribed clients.
// IMPORTANT: path MUST be "/" so Caddy can route by XTransformPort query.

import { createServer } from "http";
import { Server } from "socket.io";
import { randomUUID } from "crypto";

const httpServer = createServer((_req, res) => {
  // Health check
  if (_req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, port: 3003, uptime: process.uptime() }));
    return;
  }
  res.writeHead(404);
  res.end("Not found");
});

const io = new Server(httpServer, {
  path: "/",
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingTimeout: 60000,
  pingInterval: 25000,
});

interface ActivityEvent {
  id: string;
  type:
    | "contribution"
    | "member_join"
    | "new_org"
    | "follow"
    | "comment"
    | "vote"
    | "ledger"
    | "announcement";
  title: string;
  subtitle?: string;
  userId?: string;
  userName?: string;
  regionId?: string;
  regionName?: string;
  amount?: number;
  ts: number;
}

const RECENT_EVENTS: ActivityEvent[] = [];
const MAX_RECENT = 50;

// Pre-seed with some synthetic events so the feed isn't empty
const SEED_EVENTS: Omit<ActivityEvent, "id" | "ts">[] = [
  { type: "member_join", title: "انضمام عضو جديد", subtitle: "من طنجة-تطوان-الحسيمة", regionName: "طنجة-تطوان-الحسيمة" },
  { type: "contribution", title: "مساهمة في صندوق المعروف", subtitle: "200 درهم", amount: 200, regionName: "الدار البيضاء-سطات" },
  { type: "new_org", title: "تسجيل جمعية جديدة", subtitle: "جمعية أمل للتنمية", regionName: "طنجة-تطوان-الحسيمة" },
  { type: "follow", title: "متابعة جديدة", subtitle: "أصبح 245 متابع" },
  { type: "comment", title: "تعليق جديد على منشور", subtitle: "في نقاش المجتمع" },
  { type: "vote", title: "تصويت على مورد", subtitle: "+1 على awesome-morocco" },
  { type: "ledger", title: "قيد دفتري جديد", subtitle: "CREDIT 5000 درهم", amount: 5000, regionName: "سوس-ماسة" },
];

function pushEvent(e: Omit<ActivityEvent, "id" | "ts">) {
  const full: ActivityEvent = { ...e, id: randomUUID(), ts: Date.now() };
  RECENT_EVENTS.unshift(full);
  if (RECENT_EVENTS.length > MAX_RECENT) RECENT_EVENTS.pop();
  io.emit("activity", full);
}

// Seed with synthetic events every 25-45s
function scheduleNextSynthetic() {
  const delay = 25000 + Math.random() * 20000;
  setTimeout(() => {
    const seed = SEED_EVENTS[Math.floor(Math.random() * SEED_EVENTS.length)];
    pushEvent(seed);
    scheduleNextSynthetic();
  }, delay);
}

io.on("connection", (socket) => {
  console.log(`[activity-stream] client connected: ${socket.id}`);

  // Send recent events on connect
  socket.emit("recent", RECENT_EVENTS.slice(0, 20));

  // Allow external clients to push events (with auth in production)
  socket.on("publish", (data: Omit<ActivityEvent, "id" | "ts">) => {
    // Basic validation
    if (!data || !data.title || !data.type) return;
    pushEvent(data);
  });

  socket.on("disconnect", () => {
    console.log(`[activity-stream] client disconnected: ${socket.id}`);
  });
});

const PORT = 3003;
httpServer.listen(PORT, () => {
  console.log(`[activity-stream] Socket.io server on port ${PORT}`);
  scheduleNextSynthetic();
});
