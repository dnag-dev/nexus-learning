/**
 * Prompt Builder Tests
 * - Each prompt builder returns a non-empty string for all age groups
 * - Each parser returns valid response on both valid JSON and garbage input
 */

import { describe, it, expect } from "vitest";
import type { PromptParams, AgeGroupValue } from "../lib/prompts/types";

import * as teaching from "../lib/prompts/teaching.prompt";
import * as practice from "../lib/prompts/practice.prompt";
import * as hint from "../lib/prompts/hint.prompt";
import * as struggling from "../lib/prompts/struggling.prompt";
import * as celebrating from "../lib/prompts/celebrating.prompt";
import * as bossChallenge from "../lib/prompts/boss-challenge.prompt";
import * as emotionalCheck from "../lib/prompts/emotional-check.prompt";

const AGE_GROUPS: AgeGroupValue[] = ["EARLY_5_7", "MID_8_10", "UPPER_11_12"];

function makeParams(ageGroup: AgeGroupValue): PromptParams {
  return {
    nodeCode: "MATH.NBT.1",
    nodeTitle: "Place Value",
    nodeDescription: "Understanding ones, tens, and hundreds place values",
    gradeLevel: "Grade 2",
    domain: "Number and Operations in Base Ten",
    difficulty: 3,
    studentName: "Alex",
    ageGroup,
    personaId: "cosmo",
    currentEmotionalState: "ENGAGED",
    bktProbability: 0.5,
    masteredNodes: ["Counting to 100", "Skip Counting"],
  };
}

// ─── buildPrompt tests: non-empty string for all age groups ───

describe("Prompt Builders — all age groups produce non-empty prompts", () => {
  describe("teaching.buildPrompt", () => {
    AGE_GROUPS.forEach((ag) => {
      it(`returns non-empty for ${ag}`, () => {
        const result = teaching.buildPrompt(makeParams(ag));
        expect(typeof result).toBe("string");
        expect(result.length).toBeGreaterThan(0);
        expect(result).toContain("Place Value");
        expect(result).toContain("Alex");
      });
    });
  });

  describe("practice.buildPrompt", () => {
    AGE_GROUPS.forEach((ag) => {
      it(`returns non-empty for ${ag}`, () => {
        const result = practice.buildPrompt(makeParams(ag));
        expect(typeof result).toBe("string");
        expect(result.length).toBeGreaterThan(0);
        expect(result).toContain("Place Value");
      });
    });
  });

  describe("hint.buildPrompt", () => {
    AGE_GROUPS.forEach((ag) => {
      it(`returns non-empty for ${ag}`, () => {
        const result = hint.buildPrompt({
          ...makeParams(ag),
          questionText: "What is 35 rounded to the nearest ten?",
          studentAnswer: "30",
        });
        expect(typeof result).toBe("string");
        expect(result.length).toBeGreaterThan(0);
        expect(result).toContain("rounded");
      });
    });
  });

  describe("struggling.buildPrompt", () => {
    AGE_GROUPS.forEach((ag) => {
      it(`returns non-empty for ${ag}`, () => {
        const result = struggling.buildPrompt(makeParams(ag));
        expect(typeof result).toBe("string");
        expect(result.length).toBeGreaterThan(0);
        expect(result).toContain("struggling");
      });
    });
  });

  describe("celebrating.buildPrompt", () => {
    AGE_GROUPS.forEach((ag) => {
      it(`returns non-empty for ${ag}`, () => {
        const result = celebrating.buildPrompt({
          ...makeParams(ag),
          nextNodeTitle: "Addition with Regrouping",
        });
        expect(typeof result).toBe("string");
        expect(result.length).toBeGreaterThan(0);
        expect(result).toContain("MASTERED");
      });
    });
  });

  describe("bossChallenge.buildPrompt", () => {
    AGE_GROUPS.forEach((ag) => {
      it(`returns non-empty for ${ag}`, () => {
        const result = bossChallenge.buildPrompt({
          ...makeParams(ag),
          masteredNodeTitles: [
            "Counting to 100",
            "Skip Counting",
            "Place Value",
          ],
        });
        expect(typeof result).toBe("string");
        expect(result.length).toBeGreaterThan(0);
        expect(result).toContain("boss");
      });
    });
  });

  describe("emotionalCheck.buildPrompt", () => {
    AGE_GROUPS.forEach((ag) => {
      it(`returns non-empty for ${ag}`, () => {
        const result = emotionalCheck.buildPrompt(makeParams(ag));
        expect(typeof result).toBe("string");
        expect(result.length).toBeGreaterThan(0);
        expect(result).toContain("check-in");
      });
    });
  });
});

// ─── Persona variation ───

