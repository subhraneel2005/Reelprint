import type { NextConfig } from "next";

const root = process.cwd();

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: root,
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  devIndicators: false,
  outputFileTracingExcludes: {
    "*": ["./.data/**/*", "./docs/**/*"],
  },
  turbopack: {
    root,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
