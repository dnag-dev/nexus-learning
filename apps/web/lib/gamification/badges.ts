/**
 * Badge System — Phase 7: Gamification
 *
 * Badge definitions, award logic, and display configuration.
 *
 * Badge Categories:
 *  - MASTERY: Concept and subject mastery milestones
 *  - STREAK: Daily/weekly streak achievements
 *  - SPEED: Speed-related accomplishments
 *  - EMOTIONAL: Emotional resilience and persistence
 *  - BOSS: Boss challenge victories
 *  - EXPLORER: Discovery and exploration
 *  - SOCIAL: Sharing and helping (future)
 */

// ─── Types ───

export type BadgeCategory =
  | "MASTERY"
  | "STREAK"
  | "SPEED"
  | "EMOTIONAL"
  | "BOSS"
  | "EXPLORER"
  | "SOCIAL";

export type BadgeRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  icon: string; // Emoji or icon name
  xpReward: number;
  /** Condition description for the UI */
  condition: string;
}

export interface EarnedBadge {
  badgeType: string;
  category: string;
  earnedAt: Date;
  displayed: boolean;
}

export interface BadgeCheckResult {
  earned: boolean;
  badgeId: string;
  badge: BadgeDefinition;
}

// ─── Badge Definitions ───

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // ─── MASTERY Badges ───
  {
    id: "first_star",
    name: "First Star",
    description: "Mastered your very first concept!",
    category: "MASTERY",
    rarity: "common",
    icon: "⭐",
    xpReward: 50,
    condition: "Master 1 concept",
  },
  {
    id: "five_stars",
    name: "Star Cluster",
    description: "Mastered 5 concepts!",
    category: "MASTERY",
    rarity: "common",
    icon: "🌟",
    xpReward: 100,
    condition: "Master 5 concepts",
  },
  {
    id: "ten_stars",
    name: "Constellation Builder",
    description: "Mastered 10 concepts!",
    category: "MASTERY",
    rarity: "uncommon",
    icon: "✨",
    xpReward: 200,
    condition: "Master 10 concepts",
  },
  {
    id: "twenty_five_stars",
    name: "Galaxy Architect",
    description: "Mastered 25 concepts!",
    category: "MASTERY",
    rarity: "rare",
    icon: "🌌",
    xpReward: 500,
    condition: "Master 25 concepts",
  },
  {
    id: "fifty_stars",
    name: "Nebula Master",
    description: "Mastered 50 concepts!",
    category: "MASTERY",
    rarity: "epic",
    icon: "🪐",
    xpReward: 1000,
    condition: "Master 50 concepts",
  },
  {
    id: "hundred_stars",
    name: "Universe Conqueror",
    description: "Mastered 100 concepts!",
    category: "MASTERY",
    rarity: "legendary",
    icon: "🏆",
    xpReward: 2500,
    condition: "Master 100 concepts",
  },
  {
    id: "subject_complete",
    name: "Subject Champion",
    description: "Mastered all concepts in a subject!",
    category: "MASTERY",
    rarity: "legendary",
    icon: "👑",
    xpReward: 5000,
    condition: "Complete an entire subject",
  },

  // ─── STREAK Badges ───
  {
    id: "streak_7",
    name: "Week Warrior",
    description: "7-day learning streak!",
    category: "STREAK",
    rarity: "common",
    icon: "🔥",
    xpReward: 75,
    condition: "Maintain a 7-day streak",
  },
  {
    id: "streak_14",
    name: "Two-Week Titan",
    description: "14-day learning streak!",
    category: "STREAK",
    rarity: "uncommon",
    icon: "🔥",
    xpReward: 150,
    condition: "Maintain a 14-day streak",
  },
  {
    id: "streak_21",
    name: "Triple Week Hero",
    description: "21-day learning streak!",
    category: "STREAK",
    rarity: "rare",
    icon: "🔥",
    xpReward: 200,
    condition: "Maintain a 21-day streak",
  },
  {
    id: "streak_30",
    name: "Monthly Master",
    description: "30-day learning streak!",
    category: "STREAK",
    rarity: "rare",
    icon: "💎",
    xpReward: 300,
    condition: "Maintain a 30-day streak",
  },
  {
    id: "streak_50",
    name: "Fifty Star Explorer",
    description: "50-day learning streak!",
    category: "STREAK",
    rarity: "epic",
    icon: "💎",
    xpReward: 500,
    condition: "Maintain a 50-day streak",
  },
  {
    id: "streak_100",
    name: "Century Legend",
    description: "100-day learning streak!",
    category: "STREAK",
    rarity: "legendary",
    icon: "🌈",
    xpReward: 1000,
    condition: "Maintain a 100-day streak",
  },
  {
    id: "streak_365",
    name: "Year of Stars",
    description: "365-day learning streak!",
    category: "STREAK",
    rarity: "legendary",
    icon: "🌈",
    xpReward: 5000,
    condition: "Maintain a 365-day streak",
  },

  // ─── SPEED Badges ───
  {
    id: "speed_demon",
    name: "Speed Demon",
    description: "Completed a session 30% faster than your average!",
    category: "SPEED",
    rarity: "uncommon",
    icon: "⚡",
    xpReward: 75,
    condition: "Complete a session 30% faster than average",
  },
  {
    id: "lightning_round",
    name: "Lightning Round",
    description: "5 consecutive speed sessions!",
    category: "SPEED",
    rarity: "rare",
    icon: "⚡",
    xpReward: 200,
    condition: "Complete 5 consecutive speed sessions",
  },
  {
    id: "perfect_speed",
    name: "Perfect Storm",
    description: "Perfect score AND speed session!",
    category: "SPEED",
    rarity: "epic",
    icon: "🌪️",
    xpReward: 300,
    condition: "Get perfect score in a speed session",
  },

  // ─── EMOTIONAL Badges ───
  {
    id: "persistence",
    name: "Never Give Up",
    description: "Kept trying after 3+ wrong answers on a tough problem!",
    category: "EMOTIONAL",
    rarity: "uncommon",
    icon: "💪",
    xpReward: 100,
    condition: "Persist through 3+ wrong answers and get it right",
  },
  {
    id: "comeback_kid",
    name: "Comeback Kid",
    description: "Returned after a break and nailed it!",
    category: "EMOTIONAL",
    rarity: "uncommon",
    icon: "🎯",
    xpReward: 100,
    condition: "Return after 3+ days away and answer first question correctly",
  },
  {
    id: "calm_under_pressure",
    name: "Calm Under Pressure",
    description: "Stayed engaged during a challenging session!",
    category: "EMOTIONAL",
    rarity: "rare",
    icon: "🧘",
    xpReward: 150,
    condition: "Complete a session with high difficulty without frustration",
  },
  {
    id: "breakthrough_moment",
    name: "Eureka!",
    description: "Had a breakthrough moment after struggling!",
    category: "EMOTIONAL",
    rarity: "rare",
    icon: "💡",
    xpReward: 200,
    condition: "Achieve breakthrough emotional state",
  },

  // ─── BOSS Badges ───
  {
    id: "boss_first_win",
    name: "Dragon Slayer",
    description: "Defeated your first boss challenge!",
    category: "BOSS",
    rarity: "uncommon",
    icon: "🐉",
    xpReward: 150,
    condition: "Complete your first boss challenge",
  },
  {
    id: "boss_perfect",
    name: "Flawless Victory",
    description: "Perfect score on a boss challenge!",
    category: "BOSS",
    rarity: "rare",
    icon: "🏅",
    xpReward: 300,
    condition: "Get 100% on a boss challenge",
  },
  {
    id: "boss_speed",
    name: "Speed Boss",
    description: "Completed a boss challenge in under half the time!",
    category: "BOSS",
    rarity: "epic",
    icon: "🚀",
    xpReward: 400,
    condition: "Beat boss challenge in under half the time limit",
  },
  {
    id: "boss_five_wins",
    name: "Boss Crusher",
    description: "Defeated 5 boss challenges!",
    category: "BOSS",
    rarity: "rare",
    icon: "👊",
    xpReward: 500,
    condition: "Complete 5 boss challenges",
  },
  {
    id: "boss_ten_wins",
    name: "Champion of Champions",
    description: "Defeated 10 boss challenges!",
    category: "BOSS",
    rarity: "epic",
    icon: "🎖️",
    xpReward: 1000,
    condition: "Complete 10 boss challenges",
  },

  // ─── EXPLORER Badges ───
  {
    id: "first_session",
    name: "First Steps",
    description: "Completed your very first session!",
    category: "EXPLORER",
    rarity: "common",
    icon: "👣",
    xpReward: 25,
    condition: "Complete your first session",
  },
  {
    id: "ten_sessions",
    name: "Seasoned Explorer",
    description: "Completed 10 sessions!",
    category: "EXPLORER",
    rarity: "uncommon",
    icon: "🧭",
    xpReward: 100,
    condition: "Complete 10 sessions",
  },
  {
    id: "fifty_sessions",
    name: "Veteran Navigator",
    description: "Completed 50 sessions!",
    category: "EXPLORER",
    rarity: "rare",
    icon: "🗺️",
    xpReward: 250,
    condition: "Complete 50 sessions",
  },
  {
    id: "hundred_sessions",
    name: "Master Explorer",
    description: "Completed 100 sessions!",
    category: "EXPLORER",
    rarity: "epic",
    icon: "🔭",
    xpReward: 500,
    condition: "Complete 100 sessions",
  },
  {
    id: "perfect_session",
    name: "Perfect Session",
    description: "All correct, no hints, no hesitation!",
    category: "EXPLORER",
    rarity: "uncommon",
    icon: "💯",
    xpReward: 100,
    condition: "Complete a session with all correct and no hints",
  },
  {
    id: "night_owl",
    name: "Night Owl",
    description: "Studied after 8 PM!",
    category: "EXPLORER",
    rarity: "common",
    icon: "🦉",
    xpReward: 25,
    condition: "Complete a session after 8 PM",
  },
  {
    id: "early_bird",
    name: "Early Bird",
    description: "Studied before 8 AM!",
    category: "EXPLORER",
    rarity: "common",
    icon: "🐦",
    xpReward: 25,
    condition: "Complete a session before 8 AM",
  },
];

