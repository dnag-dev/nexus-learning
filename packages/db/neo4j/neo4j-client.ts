import neo4j, { Driver, Session } from "neo4j-driver";

let driver: Driver | null = null;

export function getNeo4jDriver(): Driver {
  if (driver) return driver;

  const uri = process.env.NEO4J_URI || "bolt://localhost:7687";
  const user = process.env.NEO4J_USER || "neo4j";
  const password = process.env.NEO4J_PASSWORD || "aautilearn_dev";

  driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
    maxConnectionPoolSize: 50,
    connectionAcquisitionTimeout: 10000,
    disableLosslessIntegers: true,
  });

  return driver;
}

export function getSession(database = "neo4j"): Session {
  return getNeo4jDriver().session({ database });
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
    await d.verifyConnectivity();
    console.log("Neo4j connection verified.");
    return true;
  } catch (err) {
    console.error("Neo4j connection failed:", err);
    return false;
  }
}
