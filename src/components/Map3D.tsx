'use client';

import React, { useEffect, useRef } from 'react';
import maplibregl, { Map as MapLibreMap } from 'maplibre-gl';
import belleplagneBuildings from '@/data/belleplagne_buildings.json';
import belleplagnePaths from '@/data/belleplagne_paths.json';

// Emprise géographique élargie pour un fondu progressif de La Plagne
const FADE_BBOX = {
  minLng: 6.54,
  maxLng: 6.90,
  minLat: 45.37,
  maxLat: 45.63,
};

// Trou rectangulaire pour le masque extérieur
const OUTSIDE_HOLE: [number, number][] = [
  [FADE_BBOX.minLng, FADE_BBOX.minLat],
  [FADE_BBOX.maxLng, FADE_BBOX.minLat],
  [FADE_BBOX.maxLng, FADE_BBOX.maxLat],
  [FADE_BBOX.minLng, FADE_BBOX.maxLat],
  [FADE_BBOX.minLng, FADE_BBOX.minLat],
];

// Principaux sommets et repères de La Plagne
const PLAGNE_SUMMITS = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [6.7808, 45.4947] },
      properties: { name: '▲ Sommet de Bellecôte', elevation: '3 417 m' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [6.7328, 45.5002] },
      properties: { name: '▲ Roche de Mio', elevation: '2 739 m' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [6.6872, 45.5054] },
      properties: { name: '▲ Grande Rochette', elevation: '2 505 m' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [6.6745, 45.5064] },
      properties: { name: 'Plagne Centre', elevation: '1 970 m' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [6.7081, 45.5113] },
      properties: { name: 'Village Belle Plagne', elevation: '2 050 m' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [6.6922, 45.4542] },
      properties: { name: 'Champagny-en-Vanoise', elevation: '1 250 m' },
    },
  ],
};

// Texture haute définition (1024x1024) en dégradé radial doux pour le fondu des bordures
function generateRadialFadeMask(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Fond blanc pur
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 1024, 1024);

  // Découpe centrale progressive
  ctx.globalCompositeOperation = 'destination-out';
  const gradient = ctx.createRadialGradient(512, 512, 140, 512, 512, 490);
  gradient.addColorStop(0.0, 'rgba(0, 0, 0, 1)');      // Cœur de La Plagne 100% visible
  gradient.addColorStop(0.42, 'rgba(0, 0, 0, 1)');
  gradient.addColorStop(0.58, 'rgba(0, 0, 0, 0.88)'); // Début de transition douce
  gradient.addColorStop(0.72, 'rgba(0, 0, 0, 0.58)');
  gradient.addColorStop(0.85, 'rgba(0, 0, 0, 0.26)');
  gradient.addColorStop(0.95, 'rgba(0, 0, 0, 0.05)');
  gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0)');       // Bords 100% blancs

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 1024);

  return canvas.toDataURL('image/png');
}