// ─── Badge Lookup ───

const _badgeMap = new Map<string, BadgeDefinition>();
for (const badge of BADGE_DEFINITIONS) {
  _badgeMap.set(badge.id, badge);
}

/**
 * Get a badge definition by ID.
 */
export function getBadgeById(id: string): BadgeDefinition | undefined {
  return _badgeMap.get(id);
}

/**
 * Get all badges in a category.
 */
export function getBadgesByCategory(category: BadgeCategory): BadgeDefinition[] {
  return BADGE_DEFINITIONS.filter((b) => b.category === category);
}

/**
 * Get all badges of a specific rarity.
 */
export function getBadgesByRarity(rarity: BadgeRarity): BadgeDefinition[] {
  return BADGE_DEFINITIONS.filter((b) => b.rarity === rarity);
}

// ─── Badge Award Checks ───

/**
 * Check mastery-based badges against a concept mastery count.
 */
export function checkMasteryBadges(
  totalMastered: number,
  alreadyEarned: Set<string>
): BadgeCheckResult[] {
  const results: BadgeCheckResult[] = [];
  const thresholds: [number, string][] = [
    [1, "first_star"],
    [5, "five_stars"],
    [10, "ten_stars"],
    [25, "twenty_five_stars"],
    [50, "fifty_stars"],
    [100, "hundred_stars"],
  ];

  for (const [count, badgeId] of thresholds) {
    if (totalMastered >= count && !alreadyEarned.has(badgeId)) {
      const badge = getBadgeById(badgeId);
      if (badge) {
        results.push({ earned: true, badgeId, badge });
      }
    }
  }

  return results;
}

