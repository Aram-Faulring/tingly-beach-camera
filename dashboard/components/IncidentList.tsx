'use client';

import React, { useState } from 'react';
import { Incident } from '@/types/incident';
import {
  Skull,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Eye,
  Mail,
  Search,
  Filter,
  RotateCw,
  Sparkles,
} from 'lucide-react';

interface IncidentListProps {
  incidents: Incident[];
  onSelectIncident: (incident: Incident) => void;
  onUpdateStatus: (id: string, status: 'unreviewed' | 'investigating' | 'resolved' | 'dismissed') => void;
  onDispatchEmail: (incident: Incident) => void;
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
}

export function IncidentList({
  incidents,
  onSelectIncident,
  onUpdateStatus,
  onDispatchEmail,
  activeFilter,
  setActiveFilter,
}: IncidentListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter items
  const filtered = incidents.filter((incident) => {
    // Type filter
    if (activeFilter === 'dead_wildlife' && incident.type !== 'dead_wildlife') return false;
    if (activeFilter === 'illegal_fishing' && incident.type !== 'illegal_fishing') return false;
    if (activeFilter === 'routine_snapshot' && incident.type !== 'routine_snapshot') return false;
    if (activeFilter === 'unreviewed' && incident.status !== 'unreviewed') return false;
    if (activeFilter === 'servos' && !incident.servosTriggered) return false;

    // Search query
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

  return (
    <div className="space-y-4">
      {/* Controls: Filter Pills & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 p-1">
          {[
            { id: 'all', label: 'All Events' },
            { id: 'dead_wildlife', label: '☠️ Dead Wildlife' },
            { id: 'illegal_fishing', label: '🎣 Illegal Fishing' },
            { id: 'routine_snapshot', label: '⏱️ Hourly Baselines' },
            { id: 'unreviewed', label: '⚠️ Unreviewed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                activeFilter === tab.id
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search species, zone, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-950 p-12 text-center">
          <Filter className="h-8 w-8 text-slate-600 mb-2" />
          <h3 className="text-sm font-semibold text-slate-300">No matching events found</h3>
          <p className="mt-1 text-xs text-slate-500">
            Try adjusting your search query or switching active filter categories.
          </p>
          <button
            onClick={() => {
              setActiveFilter('all');
              setSearchQuery('');
            }}
            className="mt-4 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Incident Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((incident) => {
          const isDead = incident.type === 'dead_wildlife';
          const isFishing = incident.type === 'illegal_fishing';
          const isRoutine = incident.type === 'routine_snapshot';

          const cardBorder = isDead
            ? 'border-rose-500/30 hover:border-rose-500/60'
            : isFishing
            ? 'border-amber-500/30 hover:border-amber-500/60'
            : 'border-slate-800 hover:border-slate-700';

          return (
            <div
              key={incident.id}
              className={`group flex flex-col justify-between overflow-hidden rounded-2xl border ${cardBorder} bg-slate-900/50 shadow-md backdrop-blur-sm transition-all hover:bg-slate-900 hover:shadow-xl`}
            >
              {/* Image Preview with Badges */}
              <div
                className="relative aspect-[16/10] w-full overflow-hidden bg-slate-950 cursor-pointer"
                onClick={() => onSelectIncident(incident)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={incident.imageUrl}
                  alt={incident.title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />

                {/* Top Overlay Pills */}
                <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                  {/* Category Pill */}
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold shadow ${
                      isDead
                        ? 'bg-rose-500/90 text-white'
                        : isFishing
                        ? 'bg-amber-500/90 text-black'
                        : 'bg-emerald-500/90 text-white'
                    }`}
                  >
                    {isDead && <Skull className="h-3 w-3" />}
                    {isFishing && <AlertTriangle className="h-3 w-3" />}
                    {isRoutine && <Clock className="h-3 w-3" />}
                    {isDead ? 'DEAD WILDLIFE' : isFishing ? 'ILLEGAL FISHING' : 'HOURLY BASELINE'}
                  </span>

                  {/* Trigger Source Pill */}
                  <span className="rounded-md bg-black/75 px-1.5 py-0.5 text-[10px] font-medium text-slate-300 backdrop-blur-sm">
                    {incident.trigger === 'pir_motion' ? 'PIR Sensor' : 'Hourly Timer'}
                  </span>
                </div>

                {/* Confidence Pill */}
                <div className="absolute top-2.5 right-2.5">
                  <span className="rounded-md bg-black/80 px-2 py-0.5 text-[11px] font-mono font-semibold text-emerald-400 border border-emerald-500/40 backdrop-blur-sm">
                    {(incident.confidence * 100).toFixed(1)}% AI CONF
                  </span>
                </div>

                {/* Bottom Overlay Info */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span className="truncate">{incident.location}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(incident.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  {/* Species / Category Highlight */}
                  {incident.species && (
                    <div className="mb-1 text-xs font-semibold text-rose-400 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Species: {incident.species}
                    </div>
                  )}

                  <h3
                    className="text-sm font-bold text-white hover:text-emerald-400 cursor-pointer transition"
                    onClick={() => onSelectIncident(incident)}
                  >
                    {incident.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                    {incident.description}
                  </p>
                </div>

                {/* Hardware Actuation & Alert Status Footer */}
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px]">
                    {/* Servo status */}
                    <div className="flex items-center gap-1">
                      <RotateCw className={`h-3 w-3 ${incident.servosTriggered ? 'text-indigo-400' : 'text-slate-500'}`} />
                      <span className={incident.servosTriggered ? 'text-indigo-300 font-medium' : 'text-slate-500'}>
                        {incident.servosTriggered ? 'Servos 180° Flag Active' : 'Servos 0° (Rest)'}
                      </span>
                    </div>

                    {/* Status Pill */}
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                        incident.status === 'unreviewed'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : incident.status === 'investigating'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {incident.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onSelectIncident(incident)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
                    >
                      <Eye className="h-3.5 w-3.5 text-sky-400" />
                      Inspect
                    </button>

                    <button
                      onClick={() => onDispatchEmail(incident)}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
                      title="Send email alert via Resend"
                    >
                      <Mail className="h-3.5 w-3.5 text-amber-400" />
                      Email
                    </button>

                    {incident.status !== 'resolved' ? (
                      <button
                        onClick={() => onUpdateStatus(incident.id, 'resolved')}
                        className="flex items-center justify-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition"
                        title="Mark incident as resolved"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Resolve
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Cleared
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
