'use client';

import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { GeoLocation } from '@automate/shared-types';
import { formatDistance, formatEta } from '@automate/shared-utils';

/**
 * Provider-agnostic route visualisation.
 *
 * Takes only coordinates plus distance/ETA, so dropping in Google Maps,
 * Mapbox or OSM later means swapping this component's internals while every
 * caller keeps the same props.
 */
export function RouteMap({
  userLocation,
  mechanicLocation,
  distanceKm,
  etaMinutes,
  progress = 0,
  userLabel = 'You',
  mechanicLabel = 'Mechanic',
  className,
  height = 'h-56',
}: {
  userLocation: GeoLocation;
  mechanicLocation?: GeoLocation | null;
  distanceKm?: number | null;
  etaMinutes?: number | null;
  /** 0..1 journey completion, used to place the moving marker. */
  progress?: number;
  userLabel?: string;
  mechanicLabel?: string;
  className?: string;
  height?: string;
}) {
  const reduce = useReducedMotion();

  // Project the two coordinates into the box with padding, so the pair is
  // always visible regardless of how far apart they are.
  const { userPt, mechPt } = useMemo(() => {
    if (!mechanicLocation) return { userPt: { x: 50, y: 60 }, mechPt: null as null | { x: number; y: number } };
    const minLat = Math.min(userLocation.latitude, mechanicLocation.latitude);
    const maxLat = Math.max(userLocation.latitude, mechanicLocation.latitude);
    const minLng = Math.min(userLocation.longitude, mechanicLocation.longitude);
    const maxLng = Math.max(userLocation.longitude, mechanicLocation.longitude);
    const spanLat = Math.max(maxLat - minLat, 0.0005);
    const spanLng = Math.max(maxLng - minLng, 0.0005);
    const px = (lng: number) => 20 + ((lng - minLng) / spanLng) * 60;
    const py = (lat: number) => 78 - ((lat - minLat) / spanLat) * 56;
    return {
      userPt: { x: px(userLocation.longitude), y: py(userLocation.latitude) },
      mechPt: { x: px(mechanicLocation.longitude), y: py(mechanicLocation.latitude) },
    };
  }, [userLocation, mechanicLocation]);

  // Gentle arc rather than a straight line — reads as a route, not a ruler.
  const path = mechPt
    ? `M ${mechPt.x} ${mechPt.y} Q ${(mechPt.x + userPt.x) / 2 + 6} ${(mechPt.y + userPt.y) / 2 - 10} ${userPt.x} ${userPt.y}`
    : '';

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-slate-900 ${height} ${className ?? ''}`}>
      <span
        aria-hidden
        className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(148,163,184,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.7) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
        }}
      />
      <span aria-hidden className="absolute inset-0 bg-gradient-to-br from-indigo-950/70 via-slate-900/30 to-sky-950/60" />

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label={`Route from ${mechanicLabel} to ${userLabel}`}
      >
        {mechPt && (
          <>
            <path d={path} fill="none" stroke="rgba(129,140,248,0.35)" strokeWidth="1.2" strokeDasharray="3 2" vectorEffect="non-scaling-stroke" />
            <motion.path
              d={path}
              fill="none"
              stroke="rgb(129,140,248)"
              strokeWidth="1.6"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: reduce ? 1 : Math.max(0.06, progress) }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </>
        )}
      </svg>

      {/* Destination */}
      <Marker x={userPt.x} y={userPt.y} tone="indigo" icon="📍" label={userLabel} pulse={!reduce} />

      {/* Mechanic, positioned along the arc by `progress` */}
      {mechPt && (
        <motion.div
          className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
          animate={{
            left: `${mechPt.x + (userPt.x - mechPt.x) * progress}%`,
            top: `${mechPt.y + (userPt.y - mechPt.y) * progress}%`,
          }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        >
          <Marker inline tone="emerald" icon="🔧" label={mechanicLabel} />
        </motion.div>
      )}

      {(distanceKm != null || etaMinutes != null) && (
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center gap-2">
          {distanceKm != null && (
            <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
              📏 {formatDistance(distanceKm)}
            </span>
          )}
          {etaMinutes != null && (
            <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
              ⏱ {formatEta(etaMinutes)}
            </span>
          )}
          <span className="ml-auto rounded-full bg-white/10 px-2.5 py-1 text-[10px] uppercase tracking-wide text-slate-300 backdrop-blur">
            Simulated route
          </span>
        </div>
      )}
    </div>
  );
}

function Marker({
  x,
  y,
  tone,
  icon,
  label,
  pulse,
  inline,
}: {
  x?: number;
  y?: number;
  tone: 'indigo' | 'emerald';
  icon: string;
  label: string;
  pulse?: boolean;
  inline?: boolean;
}) {
  const tones = {
    indigo: 'bg-indigo-500 shadow-indigo-500/50',
    emerald: 'bg-emerald-500 shadow-emerald-500/50',
  };
  const body = (
    <div className="flex flex-col items-center gap-1">
      <span className={`relative grid h-9 w-9 place-items-center rounded-full text-base shadow-lg ${tones[tone]}`}>
        {icon}
        {pulse && (
          <motion.span
            aria-hidden
            className={`absolute inset-0 rounded-full ${tones[tone]}`}
            animate={{ scale: [1, 1.9], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
      </span>
      <span className="whitespace-nowrap rounded-md bg-slate-950/70 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur">
        {label}
      </span>
    </div>
  );

  if (inline) return body;
  return (
    <div className="absolute z-10 -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }}>
      {body}
    </div>
  );
}
