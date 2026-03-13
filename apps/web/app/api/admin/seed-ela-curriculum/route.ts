/**
 * POST /api/admin/seed-ela-curriculum
 *
 * Upserts K-G5 ELA (English Language Arts) curriculum nodes.
 * Foundation nodes for K + G1 (10 nodes) plus G2-G5 (62 nodes) = 72 total.
 * Protected by ADMIN_SEED_KEY environment variable.
 *
 * Usage:
 *   curl -X POST https://nexus-learning-dnag.vercel.app/api/admin/seed-ela-curriculum \
 *     -H "Authorization: Bearer YOUR_ADMIN_SEED_KEY"
 */

import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";

// ─── Auth ───

function verifyAdminKey(request: Request): boolean {
  const key = process.env.ADMIN_SEED_KEY;
  if (!key) return false;
  const authHeader = request.headers.get("Authorization");
  return authHeader === `Bearer ${key}`;
}

// ─── Types ───

interface NodeSeed {
  nodeCode: string;
  title: string;
  description: string;
  gradeLevel: string;
  domain: string;
  subject: string;
  difficulty: number;
  prerequisiteCodes: string[];
}

// ─── K-G5 ELA Curriculum (Common Core ELA aligned) ───

const elaNodes: NodeSeed[] = [
  // ═══════════════════════════════════════════════════════════
  // KINDERGARTEN FOUNDATION (4 nodes)
  // ═══════════════════════════════════════════════════════════
  { nodeCode: "ELA-K.RF.1", title: "Recognize and Name All Letters", description: "Recognize and name all upper- and lowercase letters of the alphabet.", gradeLevel: "K", domain: "VOCABULARY", subject: "ENGLISH", difficulty: 1, prerequisiteCodes: [] },
  { nodeCode: "ELA-K.RF.2", title: "Letter-Sound Correspondence", description: "Demonstrate basic knowledge of one-to-one letter-sound correspondences by producing the primary sound for each consonant.", gradeLevel: "K", domain: "GRAMMAR", subject: "ENGLISH", difficulty: 2, prerequisiteCodes: ["ELA-K.RF.1"] },
  { nodeCode: "ELA-K.RL.1", title: "Ask and Answer Questions About Stories", description: "With prompting and support, ask and answer questions about key details in a text.", gradeLevel: "K", domain: "READING", subject: "ENGLISH", difficulty: 2, prerequisiteCodes: ["ELA-K.RF.1"] },
  { nodeCode: "ELA-K.W.1", title: "Write Simple Sentences", description: "Use a combination of drawing, dictating, and writing to compose simple sentences and opinion pieces.", gradeLevel: "K", domain: "WRITING", subject: "ENGLISH", difficulty: 3, prerequisiteCodes: ["ELA-K.RF.2"] },

  // ═══════════════════════════════════════════════════════════
  // GRADE 1 FOUNDATION (6 nodes)
  // ═══════════════════════════════════════════════════════════
  { nodeCode: "ELA-1.G.1", title: "Nouns: People, Places, Things", description: "Use common, proper, and possessive nouns. Identify nouns as people, places, or things.", gradeLevel: "G1", domain: "GRAMMAR", subject: "ENGLISH", difficulty: 3, prerequisiteCodes: ["ELA-K.RF.2", "ELA-K.W.1"] },
  { nodeCode: "ELA-1.G.2", title: "Verbs: Action Words", description: "Use verbs to convey a sense of past, present, and future. Identify action words in sentences.", gradeLevel: "G1", domain: "GRAMMAR", subject: "ENGLISH", difficulty: 3, prerequisiteCodes: ["ELA-K.RF.2", "ELA-K.W.1"] },
  { nodeCode: "ELA-1.R.1", title: "Identify Main Idea and Details", description: "Ask and answer questions about key details in a text. Identify the main topic and retell key details.", gradeLevel: "G1", domain: "READING", subject: "ENGLISH", difficulty: 3, prerequisiteCodes: ["ELA-K.RL.1"] },
  { nodeCode: "ELA-1.R.2", title: "Sequence Events in a Story", description: "Retell stories, including key details, and demonstrate understanding of their central message or lesson.", gradeLevel: "G1", domain: "READING", subject: "ENGLISH", difficulty: 4, prerequisiteCodes: ["ELA-1.R.1"] },
  { nodeCode: "ELA-1.W.1", title: "Write Complete Sentences", description: "Write informative/explanatory texts naming a topic, supplying facts, and providing a sense of closure.", gradeLevel: "G1", domain: "WRITING", subject: "ENGLISH", difficulty: 4, prerequisiteCodes: ["ELA-K.W.1", "ELA-1.G.1", "ELA-1.G.2"] },
  { nodeCode: "ELA-1.V.1", title: "Basic Sight Word Vocabulary", description: "Use sentence-level context as a clue to the meaning of a word or phrase. Identify frequently occurring root words.", gradeLevel: "G1", domain: "VOCABULARY", subject: "ENGLISH", difficulty: 3, prerequisiteCodes: ["ELA-K.RF.1"] },

  // ═══════════════════════════════════════════════════════════
  // GRADE 2 (14 nodes)
  // ═══════════════════════════════════════════════════════════

  // ── G2 Grammar (5) ──
  { nodeCode: "ELA-2.G.1", title: "Common and Proper Nouns", description: "Use collective nouns. Form and use frequently occurring irregular plural nouns. Distinguish common and proper nouns.", gradeLevel: "G2", domain: "GRAMMAR", subject: "ENGLISH", difficulty: 4, prerequisiteCodes: ["ELA-1.G.1"] },
  { nodeCode: "ELA-2.G.2", title: "Singular and Plural Nouns", description: "Form and use regular and irregular plural nouns orally and in writing. Use reflexive pronouns.", gradeLevel: "G2", domain: "GRAMMAR", subject: "ENGLISH", difficulty: 4, prerequisiteCodes: ["ELA-2.G.1"] },
  { nodeCode: "ELA-2.G.3", title: "Past Tense Verbs", description: "Form and use the past tense of frequently occurring irregular verbs. Understand regular and irregular past tenses.", gradeLevel: "G2", domain: "GRAMMAR", subject: "ENGLISH", difficulty: 4, prerequisiteCodes: ["ELA-1.G.2"] },
  { nodeCode: "ELA-2.G.4", title: "Adjectives to Describe", description: "Use adjectives and adverbs to describe nouns and verbs. Choose words and phrases for effect.", gradeLevel: "G2", domain: "GRAMMAR", subject: "ENGLISH", difficulty: 5, prerequisiteCodes: ["ELA-2.G.1"] },
  { nodeCode: "ELA-2.G.5", title: "Expand Simple Sentences", description: "Produce, expand, and rearrange complete simple and compound sentences. Use commas in greetings and closings of letters.", gradeLevel: "G2", domain: "GRAMMAR", subject: "ENGLISH", difficulty: 5, prerequisiteCodes: ["ELA-2.G.3", "ELA-2.G.4"] },

  // ── G2 Reading (4) ──
  { nodeCode: "ELA-2.R.1", title: "Recount Stories and Central Message", description: "Recount stories and determine their central message, lesson, or moral. Ask and answer who, what, where, when, why, how.", gradeLevel: "G2", domain: "READING", subject: "ENGLISH", difficulty: 4, prerequisiteCodes: ["ELA-1.R.1"] },
  { nodeCode: "ELA-2.R.2", title: "Describe Character Responses", description: "Describe how characters in a story respond to major events and challenges.", gradeLevel: "G2", domain: "READING", subject: "ENGLISH", difficulty: 5, prerequisiteCodes: ["ELA-2.R.1"] },
  { nodeCode: "ELA-2.R.3", title: "Compare Two Versions of a Story", description: "Compare and contrast two or more versions of the same story by different authors or from different cultures.", gradeLevel: "G2", domain: "READING", subject: "ENGLISH", difficulty: 5, prerequisiteCodes: ["ELA-2.R.2"] },
  { nodeCode: "ELA-2.R.4", title: "Identify Main Purpose of a Text", description: "Identify the main purpose of a text, including what the author wants to answer, explain, or describe.", gradeLevel: "G2", domain: "READING", subject: "ENGLISH", difficulty: 5, prerequisiteCodes: ["ELA-2.R.1"] },

  // ── G2 Writing (3) ──
  { nodeCode: "ELA-2.W.1", title: "Write Opinion Pieces", description: "Write opinion pieces introducing the topic, stating an opinion, supplying reasons, and providing a concluding statement.", gradeLevel: "G2", domain: "WRITING", subject: "ENGLISH", difficulty: 5, prerequisiteCodes: ["ELA-1.W.1"] },
  { nodeCode: "ELA-2.W.2", title: "Write Informative Texts", description: "Write informative/explanatory texts introducing a topic, using facts and definitions, and providing a concluding statement.", gradeLevel: "G2", domain: "WRITING", subject: "ENGLISH", difficulty: 5, prerequisiteCodes: ["ELA-1.W.1"] },
  { nodeCode: "ELA-2.W.3", title: "Write Narratives", description: "Write narratives recounting a well-elaborated event or sequence of events, including details and temporal words.", gradeLevel: "G2", domain: "WRITING", subject: "ENGLISH", difficulty: 5, prerequisiteCodes: ["ELA-1.W.1", "ELA-2.G.5"] },

  // ── G2 Vocabulary (2) ──
  { nodeCode: "ELA-2.V.1", title: "Context Clues for Word Meaning", description: "Use sentence-level context as a clue to the meaning of a word or phrase. Determine meaning of new words from context.", gradeLevel: "G2", domain: "VOCABULARY", subject: "ENGLISH", difficulty: 4, prerequisiteCodes: ["ELA-1.V.1"] },
  { nodeCode: "ELA-2.V.2", title: "Compound Words", description: "Determine the meaning of the new word formed when a known prefix or compound word is added to a known word.", gradeLevel: "G2", domain: "VOCABULARY", subject: "ENGLISH", difficulty: 4, prerequisiteCodes: ["ELA-1.V.1"] },

  // ═══════════════════════════════════════════════════════════
  // GRADE 3 (15 nodes)
  // ═══════════════════════════════════════════════════════════

  // ── G3 Grammar (5) ──
  { nodeCode: "ELA-3.G.1", title: "Subject-Verb Agreement", description: "Ensure subject-verb and pronoun-antecedent agreement. Use abstract nouns and regular/irregular verbs.", gradeLevel: "G3", domain: "GRAMMAR", subject: "ENGLISH", difficulty: 5, prerequisiteCodes: ["ELA-2.G.3", "ELA-2.G.5"] },
  { nodeCode: "ELA-3.G.2", title: "Pronouns and Antecedents", description: "Use reciprocal pronouns correctly. Ensure pronoun-antecedent agreement in number and person.", gradeLevel: "G3", domain: "GRAMMAR", subject: "ENGLISH", difficulty: 5, prerequisiteCodes: ["ELA-2.G.1", "ELA-2.G.5"] },
  { nodeCode: "ELA-3.G.3", title: "Adverbs", description: "Form and use comparative and superlative adjectives and adverbs. Choose between them depending on what is modified.", gradeLevel: "G3", domain: "GRAMMAR", subject: "ENGLISH", difficulty: 6, prerequisiteCodes: ["ELA-3.G.1"] },
  { nodeCode: "ELA-3.G.4", title: "Coordinating Conjunctions", description: "Use coordinating and subordinating conjunctions. Produce simple, compound, and complex sentences.", gradeLevel: "G3", domain: "GRAMMAR", subject: "ENGLISH", difficulty: 6, prerequisiteCodes: ["ELA-3.G.1"] },
  { nodeCode: "ELA-3.G.5", title: "Complex Sentences", description: "Produce complex sentences using conjunctions. Use commas and quotation marks in dialogue.", gradeLevel: "G3", domain: "GRAMMAR", subject: "ENGLISH", difficulty: 6, prerequisiteCodes: ["ELA-3.G.3", "ELA-3.G.4"] },

  // ── G3 Reading (5) ──
  { nodeCode: "ELA-3.R.1", title: "Ask and Answer Questions Using Text", description: "Ask and answer questions to demonstrate understanding, referring explicitly to the text as the basis for answers.", gradeLevel: "G3", domain: "READING", subject: "ENGLISH", difficulty: 5, prerequisiteCodes: ["ELA-2.R.1"] },
  { nodeCode: "ELA-3.R.2", title: "Recount Fables and Folktales", description: "Recount stories including fables, folktales, and myths from diverse cultures. Determine the central message or lesson.", gradeLevel: "G3", domain: "READING", subject: "ENGLISH", difficulty: 6, prerequisiteCodes: ["ELA-3.R.1"] },
  { nodeCode: "ELA-3.R.3", title: "Cause and Effect in Informational Text", description: "Describe the relationship between a series of historical events, scientific ideas, or concepts using language of cause and effect.", gradeLevel: "G3", domain: "READING", subject: "ENGLISH", difficulty: 6, prerequisiteCodes: ["ELA-2.R.4"] },
  { nodeCode: "ELA-3.R.4", title: "Compare and Contrast Topics", description: "Compare and contrast the most important points and key details presented in two texts on the same topic.", gradeLevel: "G3", domain: "READING", subject: "ENGLISH", difficulty: 6, prerequisiteCodes: ["ELA-2.R.3"] },
  { nodeCode: "ELA-3.R.5", title: "Distinguish Point of View", description: "Distinguish their own point of view from that of the narrator or those of the characters.", gradeLevel: "G3", domain: "READING", subject: "ENGLISH", difficulty: 7, prerequisiteCodes: ["ELA-3.R.2"] },

  // ── G3 Writing (3) ──
  { nodeCode: "ELA-3.W.1", title: "Write Opinion Pieces with Reasons", description: "Write opinion pieces supporting a point of view with reasons, using linking words, and providing a concluding statement.", gradeLevel: "G3", domain: "WRITING", subject: "ENGLISH", difficulty: 6, prerequisiteCodes: ["ELA-2.W.1"] },
  { nodeCode: "ELA-3.W.2", title: "Write Informational Texts with Facts", description: "Write informational texts examining a topic, conveying ideas and information clearly with grouped information and illustrations.", gradeLevel: "G3", domain: "WRITING", subject: "ENGLISH", difficulty: 6, prerequisiteCodes: ["ELA-2.W.2"] },
  { nodeCode: "ELA-3.W.3", title: "Write Narratives with Dialogue", description: "Write narratives to develop real or imagined experiences using effective technique, descriptive details, and clear event sequences.", gradeLevel: "G3", domain: "WRITING", subject: "ENGLISH", difficulty: 7, prerequisiteCodes: ["ELA-2.W.3", "ELA-3.G.5"] },

  // ── G3 Vocabulary (2) ──
  { nodeCode: "ELA-3.V.1", title: "Prefixes and Suffixes", description: "Determine the meaning of a new word formed when a known affix is added to a known word. Use common prefixes and suffixes.", gradeLevel: "G3", domain: "VOCABULARY", subject: "ENGLISH", difficulty: 5, prerequisiteCodes: ["ELA-2.V.1"] },
  { nodeCode: "ELA-3.V.2", title: "Synonyms and Antonyms", description: "Distinguish the literal and nonliteral meanings of words and phrases. Identify real-life connections between words and their use.", gradeLevel: "G3", domain: "VOCABULARY", subject: "ENGLISH", difficulty: 5, prerequisiteCodes: ["ELA-2.V.1"] },

  // ═══════════════════════════════════════════════════════════
  // GRADE 4 (16 nodes)
  // ═══════════════════════════════════════════════════════════

  // ── G4 Grammar (5) ──
  { nodeCode: "ELA-4.G.1", title: "Relative Pronouns and Adverbs", description: "Use relative pronouns (who, whose, whom, which, that) and relative adverbs (where, when, why).", gradeLevel: "G4", domain: "GRAMMAR", subject: "ENGLISH", difficulty: 6, prerequisiteCodes: ["ELA-3.G.2", "ELA-3.G.3"] },
  { nodeCode: "ELA-4.G.2", title: "Progressive Verb Tenses", description: "Form and use the progressive verb tenses (e.g., I was walking; I am walking; I will be walking).", gradeLevel: "G4", domain: "GRAMMAR", subject: "ENGLISH", difficulty: 7, prerequisiteCodes: ["ELA-3.G.1"] },
  { nodeCode: "ELA-4.G.3", title: "Prepositional Phrases", description: "Produce complete sentences, recognizing and correcting inappropriate fragments and run-ons. Use prepositional phrases correctly.", gradeLevel: "G4", domain: "GRAMMAR", subject: "ENGLISH", difficulty: 7, prerequisiteCodes: ["ELA-3.G.5"] },
  { nodeCode: "ELA-4.G.4", title: "Comma Rules and Quotation Marks", description: "Use correct capitalization. Use commas and quotation marks to mark direct speech and quotations from a text.", gradeLevel: "G4", domain: "GRAMMAR", subject: "ENGLISH", difficulty: 7, prerequisiteCodes: ["ELA-3.G.5"] },
  { nodeCode: "ELA-4.G.5", title: "Run-On Sentences and Fragments", description: "Produce complete sentences, recognizing and correcting inappropriate fragments and run-ons.", gradeLevel: "G4", domain: "GRAMMAR", subject: "ENGLISH", difficulty: 7, prerequisiteCodes: ["ELA-4.G.3", "ELA-4.G.4"] },

  // ── G4 Reading (5) ──
  { nodeCode: "ELA-4.R.1", title: "Refer to Details and Examples in Text", description: "Refer to details and examples in a text when explaining what the text says explicitly and when drawing inferences.", gradeLevel: "G4", domain: "READING", subject: "ENGLISH", difficulty: 6, prerequisiteCodes: ["ELA-3.R.1"] },
  { nodeCode: "ELA-4.R.2", title: "Determine Theme of a Story", description: "Determine a theme of a story, drama, or poem from details in the text. Summarize the text.", gradeLevel: "G4", domain: "READING", subject: "ENGLISH", difficulty: 7, prerequisiteCodes: ["ELA-3.R.2", "ELA-4.R.1"] },
  { nodeCode: "ELA-4.R.3", title: "Determine Author's Purpose", description: "Explain events, procedures, ideas, or concepts in a text including what happened and why based on information in the text.", gradeLevel: "G4", domain: "READING", subject: "ENGLISH", difficulty: 7, prerequisiteCodes: ["ELA-3.R.3", "ELA-4.R.1"] },
  { nodeCode: "ELA-4.R.4", title: "Explain Text Structure", description: "Describe the overall structure of events, ideas, concepts, or information in a text. Compare firsthand and secondhand accounts.", gradeLevel: "G4", domain: "READING", subject: "ENGLISH", difficulty: 7, prerequisiteCodes: ["ELA-4.R.3"] },
  { nodeCode: "ELA-4.R.5", title: "Poetry: Verse, Rhythm, Meter", description: "Explain major differences between poems, drama, and prose. Refer to structural elements of poems and drama.", gradeLevel: "G4", domain: "READING", subject: "ENGLISH", difficulty: 7, prerequisiteCodes: ["ELA-4.R.2"] },

  // ── G4 Writing (3) ──
  { nodeCode: "ELA-4.W.1", title: "Write Opinion Essays with Evidence", description: "Write opinion pieces on topics or texts, supporting a point of view with reasons and information.", gradeLevel: "G4", domain: "WRITING", subject: "ENGLISH", difficulty: 7, prerequisiteCodes: ["ELA-3.W.1"] },
  { nodeCode: "ELA-4.W.2", title: "Write Research Reports", description: "Write informative/explanatory texts to examine a topic and convey ideas clearly. Conduct short research projects.", gradeLevel: "G4", domain: "WRITING", subject: "ENGLISH", difficulty: 8, prerequisiteCodes: ["ELA-3.W.2", "ELA-4.R.4"] },
  { nodeCode: "ELA-4.W.3", title: "Write Narratives with Descriptive Details", description: "Write narratives to develop real or imagined experiences using dialogue, description, and pacing.", gradeLevel: "G4", domain: "WRITING", subject: "ENGLISH", difficulty: 8, prerequisiteCodes: ["ELA-3.W.3", "ELA-4.G.4"] },

  // ── G4 Vocabulary (3) ──
  { nodeCode: "ELA-4.V.1", title: "Greek and Latin Word Roots", description: "Use common, grade-appropriate Greek and Latin affixes and roots as clues to the meaning of a word.", gradeLevel: "G4", domain: "VOCABULARY", subject: "ENGLISH", difficulty: 6, prerequisiteCodes: ["ELA-3.V.1"] },
  { nodeCode: "ELA-4.V.2", title: "Similes and Metaphors", description: "Demonstrate understanding of figurative language, word relationships, and nuances. Explain the meaning of simple similes and metaphors.", gradeLevel: "G4", domain: "VOCABULARY", subject: "ENGLISH", difficulty: 7, prerequisiteCodes: ["ELA-3.V.2"] },
  { nodeCode: "ELA-4.V.3", title: "Reference Materials for Word Meaning", description: "Consult reference materials (dictionaries, glossaries, thesauruses) to find pronunciation and determine meaning of key words.", gradeLevel: "G4", domain: "VOCABULARY", subject: "ENGLISH", difficulty: 6, prerequisiteCodes: ["ELA-3.V.1"] },

  // ═══════════════════════════════════════════════════════════
  // GRADE 5 (17 nodes)
  // ═══════════════════════════════════════════════════════════

  // ── G5 Grammar (5) ──
  { nodeCode: "ELA-5.G.1", title: "Perfect Verb Tenses", description: "Form and use the perfect verb tenses (e.g., I had walked; I have walked; I will have walked).", gradeLevel: "G5", domain: "GRAMMAR", subject: "ENGLISH", difficulty: 7, prerequisiteCodes: ["ELA-4.G.2"] },
  { nodeCode: "ELA-5.G.2", title: "Active and Passive Voice", description: "Recognize variations from standard English in writing and speaking. Use active and passive voice appropriately.", gradeLevel: "G5", domain: "GRAMMAR", subject: "ENGLISH", difficulty: 8, prerequisiteCodes: ["ELA-5.G.1"] },
  { nodeCode: "ELA-5.G.3", title: "Correlative Conjunctions", description: "Use correlative conjunctions (e.g., either/or, neither/nor). Produce simple, compound, and complex sentences.", gradeLevel: "G5", domain: "GRAMMAR", subject: "ENGLISH", difficulty: 7, prerequisiteCodes: ["ELA-4.G.3"] },
  { nodeCode: "ELA-5.G.4", title: "Use Commas and Semicolons", description: "Use punctuation to separate items in a series. Use a comma to separate an introductory element and to set off tag questions.", gradeLevel: "G5", domain: "GRAMMAR", subject: "ENGLISH", difficulty: 8, prerequisiteCodes: ["ELA-4.G.4", "ELA-4.G.5"] },
  { nodeCode: "ELA-5.G.5", title: "Dangling and Misplaced Modifiers", description: "Expand, combine, and reduce sentences for meaning, reader interest, and style. Correct dangling and misplaced modifiers.", gradeLevel: "G5", domain: "GRAMMAR", subject: "ENGLISH", difficulty: 8, prerequisiteCodes: ["ELA-5.G.2", "ELA-5.G.3"] },

  // ── G5 Reading (5) ──
  { nodeCode: "ELA-5.R.1", title: "Quote Accurately from Text", description: "Quote accurately from a text when explaining what the text says explicitly and when drawing inferences.", gradeLevel: "G5", domain: "READING", subject: "ENGLISH", difficulty: 7, prerequisiteCodes: ["ELA-4.R.1"] },
  { nodeCode: "ELA-5.R.2", title: "Summarize Text Objectively", description: "Determine two or more main ideas of a text and explain how they are supported by key details. Summarize the text.", gradeLevel: "G5", domain: "READING", subject: "ENGLISH", difficulty: 7, prerequisiteCodes: ["ELA-5.R.1"] },
  { nodeCode: "ELA-5.R.3", title: "Analyze Multiple Accounts of Same Topic", description: "Analyze multiple accounts of the same event or topic, noting important similarities and differences in the point of view.", gradeLevel: "G5", domain: "READING", subject: "ENGLISH", difficulty: 8, prerequisiteCodes: ["ELA-4.R.3", "ELA-5.R.2"] },
  { nodeCode: "ELA-5.R.4", title: "Literary Elements: Plot, Setting, Character", description: "Compare and contrast stories in the same genre on their approaches to similar themes and topics.", gradeLevel: "G5", domain: "READING", subject: "ENGLISH", difficulty: 8, prerequisiteCodes: ["ELA-4.R.2", "ELA-5.R.1"] },
  { nodeCode: "ELA-5.R.5", title: "Evaluate Arguments and Claims", description: "Explain how an author uses reasons and evidence to support particular points in a text. Identify which reasons support which points.", gradeLevel: "G5", domain: "READING", subject: "ENGLISH", difficulty: 9, prerequisiteCodes: ["ELA-5.R.3"] },

  // ── G5 Writing (4) ──
  { nodeCode: "ELA-5.W.1", title: "Write Argumentative Essays", description: "Write opinion pieces on topics or texts, supporting a point of view with reasons and information logically grouped.", gradeLevel: "G5", domain: "WRITING", subject: "ENGLISH", difficulty: 8, prerequisiteCodes: ["ELA-4.W.1"] },
  { nodeCode: "ELA-5.W.2", title: "Write Informational Essays with Sources", description: "Write informative/explanatory texts to examine a topic conveying ideas and information clearly. Draw evidence from literary or informational texts.", gradeLevel: "G5", domain: "WRITING", subject: "ENGLISH", difficulty: 9, prerequisiteCodes: ["ELA-4.W.2", "ELA-5.R.2"] },
  { nodeCode: "ELA-5.W.3", title: "Write Narratives with Pacing", description: "Write narratives using effective technique, descriptive details, clear event sequences, dialogue, pacing, and description.", gradeLevel: "G5", domain: "WRITING", subject: "ENGLISH", difficulty: 9, prerequisiteCodes: ["ELA-4.W.3", "ELA-5.G.4"] },
  { nodeCode: "ELA-5.W.4", title: "Revise and Edit Writing", description: "With guidance and support, develop and strengthen writing by planning, revising, editing, rewriting, or trying a new approach.", gradeLevel: "G5", domain: "WRITING", subject: "ENGLISH", difficulty: 8, prerequisiteCodes: ["ELA-5.W.1", "ELA-5.G.5"] },

  // ── G5 Vocabulary (3) ──
  { nodeCode: "ELA-5.V.1", title: "Academic Vocabulary", description: "Acquire and use accurately grade-appropriate general academic and domain-specific words and phrases.", gradeLevel: "G5", domain: "VOCABULARY", subject: "ENGLISH", difficulty: 7, prerequisiteCodes: ["ELA-4.V.1"] },
  { nodeCode: "ELA-5.V.2", title: "Figurative Language: Idioms, Proverbs", description: "Interpret figurative language including similes, metaphors, idioms, adages, and proverbs in context.", gradeLevel: "G5", domain: "VOCABULARY", subject: "ENGLISH", difficulty: 8, prerequisiteCodes: ["ELA-4.V.2"] },
  { nodeCode: "ELA-5.V.3", title: "Word Relationships and Nuances", description: "Demonstrate understanding of figurative language, word relationships, and nuances in word meanings.", gradeLevel: "G5", domain: "VOCABULARY", subject: "ENGLISH", difficulty: 8, prerequisiteCodes: ["ELA-4.V.3", "ELA-5.V.1"] },
];

