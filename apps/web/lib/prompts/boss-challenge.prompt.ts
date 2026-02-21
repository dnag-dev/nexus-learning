/**
 * Boss Challenge Prompt — Epic challenge combining 3+ mastered nodes
 */

import type { PromptParams, BossChallengeResponse } from "./types";
import {
  getPersonaName,
  getPersonaTone,
  getAgeInstruction,
  getEmotionalInstruction,
} from "./types";

export function buildPrompt(
  params: PromptParams & { masteredNodeTitles: string[] }
): string {
  const persona = getPersonaName(params.personaId);
  const tone = getPersonaTone(params.personaId);
  const ageInst = getAgeInstruction(params.ageGroup);
  const emoInst = getEmotionalInstruction(params.currentEmotionalState);

  const masteredList = params.masteredNodeTitles.join(", ");

  return `You are ${persona}, an AI math tutor.

PERSONALITY: ${tone}

STUDENT: ${params.studentName} (age group: ${params.ageGroup})
LANGUAGE LEVEL: ${ageInst}
EMOTIONAL STATE: ${emoInst}

TASK: Create an EPIC boss challenge question that combines these mastered concepts:
MASTERED CONCEPTS: ${masteredList}
GRADE: ${params.gradeLevel} | DIFFICULTY: HIGH (this is a boss battle!)

INSTRUCTIONS:
1. Write a short, exciting story intro (2-3 sentences) setting up the challenge — use ${persona}'s personality
2. Create a challenging question that requires knowledge from AT LEAST 3 of the mastered concepts
3. Include 4 answer options, exactly 1 correct
4. Write a victory message (if they pass) and an encouraging defeat message (if they fail)
5. Make it feel EPIC — this is a boss battle, not a regular question!

OUTPUT FORMAT (JSON):
{
  "storyIntro": "An exciting narrative setup for the boss challenge",
  "questionText": "The challenging boss question combining multiple concepts",
  "options": [
    {"id": "A", "text": "Option A", "isCorrect": false},
    {"id": "B", "text": "Option B", "isCorrect": true},
    {"id": "C", "text": "Option C", "isCorrect": false},
    {"id": "D", "text": "Option D", "isCorrect": false}
  ],
  "correctAnswer": "B",
  "victoryMessage": "Triumphant celebration if they win",
  "defeatMessage": "Encouraging message if they lose — motivate retry"
}

Respond ONLY with valid JSON.`;
}

export function parseResponse(rawResponse: string): BossChallengeResponse {
  try {
    const cleaned = rawResponse.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (
      !parsed.options ||
      parsed.options.length !== 4 ||
      !parsed.options.some((o: { isCorrect: boolean }) => o.isCorrect)
    ) {
      throw new Error("Invalid boss challenge options");
    }

    return {
      storyIntro: parsed.storyIntro,
      questionText: parsed.questionText,
      options: parsed.options,
      correctAnswer: parsed.correctAnswer,
      victoryMessage: parsed.victoryMessage,
      defeatMessage: parsed.defeatMessage,
    };
  } catch {
    return {
      storyIntro:
        "A mighty math dragon has appeared! Only your combined knowledge can defeat it!",
      questionText:
        "The dragon guards a treasure of 15 gems. If you take away 7 and then add 3, how many gems do you have?",
      options: [
        { id: "A", text: "10", isCorrect: false },
        { id: "B", text: "11", isCorrect: true },
        { id: "C", text: "12", isCorrect: false },
        { id: "D", text: "8", isCorrect: false },
      ],
      correctAnswer: "B",
      victoryMessage:
        "The dragon is defeated! You are a true math champion!",
      defeatMessage:
        "The dragon won this round, but you'll be back stronger! Let's train some more.",
    };
  }
}
