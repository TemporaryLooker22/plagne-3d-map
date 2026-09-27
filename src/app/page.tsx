'use client';

import dynamic from 'next/dynamic';

// Dynamic import with SSR disabled for WebGL MapLibre
const Map3D = dynamic(() => import('@/components/Map3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-800">
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
        <span className="absolute text-xl">🏔️</span>
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-800 tracking-wide">
        Chargement du relief 3D de La Plagne...
      </p>
      <span className="text-xs text-slate-500 mt-1">
        Génération du maillage 3D et de l’ombrage topographique blanc
      </span>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="w-full h-full">
      <Map3D />
    </main>
  );
}
