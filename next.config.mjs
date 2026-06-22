/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // -------------------------------------------------------------------------
  // Remote image domains — extend with your own Supabase project host.
  // -------------------------------------------------------------------------
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "ui-avatars.com" },
    ],
  },

  // -------------------------------------------------------------------------
  // Keep Supabase out of the Edge bundle.
  // @supabase/supabase-js uses Node.js APIs (process.version) that aren't
  // available in the Edge Runtime. Marking it as external tells Next.js to
  // load it via Node.js require() in Server Components/Actions, removing the
  // build warning. The middleware uses @supabase/ssr which bundles separately.
  // -------------------------------------------------------------------------
  serverExternalPackages: ["@supabase/supabase-js", "@opentelemetry/api"],

  // -------------------------------------------------------------------------
  // Server Actions — tune body size limit for file uploads (admin panel).
  // -------------------------------------------------------------------------
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
