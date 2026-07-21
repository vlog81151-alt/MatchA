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
      },
      {
        destination: `${backendOrigin}/socket.io/:path*`,
        source: "/socket.io/:path*"
      }
    ];
  },
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ["@matcha/ui", "@matcha/types"],
  images: {
    remotePatterns: [
      {
        hostname: "res.cloudinary.com",
        protocol: "https"
      }
    ]
  }
};

export default nextConfig;
