export interface StructuredDataProps {
  type?: 'WebApplication' | 'SoftwareApplication' | 'WebSite';
  name?: string;
  description?: string;
  url?: string;
}

export function StructuredData({
  type = 'WebApplication',
  name = 'divideIt',
  description = 'Split your videos into random segments for Reels, TikTok, and YouTube Shorts',
  url = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
}: StructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': type,
    name,
    description,
    url,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Video file upload (MP4, MOV, AVI)',
      'Random video segmentation',
      'Customizable segment count and duration',
      'Download individual segments',
      'Optimized for social media platforms',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
