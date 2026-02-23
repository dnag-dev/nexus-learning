/**
 * Emotional Check Prompt — Gentle check-in when frustration detected.
 * Subject-aware: uses appropriate framing for MATH vs ENGLISH.
 */

import type { PromptParams, EmotionalCheckResponse } from "./types";
import {
  getPersonaName,
  getPersonaTone,
  getAgeInstruction,
  getEmotionalInstruction,
  isELASubject,
} from "./types";

export function buildPrompt(params: PromptParams): string {
  const persona = getPersonaName(params.personaId);
  const tone = getPersonaTone(params.personaId);
  const ageInst = getAgeInstruction(params.ageGroup);
  const emoInst = getEmotionalInstruction(params.currentEmotionalState);
  const subjectLabel = isELASubject(params.domain) ? "English" : "math";

  return `You are ${persona}, an AI ${subjectLabel} tutor.

PERSONALITY: ${tone}

STUDENT: ${params.studentName} (age group: ${params.ageGroup})
LANGUAGE LEVEL: ${ageInst}
DETECTED EMOTIONAL STATE: ${params.currentEmotionalState}
EMOTIONAL GUIDANCE: ${emoInst}

CONTEXT: The system detected that ${params.studentName} might be ${params.currentEmotionalState.toLowerCase()}.
They were working on "${params.nodeTitle}".

TASK: Do a gentle emotional check-in. This is NOT a quiz — it's a caring moment.

INSTRUCTIONS:
1. Write a warm, caring check-in message from ${persona}
2. Provide 3-4 response options the student can click (not typed answers)
3. Each option should be a feeling/choice (e.g., "I want to keep trying", "Can we try something different?")
4. For each option, write what ${persona} would say in response
5. Be genuinely empathetic — never dismiss feelings

OUTPUT FORMAT (JSON):
{
  "checkinMessage": "A warm check-in message from ${persona} (2-3 sentences)",
  "options": ["Option 1 text", "Option 2 text", "Option 3 text"],
  "followUpResponses": {
    "Option 1 text": "What ${persona} says if they pick option 1",
    "Option 2 text": "What ${persona} says if they pick option 2",
    "Option 3 text": "What ${persona} says if they pick option 3"
  }
}

Respond ONLY with valid JSON.`;
}

export function parseResponse(rawResponse: string): EmotionalCheckResponse {
  try {
    const cleaned = rawResponse.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      checkinMessage:
        parsed.checkinMessage || "Hey, how are you feeling right now?",
      options: parsed.options || [
        "I'm okay, let's keep going!",
        "Can we try something easier?",
        "I need a break",
      ],
      followUpResponses: parsed.followUpResponses || {
        "I'm okay, let's keep going!":
          "That's the spirit! I'm right here with you.",
        "Can we try something easier?":
          "Of course! Let's take a step back and try something simpler.",
        "I need a break":
          "Breaks are super important! Take your time, I'll be right here when you're ready.",
      },
    };
  } catch {
    return {
      checkinMessage:
        "Hey there! I noticed things might be feeling a bit tough. How are you doing?",
      options: [
        "I'm okay, let's keep going!",
        "Can we try something easier?",
        "I need a break",
      ],
      followUpResponses: {
        "I'm okay, let's keep going!":
          "Awesome! You're so brave for pushing through. Let's do this!",
        "Can we try something easier?":
          "Great idea! Let's take a small step back. There's no rush at all.",
        "I need a break":
          "That's totally fine! Taking breaks actually helps your brain learn better. Come back whenever you're ready!",
      },
    };
  }
}
