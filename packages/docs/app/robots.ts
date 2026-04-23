import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/compare/panel', '/create/preview'],
      },
    ],
    sitemap: 'https://visor.design/sitemap.xml',
  };
}
