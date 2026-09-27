import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'La Plagne 3D - Relief & Montagnes',
  description: 'Visualisation 3D épurée du relief montagneux de La Plagne (Savoie, France)',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'La Plagne 3D',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="w-full h-full overflow-hidden">
      <body className="w-full h-full h-[100dvh] fixed inset-0 overflow-hidden bg-white text-slate-900 select-none touch-none">
        {children}
      </body>
    </html>
  );
}
