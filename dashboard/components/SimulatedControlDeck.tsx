'use client';

import React, { useState } from 'react';
import {
  Zap,
  Play,
  Pause,
  RotateCcw,
  Cpu,
  Radio,
  RotateCw,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Check,
  Activity,
} from 'lucide-react';
import { DeviceTelemetry } from '@/types/incident';

interface SimulatedControlDeckProps {
  telemetry: DeviceTelemetry | null;
  onSimulateIncident: (scenarioKey: string) => Promise<void> | void;
  onActuateServos: (angle: number) => Promise<void> | void;
  onSetLeds: (color: 'green' | 'yellow' | 'red') => Promise<void> | void;
  onPulsePir: () => void;
  onResetSimulation: () => Promise<void> | void;
  onViewHardware: () => void;
  isAutoSimulate: boolean;
  setIsAutoSimulate: (val: boolean) => void;
  autoCountdown: number;
}

export function SimulatedControlDeck({
  telemetry,
  onSimulateIncident,
  onActuateServos,
  onSetLeds,
  onPulsePir,
  onResetSimulation,
  onViewHardware,
  isAutoSimulate,
  setIsAutoSimulate,
  autoCountdown,
}: SimulatedControlDeckProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeButton, setActiveButton] = useState<string | null>(null);

  const servoAngle = telemetry?.servoAngles?.[0] ?? 0;
  const leds = telemetry?.ledState || { green: true, yellow: false, red: false };
  const pirTriggered = telemetry?.pirSensorStatus === 'triggered';

  const triggerScenario = async (key: string) => {
    setActiveButton(key);
    try {
      await onSimulateIncident(key);
    } finally {
      setTimeout(() => setActiveButton(null), 1000);
    }
  };

  const handleServoClick = async (angle: number) => {
    setActiveButton(`servo_${angle}`);
    try {
      await onActuateServos(angle);
    } finally {
      setTimeout(() => setActiveButton(null), 800);
    }
  };

  const handleLedClick = async (color: 'green' | 'yellow' | 'red') => {
    setActiveButton(`led_${color}`);
    try {
      await onSetLeds(color);
    } finally {
      setTimeout(() => setActiveButton(null), 800);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-b from-slate-900/95 via-slate-950 to-slate-900/95 p-4 sm:p-5 shadow-2xl backdrop-blur-md transition-all">
      {/* Top Ambient Glow Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-emerald-400 to-sky-500 opacity-80" />

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-sm shadow-amber-500/20">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                ONLINE SIMULATOR ACTIVE
              </span>
              <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                100% Operational • Browser & Cloud Native
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Deterministic Sentinel AI simulator with virtual breadboard actuation & telemetry generation
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Auto-Simulate Toggle */}
          <button
            onClick={() => setIsAutoSimulate(!isAutoSimulate)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition shadow-sm ${
              isAutoSimulate
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 ring-2 ring-amber-400/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
            title="Automatically cycles realistic event triggers every 20 seconds"
          >
            {isAutoSimulate ? (
              <>
                <Pause className="h-3.5 w-3.5" />
                <span>Auto-Simulating ({autoCountdown}s)</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                <span>Auto-Simulate</span>
              </>
            )}
          </button>

          {/* Reset Baseline */}
          <button
            onClick={onResetSimulation}
            className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition"
            title="Reset incidents and actuators back to pristine baseline"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Collapse / Expand Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition border border-slate-800"
            title={isCollapsed ? 'Expand Simulation Controls' : 'Collapse Simulation Controls'}
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Collapsible Body */}
      {!isCollapsed && (
        <div className="mt-4 space-y-4">
          {/* Section 1: Five Anomaly Scenario Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                Instant Scenario Ingestion (Always Operates)
              </span>
              <span className="text-[11px] text-slate-400">Click any card to inject detection into the gallery</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {/* Scenario 1: Dead Mallard */}
              <button
                onClick={() => triggerScenario('dead_duck')}
                disabled={Boolean(activeButton)}
                className={`relative flex flex-col justify-between p-3 rounded-xl border text-left transition ${
                  activeButton === 'dead_duck'
                    ? 'border-rose-400 bg-rose-950/40 ring-2 ring-rose-400'
                    : 'border-rose-900/40 bg-rose-950/20 hover:bg-rose-950/40 hover:border-rose-700/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-300">🦆 Dead Mallard</span>
                    <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-bold text-rose-300 uppercase">
                      Critical
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 font-medium">Central Pond Reeds</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                    YOLO flags motionless duck. 180° servo deploy & Red LED alert.
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-rose-900/30 flex items-center justify-between text-[10px] text-rose-400 font-medium">
                  <span>94.2% Conf</span>
                  <span>{activeButton === 'dead_duck' ? '✓ Injected' : 'Trigger →'}</span>
                </div>
              </button>

              {/* Scenario 2: Dead Canada Goose */}
              <button
                onClick={() => triggerScenario('dead_goose')}
                disabled={Boolean(activeButton)}
                className={`relative flex flex-col justify-between p-3 rounded-xl border text-left transition ${
                  activeButton === 'dead_goose'
                    ? 'border-rose-400 bg-rose-950/40 ring-2 ring-rose-400'
                    : 'border-rose-900/40 bg-rose-950/20 hover:bg-rose-950/40 hover:border-rose-700/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-300">🪿 Dead Goose</span>
                    <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-bold text-rose-300 uppercase">
                      Critical
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 font-medium">South Pond Shallows</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                    Canada goose carcass flagged on gravel bank. 180° flag deployed.
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-rose-900/30 flex items-center justify-between text-[10px] text-rose-400 font-medium">
                  <span>91.5% Conf</span>
                  <span>{activeButton === 'dead_goose' ? '✓ Injected' : 'Trigger →'}</span>
                </div>
              </button>

              {/* Scenario 3: Illegal Fishing */}
              <button
                onClick={() => triggerScenario('illegal_fishing')}
                disabled={Boolean(activeButton)}
                className={`relative flex flex-col justify-between p-3 rounded-xl border text-left transition ${
                  activeButton === 'illegal_fishing'
                    ? 'border-amber-400 bg-amber-950/40 ring-2 ring-amber-400'
                    : 'border-amber-900/40 bg-amber-950/20 hover:bg-amber-950/40 hover:border-amber-700/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300">🎣 Illegal Fishing</span>
                    <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-300 uppercase">
                      High Alert
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 font-medium">Children’s Pond Pier</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                    Night fishing detected in restricted youth zone after park closing.
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-amber-900/30 flex items-center justify-between text-[10px] text-amber-400 font-medium">
                  <span>89.3% Conf</span>
                  <span>{activeButton === 'illegal_fishing' ? '✓ Injected' : 'Trigger →'}</span>
                </div>
              </button>

              {/* Scenario 4: Dead Trout */}
              <button
                onClick={() => triggerScenario('dead_fish')}
                disabled={Boolean(activeButton)}
                className={`relative flex flex-col justify-between p-3 rounded-xl border text-left transition ${
                  activeButton === 'dead_fish'
                    ? 'border-purple-400 bg-purple-950/40 ring-2 ring-purple-400'
                    : 'border-purple-900/40 bg-purple-950/20 hover:bg-purple-950/40 hover:border-purple-700/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300">🐟 Dead Trout</span>
                    <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[9px] font-bold text-purple-300 uppercase">
                      Medium
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 font-medium">Catch & Release Pond</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                    Rainbow trout mortality washed ashore. Water quality flagged.
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-purple-900/30 flex items-center justify-between text-[10px] text-purple-400 font-medium">
                  <span>96.8% Conf</span>
                  <span>{activeButton === 'dead_fish' ? '✓ Injected' : 'Trigger →'}</span>
                </div>
              </button>

              {/* Scenario 5: Hourly Routine Baseline */}
              <button
                onClick={() => triggerScenario('routine_day')}
                disabled={Boolean(activeButton)}
                className={`relative flex flex-col justify-between p-3 rounded-xl border text-left transition ${
                  activeButton === 'routine_day'
                    ? 'border-emerald-400 bg-emerald-950/40 ring-2 ring-emerald-400'
                    : 'border-emerald-900/40 bg-emerald-950/20 hover:bg-emerald-950/40 hover:border-emerald-700/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300">🕒 Baseline Check</span>
                    <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300 uppercase">
                      Nominal
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 font-medium">Central Pond Pier</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                    Timed heartbeat. Waters calm, clear frames, servos reset to 0°.
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-emerald-900/30 flex items-center justify-between text-[10px] text-emerald-400 font-medium">
                  <span>All Clear</span>
                  <span>{activeButton === 'routine_day' ? '✓ Injected' : 'Trigger →'}</span>
                </div>
              </button>
            </div>
          </div>

          {/* Section 2: Virtual Actuator & Breadboard Diagnostic Controls */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-sky-400" />
                Virtual Breadboard Actuation & Direct Diagnostic Controls
              </span>
              <button
                onClick={onViewHardware}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition flex items-center gap-1 self-start sm:self-auto"
              >
                <span>Open Solderless Breadboard Rig</span>
                <span>→</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Dual SG90 Servos */}
              <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-2.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <RotateCw className="h-3.5 w-3.5 text-indigo-400" />
                    Dual Servos (GPIO 12/13)
                  </span>
                  <span
                    className={`font-mono text-[11px] px-1.5 py-0.5 rounded font-bold ${
                      servoAngle >= 90
                        ? 'bg-indigo-500/20 text-indigo-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {servoAngle}° {servoAngle >= 90 ? '(ALERT)' : '(REST)'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleServoClick(0)}
                    disabled={activeButton === 'servo_0'}
                    className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition border ${
                      servoAngle === 0
                        ? 'bg-slate-700 text-white border-slate-600'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    Reset 0° (Rest)
                  </button>
                  <button
                    onClick={() => handleServoClick(180)}
                    disabled={activeButton === 'servo_180'}
                    className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition border ${
                      servoAngle === 180
                        ? 'bg-rose-600 text-white border-rose-500'
                        : 'bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border-rose-800/60'
                    }`}
                  >
                    Deploy 180° (Alert)
                  </button>
                </div>
              </div>

              {/* Traffic Light LEDs */}
              <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-2.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-emerald-400" />
                    Traffic LEDs (2x Modules)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        leds.green
                          ? 'bg-emerald-400 shadow-md shadow-emerald-400 ring-2 ring-emerald-300'
                          : 'bg-emerald-950'
                      }`}
                    />
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        leds.yellow
                          ? 'bg-amber-400 shadow-md shadow-amber-400 ring-2 ring-amber-300'
                          : 'bg-amber-950'
                      }`}
                    />
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        leds.red
                          ? 'bg-rose-500 shadow-md shadow-rose-500 ring-2 ring-rose-400'
                          : 'bg-rose-950'
                      }`}
                    />
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleLedClick('green')}
                    className={`flex-1 rounded-md py-1.5 text-xs font-medium border text-center transition ${
                      leds.green
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/50 border-emerald-800/60'
                    }`}
                  >
                    Green
                  </button>
                  <button
                    onClick={() => handleLedClick('yellow')}
                    className={`flex-1 rounded-md py-1.5 text-xs font-medium border text-center transition ${
                      leds.yellow
                        ? 'bg-amber-600 text-white border-amber-500'
                        : 'bg-amber-950/40 text-amber-400 hover:bg-amber-900/50 border-amber-800/60'
                    }`}
                  >
                    Yellow
                  </button>
                  <button
                    onClick={() => handleLedClick('red')}
                    className={`flex-1 rounded-md py-1.5 text-xs font-medium border text-center transition ${
                      leds.red
                        ? 'bg-rose-600 text-white border-rose-500'
                        : 'bg-rose-950/40 text-rose-400 hover:bg-rose-900/50 border-rose-800/60'
                    }`}
                  >
                    Red
                  </button>
                </div>
              </div>

              {/* PIR Motion Sensor Trigger */}
              <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-2.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Radio
                      className={`h-3.5 w-3.5 ${
                        pirTriggered ? 'text-amber-400 animate-ping' : 'text-slate-400'
                      }`}
                    />
                    PIR Sensor (GPIO 17)
                  </span>
                  <span
                    className={`font-mono text-[11px] px-1.5 py-0.5 rounded font-bold ${
                      pirTriggered
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {pirTriggered ? 'TRIGGERED (HIGH)' : 'IDLE (LOW)'}
                  </span>
                </div>
                <button
                  onClick={onPulsePir}
                  className={`w-full flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition border ${
                    pirTriggered
                      ? 'bg-amber-600 text-white border-amber-500'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  <Radio className="h-3.5 w-3.5 text-amber-400" />
                  <span>Pulse Motion Wave (3s Interrupt)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
