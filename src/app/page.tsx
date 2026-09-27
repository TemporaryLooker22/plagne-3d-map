'use client';

import dynamic from 'next/dynamic';

// Chargement direct sans écran de chargement (fond blanc épuré immédiat)
const Map3D = dynamic(() => import('@/components/Map3D'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-white" />,
});

export default function Home() {
  return (
    <main className="w-full h-full">
      <Map3D />
    </main>
  );
}
