'use client';

import React from 'react';
import { Camera, ShieldAlert, Layers, Lock, RefreshCw, Cpu, Zap } from 'lucide-react';
import { DeviceTelemetry } from '@/types/incident';

interface NavbarProps {
  telemetry: DeviceTelemetry | null;
  activeTab: 'gallery' | 'map' | 'hardware';
  setActiveTab: (tab: 'gallery' | 'map' | 'hardware') => void;
  isSimulatedMode: boolean;
  onToggleSimulatedMode: () => void;
  onOpenAdmin: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function Navbar({
  telemetry,
  activeTab,
  setActiveTab,
  isSimulatedMode,
  onToggleSimulatedMode,
  onOpenAdmin,
  onRefresh,
  isRefreshing,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand & Sentinel Identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Camera className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white sm:text-lg">
                Tingley Beach Sentinel
              </h1>
              {isSimulatedMode ? (
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  ⚡ Simulated Mode Active
                </span>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Edge Pi
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Autonomous Wildlife & Lake Monitor • Albuquerque, NM
            </p>
          </div>
        </div>

        {/* View Switcher: Gallery vs Map vs Hardware Rig */}
        <div className="hidden md:flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5">
          <button
            onClick={() => setActiveTab('gallery')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              activeTab === 'gallery'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5 text-emerald-400" />
            Live Gallery
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              activeTab === 'map'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-sky-400" />
            Pond Map
          </button>
          <button
            onClick={() => setActiveTab('hardware')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              activeTab === 'hardware'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="h-3.5 w-3.5 text-indigo-400" />
            Hardware Rig
          </button>
        </div>

        {/* Action Controls: Simulated Mode Toggle, Refresh, Admin */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Simulated Mode Quick Switch */}
          <button
            onClick={onToggleSimulatedMode}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition shadow-sm ${
              isSimulatedMode
                ? 'border-amber-500/50 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 ring-1 ring-amber-400/40'
                : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title={isSimulatedMode ? 'Switch back to Live Hardware Edge stream' : 'Switch to Interactive Simulated Mode (Always Operational)'}
          >
            <Zap className={`h-3.5 w-3.5 ${isSimulatedMode ? 'text-amber-400' : 'text-slate-400'}`} />
            <span>{isSimulatedMode ? 'Simulated Mode' : 'Simulate'}</span>
          </button>

          {/* Refresh Stream */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh stream"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {/* Admin Panel */}
          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 transition shadow-sm"
          >
            <Lock className="h-3.5 w-3.5 text-amber-400" />
            <span>Admin</span>
          </button>
        </div>
      </div>

      {/* Mobile View Switcher Row */}
      <div className="flex md:hidden border-t border-slate-900 bg-slate-950 px-4 py-2 justify-center">
        <div className="flex w-full items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5 justify-around">
          <button
            onClick={() => setActiveTab('gallery')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition ${
              activeTab === 'gallery'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5 text-emerald-400" />
            Gallery
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition ${
              activeTab === 'map'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-sky-400" />
            Map
          </button>
          <button
            onClick={() => setActiveTab('hardware')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition ${
              activeTab === 'hardware'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="h-3.5 w-3.5 text-indigo-400" />
            Hardware
          </button>
        </div>
      </div>
    </header>
  );
}
