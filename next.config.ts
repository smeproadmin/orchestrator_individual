import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === 'true';

const nextConfig: NextConfig = {
  output: "export",
  basePath: isGithubPages ? '/orchestrator_individual' : '',
  assetPrefix: isGithubPages ? '/orchestrator_individual/' : undefined,
};

export default nextConfig;
