'use client';

import React, { useState } from 'react';
import { Incident } from '@/types/incident';
import {
  Skull,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  Eye,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

interface IncidentGalleryProps {
  incidents: Incident[];
  onSelectIncident: (incident: Incident) => void;
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
}

export function IncidentGallery({
  incidents,
  onSelectIncident,
  activeFilter,
  setActiveFilter,
}: IncidentGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = incidents.filter((incident) => {
    if (activeFilter === 'dead_wildlife' && incident.type !== 'dead_wildlife') return false;
    if (activeFilter === 'illegal_fishing' && incident.type !== 'illegal_fishing') return false;
    if (activeFilter === 'routine_snapshot' && incident.type !== 'routine_snapshot') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = incident.title.toLowerCase().includes(q);
      const matchDesc = incident.description.toLowerCase().includes(q);
      const matchSpecies = incident.species?.toLowerCase().includes(q) ?? false;
      const matchLocation = incident.location.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchSpecies && !matchLocation) return false;
    }

    return true;
  });

  const formatTimeAgo = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 2) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search captures, species, locations..."
            className="w-full rounded-lg border border-slate-800 bg-slate-900/60 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-slate-700 focus:outline-none"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          {[
            { id: 'all', label: 'All' },
            { id: 'dead_wildlife', label: 'Dead Wildlife' },
            { id: 'illegal_fishing', label: 'Fishing Violations' },
            { id: 'routine_snapshot', label: 'Routine Checks' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setActiveFilter(pill.id)}
              className={`rounded-lg px-3 py-1.5 whitespace-nowrap font-medium transition ${
                activeFilter === pill.id
                  ? 'bg-slate-200 text-slate-900 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Captures Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-12 text-center text-slate-400">
          <p className="text-sm">No captures found matching your filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((incident) => {
            const isDead = incident.type === 'dead_wildlife';
            const isFishing = incident.type === 'illegal_fishing';
            const isRoutine = incident.type === 'routine_snapshot';

            return (
              <div
                key={incident.id}
                onClick={() => onSelectIncident(incident)}
                className="group cursor-pointer rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-700 transition overflow-hidden flex flex-col"
              >
                {/* Image Container */}
                <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                  <img
                    src={incident.imageUrl}
                    alt={incident.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />

                  {/* Top Category Badge */}
                  <div className="absolute top-2.5 left-2.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold backdrop-blur-md shadow-sm ${
                        isDead
                          ? 'bg-rose-500/80 text-white'
                          : isFishing
                          ? 'bg-amber-500/80 text-white'
                          : 'bg-emerald-500/80 text-white'
                      }`}
                    >
                      {isDead && <Skull className="h-3 w-3" />}
                      {isFishing && <AlertTriangle className="h-3 w-3" />}
                      {isRoutine && <Clock className="h-3 w-3" />}
                      {isDead ? 'Dead Wildlife' : isFishing ? 'Fishing Alert' : 'Routine'}
                    </span>
                  </div>

                  {/* Top Right Confidence Badge */}
                  <div className="absolute top-2.5 right-2.5">
                    <span className="rounded-md bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-mono text-slate-200">
                      {(incident.confidence * 100).toFixed(0)}% AI
                    </span>
                  </div>

                  {/* Hover Inspect Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-white bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-lg shadow-lg">
                      <Eye className="h-3.5 w-3.5" />
                      View High-Res
                    </span>
                  </div>
                </div>

                {/* Card Info */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-500" />
                        {incident.location.split('-')[1]?.trim() || 'Tingley Beach'}
                      </span>
                      <span>{formatTimeAgo(incident.timestamp)}</span>
                    </div>

                    <h3 className="text-sm font-semibold text-white line-clamp-1 group-hover:text-emerald-300 transition">
                      {incident.title}
                    </h3>

                    {incident.species && (
                      <p className="text-xs text-emerald-400 font-medium mt-0.5">
                        {incident.species}
                      </p>
                    )}

                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                      {incident.description}
                    </p>
                  </div>

                  {/* Footer status */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span
                      className={`capitalize font-medium ${
                        incident.status === 'resolved'
                          ? 'text-emerald-400'
                          : incident.status === 'investigating'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      ● {incident.status}
                    </span>

                    {incident.servosTriggered && (
                      <span className="text-slate-400 text-[10px] bg-slate-800/60 px-1.5 py-0.5 rounded border border-slate-700/50">
                        180° Flag Active
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