export default function Map3D() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Détection mobile pour cadrage et performances optimisées
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

    // Sur mobile, pixelRatio plafonné à 1.5 pour une fluidité parfaite à 60 FPS
    const optimizedPixelRatio = Math.min(
      typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
      isMobile ? 1.5 : 2
    );

    // Zoom initial adapté au format d'écran vertical sur smartphone
    const initialZoom = isMobile ? 11.6 : 12.4;
    const initialPitch = isMobile ? 60 : 66;

    const fadeMaskDataUrl = generateRadialFadeMask();

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      pixelRatio: optimizedPixelRatio,
      fadeDuration: 0,
      renderWorldCopies: false,
      maxTileCacheSize: isMobile ? 50 : 100,
      touchPitch: true, // Glisser à 2 doigts pour incliner en 3D sur mobile
      touchZoomRotate: true, // Pincer pour zoomer et pivoter à 2 doigts
      dragRotate: true,
      dragPan: true,
      cooperativeGestures: false,
      style: {
        version: 8,
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {
          // Source DEM haute définition (maxzoom 14 pour un relief 3D détaillé)
          'terrain-dem': {
            type: 'raster-dem',
            tiles: [
              'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
            ],
            encoding: 'terrarium',
            tileSize: 256,
            maxzoom: 14,
          },
          // Masque radial progressif drapé sur le relief
          'fade-mask-image': {
            type: 'image',
            url: fadeMaskDataUrl,
            coordinates: [
              [FADE_BBOX.minLng, FADE_BBOX.maxLat],
              [FADE_BBOX.maxLng, FADE_BBOX.maxLat],
              [FADE_BBOX.maxLng, FADE_BBOX.minLat],
              [FADE_BBOX.minLng, FADE_BBOX.minLat],
            ],
          },
          // Masque blanc au-delà du dégradé
          'outside-mask-geojson': {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Polygon',
                coordinates: [
                  [
                    [-180, -85],
                    [180, -85],
                    [180, 85],
                    [-180, 85],
                    [-180, -85],
                  ],
                  OUTSIDE_HOLE,
                ],
              },
            },
          },
          // Bâtiments 3D de Belle Plagne (142 résidences et chalets savoyards)
          'belle-plagne-buildings': {
            type: 'geojson',
            data: belleplagneBuildings as GeoJSON.FeatureCollection,
          },
          // Chemins piétons et remontées mécaniques de Belle Plagne
          'belle-plagne-paths': {
            type: 'geojson',
            data: belleplagnePaths as GeoJSON.FeatureCollection,
          },
          // Repères discrets des sommets
          'plagne-summits': {
            type: 'geojson',
            data: PLAGNE_SUMMITS as GeoJSON.FeatureCollection,
          },
        },
        layers: [
          // 1. Fond blanc pur
          {
            id: 'background-white',
            type: 'background',
            paint: {
              'background-color': '#ffffff',
            },
          },
          // 2. Ombrage directionnel principal
          {
            id: 'hillshade-relief-primary',
            type: 'hillshade',
            source: 'terrain-dem',
            layout: { visibility: 'visible' },
            paint: {
              'hillshade-illumination-direction': 315,
              'hillshade-illumination-anchor': 'viewport',
              'hillshade-shadow-color': '#1e293b',
              'hillshade-highlight-color': '#ffffff',
              'hillshade-accent-color': '#64748b',
              'hillshade-exaggeration': 0.82,
            },
          },
          // 3. Ombrage d'ambiance multidirectionnel
          {
            id: 'hillshade-relief-ambient',
            type: 'hillshade',
            source: 'terrain-dem',
            layout: { visibility: 'visible' },
            paint: {
              'hillshade-illumination-direction': 60,
              'hillshade-illumination-anchor': 'viewport',
              'hillshade-shadow-color': '#94a3b8',
              'hillshade-highlight-color': '#f8fafc',
              'hillshade-accent-color': '#cbd5e1',
              'hillshade-exaggeration': 0.32,
            },
          },
          // 4. Chemins piétons du village de Belle Plagne
          {
            id: 'belle-plagne-paths-layer',
            type: 'line',
            source: 'belle-plagne-paths',
            filter: ['==', ['get', 'type'], 'path'],
            paint: {
              'line-color': '#cbd5e1',
              'line-width': 1.5,
              'line-opacity': 0.8,
            },
          },
          // 5. Câbles des remontées mécaniques de Belle Plagne (télécabines / télésièges)
          {
            id: 'belle-plagne-lifts-layer',
            type: 'line',
            source: 'belle-plagne-paths',
            filter: ['==', ['get', 'type'], 'lift'],
            paint: {
              'line-color': '#64748b',
              'line-width': 1.5,
              'line-dasharray': [3, 2],
            },
          },
          // 6. Bâtiments 3D extrudés de Belle Plagne (142 chalets et résidences)
          {
            id: 'belle-plagne-buildings-3d',
            type: 'fill-extrusion',
            source: 'belle-plagne-buildings',
            paint: {
              'fill-extrusion-height': ['get', 'height'],
              'fill-extrusion-base': ['get', 'base_height'],
              'fill-extrusion-color': ['get', 'color'],
              'fill-extrusion-opacity': 0.95,
            },
          },
          // 7. Dégradé radial doux qui estompe progressivement les bordures
          {
            id: 'fade-mask-layer',
            type: 'raster',
            source: 'fade-mask-image',
            paint: {
              'raster-opacity': 1.0,
              'raster-fade-duration': 0,
            },
          },
          // 8. Masque blanc uni pour l'extérieur
          {
            id: 'outside-mask',
            type: 'fill',
            source: 'outside-mask-geojson',
            paint: {
              'fill-color': '#ffffff',
              'fill-opacity': 1.0,
            },
          },
          // 9. Noms des résidences de Belle Plagne en zoom rapproché
          {
            id: 'belle-plagne-residence-labels',
            type: 'symbol',
            source: 'belle-plagne-buildings',
            filter: ['!=', ['get', 'name'], ''],
            minzoom: 14.5,
            layout: {
              'text-field': ['get', 'name'],
              'text-size': 10,
              'text-font': ['Open Sans Regular'],
              'text-offset': [0, -1.2],
              'text-anchor': 'bottom',
              'text-max-width': 8,
            },
            paint: {
              'text-color': '#0f172a',
              'text-halo-color': '#ffffff',
              'text-halo-width': 2.5,
            },
          },
          // 10. Typographie des sommets (affichée au-dessus du relief)
          {
            id: 'summits-labels',
            type: 'symbol',
            source: 'plagne-summits',
            layout: {
              'text-field': ['concat', ['get', 'name'], ' (', ['get', 'elevation'], ')'],
              'text-size': isMobile ? 10 : 11.5,
              'text-font': ['Open Sans Bold', 'Open Sans Regular'],
              'text-offset': [0, -1],
              'text-anchor': 'bottom',
              'text-allow-overlap': true,
            },
            paint: {
              'text-color': '#0f172a',
              'text-halo-color': '#ffffff',
              'text-halo-width': 3,
            },
          },
        ],
        sky: {
          'sky-color': '#ffffff',
          'horizon-color': '#ffffff',
          'fog-color': '#ffffff',
          'sky-horizon-blend': 1.0,
        },
      },
      center: [6.72, 45.50],
      zoom: initialZoom,
      pitch: initialPitch,
      bearing: -32,
      maxPitch: 85,
      maxBounds: [
        [6.54, 45.37],
        [6.90, 45.63],
      ],
      attributionControl: false,
      canvasContextAttributes: {
        antialias: true,
        powerPreference: 'high-performance',
      },
    });

    mapInstance.on('load', () => {
      // Activation du relief 3D
      mapInstance.setTerrain({
        source: 'terrain-dem',
        exaggeration: 1.35,
      });

      // Éclairage directionnel WebGL
      mapInstance.setLight({
        anchor: 'viewport',
        color: '#ffffff',
        intensity: 0.45,
        position: [1.2, 315, 55],
      });
    });

    map.current = mapInstance;

    return () => {
      mapInstance.remove();
      map.current = null;
    };
  }, []);

  return (
    <div className="relative w-full h-full h-[100dvh] bg-white select-none overflow-hidden touch-none">
      {/* Conteneur WebGL MapLibre */}
      <div ref={mapContainer} className="w-full h-full cursor-grab active:cursor-grabbing touch-none" />

      {/* Fondu d'ambiance périphérique */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            'radial-gradient(ellipse 74% 68% at 50% 50%, transparent 48%, rgba(255,255,255,0.3) 70%, rgba(255,255,255,0.75) 86%, #ffffff 98%)',
        }}
      />
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-16 sm:h-20 bg-gradient-to-b from-white via-white/70 to-transparent z-10" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 sm:h-20 bg-gradient-to-t from-white via-white/70 to-transparent z-10" />
      <div className="pointer-events-none absolute top-0 bottom-0 left-0 w-16 sm:w-20 bg-gradient-to-r from-white via-white/70 to-transparent z-10" />
      <div className="pointer-events-none absolute top-0 bottom-0 right-0 w-16 sm:w-20 bg-gradient-to-l from-white via-white/70 to-transparent z-10" />
    </div>
  );
}
