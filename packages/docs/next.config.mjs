import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // Allow imports from workspace packages outside packages/docs
  transpilePackages: [],
  experimental: {
    // Required for monorepo imports from parent workspace
  },
};

export default withMDX(config);
