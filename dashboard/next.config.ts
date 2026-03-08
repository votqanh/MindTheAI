import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@1password/sdk", "@1password/sdk-core"],
};

export default nextConfig;
