/**
 * Challenge Mode Engine
 *
 * Open-ended, prompt-based challenge questions where students type answers
 * and Claude evaluates them. Tests real understanding, not just multiple choice.
 */

import { callClaude } from "@/lib/session/claude-client";
import {
  getPersonaName,
  getPersonaTone,
  getAgeInstruction,
  type AgeGroupValue,
} from "@/lib/prompts/types";

// ─── Types ───

export interface ChallengeQuestion {
  scenario: string;
  question: string;
  hints: string[];
  difficulty: string;
}

export interface ChallengeEvaluation {
  score: number; // 0-100
  feedback: string;
  strengths: string[];
  improvements: string[];
  isCorrect: boolean;
}

// ─── Generate Challenge ───

export async function generateChallenge(
  nodeTitle: string,
  nodeDescription: string,
  domain: string,
  gradeLevel: string,
  studentName: string,
  ageGroup: AgeGroupValue,
  personaId: string
): Promise<ChallengeQuestion> {
  const personaName = getPersonaName(personaId);
  const personaTone = getPersonaTone(personaId);
  const ageInstruction = getAgeInstruction(ageGroup);

  const prompt = `You are ${personaName}, a tutor who is ${personaTone}.

Create a real-world challenge scenario for the student "${studentName}" about: ${nodeTitle}
Topic: ${nodeDescription}
Domain: ${domain}, Grade: ${gradeLevel}

${ageInstruction}

This is a CHALLENGE MODE question — not multiple choice. The student will type their own answer.

Create a realistic scenario where the student must APPLY the concept, not just recall it.

Respond in EXACTLY this JSON format:
{
  "scenario": "A vivid, real-world scenario (2-3 sentences)",
  "question": "The specific question they must answer (1-2 sentences)",
  "hints": ["Hint 1 if they're stuck", "Hint 2 for more help"],
  "difficulty": "moderate"
}

Only return valid JSON, nothing else.`;

  const response = await callClaude(prompt);
  if (!response) {
    return {
      scenario: `Imagine you're helping a friend understand ${nodeTitle}. They're confused and need your help!`,
      question: `How would you explain ${nodeTitle} in your own words? Give an example.`,
      hints: [
        "Think about a real-life situation where you'd use this",
        "Try to explain it like you're teaching someone younger",
      ],
      difficulty: "moderate",
    };
  }

  try {
    const parsed = JSON.parse(response);
    return {
      scenario: parsed.scenario ?? `A challenge about ${nodeTitle}`,
      question: parsed.question ?? `Explain ${nodeTitle} in your own words.`,
      hints: parsed.hints ?? ["Think step by step"],
      difficulty: parsed.difficulty ?? "moderate",
    };
  } catch {
    return {
      scenario: `You're using ${nodeTitle} in a real situation!`,
      question: `Explain how ${nodeTitle} works and give an example.`,
      hints: ["Start with the basic concept", "Then show an example"],
      difficulty: "moderate",
    };
  }
}

// ─── Evaluate Challenge ───

export async function evaluateChallenge(
  studentAnswer: string,
  nodeTitle: string,
  nodeDescription: string,
  scenario: string,
  question: string,
  ageGroup: AgeGroupValue,
  personaId: string,
  studentName: string
): Promise<ChallengeEvaluation> {
  const personaName = getPersonaName(personaId);
  const ageInstruction = getAgeInstruction(ageGroup);

  const prompt = `You are ${personaName} evaluating a student's challenge response.

Topic: ${nodeTitle} — ${nodeDescription}

Scenario given: ${scenario}
Question asked: ${question}
Student's answer: "${studentAnswer}"

${ageInstruction}

Evaluate the student "${studentName}"'s response. Be encouraging but honest.
Score from 0-100 where:
  70+ = shows understanding
  85+ = strong application
  95+ = exceptional insight

Respond in EXACTLY this JSON format:
{
  "score": 75,
  "feedback": "Your encouraging, specific feedback about their answer (2-3 sentences)",
  "strengths": ["Specific thing they did well", "Another strength"],
  "improvements": ["Something they could add or clarify"],
  "isCorrect": true
}

Only return valid JSON, nothing else.`;

  const response = await callClaude(prompt);
  if (!response) {
    // Generous fallback if Claude fails
    return {
      score: 60,
      feedback:
        "Thanks for your answer! You showed effort in explaining the concept. Keep practicing to deepen your understanding.",
      strengths: ["You attempted the challenge"],
      improvements: ["Try adding more specific examples"],
      isCorrect: studentAnswer.length > 10,
    };
  }

  try {
    const parsed = JSON.parse(response);
    return {
      score: Math.max(0, Math.min(100, parsed.score ?? 50)),
      feedback: parsed.feedback ?? "Good effort!",
      strengths: parsed.strengths ?? ["You tried!"],
      improvements: parsed.improvements ?? [],
      isCorrect: parsed.isCorrect ?? parsed.score >= 70,
    };
  } catch {
    return {
      score: 50,
      feedback: "Good effort! Keep working on applying this concept.",
      strengths: ["You participated in the challenge"],
      improvements: ["Try to be more specific in your explanation"],
      isCorrect: false,
    };
  }
}
