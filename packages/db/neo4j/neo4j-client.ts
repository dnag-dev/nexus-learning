import neo4j, { Driver, Session } from "neo4j-driver";

let driver: Driver | null = null;
let driverUnavailable = false;

/**
 * Returns the Neo4j driver, or null if the connection is unavailable
 * (e.g., missing/invalid URI, placeholder credentials).
 */
export function getNeo4jDriver(): Driver | null {
  if (driverUnavailable) return null;
  if (driver) return driver;

  const uri = process.env.NEO4J_URI || "bolt://localhost:7687";
  const user = process.env.NEO4J_USER || "neo4j";
  const password = process.env.NEO4J_PASSWORD || "aautilearn_dev";

  // Validate URI before attempting to create driver
  if (
    !uri ||
    uri === "placeholder_will_update" ||
    (!uri.startsWith("bolt://") &&
      !uri.startsWith("bolt+s://") &&
      !uri.startsWith("neo4j://") &&
      !uri.startsWith("neo4j+s://"))
  ) {
    console.warn(
      `[Neo4j] Invalid URI "${uri}" — Neo4j is unavailable. Queries will fall back to PostgreSQL.`
    );
    driverUnavailable = true;
    return null;
  }

  try {
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
      maxConnectionPoolSize: 50,
      connectionAcquisitionTimeout: 10000,
      disableLosslessIntegers: true,
    });
    return driver;
  } catch (err) {
    console.warn("[Neo4j] Failed to create driver:", err);
    driverUnavailable = true;
    return null;
  }
}

export function getSession(database = "neo4j"): Session | null {
  const d = getNeo4jDriver();
  if (!d) return null;
  return d.session({ database });
}

export async function closeNeo4j(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

export async function verifyConnectivity(): Promise<boolean> {
  try {
    const d = getNeo4jDriver();
    if (!d) return false;
    await d.verifyConnectivity();
    console.log("Neo4j connection verified.");
    return true;
  } catch (err) {
    console.error("Neo4j connection failed:", err);
    return false;
  }
}

/** Check if Neo4j is available (driver created successfully). */
export function isNeo4jAvailable(): boolean {
  return getNeo4jDriver() !== null;
}