// ─── Handler ───

export async function POST(request: Request) {
  if (!verifyAdminKey(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const results = { created: 0, updated: 0, linked: 0, errors: [] as string[] };

    // 1. Upsert all nodes
    for (const node of elaNodes) {
      try {
        await prisma.knowledgeNode.upsert({
          where: { nodeCode: node.nodeCode },
          update: {
            title: node.title,
            description: node.description,
            gradeLevel: node.gradeLevel as never,
            domain: node.domain as never,
            subject: node.subject as never,
            difficulty: node.difficulty,
          },
          create: {
            nodeCode: node.nodeCode,
            title: node.title,
            description: node.description,
            gradeLevel: node.gradeLevel as never,
            domain: node.domain as never,
            subject: node.subject as never,
            difficulty: node.difficulty,
          },
        });
        results.created++;
      } catch (err) {
        results.errors.push(
          `Node ${node.nodeCode}: ${err instanceof Error ? err.message : "unknown error"}`
        );
      }
    }

    // 2. Link prerequisites
    for (const node of elaNodes) {
      if (node.prerequisiteCodes.length === 0) continue;

      try {
        const currentNode = await prisma.knowledgeNode.findUnique({
          where: { nodeCode: node.nodeCode },
        });
        if (!currentNode) continue;

        const prerequisites = await prisma.knowledgeNode.findMany({
          where: { nodeCode: { in: node.prerequisiteCodes } },
        });

        await prisma.knowledgeNode.update({
          where: { id: currentNode.id },
          data: {
            prerequisites: {
              set: prerequisites.map((p) => ({ id: p.id })),
            },
          },
        });
        results.linked++;
      } catch (err) {
        results.errors.push(
          `Prerequisites for ${node.nodeCode}: ${err instanceof Error ? err.message : "unknown error"}`
        );
      }
    }

    // Count G2-G5 nodes
    const g2g5Count = elaNodes.filter(
      (n) => ["G2", "G3", "G4", "G5"].includes(n.gradeLevel)
    ).length;

    return NextResponse.json({
      success: true,
      total: elaNodes.length,
      g2g5Nodes: g2g5Count,
      foundationNodes: elaNodes.length - g2g5Count,
      upserted: results.created,
      prerequisitesLinked: results.linked,
      errors: results.errors.length > 0 ? results.errors : undefined,
    });
  } catch (error) {
    console.error("Seed ELA curriculum error:", error);
    return NextResponse.json(
      { error: "Seed failed" },
      { status: 500 }
    );
  }
}
