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
  async redirects() {
    return [
      {
        source: '/docs/theming',
        destination: '/docs/themes/theming',
        permanent: true,
      },
      {
        source: '/docs/creating-themes',
        destination: '/docs/themes/creating-themes',
        permanent: true,
      },
      {
        source: '/docs/token-rules',
        destination: '/docs/themes/token-rules',
        permanent: true,
      },
    ];
  },
};

export default withMDX(config);
