'use client';

import React, { useState } from 'react';
import { X, Play, Skull, AlertTriangle, Clock, RotateCw, CheckCircle2 } from 'lucide-react';

interface SimulateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulate: (scenario: string) => Promise<void>;
}

export function SimulateModal({ isOpen, onClose, onSimulate }: SimulateModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState('dead_goose');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const scenarios = [
    {
      id: 'dead_goose',
      title: 'PIR Motion: Deceased Canada Goose',
      icon: Skull,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10 border-rose-500/30',
      desc: 'PIR sensor triggers capture. YOLO classifies lifeless Canada Goose on South Pond bank. Actuates 2x Servos to 180° and activates Red alert LED.',
    },
    {
      id: 'illegal_fishing',
      title: 'PIR Motion: Illegal Night Fishing in Model Boat Pond',
      icon: AlertTriangle,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/30',
      desc: 'PIR sensor detects motion after hours. YOLO classifies angler casting rod in restricted youth/model boat zone. Actuates 2x Servos to 180° and dispatches email.',
    },
    {
      id: 'hourly_timer',
      title: 'Hourly Timer: Routine Baseline Check (All Clear)',
      icon: Clock,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/30',
      desc: '60-minute default timer capture. Surface clear, water level nominal. Servos stay at 0°, Green LED stays active, logs routine check.',
    },
  ];

  const handleRun = async () => {
    setLoading(true);
    setSuccessMsg(null);
    try {
      await onSimulate(selectedScenario);
      setSuccessMsg('Simulation injected! Incident created, servos rotated, and alert recorded.');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <Play className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Simulate Edge Pi Trigger</h3>
              <p className="text-xs text-slate-400">Test ingestion, servo actuation & alert dispatch</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {scenarios.map((s) => {
            const Icon = s.icon;
            const isSelected = selectedScenario === s.id;
            return (
              <div
                key={s.id}
                onClick={() => setSelectedScenario(s.id)}
                className={`cursor-pointer rounded-xl border p-3.5 transition ${
                  isSelected
                    ? `${s.bgColor} border-2`
                    : 'border-slate-800 bg-slate-900/50 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${s.color}`} />
                    <span className="text-xs font-bold text-white">{s.title}</span>
                  </div>
                  <input
                    type="radio"
                    name="scenario"
                    checked={isSelected}
                    onChange={() => setSelectedScenario(s.id)}
                    className="h-3.5 w-3.5 text-emerald-500"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            );
          })}
        </div>

        {successMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-xs text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleRun}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5" />
            {loading ? 'Simulating...' : 'Fire Trigger Scenario'}
          </button>
        </div>
      </div>
    </div>
  );
}