/**
 * Check session-count-based badges.
 */
export function checkSessionBadges(
  totalSessions: number,
  alreadyEarned: Set<string>
): BadgeCheckResult[] {
  const results: BadgeCheckResult[] = [];
  const thresholds: [number, string][] = [
    [1, "first_session"],
    [10, "ten_sessions"],
    [50, "fifty_sessions"],
    [100, "hundred_sessions"],
  ];

  for (const [count, badgeId] of thresholds) {
    if (totalSessions >= count && !alreadyEarned.has(badgeId)) {
      const badge = getBadgeById(badgeId);
      if (badge) {
        results.push({ earned: true, badgeId, badge });
      }
    }
  }

  return results;
}

/**
 * Check boss-challenge-based badges.
 */
export function checkBossBadges(
  totalBossWins: number,
  latestScore: number | null,
  latestTimeMs: number | null,
  timeLimitMs: number | null,
  alreadyEarned: Set<string>
): BadgeCheckResult[] {
  const results: BadgeCheckResult[] = [];

  // First win
  if (totalBossWins >= 1 && !alreadyEarned.has("boss_first_win")) {
    const badge = getBadgeById("boss_first_win");
    if (badge) results.push({ earned: true, badgeId: "boss_first_win", badge });
  }

  // Five wins
  if (totalBossWins >= 5 && !alreadyEarned.has("boss_five_wins")) {
    const badge = getBadgeById("boss_five_wins");
    if (badge) results.push({ earned: true, badgeId: "boss_five_wins", badge });
  }

  // Ten wins
  if (totalBossWins >= 10 && !alreadyEarned.has("boss_ten_wins")) {
    const badge = getBadgeById("boss_ten_wins");
    if (badge) results.push({ earned: true, badgeId: "boss_ten_wins", badge });
  }

  // Perfect boss
  if (latestScore !== null && latestScore >= 1.0 && !alreadyEarned.has("boss_perfect")) {
    const badge = getBadgeById("boss_perfect");
    if (badge) results.push({ earned: true, badgeId: "boss_perfect", badge });
  }

  // Speed boss
  if (
    latestTimeMs !== null &&
    timeLimitMs !== null &&
    latestTimeMs <= timeLimitMs / 2 &&
    !alreadyEarned.has("boss_speed")
  ) {
    const badge = getBadgeById("boss_speed");
    if (badge) results.push({ earned: true, badgeId: "boss_speed", badge });
  }

  return results;
}

