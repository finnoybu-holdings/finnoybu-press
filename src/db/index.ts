import { env as cfEnv } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

// Returns a Drizzle client wrapping the D1 binding for the request context.
// Cloudflare exposes the binding via `import { env } from 'cloudflare:workers'`
// (Astro v6 / @astrojs/cloudflare v13+).
export function getDb() {
  const env = cfEnv as Env | undefined;
  if (!env?.DB) {
    throw new Error(
      'D1 binding `DB` not found on runtime env. Make sure wrangler.toml ' +
        'declares the binding and the Worker has it bound.',
    );
  }
  return drizzle(env.DB as D1Database, { schema });
}

// True when the D1 binding is available. Useful for graceful no-op in dev.
export function isDbConfigured(): boolean {
  const env = cfEnv as Env | undefined;
  return Boolean(env?.DB);
}

export { schema };
export type Db = ReturnType<typeof getDb>;
