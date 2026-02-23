/**
 * Celebrating Prompt — Celebrate mastery, build excitement for next node.
 * Subject-aware: uses appropriate framing for MATH vs ENGLISH.
 */

import type { PromptParams, CelebratingResponse } from "./types";
import {
  getPersonaName,
  getPersonaTone,
  getAgeInstruction,
  getEmotionalInstruction,
  isELASubject,
} from "./types";

export function buildPrompt(
  params: PromptParams & { nextNodeTitle?: string }
): string {
  const persona = getPersonaName(params.personaId);
  const tone = getPersonaTone(params.personaId);
  const ageInst = getAgeInstruction(params.ageGroup);
  const emoInst = getEmotionalInstruction(params.currentEmotionalState);
  const subjectLabel = isELASubject(params.domain) ? "English" : "math";
  const funFactLabel = isELASubject(params.domain) ? "language" : "math";

  const nextPart = params.nextNodeTitle
    ? `NEXT CONCEPT: ${params.nextNodeTitle} — tease what's coming next to build excitement.`
    : "This was the last concept in this path — celebrate the full achievement!";

  return `You are ${persona}, an AI ${subjectLabel} tutor.

PERSONALITY: ${tone}

STUDENT: ${params.studentName} (age group: ${params.ageGroup})
LANGUAGE LEVEL: ${ageInst}
EMOTIONAL STATE: ${emoInst}

CONTEXT: ${params.studentName} just MASTERED "${params.nodeTitle}" (${params.nodeCode})!
This is a big moment — they've demonstrated strong understanding through practice.

${nextPart}

INSTRUCTIONS:
1. Write an enthusiastic celebration message (match ${persona}'s personality!)
2. Include a fun ${funFactLabel} fact related to the mastered concept
3. Tease the next concept to maintain momentum (or celebrate path completion)
4. Make the student feel genuinely proud of their achievement

OUTPUT FORMAT (JSON):
{
  "celebration": "Enthusiastic celebration message (2-3 sentences)",
  "funFact": "A fun, surprising ${funFactLabel} fact related to the concept (1 sentence)",
  "nextTeaser": "Exciting teaser for the next concept or path completion message (1-2 sentences)"
}

Respond ONLY with valid JSON.`;
}

export function parseResponse(rawResponse: string): CelebratingResponse {
  try {
    const cleaned = rawResponse.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      celebration:
        parsed.celebration || "You did it! That was amazing work!",
      funFact:
        parsed.funFact ||
        "Did you know that math is used in everything from video games to cooking?",
      nextTeaser:
        parsed.nextTeaser ||
        "Get ready — the next challenge is going to be even more exciting!",
    };
  } catch {
    return {
      celebration:
        "Incredible! You've mastered this concept. I'm so proud of you!",
      funFact: "Math is like a superpower — the more you practice, the stronger it gets!",
      nextTeaser: "Ready for the next adventure? Something awesome is coming up!",
    };
  }
}
