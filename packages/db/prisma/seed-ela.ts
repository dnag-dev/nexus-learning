/**
 * ELA Knowledge Node Seed Script
 *
 * Seeds English Language Arts nodes into the knowledge graph.
 * All existing math nodes remain untouched.
 * Run: npx ts-node --project packages/db/tsconfig.json packages/db/prisma/seed-ela.ts
 */

import { PrismaClient, GradeLevel, KnowledgeDomain, Subject } from "@prisma/client";

const prisma = new PrismaClient();

interface ELANodeSeed {
  nodeCode: string;
  title: string;
  description: string;
  gradeLevel: GradeLevel;
  domain: KnowledgeDomain;
  subject: Subject;
  difficulty: number;
  prerequisiteCodes: string[];
}

const elaNodes: ELANodeSeed[] = [
  // ─── GRADE K-2: FOUNDATIONAL ───
  {
    nodeCode: "ela_nouns_basic",
    title: "What is a Noun",
    description:
      "A noun is a word that names a person, place, thing, or idea. Examples: dog, school, happiness.",
    gradeLevel: GradeLevel.G1,
    domain: KnowledgeDomain.GRAMMAR,
    subject: Subject.ENGLISH,
    difficulty: 1,
    prerequisiteCodes: [],
  },
  {
    nodeCode: "ela_verbs_basic",
    title: "What is a Verb",
    description:
      "A verb is a word that shows action or a state of being. Examples: run, jump, is, are.",
    gradeLevel: GradeLevel.G1,
    domain: KnowledgeDomain.GRAMMAR,
    subject: Subject.ENGLISH,
    difficulty: 1,
    prerequisiteCodes: [],
  },
  {
    nodeCode: "ela_sentences_basic",
    title: "What Makes a Sentence",
    description:
      "A sentence is a group of words that expresses a complete thought. It starts with a capital letter and ends with punctuation. Every sentence needs a subject and a verb.",
    gradeLevel: GradeLevel.G1,
    domain: KnowledgeDomain.GRAMMAR,
    subject: Subject.ENGLISH,
    difficulty: 1,
    prerequisiteCodes: [],
  },
  {
    nodeCode: "ela_adjectives_basic",
    title: "What is an Adjective",
    description:
      "An adjective is a word that describes a noun. It tells us what kind, how many, or which one. Examples: big, red, three, that.",
    gradeLevel: GradeLevel.G2,
    domain: KnowledgeDomain.GRAMMAR,
    subject: Subject.ENGLISH,
    difficulty: 2,
    prerequisiteCodes: ["ela_nouns_basic"],
  },

  // ─── GRADE 3-5: PARTS OF SPEECH ───
  {
    nodeCode: "ela_nouns_advanced",
    title: "Proper, Common, and Collective Nouns",
    description:
      "Common nouns name general things (city, dog). Proper nouns name specific things and are capitalized (Chicago, Rex). Collective nouns name groups (team, flock, family).",
    gradeLevel: GradeLevel.G3,
    domain: KnowledgeDomain.GRAMMAR,
    subject: Subject.ENGLISH,
    difficulty: 3,
    prerequisiteCodes: ["ela_nouns_basic"],
  },
  {
    nodeCode: "ela_verbs_advanced",
    title: "Action, Linking, and Helping Verbs",
    description:
      "Action verbs show what someone does (run, write). Linking verbs connect the subject to a description (is, seems, became). Helping verbs work with main verbs to show tense or possibility (have, will, can).",
    gradeLevel: GradeLevel.G3,
    domain: KnowledgeDomain.GRAMMAR,
    subject: Subject.ENGLISH,
    difficulty: 3,
    prerequisiteCodes: ["ela_verbs_basic"],
  },
  {
    nodeCode: "ela_pronouns",
    title: "Subject and Object Pronouns",
    description:
      "Subject pronouns replace the subject of a sentence (I, you, he, she, it, we, they). Object pronouns replace the object (me, you, him, her, it, us, them). Choosing the right pronoun depends on its role in the sentence.",
    gradeLevel: GradeLevel.G4,
    domain: KnowledgeDomain.GRAMMAR,
    subject: Subject.ENGLISH,
    difficulty: 3,
    prerequisiteCodes: ["ela_nouns_advanced"],
  },
  {
    nodeCode: "ela_adjectives_advanced",
    title: "Comparative and Superlative Adjectives",
    description:
      "Comparative adjectives compare two things (bigger, more beautiful). Superlative adjectives compare three or more things (biggest, most beautiful). Short adjectives add -er/-est; longer adjectives use more/most.",
    gradeLevel: GradeLevel.G4,
    domain: KnowledgeDomain.GRAMMAR,
    subject: Subject.ENGLISH,
    difficulty: 4,
    prerequisiteCodes: ["ela_adjectives_basic"],
  },
  {
    nodeCode: "ela_adverbs",
    title: "Adverbs of Time, Place, and Manner",
    description:
      "Adverbs modify verbs, adjectives, or other adverbs. Adverbs of time tell when (yesterday, soon). Adverbs of place tell where (here, outside). Adverbs of manner tell how (quickly, carefully).",
    gradeLevel: GradeLevel.G4,
    domain: KnowledgeDomain.GRAMMAR,
    subject: Subject.ENGLISH,
    difficulty: 4,
    prerequisiteCodes: ["ela_verbs_advanced"],
  },
  {
    nodeCode: "ela_prepositions",
    title: "Prepositions and Prepositional Phrases",
    description:
      "A preposition shows the relationship between a noun/pronoun and another word in the sentence (in, on, at, with, by, for, about). A prepositional phrase starts with a preposition and ends with a noun or pronoun (in the park, with my friend).",
    gradeLevel: GradeLevel.G5,
    domain: KnowledgeDomain.GRAMMAR,
    subject: Subject.ENGLISH,
    difficulty: 4,
    prerequisiteCodes: ["ela_adverbs"],
  },
  {
    nodeCode: "ela_conjunctions",
    title: "Coordinating and Subordinating Conjunctions",
    description:
      "Coordinating conjunctions join equal parts of a sentence (FANBOYS: for, and, nor, but, or, yet, so). Subordinating conjunctions join a dependent clause to an independent clause (because, although, when, while, if, since).",
    gradeLevel: GradeLevel.G5,
    domain: KnowledgeDomain.GRAMMAR,
    subject: Subject.ENGLISH,
    difficulty: 5,
    prerequisiteCodes: ["ela_prepositions"],
  },

  // ─── GRADE 6-8: SENTENCE STRUCTURE ───
  {
    nodeCode: "ela_sentence_subject_predicate",
    title: "Identifying Subject and Predicate",
    description:
      "Every sentence has two main parts: the subject (who or what the sentence is about) and the predicate (what the subject does or is). The simple subject is the main noun; the simple predicate is the main verb.",
    gradeLevel: GradeLevel.G6,
    domain: KnowledgeDomain.GRAMMAR,
    subject: Subject.ENGLISH,
    difficulty: 5,
    prerequisiteCodes: ["ela_prepositions", "ela_conjunctions"],
  },
  {
    nodeCode: "ela_sentence_simple",
    title: "Simple Sentences",
    description:
      "A simple sentence has one independent clause — one subject and one predicate. It expresses a complete thought. Example: 'The cat sat on the mat.' Simple sentences can have compound subjects or compound verbs.",
    gradeLevel: GradeLevel.G6,
    domain: KnowledgeDomain.GRAMMAR,
    subject: Subject.ENGLISH,
    difficulty: 5,
    prerequisiteCodes: ["ela_sentence_subject_predicate"],
  },
  {
    nodeCode: "ela_sentence_compound",
    title: "Compound Sentences",
    description:
      "A compound sentence joins two independent clauses using a coordinating conjunction (FANBOYS) with a comma, or using a semicolon. Example: 'I like reading, but my sister prefers drawing.'",
    gradeLevel: GradeLevel.G7,
    domain: KnowledgeDomain.GRAMMAR,
    subject: Subject.ENGLISH,
    difficulty: 6,
    prerequisiteCodes: ["ela_sentence_simple"],
  },
  {
    nodeCode: "ela_sentence_complex",
    title: "Complex Sentences",
    description:
      "A complex sentence has one independent clause and at least one dependent clause, joined by a subordinating conjunction. Example: 'Although it was raining, we went to the park.'",
    gradeLevel: GradeLevel.G7,
    domain: KnowledgeDomain.GRAMMAR,
    subject: Subject.ENGLISH,
    difficulty: 6,
    prerequisiteCodes: ["ela_sentence_compound"],
  },
  {
    nodeCode: "ela_sentence_fragments",
    title: "Identifying and Fixing Sentence Fragments",
    description:
      "A sentence fragment is a group of words that looks like a sentence but is missing a subject, a verb, or a complete thought. Fragments can be fixed by adding the missing part or connecting them to a nearby sentence.",
    gradeLevel: GradeLevel.G7,
    domain: KnowledgeDomain.GRAMMAR,
    subject: Subject.ENGLISH,
    difficulty: 6,
    prerequisiteCodes: ["ela_sentence_simple"],
  },
  {
    nodeCode: "ela_punctuation_commas",
    title: "Comma Rules",
    description:
      "Commas separate items in a list, join independent clauses before a conjunction, follow introductory elements, and set off nonessential information. Correct comma use prevents confusion and run-on sentences.",
    gradeLevel: GradeLevel.G6,
    domain: KnowledgeDomain.GRAMMAR,
    subject: Subject.ENGLISH,
    difficulty: 5,
    prerequisiteCodes: ["ela_sentence_subject_predicate"],
  },
  {
    nodeCode: "ela_punctuation_apostrophe",
    title: "Apostrophes and Possession",
    description:
      "Apostrophes show possession (the dog's bone, the girls' team) and create contractions (don't, it's). Remember: it's = it is, while its = possessive. Singular possessive adds 's; plural possessive ending in s adds just an apostrophe.",
    gradeLevel: GradeLevel.G6,
    domain: KnowledgeDomain.GRAMMAR,
    subject: Subject.ENGLISH,
    difficulty: 5,
    prerequisiteCodes: ["ela_sentence_subject_predicate"],
  },

  // ─── GRADE 9-10: ADVANCED ───
  {
    nodeCode: "ela_sentence_compound_complex",
    title: "Compound-Complex Sentences",
    description:
      "A compound-complex sentence has at least two independent clauses and at least one dependent clause. Example: 'Although I was tired, I finished my homework, and then I went to bed.'",
    gradeLevel: GradeLevel.G9,
    domain: KnowledgeDomain.GRAMMAR,
    subject: Subject.ENGLISH,
    difficulty: 7,
    prerequisiteCodes: ["ela_sentence_compound", "ela_sentence_complex"],
  },
  {
    nodeCode: "ela_parallel_structure",
    title: "Parallel Structure in Sentences",
    description:
      "Parallel structure means using the same grammatical form for items in a list or comparison. Correct: 'She likes reading, writing, and drawing.' Incorrect: 'She likes reading, to write, and drawing.'",
    gradeLevel: GradeLevel.G9,
    domain: KnowledgeDomain.GRAMMAR,
    subject: Subject.ENGLISH,
    difficulty: 7,
    prerequisiteCodes: ["ela_sentence_compound_complex"],
  },
  {
    nodeCode: "ela_active_passive_voice",
    title: "Active vs Passive Voice",
    description:
      "In active voice, the subject performs the action: 'The dog chased the cat.' In passive voice, the subject receives the action: 'The cat was chased by the dog.' Active voice is usually clearer and more direct.",
    gradeLevel: GradeLevel.G9,
    domain: KnowledgeDomain.GRAMMAR,
    subject: Subject.ENGLISH,
    difficulty: 7,
    prerequisiteCodes: ["ela_sentence_compound_complex"],
  },
  {
    nodeCode: "ela_clauses",
    title: "Independent vs Dependent Clauses",
    description:
      "An independent clause can stand alone as a sentence. A dependent clause cannot stand alone — it begins with a subordinating conjunction or relative pronoun and needs an independent clause to complete its meaning.",
    gradeLevel: GradeLevel.G10,
    domain: KnowledgeDomain.GRAMMAR,
    subject: Subject.ENGLISH,
    difficulty: 8,
    prerequisiteCodes: ["ela_parallel_structure", "ela_active_passive_voice"],
  },
  {
    nodeCode: "ela_modifiers",
    title: "Misplaced and Dangling Modifiers",
    description:
      "A misplaced modifier is too far from the word it modifies, causing confusion. A dangling modifier has no word in the sentence to modify. Fix them by placing modifiers next to what they describe.",
    gradeLevel: GradeLevel.G10,
    domain: KnowledgeDomain.GRAMMAR,
    subject: Subject.ENGLISH,
    difficulty: 8,
    prerequisiteCodes: ["ela_clauses"],
  },
];

