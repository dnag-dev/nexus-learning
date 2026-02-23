/**
 * Shared types for all prompt builders.
 */

export type AgeGroupValue = "EARLY_5_7" | "MID_8_10" | "UPPER_11_12";
export type EmotionalStateValue =
  | "ENGAGED"
  | "FRUSTRATED"
  | "BORED"
  | "CONFUSED"
  | "EXCITED"
  | "NEUTRAL";

export interface PromptParams {
  nodeCode: string;
  nodeTitle: string;
  nodeDescription: string;
  gradeLevel: string;
  domain: string;
  difficulty: number;
  studentName: string;
  ageGroup: AgeGroupValue;
  personaId: string;
  currentEmotionalState: EmotionalStateValue;
  bktProbability?: number;
  masteredNodes?: string[];
}

export interface TeachingResponse {
  emoji: string;
  hook: string;
  explanation: string;
  example: string;
  checkQuestion: string;
  checkAnswer: string;
}

export interface PracticeResponse {
  questionText: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  correctAnswer: string;
  explanation: string;
}

export interface HintResponse {
  hint: string;
  encouragement: string;
}

export interface StrugglingResponse {
  message: string;
  simplerExplanation: string;
  easierQuestion: string;
  easierAnswer: string;
}

export interface CelebratingResponse {
  celebration: string;
  funFact: string;
  nextTeaser: string;
}

export interface BossChallengeResponse {
  storyIntro: string;
  questionText: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  correctAnswer: string;
  victoryMessage: string;
  defeatMessage: string;
}

export interface EmotionalCheckResponse {
  checkinMessage: string;
  options: string[];
  followUpResponses: Record<string, string>;
}

// ─── Subject Detection Helper ───

/** ELA domains from the KnowledgeDomain enum */
const ELA_DOMAINS = new Set(["GRAMMAR", "READING", "WRITING", "VOCABULARY"]);

/**
 * Returns true if the domain belongs to English Language Arts.
 * Used by prompt builders to select the correct prompt template.
 * Nodes without a recognized ELA domain default to math behavior.
 */
export function isELASubject(domain: string): boolean {
  return ELA_DOMAINS.has(domain);
}

// ─── Persona Helpers ───

const PERSONA_NAMES: Record<string, string> = {
  cosmo: "Cosmo the Bear",
  luna: "Luna the Cat",
  rex: "Rex the Dinosaur",
  nova: "Nova the Fox",
  pip: "Pip the Owl",
  atlas: "Atlas the Turtle",
  zara: "Zara the Zebra",
  finn: "Finn the Dolphin",
  echo: "Echo",
  sage: "Sage",
  bolt: "Bolt",
  ivy: "Ivy",
  max: "Max",
  aria: "Aria",
};

const PERSONA_TONES: Record<string, string> = {
  cosmo: "warm, encouraging, and uses bear/space metaphors. Says things like 'pawsome!' and 'stellar!'",
  luna: "gentle, graceful, and poetic. Uses moonlight and nature metaphors. Calm and reassuring.",
  rex: "goofy, enthusiastic, and makes deliberate funny mistakes. Uses dino puns. Very energetic.",
  nova: "curious, clever, and adventurous. Uses fox/exploration metaphors. Quick-witted.",
  pip: "wise, patient, and observant. Uses owl/forest metaphors. Thoughtful and methodical.",
  atlas: "steady, reliable, and encouraging. Uses turtle/journey metaphors. Never rushes.",
};

export function getPersonaName(personaId: string): string {
  return PERSONA_NAMES[personaId] ?? "Your Tutor";
}

export function getPersonaTone(personaId: string): string {
  return PERSONA_TONES[personaId] ?? "friendly, encouraging, and patient";
}

export function getAgeInstruction(ageGroup: AgeGroupValue): string {
  switch (ageGroup) {
    case "EARLY_5_7":
      return "Use very simple words (max 2 syllables). Short sentences. Lots of visual examples and emojis. Make it playful and fun.";
    case "MID_8_10":
      return "Use clear, grade-appropriate language. Include relatable real-world examples. Balance fun with learning.";
    case "UPPER_11_12":
      return "Use age-appropriate vocabulary. Include real-world applications. Respect their growing independence. Less childish, more collaborative.";
  }
}

export function getEmotionalInstruction(state: EmotionalStateValue): string {
  switch (state) {
    case "FRUSTRATED":
      return "The student is frustrated. Be extra gentle and patient. Acknowledge difficulty. Break things into smaller steps. Use lots of encouragement.";
    case "BORED":
      return "The student seems bored. Make it more engaging and exciting. Add a fun twist or challenge. Increase the pace.";
    case "CONFUSED":
      return "The student is confused. Use simpler language. Give a concrete visual example first. Go step-by-step.";
    case "EXCITED":
      return "The student is excited! Match their energy. Build on this momentum. Celebrate their enthusiasm.";
    case "ENGAGED":
      return "The student is engaged. Keep the current pace and tone. They're in a good learning flow.";
    case "NEUTRAL":
      return "The student is in a neutral state. Use your normal engaging teaching style.";
  }
}