/**
 * Check time-of-day badges.
 */
export function checkTimeOfDayBadge(
  hour: number,
  alreadyEarned: Set<string>
): BadgeCheckResult | null {
  if (hour < 8 && !alreadyEarned.has("early_bird")) {
    const badge = getBadgeById("early_bird");
    if (badge) return { earned: true, badgeId: "early_bird", badge };
  }
  if (hour >= 20 && !alreadyEarned.has("night_owl")) {
    const badge = getBadgeById("night_owl");
    if (badge) return { earned: true, badgeId: "night_owl", badge };
  }
  return null;
}

/**
 * Check if a streak milestone earned a badge.
 */
export function checkStreakBadge(
  badgeType: string | null,
  alreadyEarned: Set<string>
): BadgeCheckResult | null {
  if (!badgeType || alreadyEarned.has(badgeType)) return null;
  const badge = getBadgeById(badgeType);
  if (!badge) return null;
  return { earned: true, badgeId: badgeType, badge };
}

// ─── Display Helpers ───

/**
 * Get rarity color class for styling.
 */
export function getRarityColor(rarity: BadgeRarity): string {
  switch (rarity) {
    case "common":
      return "text-gray-500";
    case "uncommon":
      return "text-green-500";
    case "rare":
      return "text-blue-500";
    case "epic":
      return "text-purple-500";
    case "legendary":
      return "text-yellow-500";
  }
}

/**
 * Get rarity background class for styling.
 */
export function getRarityBg(rarity: BadgeRarity): string {
  switch (rarity) {
    case "common":
      return "bg-gray-100";
    case "uncommon":
      return "bg-green-50";
    case "rare":
      return "bg-blue-50";
    case "epic":
      return "bg-purple-50";
    case "legendary":
      return "bg-yellow-50";
  }
}

/**
 * Get rarity border class for styling.
 */
export function getRarityBorder(rarity: BadgeRarity): string {
  switch (rarity) {
    case "common":
      return "border-gray-300";
    case "uncommon":
      return "border-green-300";
    case "rare":
      return "border-blue-300";
    case "epic":
      return "border-purple-300";
    case "legendary":
      return "border-yellow-400";
  }
}

/**
 * Sort badges by rarity (legendary first).
 */
export function sortByRarity(badges: BadgeDefinition[]): BadgeDefinition[] {
  const order: Record<BadgeRarity, number> = {
    legendary: 0,
    epic: 1,
    rare: 2,
    uncommon: 3,
    common: 4,
  };
  return [...badges].sort((a, b) => order[a.rarity] - order[b.rarity]);
}

/**
 * Get the total badge count and earned count.
 */
export function getBadgeProgress(earnedBadgeIds: Set<string>): {
  total: number;
  earned: number;
  percentage: number;
} {
  const total = BADGE_DEFINITIONS.length;
  const earned = BADGE_DEFINITIONS.filter((b) =>
    earnedBadgeIds.has(b.id)
  ).length;
  const percentage = total > 0 ? Math.round((earned / total) * 100) : 0;

  return { total, earned, percentage };
}
