import type { NextConfig } from "next";

const backendOrigin = (process.env.INTERNAL_API_URL ?? "http://localhost:5000/api").replace(
  /\/api\/?$/,
  ""
);

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        destination: `${backendOrigin}/api/:path*`,
        source: "/api/:path*"
      }
    ];
  },
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ["@matcha/ui", "@matcha/types"]
};

export default nextConfig;
