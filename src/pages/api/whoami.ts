import type { APIRoute } from 'astro';
import { getEnv, isAuthConfigured } from '~/lib/env';
import { isDbConfigured } from '~/db';

export const prerender = false;

// Diagnostic endpoint: visit /api/whoami to confirm the auth pipeline is
// wired correctly. Reports binding presence and the current session user.
export const GET: APIRoute = async (ctx) => {
  const env = getEnv();
  const user = ctx.locals.user;

  return Response.json({
    ok: true,
    bindings: {
      DB: isDbConfigured(),
      PDFS: Boolean(env.PDFS),
    },
    authConfigured: isAuthConfigured(env),
    seesUser: Boolean(user),
    user: user
      ? { id: user.id, email: user.email, name: user.name }
      : null,
  });
};
