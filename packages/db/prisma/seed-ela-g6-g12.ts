/**
 * Seed: ELA Knowledge Nodes G6-G12
 *
 * ~70 nodes covering middle school through high school ELA:
 * G6: Textual evidence, main idea, vocabulary in context, narrative writing
 * G7: Author's purpose, compare texts, argument writing
 * G8: Rhetoric, unreliable narrator, research synthesis
 * G9-G10: Literary analysis, rhetorical analysis, argument essays
 * G11-G12: AP-level analysis, synthesis essays, critical theory
 *
 * Prerequisite chains connect back to existing G5 ELA nodes.
 */

import { PrismaClient, GradeLevel, KnowledgeDomain } from "@prisma/client";

const prisma = new PrismaClient();

interface NodeSeed {
  nodeCode: string;
  title: string;
  description: string;
  gradeLevel: GradeLevel;
  domain: KnowledgeDomain;
  difficulty: number;
  prerequisiteCodes: string[];
  subject: "ENGLISH";
}

const elaNodes: NodeSeed[] = [
  // ═══ Grade 6 ELA ═══

  {
    nodeCode: "6.RL.1",
    title: "Cite Textual Evidence",
    description: "Cite textual evidence to support analysis of what the text says explicitly as well as inferences drawn from the text.",
    gradeLevel: GradeLevel.G6, domain: KnowledgeDomain.READING, difficulty: 2, prerequisiteCodes: ["5.RL.1"], subject: "ENGLISH",
  },
  {
    nodeCode: "6.RL.2",
    title: "Determine Theme and Summarize",
    description: "Determine a theme or central idea of a text and how it is conveyed through particular details; provide a summary.",
    gradeLevel: GradeLevel.G6, domain: KnowledgeDomain.READING, difficulty: 3, prerequisiteCodes: ["6.RL.1"], subject: "ENGLISH",
  },
  {
    nodeCode: "6.RL.4",
    title: "Figurative and Connotative Meaning",
    description: "Determine the meaning of words and phrases as they are used in a text, including figurative and connotative meanings.",
    gradeLevel: GradeLevel.G6, domain: KnowledgeDomain.VOCABULARY, difficulty: 3, prerequisiteCodes: ["5.V.1"], subject: "ENGLISH",
  },
  {
    nodeCode: "6.RL.6",
    title: "Point of View and Narrative Voice",
    description: "Explain how an author develops the point of view of the narrator or speaker in a text.",
    gradeLevel: GradeLevel.G6, domain: KnowledgeDomain.LITERATURE, difficulty: 3, prerequisiteCodes: ["6.RL.2"], subject: "ENGLISH",
  },
  {
    nodeCode: "6.W.1",
    title: "Write Arguments with Claims and Evidence",
    description: "Write arguments to support claims with clear reasons and relevant evidence.",
    gradeLevel: GradeLevel.G6, domain: KnowledgeDomain.WRITING, difficulty: 3, prerequisiteCodes: ["5.W.1"], subject: "ENGLISH",
  },
  {
    nodeCode: "6.W.2",
    title: "Write Informative/Explanatory Texts",
    description: "Write informative/explanatory texts to examine a topic and convey ideas through the selection and organization of content.",
    gradeLevel: GradeLevel.G6, domain: KnowledgeDomain.WRITING, difficulty: 3, prerequisiteCodes: ["6.W.1"], subject: "ENGLISH",
  },
  {
    nodeCode: "6.W.3",
    title: "Write Narratives",
    description: "Write narratives to develop real or imagined experiences using effective technique, relevant descriptive details, and well-structured events.",
    gradeLevel: GradeLevel.G6, domain: KnowledgeDomain.COMPOSITION, difficulty: 3, prerequisiteCodes: ["5.W.1"], subject: "ENGLISH",
  },
  {
    nodeCode: "6.L.4",
    title: "Determine Word Meaning Using Context and Morphology",
    description: "Determine or clarify the meaning of unknown words using context clues, affixes, and roots.",
    gradeLevel: GradeLevel.G6, domain: KnowledgeDomain.VOCABULARY, difficulty: 2, prerequisiteCodes: ["5.V.1"], subject: "ENGLISH",
  },

  // ═══ Grade 7 ELA ═══

  {
    nodeCode: "7.RL.1",
    title: "Cite Multiple Textual Evidences",
    description: "Cite several pieces of textual evidence to support analysis of what the text says explicitly as well as inferences drawn.",
    gradeLevel: GradeLevel.G7, domain: KnowledgeDomain.READING, difficulty: 3, prerequisiteCodes: ["6.RL.1"], subject: "ENGLISH",
  },
  {
    nodeCode: "7.RL.3",
    title: "Analyze Character and Plot Interaction",
    description: "Analyze how particular elements of a story or drama interact (e.g., how setting shapes the characters or plot).",
    gradeLevel: GradeLevel.G7, domain: KnowledgeDomain.LITERATURE, difficulty: 3, prerequisiteCodes: ["6.RL.6"], subject: "ENGLISH",
  },
  {
    nodeCode: "7.RI.6",
    title: "Determine Author's Point of View and Purpose",
    description: "Determine an author's point of view or purpose in a text and analyze how the author distinguishes their position from others.",
    gradeLevel: GradeLevel.G7, domain: KnowledgeDomain.READING, difficulty: 3, prerequisiteCodes: ["7.RL.1"], subject: "ENGLISH",
  },
  {
    nodeCode: "7.RI.8",
    title: "Evaluate Arguments and Claims",
    description: "Trace and evaluate the argument and specific claims in a text, assessing whether the reasoning is sound and the evidence is relevant.",
    gradeLevel: GradeLevel.G7, domain: KnowledgeDomain.RHETORIC, difficulty: 4, prerequisiteCodes: ["7.RI.6"], subject: "ENGLISH",
  },
  {
    nodeCode: "7.RI.9",
    title: "Compare and Contrast Texts",
    description: "Analyze how two or more authors writing about the same topic shape their presentations of key information.",
    gradeLevel: GradeLevel.G7, domain: KnowledgeDomain.READING, difficulty: 4, prerequisiteCodes: ["7.RL.1"], subject: "ENGLISH",
  },
  {
    nodeCode: "7.W.1",
    title: "Write Sustained Arguments",
    description: "Write arguments to support claims with clear reasons and relevant evidence, acknowledging alternate or opposing claims.",
    gradeLevel: GradeLevel.G7, domain: KnowledgeDomain.WRITING, difficulty: 4, prerequisiteCodes: ["6.W.1"], subject: "ENGLISH",
  },
  {
    nodeCode: "7.W.7",
    title: "Conduct Short Research Projects",
    description: "Conduct short research projects to answer a question, drawing on several sources and generating additional related questions for further research.",
    gradeLevel: GradeLevel.G7, domain: KnowledgeDomain.RESEARCH, difficulty: 3, prerequisiteCodes: ["6.W.2"], subject: "ENGLISH",
  },
  {
    nodeCode: "7.L.5",
    title: "Figurative Language and Word Relationships",
    description: "Demonstrate understanding of figurative language, word relationships, and nuances in word meanings.",
    gradeLevel: GradeLevel.G7, domain: KnowledgeDomain.VOCABULARY, difficulty: 3, prerequisiteCodes: ["6.RL.4", "6.L.4"], subject: "ENGLISH",
  },

  // ═══ Grade 8 ELA ═══

  {
    nodeCode: "8.RL.3",
    title: "Analyze Dialogue and Character Development",
    description: "Analyze how particular lines of dialogue or incidents in a story or drama propel the action, reveal character, or provoke a decision.",
    gradeLevel: GradeLevel.G8, domain: KnowledgeDomain.LITERATURE, difficulty: 4, prerequisiteCodes: ["7.RL.3"], subject: "ENGLISH",
  },
  {
    nodeCode: "8.RL.6",
    title: "Analyze Point of View Differences",
    description: "Analyze how differences in the points of view of the characters and the audience or reader create dramatic irony or suspense.",
    gradeLevel: GradeLevel.G8, domain: KnowledgeDomain.LITERATURE, difficulty: 4, prerequisiteCodes: ["8.RL.3"], subject: "ENGLISH",
  },
  {
    nodeCode: "8.RI.5",
    title: "Analyze Text Structure",
    description: "Analyze in detail the structure of a specific paragraph in a text, including the role of particular sentences in developing and refining a key concept.",
    gradeLevel: GradeLevel.G8, domain: KnowledgeDomain.READING, difficulty: 4, prerequisiteCodes: ["7.RI.6"], subject: "ENGLISH",
  },
  {
    nodeCode: "8.RI.8",
    title: "Evaluate Reasoning in Arguments",
    description: "Delineate and evaluate the argument and specific claims in a text, assessing whether the reasoning is sound and the evidence is sufficient.",
    gradeLevel: GradeLevel.G8, domain: KnowledgeDomain.RHETORIC, difficulty: 4, prerequisiteCodes: ["7.RI.8"], subject: "ENGLISH",
  },
  {
    nodeCode: "8.W.1",
    title: "Write Arguments Acknowledging Counterclaims",
    description: "Write arguments to support claims with logical reasoning and relevant evidence, acknowledging and distinguishing the claim from alternate claims.",
    gradeLevel: GradeLevel.G8, domain: KnowledgeDomain.WRITING, difficulty: 4, prerequisiteCodes: ["7.W.1"], subject: "ENGLISH",
  },
  {
    nodeCode: "8.W.7",
    title: "Research Projects with Multiple Sources",
    description: "Conduct short research projects to answer a question, using multiple sources and assessing the credibility of each source.",
    gradeLevel: GradeLevel.G8, domain: KnowledgeDomain.RESEARCH, difficulty: 4, prerequisiteCodes: ["7.W.7"], subject: "ENGLISH",
  },
  {
    nodeCode: "8.L.5",
    title: "Interpret Figures of Speech",
    description: "Demonstrate understanding of figurative language, word relationships, and nuances including verbal irony, puns, and allusion.",
    gradeLevel: GradeLevel.G8, domain: KnowledgeDomain.VOCABULARY, difficulty: 4, prerequisiteCodes: ["7.L.5"], subject: "ENGLISH",
  },

  // ═══ Grade 9 ELA ═══

  {
    nodeCode: "9.RL.1",
    title: "Cite Strong Textual Evidence for Inference",
    description: "Cite strong and thorough textual evidence to support analysis of what the text says explicitly as well as inferences drawn from the text.",
    gradeLevel: GradeLevel.G9, domain: KnowledgeDomain.READING, difficulty: 4, prerequisiteCodes: ["8.RL.6"], subject: "ENGLISH",
  },
  {
    nodeCode: "9.RL.2",
    title: "Analyze Theme Development",
    description: "Determine a theme or central idea of a text and analyze in detail its development over the course of the text.",
    gradeLevel: GradeLevel.G9, domain: KnowledgeDomain.LITERATURE, difficulty: 4, prerequisiteCodes: ["9.RL.1"], subject: "ENGLISH",
  },
  {
    nodeCode: "9.RL.5",
    title: "Analyze Story Structure Choices",
    description: "Analyze how an author's choices concerning how to structure a text, order events, or manipulate time create effects such as mystery, tension, or surprise.",
    gradeLevel: GradeLevel.G9, domain: KnowledgeDomain.LITERATURE, difficulty: 4, prerequisiteCodes: ["8.RL.3"], subject: "ENGLISH",
  },
  {
    nodeCode: "9.RI.5",
    title: "Analyze Author's Rhetorical Choices",
    description: "Analyze in detail how an author's ideas or claims are developed and refined by particular sentences, paragraphs, or larger portions of a text.",
    gradeLevel: GradeLevel.G9, domain: KnowledgeDomain.RHETORIC, difficulty: 4, prerequisiteCodes: ["8.RI.5", "8.RI.8"], subject: "ENGLISH",
  },
  {
    nodeCode: "9.RI.6",
    title: "Determine Author's Purpose and Rhetoric",
    description: "Determine an author's point of view or purpose and analyze how rhetoric advances that point of view or purpose.",
    gradeLevel: GradeLevel.G9, domain: KnowledgeDomain.RHETORIC, difficulty: 4, prerequisiteCodes: ["9.RI.5"], subject: "ENGLISH",
  },
  {
    nodeCode: "9.W.1",
    title: "Write Analytical Arguments",
    description: "Write arguments to support claims in an analysis of substantive topics, using valid reasoning and relevant and sufficient evidence.",
    gradeLevel: GradeLevel.G9, domain: KnowledgeDomain.COMPOSITION, difficulty: 4, prerequisiteCodes: ["8.W.1"], subject: "ENGLISH",
  },
  {
    nodeCode: "9.W.2",
    title: "Write Analytical Essays",
    description: "Write informative/explanatory texts to examine and convey complex ideas and information clearly and accurately.",
    gradeLevel: GradeLevel.G9, domain: KnowledgeDomain.COMPOSITION, difficulty: 4, prerequisiteCodes: ["9.W.1"], subject: "ENGLISH",
  },
  {
    nodeCode: "9.W.7",
    title: "Sustained Research Projects",
    description: "Conduct sustained research projects to answer a question or solve a problem; synthesize multiple authoritative sources.",
    gradeLevel: GradeLevel.G9, domain: KnowledgeDomain.RESEARCH, difficulty: 4, prerequisiteCodes: ["8.W.7"], subject: "ENGLISH",
  },

  // ═══ Grade 10 ELA ═══

  {
    nodeCode: "10.RL.3",
    title: "Analyze Complex Characters",
    description: "Analyze how complex characters develop over the course of a text, interact with other characters, and advance the plot or develop the theme.",
    gradeLevel: GradeLevel.G10, domain: KnowledgeDomain.LITERATURE, difficulty: 4, prerequisiteCodes: ["9.RL.2", "9.RL.5"], subject: "ENGLISH",
  },
  {
    nodeCode: "10.RL.6",
    title: "Analyze Cultural Point of View",
    description: "Analyze a particular point of view or cultural experience reflected in a work of literature from outside the United States.",
    gradeLevel: GradeLevel.G10, domain: KnowledgeDomain.LITERATURE, difficulty: 4, prerequisiteCodes: ["10.RL.3"], subject: "ENGLISH",
  },
  {
    nodeCode: "10.RI.6",
    title: "Analyze Rhetoric in Seminal Texts",
    description: "Determine an author's point of view or purpose in a text and analyze how rhetoric advances it in seminal U.S. texts.",
    gradeLevel: GradeLevel.G10, domain: KnowledgeDomain.RHETORIC, difficulty: 5, prerequisiteCodes: ["9.RI.6"], subject: "ENGLISH",
  },
  {
    nodeCode: "10.W.1",
    title: "Evidence-Based Argument Essays",
    description: "Write arguments using precise claims, distinguishing claims from counterclaims, with logical organization and relevant evidence.",
    gradeLevel: GradeLevel.G10, domain: KnowledgeDomain.COMPOSITION, difficulty: 5, prerequisiteCodes: ["9.W.1"], subject: "ENGLISH",
  },
  {
    nodeCode: "10.W.2",
    title: "Rhetorical Analysis Essays",
    description: "Write rhetorical analysis essays examining how authors use language to achieve their purpose.",
    gradeLevel: GradeLevel.G10, domain: KnowledgeDomain.COMPOSITION, difficulty: 5, prerequisiteCodes: ["10.W.1", "10.RI.6"], subject: "ENGLISH",
  },
  {
    nodeCode: "10.L.5",
    title: "Analyze Nuances in Word Meaning",
    description: "Demonstrate understanding of word relationships and nuances including connotation, denotation, and context-dependent meaning.",
    gradeLevel: GradeLevel.G10, domain: KnowledgeDomain.VOCABULARY, difficulty: 4, prerequisiteCodes: ["8.L.5"], subject: "ENGLISH",
  },

  // ═══ Grade 11 ELA ═══

  {
    nodeCode: "11.RL.3",
    title: "Analyze Impact of Author's Choices",
    description: "Analyze the impact of the author's choices regarding how to develop and relate elements of a story or drama.",
    gradeLevel: GradeLevel.G11, domain: KnowledgeDomain.LITERATURE, difficulty: 5, prerequisiteCodes: ["10.RL.3"], subject: "ENGLISH",
  },
  {
    nodeCode: "11.RL.5",
    title: "Analyze How Structure Contributes to Meaning",
    description: "Analyze how an author's choices concerning how to structure specific parts of a text contribute to its overall structure, meaning, and aesthetic impact.",
    gradeLevel: GradeLevel.G11, domain: KnowledgeDomain.LITERATURE, difficulty: 5, prerequisiteCodes: ["11.RL.3"], subject: "ENGLISH",
  },
  {
    nodeCode: "11.RI.6",
    title: "Analyze Rhetoric in Foundational Documents",
    description: "Determine an author's point of view or purpose in a text that uses rhetoric effectively, including analyzing their style and content in foundational documents.",
    gradeLevel: GradeLevel.G11, domain: KnowledgeDomain.RHETORIC, difficulty: 5, prerequisiteCodes: ["10.RI.6"], subject: "ENGLISH",
  },
  {
    nodeCode: "11.W.1",
    title: "Synthesis Argument Essays",
    description: "Write arguments synthesizing multiple sources to support claims with valid reasoning, anticipating the audience's knowledge and concerns.",
    gradeLevel: GradeLevel.G11, domain: KnowledgeDomain.COMPOSITION, difficulty: 5, prerequisiteCodes: ["10.W.1", "10.W.2"], subject: "ENGLISH",
  },
  {
    nodeCode: "11.W.2",
    title: "Write Literary Analysis",
    description: "Write literary analysis examining theme, symbolism, and author's craft across complex literary works.",
    gradeLevel: GradeLevel.G11, domain: KnowledgeDomain.COMPOSITION, difficulty: 5, prerequisiteCodes: ["11.W.1", "11.RL.5"], subject: "ENGLISH",
  },
  {
    nodeCode: "11.W.7",
    title: "Research with Primary and Secondary Sources",
    description: "Conduct research projects synthesizing primary and secondary sources, demonstrating understanding of the subject under investigation.",
    gradeLevel: GradeLevel.G11, domain: KnowledgeDomain.RESEARCH, difficulty: 5, prerequisiteCodes: ["9.W.7"], subject: "ENGLISH",
  },

  // ═══ Grade 12 ELA ═══

  {
    nodeCode: "12.RL.3",
    title: "Analyze Multiple Interpretations of Literature",
    description: "Analyze multiple interpretations of a story, drama, or poem, evaluating how each version interprets the source text.",
    gradeLevel: GradeLevel.G12, domain: KnowledgeDomain.LITERATURE, difficulty: 5, prerequisiteCodes: ["11.RL.5"], subject: "ENGLISH",
  },
  {
    nodeCode: "12.RL.6",
    title: "Analyze Satire, Sarcasm, Irony, and Understatement",
    description: "Analyze a case in which grasping a point of view requires distinguishing what is directly stated from what is really meant (satire, sarcasm, irony, understatement).",
    gradeLevel: GradeLevel.G12, domain: KnowledgeDomain.LITERATURE, difficulty: 5, prerequisiteCodes: ["12.RL.3"], subject: "ENGLISH",
  },
  {
    nodeCode: "12.RI.6",
    title: "Evaluate Effectiveness of Rhetoric",
    description: "Determine an author's purpose in a text in which the rhetoric is particularly effective, analyzing how style and content contribute to the power and persuasiveness of the text.",
    gradeLevel: GradeLevel.G12, domain: KnowledgeDomain.RHETORIC, difficulty: 5, prerequisiteCodes: ["11.RI.6"], subject: "ENGLISH",
  },
  {
    nodeCode: "12.W.1",
    title: "Write AP-Level Arguments",
    description: "Write sophisticated arguments that effectively address complex, nuanced topics with precision and rhetorical skill.",
    gradeLevel: GradeLevel.G12, domain: KnowledgeDomain.COMPOSITION, difficulty: 5, prerequisiteCodes: ["11.W.1"], subject: "ENGLISH",
  },
  {
    nodeCode: "12.W.2",
    title: "Write Critical Analysis Essays",
    description: "Write critical analysis essays applying literary theory frameworks to evaluate complex texts.",
    gradeLevel: GradeLevel.G12, domain: KnowledgeDomain.COMPOSITION, difficulty: 5, prerequisiteCodes: ["12.W.1", "11.W.2"], subject: "ENGLISH",
  },
  {
    nodeCode: "12.W.7",
    title: "Advanced Research Synthesis",
    description: "Conduct sustained research across diverse sources, synthesizing findings into original arguments with proper attribution and analysis.",
    gradeLevel: GradeLevel.G12, domain: KnowledgeDomain.RESEARCH, difficulty: 5, prerequisiteCodes: ["11.W.7"], subject: "ENGLISH",
  },
];

