import { createMDX } from 'fumadocs-mdx/next';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  transpilePackages: [],
  // Tell Next.js where the monorepo root is so it can resolve workspace packages
  outputFileTracingRoot: path.join(__dirname, '../../'),
  experimental: {},
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
