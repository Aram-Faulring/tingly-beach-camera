'use client';

import React from 'react';
import { Incident } from '@/types/incident';
import {
  X,
  Skull,
  AlertTriangle,
  Clock,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface IncidentModalProps {
  incident: Incident | null;
  onClose: () => void;
}

export function IncidentModal({ incident, onClose }: IncidentModalProps) {
  if (!incident) return null;

  const isDead = incident.type === 'dead_wildlife';
  const isFishing = incident.type === 'illegal_fishing';
  const isRoutine = incident.type === 'routine_snapshot';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-950/95 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div
              className={`rounded-xl p-2 ${
                isDead
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : isFishing
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}
            >
              {isDead && <Skull className="h-5 w-5" />}
              {isFishing && <AlertTriangle className="h-5 w-5" />}
              {isRoutine && <Clock className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                {incident.title}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span>{new Date(incident.timestamp).toLocaleString()}</span>
                <span>•</span>
                <span className="capitalize text-slate-300">{incident.status}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5">
          {/* Main Visual Display */}
          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-black aspect-video flex items-center justify-center">
            <img
              src={incident.imageUrl}
              alt={incident.title}
              className="w-full h-full object-contain"
            />

            {/* Bounding Box Highlights if present */}
            {incident.boundingBoxes && incident.boundingBoxes.length > 0 && (
              <div className="absolute inset-0 pointer-events-none">
                {incident.boundingBoxes.map((box, idx) => {
                  const [ymin, xmin, ymax, xmax] = box.box;
                  return (
                    <div
                      key={idx}
                      style={{
                        top: `${ymin}%`,
                        left: `${xmin}%`,
                        width: `${xmax - xmin}%`,
                        height: `${ymax - ymin}%`,
                      }}
                      className="absolute border-2 border-rose-500 bg-rose-500/20 rounded shadow-sm flex items-start"
                    >
                      <span className="bg-rose-600 text-white text-[10px] px-1 py-0.5 font-bold rounded-br">
                        {box.label} ({(box.confidence * 100).toFixed(0)}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-1">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                Pond Location
              </span>
              <p className="text-white font-medium">{incident.location}</p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-1">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-slate-400" />
                Edge AI Confidence
              </span>
              <p className="text-emerald-400 font-medium">
                {(incident.confidence * 100).toFixed(1)}% Confidence
                {incident.species ? ` • ${incident.species}` : ''}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-1 sm:col-span-2">
              <span className="text-slate-500 font-medium">Incident Summary</span>
              <p className="text-slate-300 leading-relaxed">{incident.description}</p>
            </div>

            {incident.notes && (
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-1 sm:col-span-2">
                <span className="text-slate-500 font-medium">Telemetry & Actuation Notes</span>
                <p className="text-slate-300">{incident.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-800 bg-slate-950/95 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 text-xs font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
