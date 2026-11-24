const SITE_URL = 'https://kavana.my.id';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Area terautentikasi dan tautan bertoken tidak untuk diindeks.
        disallow: ['/dashboard', '/dashboard/', '/verify/', '/api/'],
      },
      {
        // Bot agresif yang tidak memberi nilai SEO.
        userAgent: ['AhrefsBot', 'SemrushBot', 'MJ12bot', 'DotBot'],
        disallow: '/',
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
