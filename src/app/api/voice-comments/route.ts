// v72.0 — Voice Comments API (ASR transcription)
// POST /api/voice-comments  Body: { blogPostId, audioData(base64), duration, commenterName }
// Returns: { voiceComment, transcription }
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { blogPostId, audioData, duration, commenterName } = body;

    if (!audioData || typeof audioData !== "string") {
      return NextResponse.json({ error: "audio_data_required" }, { status: 400 });
    }
    if (audioData.length > 500_000) {
      return NextResponse.json({ error: "audio_too_large" }, { status: 413 });
    }

    const currentUser = await getCurrentUser();
    const safeName = currentUser?.name ?? commenterName ?? "زائر";

    let transcription: string | null = null;

    // Try ASR with z-ai-web-dev-sdk (best effort — if it fails, store audio without text)
    try {
      const ZAI = (await import("z-ai-web-dev-sdk")).default;
      const zai = await ZAI.create();
      // ASR: pass the base64 audio (strip data: prefix if present)
      const base64Audio = audioData.replace(/^data:audio\/\w+;base64,/, "");
      const audioBuffer = Buffer.from(base64Audio, "base64");

      const blob = new Blob([new Uint8Array(audioBuffer)], { type: "audio/wav" });
      // z-ai SDK supports audio.transcriptions.create
      // @ts-ignore — type signatures may vary
      const asrResp = await zai.audio.transcriptions.create({
        file: blob,
        model: "whisper-1",
        language: "ar",
      });
      transcription = (asrResp as any)?.text ?? null;
    } catch (asrError: any) {
      console.warn("[voice-comments] ASR failed, storing audio without transcription:", asrError?.message?.slice(0, 100));
      transcription = null;
    }

    const voiceComment = await db.voiceComment.create({
      data: {
        blogPostId: blogPostId ?? null,
        userId: currentUser?.id ?? null,
        commenterName: safeName,
        audioData,
        duration: Math.min(Math.max(parseInt(duration) || 0, 0), 600),
        transcription,
        language: "ar",
        isApproved: true,
      },
    });

    return NextResponse.json({
      voiceComment: {
        id: voiceComment.id,
        duration: voiceComment.duration,
        transcription,
        commenterName: voiceComment.commenterName,
        createdAt: voiceComment.createdAt.toISOString(),
      },
      transcription,
    }, { status: 201 });
  } catch (error) {
    console.error("[voice-comments/post] error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const blogPostId = searchParams.get("blogPostId");
    if (!blogPostId) {
      return NextResponse.json({ error: "blogPostId_required" }, { status: 400 });
    }

    const comments = await db.voiceComment.findMany({
      where: { blogPostId, isApproved: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Strip audioData from response (return only metadata + transcription)
    return NextResponse.json({
      comments: comments.map((c) => ({
        id: c.id,
        commenterName: c.commenterName,
        duration: c.duration,
        transcription: c.transcription,
        createdAt: c.createdAt.toISOString(),
        audioData: c.audioData,  // include base64 for client playback
      })),
    });
  } catch (error) {
    console.error("[voice-comments/get] error:", error);
    return NextResponse.json({ comments: [] });
  }
}
