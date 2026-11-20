'use client';

import React from 'react';
import { Incident } from '@/types/incident';
import { Skull, AlertTriangle, Clock, Layers, ShieldCheck } from 'lucide-react';

interface MetricsCardsProps {
  incidents: Incident[];
  onFilterChange: (type: string) => void;
  activeFilter: string;
}

export function MetricsCards({ incidents, onFilterChange, activeFilter }: MetricsCardsProps) {
  const totalAlerts = incidents.length;
  const deadWildlife = incidents.filter((i) => i.type === 'dead_wildlife').length;
  const illegalFishing = incidents.filter((i) => i.type === 'illegal_fishing').length;
  const routineSnapshots = incidents.filter((i) => i.type === 'routine_snapshot').length;

  const cards = [
    {
      id: 'all',
      title: 'Total Captures',
      value: totalAlerts,
      icon: Layers,
      color: 'text-sky-400',
      bgColor: 'bg-sky-500/10',
      borderColor: 'border-sky-500/20',
      activeBorder: 'ring-1 ring-sky-400 bg-sky-950/20',
      description: 'All recorded events',
    },
    {
      id: 'dead_wildlife',
      title: 'Dead Wildlife',
      value: deadWildlife,
      icon: Skull,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/20',
      activeBorder: 'ring-1 ring-rose-400 bg-rose-950/20',
      description: 'YOLO carcass flags',
    },
    {
      id: 'illegal_fishing',
      title: 'Fishing Violations',
      value: illegalFishing,
      icon: AlertTriangle,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      activeBorder: 'ring-1 ring-amber-400 bg-amber-950/20',
      description: 'Restricted pond checks',
    },
    {
      id: 'routine_snapshot',
      title: 'Hourly Baselines',
      value: routineSnapshots,
      icon: Clock,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      activeBorder: 'ring-1 ring-emerald-400 bg-emerald-950/20',
      description: 'Scheduled clear frames',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.id;

        return (
          <button
            key={card.id}
            onClick={() => onFilterChange(card.id)}
            className={`flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 text-left transition hover:border-slate-700 ${
              isActive ? card.activeBorder : ''
            }`}
          >
            <div>
              <p className="text-xs text-slate-400 font-medium">{card.title}</p>
              <p className="text-xl font-bold text-white mt-0.5">{card.value}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{card.description}</p>
            </div>
            <div className={`p-2 rounded-lg ${card.bgColor} ${card.color}`}>
              <Icon className="h-5 w-5" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
