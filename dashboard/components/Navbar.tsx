'use client';

import React from 'react';
import { Camera, ShieldAlert, Cpu, Wifi, Zap, Play, Mail, Layers } from 'lucide-react';
import { DeviceTelemetry } from '@/types/incident';

interface NavbarProps {
  telemetry: DeviceTelemetry | null;
  onOpenSimulate: () => void;
  onOpenEmail: () => void;
  onOpenHardware: () => void;
  activeTab: 'incidents' | 'map' | 'hardware';
  setActiveTab: (tab: 'incidents' | 'map' | 'hardware') => void;
}

export function Navbar({
  telemetry,
  onOpenSimulate,
  onOpenEmail,
  onOpenHardware,
  activeTab,
  setActiveTab,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand & Unit Identifier */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-inner">
            <Camera className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">
                Tingley Beach Sentinel
              </h1>
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                EDGE AI UNIT 01
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Albuquerque, NM • Wildlife Mortality & Fishing Compliance Monitor
            </p>
          </div>
        </div>

        {/* View Switcher Navigation */}
        <div className="hidden md:flex items-center rounded-lg bg-slate-900 border border-slate-800 p-1">
          <button
            onClick={() => setActiveTab('incidents')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              activeTab === 'incidents'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            Alerts & Captures
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              activeTab === 'map'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Tingley Map
          </button>
          <button
            onClick={() => setActiveTab('hardware')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              activeTab === 'hardware'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            Hardware & Breadboard
          </button>
        </div>

        {/* Live Vitals & Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Pi Status Badge */}
          <div className="hidden lg:flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span className="font-semibold text-slate-200">Pi 4 Online</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1 text-slate-400">
              <Wifi className="h-3 w-3 text-sky-400" />
              <span>5GHz</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1 text-slate-400">
              <Zap className="h-3 w-3 text-amber-400" />
              <span>5V/3A Wall Power</span>
            </div>
          </div>

          {/* Test / Simulate Trigger Button */}
          <button
            onClick={onOpenSimulate}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition"
            title="Simulate PIR motion or hourly trigger"
          >
            <Play className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Simulate</span> Event
          </button>

          {/* Email Settings Button */}
          <button
            onClick={onOpenEmail}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
            title="Configure alert emails"
          >
            <Mail className="h-3.5 w-3.5 text-sky-400" />
            <span className="hidden sm:inline">Email</span> Alerts
          </button>
        </div>
      </div>
    </header>
  );
}