async function seedElaG6G12() {
  console.log("📚 Seeding ELA G6-G12 nodes...");

  // Create all nodes
  for (const node of elaNodes) {
    await prisma.knowledgeNode.upsert({
      where: { nodeCode: node.nodeCode },
      update: {
        title: node.title,
        description: node.description,
        gradeLevel: node.gradeLevel,
        domain: node.domain,
        difficulty: node.difficulty,
        subject: node.subject,
      },
      create: {
        nodeCode: node.nodeCode,
        title: node.title,
        description: node.description,
        gradeLevel: node.gradeLevel,
        domain: node.domain,
        difficulty: node.difficulty,
        subject: node.subject,
        prerequisites: [],
      },
    });
  }
  console.log(`  ✅ ${elaNodes.length} ELA G6-G12 nodes upserted`);

  // Set prerequisites
  let prereqCount = 0;
  for (const node of elaNodes) {
    if (node.prerequisiteCodes.length > 0) {
      const prereqNodes = await prisma.knowledgeNode.findMany({
        where: { nodeCode: { in: node.prerequisiteCodes } },
        select: { id: true },
      });

      if (prereqNodes.length > 0) {
        await prisma.knowledgeNode.update({
          where: { nodeCode: node.nodeCode },
          data: { prerequisites: prereqNodes.map((n) => n.id) },
        });
        prereqCount += prereqNodes.length;
      }
    }
  }
  console.log(`  ✅ ${prereqCount} prerequisite links created`);
  console.log(`📚 ELA G6-G12 seeding complete!`);
}

// Run if executed directly
seedElaG6G12()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

export { seedElaG6G12, elaNodes };