async function seedELA() {
  console.log("Seeding ELA knowledge nodes...");

  // Create all ELA nodes first
  for (const node of elaNodes) {
    await prisma.knowledgeNode.upsert({
      where: { nodeCode: node.nodeCode },
      update: {
        title: node.title,
        description: node.description,
        gradeLevel: node.gradeLevel,
        domain: node.domain,
        subject: node.subject,
        difficulty: node.difficulty,
      },
      create: {
        nodeCode: node.nodeCode,
        title: node.title,
        description: node.description,
        gradeLevel: node.gradeLevel,
        domain: node.domain,
        subject: node.subject,
        difficulty: node.difficulty,
      },
    });
    console.log(`  Created ELA node: ${node.nodeCode} - ${node.title}`);
  }

  // Now create prerequisite relationships
  for (const node of elaNodes) {
    if (node.prerequisiteCodes.length > 0) {
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
            connect: prerequisites.map((p) => ({ id: p.id })),
          },
        },
      });
      console.log(
        `  Linked ${node.nodeCode} prerequisites: ${node.prerequisiteCodes.join(", ")}`
      );
    }
  }

  // Verify: count ELA nodes
  const elaCount = await prisma.knowledgeNode.count({
    where: { subject: "ENGLISH" },
  });
  console.log(`\nELA seed complete! ${elaCount} ELA nodes in database.`);

  // Verify math nodes untouched
  const mathCount = await prisma.knowledgeNode.count({
    where: { subject: "MATH" },
  });
  console.log(`Math nodes still intact: ${mathCount} nodes.`);
}

seedELA()
  .catch((e) => {
    console.error("ELA seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
