import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16 serves dev assets only to localhost and the bind hostname.
  // 127.0.0.1 is a separate origin, so browsers on that host never hydrate.
  allowedDevOrigins: ["127.0.0.1"],
  reactCompiler: true,
  experimental: {
    optimizePackageImports: ["@tabler/icons-react"],
  },
};

export default nextConfig;
