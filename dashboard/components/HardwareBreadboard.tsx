'use client';

import React from 'react';
import { DeviceTelemetry } from '@/types/incident';
import { Cpu, Zap, Activity, Radio, Eye, RotateCw, Monitor, CheckCircle2 } from 'lucide-react';

interface HardwareBreadboardProps {
  telemetry: DeviceTelemetry | null;
}

export function HardwareBreadboard({ telemetry }: HardwareBreadboardProps) {
  const servoAngle = telemetry?.servoAngles?.[0] ?? 0;
  const isAlert = servoAngle >= 90;
  const leds = telemetry?.ledState || { green: true, yellow: false, red: false };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Hardware & Breadboard Wiring Monitor</h2>
            <p className="text-xs text-slate-400">
              Raspberry Pi 4 Model B • GPIO Breakout Ribbon • Solderless Breadboard Rig
            </p>
          </div>
        </div>

        {/* Live Power & Bus Status */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-400">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            USB-C Wall Power: 5.12V / 3.0A
          </span>
          <span className="flex items-center gap-1.5 rounded-md bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 text-xs font-medium text-sky-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Red (+) 5V Rail & Blue (-) GND Active
          </span>
        </div>
      </div>

      {/* Visual Hardware Schematic Layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left Column: Raspberry Pi 4 Controller Box */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-slate-800 bg-gradient-to-br from-emerald-950/20 via-slate-900 to-slate-950 p-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Core SBC Unit
              </span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                Pi 4 (4GB RAM)
              </span>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <div className="h-16 w-16 rounded-lg bg-emerald-900/40 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-mono text-xs">
                BCM2711
              </div>
              <div className="text-xs space-y-1">
                <div className="text-slate-300 font-medium">Raspberry Pi 4 Model B</div>
                <div className="text-slate-400">CPU: Quad-core Cortex-A72 @ 1.5GHz</div>
                <div className="text-slate-400">OS: Raspberry Pi OS 64-bit (Headless)</div>
                <div className="text-emerald-400">Temp: {telemetry?.cpuTempC ?? 46.8}°C • Load: {telemetry?.cpuUsagePct ?? 22}%</div>
              </div>
            </div>

            {/* Direct Connected Interfaces */}
            <div className="mt-4 space-y-2 border-t border-slate-800/80 pt-3 text-xs">
              {/* Power Delivery */}
              <div className="flex items-center justify-between rounded-lg bg-slate-900/80 p-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-400" />
                  <span className="text-slate-300 font-medium">USB-C Power In</span>
                </div>
                <span className="text-[11px] text-slate-400">Wall Adapter (Continuous)</span>
              </div>

              {/* CSI Camera Ribbon */}
              <div className="flex items-center justify-between rounded-lg bg-slate-900/80 p-2">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-sky-400" />
                  <span className="text-slate-300 font-medium">MIPI-CSI Ribbon Cable</span>
                </div>
                <span className="text-[11px] text-emerald-400">1080p Camera Module</span>
              </div>

              {/* Optional Field HDMI Monitor */}
              <div className="flex items-center justify-between rounded-lg bg-slate-900/80 p-2">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-indigo-400" />
                  <span className="text-slate-300 font-medium">Micro-HDMI Port</span>
                </div>
                <span className="text-[11px] text-amber-300">Field Demo Display (Standby)</span>
              </div>

              {/* GPIO Ribbon Extension */}
              <div className="flex items-center justify-between rounded-lg bg-slate-900/80 p-2">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-purple-400" />
                  <span className="text-slate-300 font-medium">40-Pin GPIO Extension Ribbon</span>
                </div>
                <span className="text-[11px] text-emerald-400">Connected to Breadboard</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Solderless Breadboard & Peripherals */}
        <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                Breadboard Rig & Actuators
              </span>
              <p className="text-[11px] text-slate-400">Full-size 830-point solderless breadboard via T-cobbler</p>
            </div>
            {/* Visual Power Rails */}
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-5 rounded bg-red-500 shadow-sm shadow-red-500/50"></span>
                <span className="text-red-400 font-semibold">+5V Red Rail</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-5 rounded bg-blue-500 shadow-sm shadow-blue-500/50"></span>
                <span className="text-blue-400 font-semibold">GND Blue Rail</span>
              </div>
            </div>
          </div>

          {/* Component Modules Grid on Breadboard */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* PIR Motion Sensor */}
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">PIR Dome Sensor</span>
                  <Radio className={`h-4 w-4 ${telemetry?.pirSensorStatus === 'triggered' ? 'text-amber-400 animate-ping' : 'text-slate-500'}`} />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">Fresnel lens • GPIO 17</p>
                
                {/* Visual Dome Graphic */}
                <div className="mt-3 flex justify-center">
                  <div className={`relative flex h-16 w-16 items-center justify-center rounded-full border-2 transition ${
                    telemetry?.pirSensorStatus === 'triggered' 
                      ? 'border-amber-400 bg-amber-500/20 text-amber-300 shadow-lg shadow-amber-500/20' 
                      : 'border-slate-700 bg-slate-900 text-slate-400'
                  }`}>
                    <div className="absolute inset-2 rounded-full border border-dashed border-current opacity-60"></div>
                    <Radio className="h-6 w-6" />
                  </div>
                </div>
              </div>

              <div className="mt-3 text-center">
                <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                  telemetry?.pirSensorStatus === 'triggered' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {telemetry?.pirSensorStatus === 'triggered' ? 'MOTION DETECTED' : 'MONITORING (IDLE)'}
                </span>
              </div>
            </div>

            {/* 2x Traffic Light LED Modules */}
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">Traffic LEDs (2x)</span>
                  <Activity className="h-4 w-4 text-emerald-400" />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">GPIO 22, 27, 18 & 23, 24, 25</p>

                {/* Visual Traffic Light Pillars */}
                <div className="mt-2.5 flex justify-center gap-4">
                  {[1, 2].map((num) => (
                    <div key={num} className="flex flex-col items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 p-2 shadow-inner">
                      {/* Red Light */}
                      <div className={`h-4 w-4 rounded-full transition-all duration-300 ${
                        leds.red 
                          ? 'bg-rose-500 shadow-lg shadow-rose-500/80 ring-2 ring-rose-400' 
                          : 'bg-rose-950/40 opacity-30'
                      }`} />
                      {/* Yellow Light */}
                      <div className={`h-4 w-4 rounded-full transition-all duration-300 ${
                        leds.yellow 
                          ? 'bg-amber-400 shadow-lg shadow-amber-400/80 ring-2 ring-amber-300' 
                          : 'bg-amber-950/40 opacity-30'
                      }`} />
                      {/* Green Light */}
                      <div className={`h-4 w-4 rounded-full transition-all duration-300 ${
                        leds.green 
                          ? 'bg-emerald-400 shadow-lg shadow-emerald-400/80 ring-2 ring-emerald-300' 
                          : 'bg-emerald-950/40 opacity-30'
                      }`} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 text-center">
                <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                  leds.red 
                    ? 'bg-rose-500/20 text-rose-300' 
                    : leds.yellow 
                    ? 'bg-amber-500/20 text-amber-300' 
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {leds.red ? 'ALERT ACTIVE' : leds.yellow ? 'INFERENCE ACTIVE' : 'SYSTEM READY'}
                </span>
              </div>
            </div>

            {/* 2x Micro Servos SG90 */}
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">Micro Servos (2x)</span>
                  <RotateCw className="h-4 w-4 text-indigo-400" />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">PWM Pins 12 & 13 • 180° Rule</p>

                {/* Animated Servo Horns */}
                <div className="mt-2.5 flex justify-center gap-4">
                  {[1, 2].map((servoIdx) => (
                    <div key={servoIdx} className="flex flex-col items-center">
                      <div className="relative flex h-14 w-12 items-center justify-center rounded-md border border-slate-800 bg-sky-950/40">
                        {/* Servo Horn indicator rotating between 0 and 180 degrees */}
                        <div
                          className="h-8 w-1.5 origin-bottom rounded-full bg-indigo-400 shadow-md transition-transform duration-700 ease-out"
                          style={{
                            transform: `rotate(${servoAngle}deg)`,
                          }}
                        />
                        <div className="absolute h-3 w-3 rounded-full bg-slate-300 border border-slate-700" />
                      </div>
                      <span className="mt-1 text-[10px] text-slate-400">Servo {servoIdx}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 text-center">
                <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                  isAlert ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {isAlert ? 'ROTATED 180° (ALERT)' : 'AT REST (0°)'}
                </span>
              </div>
            </div>
          </div>

          {/* Breadboard Connection Summary Footer */}
          <div className="mt-4 rounded-lg bg-slate-950/70 p-2.5 border border-slate-800/80 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
            <span>⚡ Power Bus: Pi 5V Pin (Pin 2) → Red Rail | GND (Pin 6) → Blue Rail</span>
            <span className="text-emerald-400 font-medium">✓ Logic Safe: Breadboard GND tied directly to Pi GND</span>
          </div>
        </div>
      </div>
    </div>
  );
}
