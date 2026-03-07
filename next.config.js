/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // Use this directory as project root (fixes env + lockfile warning when repo is inside another repo)
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;
