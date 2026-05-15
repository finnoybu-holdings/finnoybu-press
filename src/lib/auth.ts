// Better Auth configuration for Finnoybu Press.
//
// Auth model:
//   - Magic-link only. No passwords, no social providers — simplest UX for a
//     digital download site where users sign in occasionally to grab files.
//   - 60-minute link expiry.
//   - Sessions stored in D1 via Better Auth's Drizzle adapter.
//   - Magic-link emails go out through AWS SES (SigV4 via aws4fetch, works
//     in the Workers runtime where Node's crypto isn't available).
//
// This module is server-only. Never import from a client-side script.

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { magicLink } from 'better-auth/plugins';
import { drizzle } from 'drizzle-orm/d1';
import { AwsClient } from 'aws4fetch';
import * as schema from '~/db/schema';

interface AuthInitOptions {
  d1: D1Database;
  baseUrl: string;
  authSecret: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsRegion?: string;
  fromAddress?: string;
}

// Build a Better Auth instance bound to the request's D1 binding and env.
// Called per-request from the auth handler and middleware. Cheap to construct.
export function createAuth({
  d1,
  baseUrl,
  authSecret,
  awsAccessKeyId,
  awsSecretAccessKey,
  awsRegion = 'us-east-1',
  fromAddress = 'Finnoybu Press <hello@press.finnoybu.org>',
}: AuthInitOptions) {
  const db = drizzle(d1, { schema });

  return betterAuth({
    baseURL: baseUrl,
    secret: authSecret,
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    // Magic-link only — password + social explicitly disabled.
    emailAndPassword: { enabled: false },
    plugins: [
      magicLink({
        expiresIn: 60 * 60, // seconds
        sendMagicLink: async ({ email, url }) => {
          if (!awsAccessKeyId || !awsSecretAccessKey) {
            // Dev / unconfigured: print the link so it can be copy-pasted
            // from the terminal during local testing.
            console.warn(
              `[auth] AWS SES not configured. Magic link for ${email}:\n${url}`,
            );
            return;
          }

          const aws = new AwsClient({
            accessKeyId: awsAccessKeyId,
            secretAccessKey: awsSecretAccessKey,
            service: 'ses',
            region: awsRegion,
          });

          const text = magicLinkPlainText(url);
          const html = magicLinkHtml(url);

          const endpoint = `https://email.${awsRegion}.amazonaws.com/v2/email/outbound-emails`;
          const body = {
            FromEmailAddress: fromAddress,
            Destination: { ToAddresses: [email] },
            Content: {
              Simple: {
                Subject: { Data: 'Sign in to Finnoybu Press', Charset: 'UTF-8' },
                Body: {
                  Text: { Data: text, Charset: 'UTF-8' },
                  Html: { Data: html, Charset: 'UTF-8' },
                },
              },
            },
          };

          const res = await aws.fetch(endpoint, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(body),
          });

          if (!res.ok) {
            const errBody = await res.text();
            console.error(
              `[auth] SES sendEmail failed (${res.status}): ${errBody}`,
            );
            throw new Error(`SES sendEmail failed: ${res.status}`);
          }
        },
      }),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;

// =============================================================================
// Email templates
// =============================================================================

function magicLinkPlainText(url: string): string {
  return [
    "You're signing in to Finnoybu Press.",
    '',
    'Click the link below within the next 60 minutes:',
    '',
    url,
    '',
    "If you didn't request this, ignore this email — your account is safe.",
    '',
    '—',
    'Finnoybu Press',
    'https://press.finnoybu.org',
  ].join('\n');
}

function magicLinkHtml(url: string): string {
  return `<!doctype html>
<html><body style="font-family:Georgia,'Times New Roman',serif;color:#1c1814;background:#f5efe2;padding:2rem;line-height:1.6;max-width:840px;margin:0 auto;">
  <p style="font-size:0.75rem;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#6e665a;margin:0 0 1.5rem;">Finnoybu Press</p>
  <p style="font-size:1.125rem;margin:0 0 1.5rem;">You're signing in to your account.</p>
  <p style="margin:0 0 1.5rem;">Click the link below within the next 60 minutes to complete sign-in:</p>
  <p style="margin:0 0 1.5rem;">
    <a href="${escapeHtml(url)}" style="display:inline-block;background:#1c1814;color:#f5efe2;padding:0.75rem 1.25rem;text-decoration:none;font-weight:600;font-family:Inter,system-ui,sans-serif;font-size:0.95rem;">Sign in</a>
  </p>
  <p style="margin:0 0 1.5rem;font-size:0.875rem;color:#6e665a;">Or paste this URL into your browser:<br><span style="word-break:break-all;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:0.8125rem;">${escapeHtml(url)}</span></p>
  <hr style="border:0;border-top:1px solid #d4cab2;margin:2rem 0;">
  <p style="font-size:0.875rem;color:#6e665a;margin:0;">If you didn't request this, ignore this email — your account is safe.</p>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
