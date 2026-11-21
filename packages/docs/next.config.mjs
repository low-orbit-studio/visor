import { createMDX } from 'fumadocs-mdx/next';
import path from 'path';
import { fileURLToPath } from 'url';
import { componentRedirects } from './lib/component-redirects.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // Dev only: lets the dev server hydrate when opened by IP or a *.localhost name (review links, Playwright).
  allowedDevOrigins: ['127.0.0.1', '*.localhost'],
  transpilePackages: [],
  // Tell Next.js where the monorepo root is so it can resolve workspace packages
  outputFileTracingRoot: path.join(__dirname, '../../'),
  experimental: {},
  // Dev only: Next 16 blocks dev resources (HMR, client chunks) for other hosts, so a page opened
  // through 127.0.0.1 or a review proxy (app-web.<ticket>.visor.localhost) never hydrates.
  allowedDevOrigins: ['127.0.0.1', '**.localhost'],
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
      ...componentRedirects(path.join(__dirname, 'content/docs/components')),
    ];
  },
};

export default withMDX(config);
