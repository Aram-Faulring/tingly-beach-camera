'use client';

import React from 'react';
import { Camera, Lock, RefreshCw, Zap, RotateCw, Activity, Cpu } from 'lucide-react';
import { DeviceTelemetry } from '@/types/incident';

interface NavbarProps {
  telemetry: DeviceTelemetry | null;
  isSimulatedMode: boolean;
  onToggleSimulatedMode: () => void;
  onOpenAdmin: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function Navbar({
  telemetry,
  isSimulatedMode,
  onToggleSimulatedMode,
  onOpenAdmin,
  onRefresh,
  isRefreshing,
}: NavbarProps) {
  const servoAngle = telemetry?.servoAngles?.[0] ?? 0;
  const isServoAlert = servoAngle >= 90;
  const leds = telemetry?.ledState || { green: true, yellow: false, red: false };
  const cpuTemp = telemetry?.cpuTempC ?? 46.8;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
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
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  ⚡ Edge Simulator Active
                </span>
              ) : (
                <span
                  className={`hidden sm:inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${
                    telemetry?.online
                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      telemetry?.online ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                    }`}
                  />
                  {telemetry?.online ? 'Live Edge Pi 4' : 'Edge Pi Offline'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Autonomous Wildlife & Lake Sentinel • Albuquerque, NM
            </p>
          </div>
        </div>

        {/* Live Hardware Actuator Telemetry Badges */}
        <div className="hidden lg:flex items-center gap-2.5 text-xs">
          {/* Servos Status */}
          <div
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-[11px] transition ${
              isServoAlert
                ? 'border-rose-500/40 bg-rose-950/30 text-rose-300 font-bold'
                : 'border-slate-800 bg-slate-900/60 text-slate-300'
            }`}
            title="SG90 Micro Servos (GPIO 12/13)"
          >
            <RotateCw className={`h-3 w-3 ${isServoAlert ? 'text-rose-400 animate-spin' : 'text-slate-400'}`} />
            <span>Servos: {servoAngle}° {isServoAlert ? '(ALERT FLAG)' : '(REST)'}</span>
          </div>

          {/* LED Indicator */}
          <div
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-[11px] font-mono text-slate-300"
            title="Traffic Light Indicator LEDs"
          >
            <Activity className="h-3 w-3 text-slate-400" />
            <span className="flex items-center gap-1">
              LED:
              <span
                className={`h-2 w-2 rounded-full ${
                  leds.red
                    ? 'bg-rose-500 shadow-sm shadow-rose-500'
                    : leds.yellow
                    ? 'bg-amber-400 shadow-sm shadow-amber-400'
                    : 'bg-emerald-400 shadow-sm shadow-emerald-400'
                }`}
              />
              <span className={leds.red ? 'text-rose-300 font-bold' : leds.yellow ? 'text-amber-300' : 'text-emerald-300'}>
                {leds.red ? 'RED' : leds.yellow ? 'YELLOW' : 'GREEN'}
              </span>
            </span>
          </div>

          {/* Core Temp */}
          <div
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-[11px] font-mono text-slate-400"
            title="Raspberry Pi 4 CPU Temperature"
          >
            <Cpu className="h-3 w-3 text-indigo-400" />
            <span>{cpuTemp}°C</span>
          </div>
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
            title={isSimulatedMode ? 'Switch to Live Edge Pi feed' : 'Switch to Interactive Edge Simulator'}
          >
            <Zap className={`h-3.5 w-3.5 ${isSimulatedMode ? 'text-amber-400' : 'text-slate-400'}`} />
            <span>{isSimulatedMode ? 'Simulator Active' : 'Run Simulator'}</span>
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
    </header>
  );
}
