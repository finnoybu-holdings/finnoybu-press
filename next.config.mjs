/** @type {import('next').NextConfig} */
const nextConfig = {
  // Match fiction's transpile workaround so @supabase/auth-js plays nicely.
  transpilePackages: ['@supabase/auth-js'],
  experimental: {
    typedRoutes: false,
  },
  // Press serves digital books from /api/download streaming files outside
  // public/. Nothing exotic in next.config — defaults are fine.
};

export default nextConfig;
