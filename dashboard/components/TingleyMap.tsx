'use client';

import React, { useState } from 'react';
import { Incident } from '@/types/incident';
import { Camera, MapPin, Eye, Radio, AlertCircle } from 'lucide-react';

interface TingleyMapProps {
  incidents: Incident[];
  onSelectIncident: (incident: Incident) => void;
}

export function TingleyMap({ incidents, onSelectIncident }: TingleyMapProps) {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  // Map zone locations in percentages for SVG rendering
  const zoneCoords: Record<string, { x: number; y: number; label: string }> = {
    central_pond: { x: 50, y: 44, label: 'Central Pond' },
    children_pond: { x: 74, y: 68, label: "Children's & Model Boat Pond" },
    south_pond: { x: 26, y: 64, label: 'Catch & Release Pond' },
    bosque_bank: { x: 18, y: 32, label: 'Rio Grande Bosque Bank' },
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-xl">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-400">
            <Radio className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Tingley Beach Tactical Zone Map</h2>
            <p className="text-xs text-slate-400">Albuquerque BioPark & Open Space Division (35.086° N, 106.678° W)</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30"></span>
            <span>Pi 4 Camera Unit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
            <span>Dead Wildlife</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
            <span>Illegal Fishing</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900">
        <svg viewBox="0 0 1000 560" className="h-full w-full select-none">
          <defs>
            {/* Water gradient */}
            <linearGradient id="pondGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0.7" />
            </linearGradient>

            {/* Camera FOV radar cone */}
            <radialGradient id="fovCone" cx="50%" cy="80%" r="65%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </radialGradient>
          </defs>

          {/* Grid lines */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.75" />
          </pattern>
          <rect width="1000" height="560" fill="url(#grid)" />

          {/* Rio Grande River Bank along western side */}
          <path
            d="M 20 0 Q 70 200 40 380 T 60 560 L 0 560 L 0 0 Z"
            fill="#1e3a8a"
            fillOpacity="0.25"
          />
          <text x="25" y="280" fill="#60a5fa" fontSize="11" transform="rotate(-90 25 280)" opacity="0.6" letterSpacing="2">
            RIO GRANDE RIVER
          </text>

          {/* Bosque Cottonwood Forest / Nature Trail */}
          <path
            d="M 60 0 Q 110 200 80 400 T 110 560 L 60 560 L 20 0 Z"
            fill="#14532d"
            fillOpacity="0.3"
          />
          <text x="75" y="140" fill="#4ade80" fontSize="10" opacity="0.5">
            BOSQUE TRAIL (RESTRICTED)
          </text>

          {/* Central Pond (Main Fishing Pond) */}
          <g>
            <path
              d="M 360 140 Q 550 110 680 170 Q 720 280 620 330 Q 420 360 330 280 Q 300 200 360 140 Z"
              fill="url(#pondGrad)"
              stroke="#38bdf8"
              strokeWidth="2"
            />
            <text x="500" y="235" fill="#bae6fd" fontSize="13" fontWeight="600" textAnchor="middle">
              CENTRAL POND
            </text>
            <text x="500" y="252" fill="#7dd3fc" fontSize="10" textAnchor="middle" opacity="0.8">
              Daily Stocked • Daytime Permitted
            </text>
          </g>

          {/* Children's & Model Boat Pond (East) */}
          <g>
            <ellipse
              cx="760"
              cy="380"
              rx="130"
              ry="80"
              fill="url(#pondGrad)"
              stroke="#38bdf8"
              strokeWidth="2"
            />
            <text x="760" y="375" fill="#bae6fd" fontSize="12" fontWeight="600" textAnchor="middle">
              MODEL BOAT POND
            </text>
            <text x="760" y="392" fill="#f87171" fontSize="10" textAnchor="middle">
              NO ADULT FISHING • NO NIGHT CASTING
            </text>
          </g>

          {/* South Pond (Catch & Release) */}
          <g>
            <ellipse
              cx="260"
              cy="380"
              rx="110"
              ry="75"
              fill="url(#pondGrad)"
              stroke="#38bdf8"
              strokeWidth="2"
            />
            <text x="260" y="375" fill="#bae6fd" fontSize="12" fontWeight="600" textAnchor="middle">
              SOUTH POND
            </text>
            <text x="260" y="392" fill="#7dd3fc" fontSize="10" textAnchor="middle" opacity="0.8">
              Catch & Release Only • Barbless Hooks
            </text>
          </g>

          {/* Walking Paths and Docks */}
          <path
            d="M 120 480 Q 300 500 520 480 T 940 490"
            fill="none"
            stroke="#475569"
            strokeWidth="3"
            strokeDasharray="6,4"
          />
          <text x="520" y="520" fill="#94a3b8" fontSize="10" textAnchor="middle">
            TINGLEY BEACH PROMENADE / BOARDWALK
          </text>

          {/* Camera Field of View (FOV) Cone from Promontory Station */}
          <g>
            {/* FOV Triangle spanning Central and Model Boat Ponds */}
            <polygon
              points="520,470 300,120 780,120"
              fill="url(#fovCone)"
            />
            {/* Sweeping scan line */}
            <line
              x1="520"
              y1="470"
              x2="520"
              y2="120"
              stroke="#10b981"
              strokeWidth="1.5"
              strokeDasharray="4,4"
              opacity="0.7"
            />
          </g>

          {/* Raspberry Pi 4 Camera Station Marker */}
          <g transform="translate(520, 470)">
            {/* Pulsing ring */}
            <circle cx="0" cy="0" r="18" fill="#10b981" fillOpacity="0.2" className="animate-ping" />
            <circle cx="0" cy="0" r="10" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
            <circle cx="0" cy="0" r="4" fill="#ffffff" />
            {/* Callout Tag */}
            <rect x="-85" y="-38" width="170" height="24" rx="5" fill="#0f172a" stroke="#10b981" strokeWidth="1" />
            <text x="0" y="-22" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
              📷 RASPBERRY PI 4 UNIT
            </text>
          </g>

          {/* Incident Pins */}
          {incidents.map((incident) => {
            const coords = zoneCoords[incident.pondZone] || { x: 50, y: 50 };
            const svgX = (coords.x / 100) * 1000 + (incident.id.charCodeAt(incident.id.length - 1) % 20 - 10) * 2;
            const svgY = (coords.y / 100) * 560 + (incident.id.charCodeAt(incident.id.length - 2) % 20 - 10) * 2;

            const isDead = incident.type === 'dead_wildlife';
            const isFishing = incident.type === 'illegal_fishing';
            const pinColor = isDead ? '#ef4444' : isFishing ? '#f59e0b' : '#10b981';

            return (
              <g
                key={incident.id}
                transform={`translate(${svgX}, ${svgY})`}
                className="cursor-pointer transition hover:scale-125"
                onClick={() => onSelectIncident(incident)}
              >
                {/* Ping animation for active/unreviewed alerts */}
                {incident.status === 'unreviewed' && (
                  <circle cx="0" cy="0" r="16" fill={pinColor} fillOpacity="0.3" className="animate-ping" />
                )}
                {/* Pin Head */}
                <circle cx="0" cy="-14" r="12" fill={pinColor} stroke="#ffffff" strokeWidth="2" />
                <path d="M 0 0 L -5 -8 L 5 -8 Z" fill={pinColor} />
                <circle cx="0" cy="-14" r="5" fill="#ffffff" />

                {/* Pin Tooltip */}
                <rect x="-60" y="-46" width="120" height="20" rx="4" fill="#020617" stroke={pinColor} strokeWidth="1" fillOpacity="0.9" />
                <text x="0" y="-32" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                  {isDead ? '☠️ ' + (incident.species?.split(' ')[0] || 'Wildlife') : isFishing ? '🎣 Illegal Fishing' : '⏱️ Routine'}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Live Camera Status Overlay */}
        <div className="absolute bottom-3 left-3 rounded-lg border border-slate-800 bg-slate-950/90 p-2.5 backdrop-blur-sm text-xs">
          <div className="flex items-center gap-2 font-medium text-slate-200">
            <Eye className="h-3.5 w-3.5 text-emerald-400" />
            <span>FOV Coverage: Central & Model Boat Ponds</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            PIR Motion Sensor arc: 110° • Detection Range: ~45m
          </div>
        </div>
      </div>
    </div>
  );
}
