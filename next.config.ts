import type { NextConfig } from "next";

const preserveSymlinks = process.execArgv.includes("--preserve-symlinks")
  || /(?:^|\s)--preserve-symlinks(?:\s|$)/.test(process.env.NODE_OPTIONS ?? "");

const nextConfig: NextConfig = {
  typedRoutes: false,
  allowedDevOrigins: ["127.0.0.1"],
  serverExternalPackages: ["bullmq", "@hyperframes/producer", "esbuild"],
  webpack: preserveSymlinks ? (config) => {
    // Keep loaders and plugins on the same path when dependencies live on another drive.
    config.resolve = { ...config.resolve, symlinks: false };
    config.resolveLoader = { ...config.resolveLoader, symlinks: false };
    return config;
  } : undefined,
};

export default nextConfig;