describe("Prompt Builders — persona customization", () => {
  const personas = ["cosmo", "luna", "rex", "nova", "pip", "atlas"];

  personas.forEach((pid) => {
    it(`teaching prompt uses ${pid} persona name`, () => {
      const params = makeParams("MID_8_10");
      params.personaId = pid;
      const result = teaching.buildPrompt(params);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  it("unknown persona falls back gracefully", () => {
    const params = makeParams("MID_8_10");
    params.personaId = "unknown_persona";
    const result = teaching.buildPrompt(params);
    expect(result).toContain("Your Tutor");
  });
});

// ─── parseResponse tests: valid JSON and garbage fallback ───

describe("Prompt Parsers — valid JSON", () => {
  it("teaching.parseResponse parses valid JSON", () => {
    const json = JSON.stringify({
      explanation: "Here is the concept!",
      checkQuestion: "What is 2+2?",
      checkAnswer: "4",
    });
    const result = teaching.parseResponse(json);
    expect(result.explanation).toBe("Here is the concept!");
    expect(result.checkQuestion).toBe("What is 2+2?");
    expect(result.checkAnswer).toBe("4");
  });

  it("practice.parseResponse parses valid JSON with 4 options", () => {
    const json = JSON.stringify({
      questionText: "What is 5+3?",
      options: [
        { id: "A", text: "7", isCorrect: false },
        { id: "B", text: "8", isCorrect: true },
        { id: "C", text: "9", isCorrect: false },
        { id: "D", text: "6", isCorrect: false },
      ],
      correctAnswer: "B",
      explanation: "5+3=8",
    });
    const result = practice.parseResponse(json);
    expect(result.questionText).toBe("What is 5+3?");
    expect(result.options).toHaveLength(4);
    expect(result.options.filter((o) => o.isCorrect)).toHaveLength(1);
  });

  it("hint.parseResponse parses valid JSON", () => {
    const json = JSON.stringify({
      hint: "Try counting on your fingers",
      encouragement: "You're so close!",
    });
    const result = hint.parseResponse(json);
    expect(result.hint).toBe("Try counting on your fingers");
    expect(result.encouragement).toBe("You're so close!");
  });

  it("struggling.parseResponse parses valid JSON", () => {
    const json = JSON.stringify({
      message: "It's okay!",
      simplerExplanation: "Think of it like blocks.",
      easierQuestion: "What is 1+1?",
      easierAnswer: "2",
    });
    const result = struggling.parseResponse(json);
    expect(result.message).toBe("It's okay!");
    expect(result.easierAnswer).toBe("2");
  });

  it("celebrating.parseResponse parses valid JSON", () => {
    const json = JSON.stringify({
      celebration: "Amazing job!",
      funFact: "Zero is the only number that is neither positive nor negative.",
      nextTeaser: "Next up: multiplication!",
    });
    const result = celebrating.parseResponse(json);
    expect(result.celebration).toBe("Amazing job!");
    expect(result.funFact).toContain("Zero");
  });

  it("bossChallenge.parseResponse parses valid JSON", () => {
    const json = JSON.stringify({
      storyIntro: "A dragon approaches!",
      questionText: "Solve this epic math!",
      options: [
        { id: "A", text: "10", isCorrect: false },
        { id: "B", text: "20", isCorrect: true },
        { id: "C", text: "30", isCorrect: false },
        { id: "D", text: "40", isCorrect: false },
      ],
      correctAnswer: "B",
      victoryMessage: "You win!",
      defeatMessage: "Try again!",
    });
    const result = bossChallenge.parseResponse(json);
    expect(result.storyIntro).toBe("A dragon approaches!");
    expect(result.options).toHaveLength(4);
  });

  it("emotionalCheck.parseResponse parses valid JSON", () => {
    const json = JSON.stringify({
      checkinMessage: "How are you?",
      options: ["Good", "Okay", "Sad"],
      followUpResponses: {
        Good: "Glad to hear it!",
        Okay: "Let's keep going.",
        Sad: "It's okay to feel that way.",
      },
    });
    const result = emotionalCheck.parseResponse(json);
    expect(result.checkinMessage).toBe("How are you?");
    expect(result.options).toHaveLength(3);
    expect(result.followUpResponses["Good"]).toBe("Glad to hear it!");
  });
});

describe("Prompt Parsers — garbage input falls back gracefully", () => {
  it("teaching.parseResponse returns fallback on garbage", () => {
    const result = teaching.parseResponse("not json at all {}{{");
    expect(result.explanation.length).toBeGreaterThan(0);
    expect(result.checkQuestion.length).toBeGreaterThan(0);
    expect(result.checkAnswer.length).toBeGreaterThan(0);
  });

  it("practice.parseResponse returns fallback on garbage", () => {
    const result = practice.parseResponse("broken");
    expect(result.questionText.length).toBeGreaterThan(0);
    expect(result.options).toHaveLength(4);
    expect(result.options.filter((o) => o.isCorrect)).toHaveLength(1);
  });

  it("hint.parseResponse returns fallback on garbage", () => {
    const result = hint.parseResponse("zzz");
    expect(result.hint.length).toBeGreaterThan(0);
    expect(result.encouragement.length).toBeGreaterThan(0);
  });

  it("struggling.parseResponse returns fallback on garbage", () => {
    const result = struggling.parseResponse("!!!");
    expect(result.message.length).toBeGreaterThan(0);
    expect(result.simplerExplanation.length).toBeGreaterThan(0);
    expect(result.easierQuestion.length).toBeGreaterThan(0);
    expect(result.easierAnswer.length).toBeGreaterThan(0);
  });

  it("celebrating.parseResponse returns fallback on garbage", () => {
    const result = celebrating.parseResponse("nope");
    expect(result.celebration.length).toBeGreaterThan(0);
    expect(result.funFact.length).toBeGreaterThan(0);
    expect(result.nextTeaser.length).toBeGreaterThan(0);
  });

  it("bossChallenge.parseResponse returns fallback on garbage", () => {
    const result = bossChallenge.parseResponse("corrupt");
    expect(result.storyIntro.length).toBeGreaterThan(0);
    expect(result.options).toHaveLength(4);
    expect(result.options.filter((o) => o.isCorrect)).toHaveLength(1);
  });

  it("emotionalCheck.parseResponse returns fallback on garbage", () => {
    const result = emotionalCheck.parseResponse("oops");
    expect(result.checkinMessage.length).toBeGreaterThan(0);
    expect(result.options.length).toBeGreaterThan(0);
    expect(Object.keys(result.followUpResponses).length).toBeGreaterThan(0);
  });

  it("practice.parseResponse falls back when options invalid (wrong count)", () => {
    const json = JSON.stringify({
      questionText: "What is 2+2?",
      options: [{ id: "A", text: "4", isCorrect: true }],
      correctAnswer: "A",
      explanation: "2+2=4",
    });
    const result = practice.parseResponse(json);
    // Should use fallback because only 1 option
    expect(result.options).toHaveLength(4);
  });

  it("practice.parseResponse falls back when no correct option", () => {
    const json = JSON.stringify({
      questionText: "What is 2+2?",
      options: [
        { id: "A", text: "3", isCorrect: false },
        { id: "B", text: "5", isCorrect: false },
        { id: "C", text: "6", isCorrect: false },
        { id: "D", text: "7", isCorrect: false },
      ],
      correctAnswer: "A",
      explanation: "None correct",
    });
    const result = practice.parseResponse(json);
    expect(result.options.filter((o) => o.isCorrect)).toHaveLength(1);
  });

  it("bossChallenge.parseResponse falls back when options invalid", () => {
    const json = JSON.stringify({
      storyIntro: "A boss!",
      questionText: "Hard question",
      options: [{ id: "A", text: "Only one", isCorrect: true }],
      correctAnswer: "A",
      victoryMessage: "Win!",
      defeatMessage: "Lose!",
    });
    const result = bossChallenge.parseResponse(json);
    expect(result.options).toHaveLength(4);
  });
});

// ─── Emotional state variation ───

describe("Prompt Builders — emotional state customization", () => {
  const states = [
    "ENGAGED",
    "FRUSTRATED",
    "BORED",
    "CONFUSED",
    "EXCITED",
    "NEUTRAL",
  ] as const;

  states.forEach((state) => {
    it(`teaching prompt works with ${state} emotional state`, () => {
      const params = makeParams("MID_8_10");
      params.currentEmotionalState = state;
      const result = teaching.buildPrompt(params);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});

// ─── Parse with markdown-wrapped JSON ───

describe("Prompt Parsers — handle markdown code fences", () => {
  it("teaching parser strips ```json fences", () => {
    const wrapped =
      '```json\n{"explanation":"test","checkQuestion":"q","checkAnswer":"a"}\n```';
    const result = teaching.parseResponse(wrapped);
    expect(result.explanation).toBe("test");
  });

  it("practice parser strips ```json fences", () => {
    const wrapped = `\`\`\`json
{
  "questionText": "What is 1+1?",
  "options": [
    {"id":"A","text":"1","isCorrect":false},
    {"id":"B","text":"2","isCorrect":true},
    {"id":"C","text":"3","isCorrect":false},
    {"id":"D","text":"4","isCorrect":false}
  ],
  "correctAnswer": "B",
  "explanation": "1+1=2"
}
\`\`\``;
    const result = practice.parseResponse(wrapped);
    expect(result.questionText).toBe("What is 1+1?");
    expect(result.options).toHaveLength(4);
  });
});
