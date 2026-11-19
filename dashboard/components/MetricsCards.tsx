'use client';

import React from 'react';
import { Incident } from '@/types/incident';
import { Skull, AlertTriangle, Clock, RotateCw, Activity } from 'lucide-react';

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
  const servosActuated = incidents.filter((i) => i.servosTriggered).length;

  const cards = [
    {
      id: 'all',
      title: 'Total Captures',
      value: totalAlerts,
      icon: Activity,
      color: 'text-sky-400',
      bgColor: 'bg-sky-500/10',
      borderColor: 'border-sky-500/20',
      activeBorder: 'ring-2 ring-sky-500',
      subtext: 'PIR motion & hourly checks',
    },
    {
      id: 'dead_wildlife',
      title: 'Dead Wildlife',
      value: deadWildlife,
      icon: Skull,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/20',
      activeBorder: 'ring-2 ring-rose-500',
      subtext: 'Species classified by YOLO',
    },
    {
      id: 'illegal_fishing',
      title: 'Illegal Fishing',
      value: illegalFishing,
      icon: AlertTriangle,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      activeBorder: 'ring-2 ring-amber-500',
      subtext: 'Restricted zones & night rods',
    },
    {
      id: 'routine_snapshot',
      title: 'Hourly Baselines',
      value: routineSnapshots,
      icon: Clock,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      activeBorder: 'ring-2 ring-emerald-500',
      subtext: 'Default 60-min timer checks',
    },
    {
      id: 'servos',
      title: 'Servo Actuations',
      value: servosActuated,
      icon: RotateCw,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20',
      activeBorder: 'ring-2 ring-indigo-500',
      subtext: '180° incident flags deployed',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.id;

        return (
          <button
            key={card.id}
            onClick={() => onFilterChange(card.id)}
            className={`flex flex-col justify-between rounded-xl border ${card.borderColor} bg-slate-900/60 p-4 text-left transition hover:bg-slate-900 ${
              isActive ? `${card.activeBorder} bg-slate-900` : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">{card.title}</span>
              <div className={`rounded-lg ${card.bgColor} p-1.5`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-white">{card.value}</div>
              <p className="mt-0.5 text-[11px] text-slate-400">{card.subtext}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
