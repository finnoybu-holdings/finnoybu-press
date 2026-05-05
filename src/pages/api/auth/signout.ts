import type { APIRoute } from 'astro';
import { createClient } from '../../../lib/supabase/server';

export const prerender = false;

export const POST: APIRoute = async ({ cookies, redirect, request }) => {
  const supabase = createClient(cookies, request);
  await supabase.auth.signOut();
  return redirect('/');
};
