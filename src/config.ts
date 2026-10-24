export interface Config {
  base: string;
  token: string;
  headers: Record<string, string>;
  tournament?: string;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly STRATEGYJAM_URL?: string;
      readonly STRATEGYJAM_TOKEN?: string;
      readonly CF_ACCESS_CLIENT_ID?: string;
      readonly CF_ACCESS_CLIENT_SECRET?: string;
      readonly TOURNAMENT_ID?: string;
    }
  }
}

function loadConfig(): Config {
  const rawBase = Bun.env.STRATEGYJAM_URL;
  if (!rawBase) {
    console.error("STRATEGYJAM_URL environment variable is required.");
    process.exit(1);
  }

  let parsed: URL;
  try {
    parsed = new URL(rawBase);
  } catch {
    console.error("Use a plain HTTPS StrategyJam origin");
    process.exit(1);
  }

  if (
    parsed.protocol !== "https:" ||
    !parsed.host ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash
  ) {
    console.error("Use a plain HTTPS StrategyJam origin");
    process.exit(1);
  }

  const base = rawBase.replace(/\/$/, "");
  const token = Bun.env.STRATEGYJAM_TOKEN;
  if (!token) {
    console.error("STRATEGYJAM_TOKEN environment variable is required.");
    process.exit(1);
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  if (Bun.env.CF_ACCESS_CLIENT_ID) {
    headers["CF-Access-Client-Id"] = Bun.env.CF_ACCESS_CLIENT_ID;
  }
  if (Bun.env.CF_ACCESS_CLIENT_SECRET) {
    headers["CF-Access-Client-Secret"] = Bun.env.CF_ACCESS_CLIENT_SECRET;
  }

  return {
    base,
    token,
    headers,
    tournament: Bun.env.TOURNAMENT_ID,
  };
}

export const config = loadConfig();
