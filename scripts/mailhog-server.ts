#!/usr/bin/env bun
/**
 * سيرفر SMTP تجريبي (محاكاة MailHog)
 * يستقبل كل البريد ويحفظه في JSON file
 * عرض البريد: http://localhost:8025
 * SMTP: localhost:1025
 */
import { SMTPServer } from "smtp-server";
import { promises as fs } from "fs";
import path from "path";

const STORAGE_FILE = path.join(process.cwd(), "mailhog-mails.json");
const PORT = 1025;
const HTTP_PORT = 8025;

// تحميل الرسائل المُحفوظة
async function loadMails(): Promise<Array<{ id: string; from: string; to: string; subject: string; body: string; receivedAt: string }>> {
  try {
    const content = await fs.readFile(STORAGE_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    return [];
  }
}

async function saveMails(mails: any[]) {
  await fs.writeFile(STORAGE_FILE, JSON.stringify(mails, null, 2));
}

const server = new SMTPServer({
  authOptional: true,
  disabledCommands: ["STARTTLS"],
  logger: false,
  onConnect(session, callback) {
    callback();
  },
  onData(stream, session, callback) {
    let raw = "";
    stream.on("data", (chunk) => { raw += chunk.toString(); });
    stream.on("end", async () => {
      // استخراج Subject + body
      const lines = raw.split("\r\n");
      let subject = "(no subject)";
      let from = session.envelope.mailFrom?.address ?? "unknown";
      const toRaw = session.envelope.rcptTo?.map((r: any) => r.address).join(", ") ?? "unknown";
      const subjectIdx = lines.findIndex((l) => l.toLowerCase().startsWith("subject:"));
      if (subjectIdx >= 0) {
        subject = lines[subjectIdx].substring(8).trim();
      }
      const bodyIdx = lines.findIndex((l, i) => i > 0 && l === "");
      const body = bodyIdx >= 0 ? lines.slice(bodyIdx + 1).join("\n") : raw;

      const mail = {
        id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        from,
        to: toRaw,
        subject,
        body,
        receivedAt: new Date().toISOString(),
      };

      const mails = await loadMails();
      mails.unshift(mail);
      if (mails.length > 500) mails.length = 500;
      await saveMails(mails);

      console.log(`📧 بريد مُستلَم: ${subject} → ${toRaw}`);
      callback();
    });
  },
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`\n╔════════════════════════════════════════════════════╗`);
  console.log(`║  📧 سيرفر SMTP تجريبي (محاكاة MailHog)            ║`);
  console.log(`╠════════════════════════════════════════════════════╣`);
  console.log(`║  SMTP:  127.0.0.1:${PORT}                            ║`);
  console.log(`║  HTTP:  http://localhost:${HTTP_PORT}                  ║`);
  console.log(`║  التخزين: ${STORAGE_FILE.substring(0, 30)}...║`);
  console.log(`╚════════════════════════════════════════════════════╝\n`);
});

// HTTP server بسيط لعرض الرسائل
const http = await import("http");
const httpServer = http.createServer(async (req, res) => {
  if (req.url === "/" || req.url === "/api/mails") {
    const mails = await loadMails();
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(mails, null, 2));
    return;
  }
  // HTML واجهة بسيطة
  const mails = await loadMails();
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8">
<title>صندوق البريد التجريبي — سيدي يوسف بن علي</title>
<style>
body { font-family: sans-serif; background: #FBF6EE; color: #1F1A17; margin: 0; padding: 20px; }
h1 { color: #B8492B; border-bottom: 2px solid #C8842A; padding-bottom: 10px; }
.mail { background: white; border: 1px solid #E8DCC4; padding: 15px; margin: 10px 0; border-radius: 6px; }
.mail h3 { margin: 0 0 5px 0; color: #B8492B; }
.meta { color: #6B5D4E; font-size: 13px; margin-bottom: 10px; }
.body { white-space: pre-wrap; font-family: monospace; font-size: 12px; max-height: 200px; overflow: auto; border-top: 1px solid #E8DCC4; padding-top: 10px; }
.stats { background: #2D5A3D; color: white; padding: 10px 15px; border-radius: 6px; margin-bottom: 20px; }
</style>
</head>
<body>
<h1>📧 صندوق البريد التجريبي — سيدي يوسف بن علي العاصمة</h1>
<div class="stats">📨 إجمالي الرسائل المستلَمة: ${mails.length}</div>
${mails.map((m: any) => `
<div class="mail">
<h3>${m.subject}</h3>
<div class="meta">من: ${m.from} → إلى: ${m.to} | ${new Date(m.receivedAt).toLocaleString("ar-MA")}</div>
<div class="body">${m.body.substring(0, 2000)}</div>
</div>
`).join("")}
${mails.length === 0 ? "<p>لا توجد رسائل بعد. جرّب إرسال بريد من المنصة.</p>" : ""}
</body>
</html>`);
});
httpServer.listen(HTTP_PORT, () => {
  console.log(`  → واجهة الويب: http://localhost:${HTTP_PORT}\n`);
});
