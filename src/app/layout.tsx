import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/manrope';
import '@fontsource-variable/dm-sans';
import '@fontsource-variable/newsreader';
import '@fontsource-variable/newsreader/wght-italic.css';
import '@fontsource-variable/inter';
import './globals.css';
import './product-surfaces.css';
import './art-direction.css';
import './product-flow.css';
import { Providers } from '@/components/providers';
export const metadata: Metadata = {
  metadataBase: new URL('https://growora.co.uk'),
  title: { default: 'Growora — Every lead, a next step.', template: '%s | Growora' },
  description:
    'Turn website visitors into qualified leads. Explore the Growora lead conversion platform, from first interest to next opportunity.',
  openGraph: {
    type: 'website',
    siteName: 'Growora',
    title: 'Growora — Turn more enquiries into paying customers.',
    description:
      'Capture enquiries, prioritise opportunities and plan follow-ups. Explore the Growora interactive workspace.',
    images: ['/opengraph-image'],
  },
  twitter: { card: 'summary_large_image' },
  icons: { icon: '/icon.svg' },
};
export const viewport: Viewport = { themeColor: '#f7f7f5' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
