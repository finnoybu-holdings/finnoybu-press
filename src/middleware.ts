import { defineMiddleware } from 'astro:middleware';
import { createAuth } from '~/lib/auth';
import { getEnv, getSiteUrl, isAuthConfigured } from '~/lib/env';
import { isDbConfigured } from '~/db';

let warnedMissingConfig = false;

// Populates Astro.locals.user on every non-prerendered request. Pages opt in
// to dynamic rendering with `export const prerender = false`.
export const onRequest = defineMiddleware(async (ctx, next) => {
  ctx.locals.user = null;

  if (ctx.isPrerendered) return next();

  const env = getEnv(ctx);

  // No D1 / auth secret → render signed-out. Lets dev/preview work without
  // bindings; logs once so we don't spam the console.
  if (!isDbConfigured(ctx) || !isAuthConfigured(env)) {
    if (!warnedMissingConfig) {
      console.warn(
        '[middleware] D1 or BETTER_AUTH_SECRET not configured; auth disabled.',
      );
      warnedMissingConfig = true;
    }
    return next();
  }

  try {
    const auth = createAuth({
      d1: env.DB,
      baseUrl: getSiteUrl(ctx),
      authSecret: env.BETTER_AUTH_SECRET,
      awsAccessKeyId: env.AWS_ACCESS_KEY_ID,
      awsSecretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      awsRegion: env.AWS_REGION,
      fromAddress: env.EMAIL_FROM,
    });

    const session = await auth.api.getSession({ headers: ctx.request.headers });

    if (session?.user) {
      ctx.locals.user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name ?? null,
      };
    }
  } catch (err) {
    // Auth failure must never block page render.
    console.error('[middleware] auth lookup failed', err);
  }

  return next();
});
