/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@aauti/ui", "@aauti/types", "@aauti/db"],
  experimental: {
    serverComponentsExternalPackages: ["neo4j-driver"],
  },
};

module.exports = nextConfig;
