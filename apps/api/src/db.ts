import { createClient, type Client } from "@libsql/client";

export interface Env {
  TURSO_URL?: string;
  TURSO_TOKEN?: string;
  JWT_SECRET?: string;
  ASSETS?: Fetcher;
}

const isNode = typeof process !== "undefined" && !!process.versions?.node;

type ConfigKey = "TURSO_URL" | "TURSO_TOKEN" | "JWT_SECRET";
type LocalKey = "DATABASE_URL" | "TURSO_AUTH_TOKEN" | "JWT_SECRET";

const localKeys: Record<ConfigKey, LocalKey> = {
  TURSO_URL: "DATABASE_URL",
  TURSO_TOKEN: "TURSO_AUTH_TOKEN",
  JWT_SECRET: "JWT_SECRET",
};

function fromLocal(key: LocalKey): string | undefined {
  if (!isNode) return undefined;
  return process.env[key] || undefined;
}

function resolve(env: Env | undefined, key: ConfigKey): string | undefined {
  return env?.[key] || fromLocal(localKeys[key]);
}

export let db: Client;
export let jwtSecret = "farmdesk-dev-secret-change-me";

export function initEnv(env?: Env): void {
  const url = resolve(env, "TURSO_URL") ?? "file:local.db";
  const token = resolve(env, "TURSO_TOKEN");
  db = createClient({ url, authToken: token });
  jwtSecret = resolve(env, "JWT_SECRET") ?? "farmdesk-dev-secret-change-me";
}

if (isNode) {
  initEnv();
}
