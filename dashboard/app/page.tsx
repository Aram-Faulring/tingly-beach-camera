'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Incident, DeviceTelemetry } from '@/types/incident';
import { Navbar } from '@/components/Navbar';
import { MetricsCards } from '@/components/MetricsCards';
import { IncidentGallery } from '@/components/IncidentGallery';
import { TingleyMap } from '@/components/TingleyMap';
import { HardwareBreadboard } from '@/components/HardwareBreadboard';
import { SimulatedControlDeck } from '@/components/SimulatedControlDeck';
import { IncidentModal } from '@/components/IncidentModal';
import { AdminPanelModal } from '@/components/AdminPanelModal';
import {
  createSimulatedIncident,
  createSimulatedTelemetry,
  simulateTelemetryTick,
} from '@/lib/simulation-engine';
import { Zap, Sparkles } from 'lucide-react';

const AUTO_SCENARIOS = ['dead_duck', 'illegal_fishing', 'dead_fish', 'dead_goose', 'routine_day'];

export default function DashboardPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [telemetry, setTelemetry] = useState<DeviceTelemetry | null>(null);
  const [activeTab, setActiveTab] = useState<'gallery' | 'map' | 'hardware'>('gallery');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Simulated Mode State
  const [isSimulatedMode, setIsSimulatedMode] = useState<boolean>(false);
  const [isAutoSimulate, setIsAutoSimulate] = useState<boolean>(false);
  const [autoCountdown, setAutoCountdown] = useState<number>(20);
  const autoScenarioIndex = useRef(0);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // Check initial Simulated Mode preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tingley_simulated_mode');
      if (saved === 'true') {
        setIsSimulatedMode(true);
      }
    } catch {
      // localStorage unavailable in private sandbox
    }
  }, []);

  // Fetch incidents from API
  const fetchIncidents = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts');
      if (res.ok) {
        const data = await res.json();
        setIncidents(data.incidents || []);
      }
    } catch (err) {
      console.error('Failed to load incidents', err);
    }
  }, []);

  // Fetch device telemetry from API
  const fetchTelemetry = useCallback(async () => {
    try {
      const res = await fetch('/api/telemetry');
      if (res.ok) {
        const data = await res.json();
        if (data.telemetry) {
          setTelemetry(data.telemetry);
        }
      }
    } catch (err) {
      console.error('Failed to load telemetry', err);
      // If telemetry fails and in simulated mode, provide simulated baseline
      if (isSimulatedMode && !telemetry) {
        setTelemetry(createSimulatedTelemetry());
      }
    }
  }, [isSimulatedMode, telemetry]);

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchIncidents(), fetchTelemetry()]);
    setIsRefreshing(false);
  }, [fetchIncidents, fetchTelemetry]);

  // Periodic refresh when NOT auto-simulating
  useEffect(() => {
    refreshAll();
    const timer = setInterval(() => {
      if (!isAutoSimulate) {
        refreshAll();
      }
    }, 12000);
    return () => clearInterval(timer);
  }, [refreshAll, isAutoSimulate]);

  // Toggle Simulated Mode
  const toggleSimulatedMode = useCallback(() => {
    setIsSimulatedMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('tingley_simulated_mode', String(next));
      } catch {
        // Ignore
      }
      if (next) {
        if (!telemetry) {
          setTelemetry(createSimulatedTelemetry());
        }
        showToast('⚡ Simulated Mode Activated — Always Works (Offline & Cloud Ready)');
      } else {
        setIsAutoSimulate(false);
        showToast('Switched to Live Edge Camera feed');
        refreshAll();
      }
      return next;
    });
  }, [telemetry, showToast, refreshAll]);

  // 1. Instant optimistic incident simulator (Guaranteed execution)
  const handleSimulateIncident = useCallback(
    async (scenarioKey: string) => {
      // Create incident locally in 0ms
      const newIncident = createSimulatedIncident(scenarioKey);

      // Prepend to incidents list immediately
      setIncidents((prev) => [newIncident, ...prev]);

      // Update telemetry state immediately
      setTelemetry((prev) => {
        const base = prev || createSimulatedTelemetry();
        return {
          ...base,
          online: true,
          lastHeartbeat: new Date().toISOString(),
          servoAngles: newIncident.servosTriggered ? [180, 180] : [0, 0],
          ledState: { ...newIncident.ledState },
          pirSensorStatus: newIncident.trigger === 'pir_motion' ? 'triggered' : 'idle',
        };
      });

      // User feedback toast
      showToast(`Injected: ${newIncident.title} (${newIncident.severity.toUpperCase()})`);

      // Sync to backend in background (never throws or stalls UI)
      try {
        await fetch('/api/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenario: scenarioKey }),
        });
      } catch (err) {
        console.warn('Backend sync deferred (operating in offline simulation)', err);
      }
    },
    [showToast]
  );

  // 2. Instant virtual servo actuation
  const handleActuateServos = useCallback(
    async (angle: number) => {
      setTelemetry((prev) => {
        const base = prev || createSimulatedTelemetry();
        return {
          ...base,
          servoAngles: [angle, angle],
          ledState:
            angle >= 90
              ? { green: false, yellow: false, red: true }
              : { green: true, yellow: false, red: false },
        };
      });

      showToast(`Dual SG90 Servos rotated to ${angle}° (${angle >= 90 ? 'Alert Flag' : 'Rest Position'})`);

      try {
        await fetch('/api/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenario: 'actuate_servos', angle }),
        });
      } catch (err) {
        console.warn('Backend actuator sync deferred', err);
      }
    },
    [showToast]
  );

  // 3. Instant traffic LED switching
  const handleSetLeds = useCallback(
    async (color: 'green' | 'yellow' | 'red') => {
      setTelemetry((prev) => {
        const base = prev || createSimulatedTelemetry();
        return {
          ...base,
          ledState: {
            green: color === 'green',
            yellow: color === 'yellow',
            red: color === 'red',
          },
        };
      });

      showToast(`Traffic Light Modules set to ${color.toUpperCase()}`);

      try {
        await fetch('/api/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenario: 'set_leds', ledColor: color }),
        });
      } catch (err) {
        console.warn('Backend LED sync deferred', err);
      }
    },
    [showToast]
  );

  // 4. Instant PIR motion pulse (3s wave)
  const handlePulsePir = useCallback(() => {
    setTelemetry((prev) => {
      const base = prev || createSimulatedTelemetry();
      return {
        ...base,
        pirSensorStatus: 'triggered',
      };
    });

    showToast('📡 PIR Motion Sensor Interrupt Fired (GPIO 17 High)');

    setTimeout(() => {
      setTelemetry((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          pirSensorStatus: 'idle',
        };
      });
    }, 3200);

    try {
      fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: 'trigger_pir' }),
      }).catch(() => {});
    } catch {
      // Ignore
    }
  }, [showToast]);

  // 5. Reset demo incidents & telemetry back to baseline
  const handleResetSimulation = useCallback(async () => {
    setTelemetry(createSimulatedTelemetry());
    showToast('Resetting sentinel data back to clean baseline...');

    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: 'reset' }),
      });
      if (res.ok) {
        await fetchIncidents();
      }
    } catch {
      // If serverless is offline, refresh incidents
      await fetchIncidents();
    }

    showToast('Sentinel demo incidents and actuators restored to baseline');
  }, [showToast, fetchIncidents]);

  // Auto-Simulate background countdown & scenario runner
  useEffect(() => {
    if (!isAutoSimulate) {
      setAutoCountdown(20);
      return;
    }

    const interval = setInterval(() => {
      setAutoCountdown((prev) => {
        if (prev <= 1) {
          // Fire next scenario
          const scenario = AUTO_SCENARIOS[autoScenarioIndex.current % AUTO_SCENARIOS.length];
          autoScenarioIndex.current += 1;
          handleSimulateIncident(scenario);

          // Update minor telemetry tick
          setTelemetry((curr) => simulateTelemetryTick(curr));

          return 20; // reset countdown to 20s
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAutoSimulate, handleSimulateIncident]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/95 px-4 py-3 text-xs font-medium text-white shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        telemetry={telemetry}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSimulatedMode={isSimulatedMode}
        onToggleSimulatedMode={toggleSimulatedMode}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onRefresh={refreshAll}
        isRefreshing={isRefreshing}
      />

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 space-y-6">
        {/* If Simulated Mode is Active: Render the Full Interactive Control Deck */}
        {isSimulatedMode ? (
          <SimulatedControlDeck
            telemetry={telemetry}
            onSimulateIncident={handleSimulateIncident}
            onActuateServos={handleActuateServos}
            onSetLeds={handleSetLeds}
            onPulsePir={handlePulsePir}
            onResetSimulation={handleResetSimulation}
            onViewHardware={() => setActiveTab('hardware')}
            isAutoSimulate={isAutoSimulate}
            setIsAutoSimulate={setIsAutoSimulate}
            autoCountdown={autoCountdown}
          />
        ) : (
          /* Subtle Discovery Bar for Simulated Mode when in Live Mode */
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-2.5 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                Demonstrating without a physical Raspberry Pi connected? Turn on <strong>Simulated Mode</strong> to test live detection scenarios and virtual breadboard servos.
              </span>
            </div>
            <button
              onClick={toggleSimulatedMode}
              className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300 transition shrink-0"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Enable Simulated Mode</span>
            </button>
          </div>
        )}

        {/* Metric Cards Banner */}
        <MetricsCards
          incidents={incidents}
          onFilterChange={(filter) => {
            setActiveFilter(filter);
            setActiveTab('gallery');
          }}
          activeFilter={activeFilter}
        />

        {/* Dynamic View Tab */}
        {activeTab === 'gallery' && (
          <IncidentGallery
            incidents={incidents}
            onSelectIncident={setSelectedIncident}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
          />
        )}

        {activeTab === 'map' && (
          <TingleyMap
            incidents={incidents}
            onSelectIncident={setSelectedIncident}
          />
        )}

        {activeTab === 'hardware' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Hardware & Solderless Breadboard Diagnostics
                </h2>
                <p className="text-xs text-slate-400">
                  Live state of 40-pin GPIO breakout, dual SG90 micro servos, dual traffic light LEDs, and PIR sensor
                </p>
              </div>
              {!isSimulatedMode && (
                <button
                  onClick={toggleSimulatedMode}
                  className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>Test in Simulated Mode</span>
                </button>
              )}
            </div>
            <HardwareBreadboard telemetry={telemetry} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>Tingley Beach Sentinel • City of Albuquerque Open Space Division • Powered by Raspberry Pi 4 Edge AI</p>
        <p className="mt-1 text-[11px] text-slate-600">
          {isSimulatedMode ? 'Operating in Deterministic Simulated Sandbox' : 'Connected to Tingley Edge Camera Stream'}
        </p>
      </footer>

      {/* Modals */}
      <IncidentModal
        incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
      />

      <AdminPanelModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        telemetry={telemetry}
        onRefreshAll={refreshAll}
        showToast={showToast}
        onSimulateIncident={handleSimulateIncident}
        isSimulatedMode={isSimulatedMode}
      />
    </div>
  );
}
