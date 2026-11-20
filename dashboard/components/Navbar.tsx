'use client';

import React from 'react';
import { Camera, ShieldAlert, Layers, Lock, RefreshCw } from 'lucide-react';
import { DeviceTelemetry } from '@/types/incident';

interface NavbarProps {
  telemetry: DeviceTelemetry | null;
  activeTab: 'gallery' | 'map';
  setActiveTab: (tab: 'gallery' | 'map') => void;
  onOpenAdmin: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function Navbar({
  telemetry,
  activeTab,
  setActiveTab,
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
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Monitoring
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous Wildlife & Lake Monitor • Albuquerque, NM
            </p>
          </div>
        </div>

        {/* View Switcher: Gallery vs Map */}
        <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5">
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
        </div>

        {/* Refresh & Admin Access */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh stream"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-300 transition shadow-sm"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Admin</span>
          </button>
        </div>
      </div>
    </header>
  );
}
