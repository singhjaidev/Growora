import type { MetadataRoute } from 'next';
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    '',
    'product',
    'solutions',
    'integrations',
    'pricing',
    'about',
    'demo',
    'contact',
    'docs',
    'guides',
    'privacy',
    'terms',
  ].map((route) => ({
    url: `https://growora.co.uk/${route}`,
    changeFrequency: 'monthly',
    priority: route === '' ? 1 : 0.7,
  }));
}
