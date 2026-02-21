/**
 * POST /api/voice/speak
 *
 * Text-to-speech endpoint using ElevenLabs.
 * Body: { text: string, personaId: string }
 * Returns: audio/mpeg ArrayBuffer, or empty 204 if unavailable
 */

import { NextRequest, NextResponse } from "next/server";
import { synthesizeSpeech } from "@/lib/voice/elevenlabs-client";
import { getPersonaById } from "@/lib/personas/persona-config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, personaId } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "text is required" },
        { status: 400 }
      );
    }

    // Look up persona's voice ID
    const persona = getPersonaById(personaId ?? "cosmo");
    const voiceId = persona?.voiceId ?? "pNInz6obpgDQGcFmaJgB";

    // Synthesize speech
    const audio = await synthesizeSpeech(text, voiceId);

    if (!audio) {
      // ElevenLabs unavailable — return empty response, UI falls back to text
      return new NextResponse(null, { status: 204 });
    }

    return new NextResponse(audio, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=604800",
      },
    });
  } catch (err) {
    console.error("POST /api/voice/speak error:", err);
    return new NextResponse(null, { status: 204 });
  }
}
