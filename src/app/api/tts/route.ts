// v71.0 Section B — Text to Speech (Arabic)
// POST /api/tts  Body: { text, voice?, speed? }
// Returns audio/wav binary
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function splitTextIntoChunks(text: string, maxLen = 1000): string[] {
  if (text.length <= maxLen) return [text];
  const sentences = text.match(/[^.!?؟،\n]+[.!?؟،\n]+/g) || [text];
  const chunks: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if ((cur + s).length <= maxLen) {
      cur += s;
    } else {
      if (cur) chunks.push(cur.trim());
      cur = s.length > maxLen ? s.slice(0, maxLen) : s;
    }
  }
  if (cur) chunks.push(cur.trim());
  return chunks;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, voice = "tongtong", speed = 1.0 } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "text_required" }, { status: 400 });
    }

    // Cap at 1024 chars per API constraint
    const inputText = text.slice(0, 1000).trim();
    if (inputText.length === 0) {
      return NextResponse.json({ error: "empty_text" }, { status: 400 });
    }

    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();

    const response = await zai.audio.tts.create({
      input: inputText,
      voice,
      speed: Math.min(Math.max(speed, 0.5), 2.0),
      response_format: "wav",
      stream: false,
    });

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[tts] error:", error);
    return NextResponse.json({ error: "tts_failed" }, { status: 500 });
  }
}
