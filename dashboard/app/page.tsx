'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Incident, DeviceTelemetry, TriggerSource } from '@/types/incident';
import { Navbar } from '@/components/Navbar';
import { MetricsCards } from '@/components/MetricsCards';
import { IncidentGallery } from '@/components/IncidentGallery';
import { SimulatedControlDeck } from '@/components/SimulatedControlDeck';
import { IncidentModal } from '@/components/IncidentModal';
import { AdminPanelModal } from '@/components/AdminPanelModal';
import {
  createSimulatedIncident,
  createSimulatedTelemetry,
  simulateTelemetryTick,
  SIMULATION_SCENARIOS,
} from '@/lib/simulation-engine';
import { Zap, Sparkles } from 'lucide-react';

const AUTO_SCENARIOS = ['dead_duck', 'illegal_fishing', 'dead_fish', 'dead_goose', 'routine_day'];

export default function DashboardPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [telemetry, setTelemetry] = useState<DeviceTelemetry | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Online Simulated Mode State (defaults to true so it works immediately without setup)
  const [isSimulatedMode, setIsSimulatedMode] = useState<boolean>(true);
  const [isAutoSimulate, setIsAutoSimulate] = useState<boolean>(false);
  const [autoCountdown, setAutoCountdown] = useState<number>(20);
  const autoScenarioIndex = useRef(0);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoResetTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Stable incident fetcher from API
  const fetchIncidents = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.incidents)) {
          setIncidents(data.incidents);
        }
      }
    } catch (err) {
      console.error('Failed to load incidents', err);
    }
  }, []);

  // Stable telemetry fetcher from API (used in live mode)
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
    }
  }, []);

  // Manual refresh button handler (sets spinner only for explicit user actions)
  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (isSimulatedMode) {
        const res = await fetch('/api/alerts');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.incidents)) setIncidents(data.incidents);
        }
      } else {
        await Promise.all([fetchIncidents(), fetchTelemetry()]);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [isSimulatedMode, fetchIncidents, fetchTelemetry]);

  // Initial load on mount
  useEffect(() => {
    let isSim = true;
    try {
      const saved = localStorage.getItem('tingley_simulated_mode');
      if (saved !== null) {
        isSim = saved === 'true';
      }
    } catch {
      // Ignore
    }
    queueMicrotask(() => {
      setIsSimulatedMode(isSim);

      if (isSim) {
        setTelemetry((curr) => curr || createSimulatedTelemetry());
      } else {
        fetchTelemetry();
      }

      fetchIncidents();
    });
  }, [fetchIncidents, fetchTelemetry]);

  // Periodic background refresh for Live Pi mode ONLY (NEVER interferes with simulated mode)
  useEffect(() => {
    if (isSimulatedMode || isAutoSimulate) return;

    const timer = setInterval(() => {
      fetchIncidents();
      fetchTelemetry();
    }, 10000);

    return () => clearInterval(timer);
  }, [isSimulatedMode, isAutoSimulate, fetchIncidents, fetchTelemetry]);

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
        setTelemetry((curr) => curr || createSimulatedTelemetry());
        showToast('⚡ Simulated Mode Activated — Online Sentinel Sandbox Ready');
      } else {
        setIsAutoSimulate(false);
        showToast('Switched to Live Edge Camera feed');
        fetchIncidents();
        fetchTelemetry();
      }
      return next;
    });
  }, [showToast, fetchIncidents, fetchTelemetry]);

  // 1. Edge Incident Ingestion (Works exactly like actual Raspberry Pi hardware)
  const handleSimulateIncident = useCallback(
    async (scenarioKey: string) => {
      // 1. Get defined scenario payload
      const scenario = SIMULATION_SCENARIOS[scenarioKey] || SIMULATION_SCENARIOS.dead_duck;
      const isRoutine = scenario.type === 'routine_snapshot';

      const trigger: TriggerSource = isRoutine ? 'hourly_timer' : 'pir_motion';

      // Construct identical JSON payload that Raspberry Pi device/service.py sends
      const payload = {
        apiKey: 'tingley-edge-secret-key-2026',
        deviceId: 'tingley-pi4-01',
        timestamp: new Date().toISOString(),
        trigger,
        type: scenario.type,
        title: scenario.title,
        description: scenario.description,
        species: scenario.species,
        confidence: scenario.confidence,
        location: scenario.location,
        pondZone: scenario.pondZone,
        imageUrl: scenario.imageUrl,
        boundingBoxes: scenario.boundingBoxes || [],
        servosTriggered: scenario.servosTriggered,
        servoAngle: scenario.servoAngle,
        ledState: scenario.ledState,
        sendEmail: scenario.servosTriggered,
        notes: scenario.notes,
      };

      // Optimistic local update for 0ms instant UI feedback
      const localIncident: Incident = {
        id: `inc-${Date.now().toString().slice(-6)}`,
        ...payload,
        status: isRoutine ? 'resolved' : 'unreviewed',
        severity: scenario.severity,
        emailAlertSent: scenario.servosTriggered,
        emailRecipient: 'cuddles_caterer_3c@icloud.com',
      };
      setIncidents((prev) => [localIncident, ...prev.filter((i) => i.id !== localIncident.id)]);

      // Update telemetry state to match actuation
      setTelemetry((prev) => {
        const base = prev || createSimulatedTelemetry();
        return {
          ...base,
          online: true,
          lastHeartbeat: new Date().toISOString(),
          servoAngles: scenario.servosTriggered ? [180, 180] : [0, 0],
          ledState: { ...scenario.ledState },
          pirSensorStatus: !isRoutine ? 'triggered' : 'idle',
        };
      });

      showToast(`🚨 Ingested: ${scenario.title} (${scenario.severity.toUpperCase()})`);

      // 2. ACTUAL HTTP POST to /api/alerts (matching physical hardware network transmission)
      try {
        const res = await fetch('/api/alerts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'tingley-edge-secret-key-2026',
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.incident) {
            setIncidents((prev) => [data.incident, ...prev.filter((i) => i.id !== localIncident.id && i.id !== data.incident.id)]);
          }
        }
      } catch (err) {
        console.warn('Network alert post deferred', err);
      }

      // 3. 15-second hardware auto-reset timer (EXACT BEHAVIOR AS RASPBERRY PI 4 DAEMON)
      if (scenario.servosTriggered) {
        if (autoResetTimerRef.current) clearTimeout(autoResetTimerRef.current);
        autoResetTimerRef.current = setTimeout(() => {
          setTelemetry((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              servoAngles: [0, 0],
              ledState: { green: true, yellow: false, red: false },
              pirSensorStatus: 'idle',
            };
          });

          // Sync auto-reset to /api/telemetry
          fetch('/api/telemetry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              servoAngles: [0, 0],
              ledState: { green: true, yellow: false, red: false },
              pirSensorStatus: 'idle',
            }),
          }).catch(() => {});

          showToast('⏱️ Dual servos auto-reset to 0° (Green Ready) after 15s display');
        }, 15000);
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

      // Send to /api/telemetry
      try {
        await fetch('/api/telemetry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            servoAngles: [angle, angle],
            ledState:
              angle >= 90
                ? { green: false, yellow: false, red: true }
                : { green: true, yellow: false, red: false },
          }),
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

      // Send to /api/telemetry
      try {
        await fetch('/api/telemetry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ledState: {
              green: color === 'green',
              yellow: color === 'yellow',
              red: color === 'red',
            },
          }),
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

    fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pirSensorStatus: 'triggered' }),
    }).catch(() => {});

    setTimeout(() => {
      setTelemetry((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          pirSensorStatus: 'idle',
        };
      });
      fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pirSensorStatus: 'idle' }),
      }).catch(() => {});
    }, 3200);
  }, [showToast]);

  // 5. Reset demo incidents & telemetry back to baseline
  const handleResetSimulation = useCallback(async () => {
    if (autoResetTimerRef.current) clearTimeout(autoResetTimerRef.current);
    setTelemetry(createSimulatedTelemetry());
    showToast('Resetting sentinel data back to clean baseline...');

    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: 'reset' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.incidents)) {
          setIncidents(data.incidents);
        }
      }
    } catch {
      await fetchIncidents();
    }

    showToast('Sentinel demo incidents and actuators restored to baseline');
  }, [showToast, fetchIncidents]);

  // Auto-Simulate background countdown & scenario runner
  useEffect(() => {
    if (!isAutoSimulate) {
      queueMicrotask(() => setAutoCountdown(20));
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
        isSimulatedMode={isSimulatedMode}
        onToggleSimulatedMode={toggleSimulatedMode}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 space-y-6">
        {/* If Simulated Mode is Active: Render the Edge Simulator Deck */}
        {isSimulatedMode ? (
          <SimulatedControlDeck
            telemetry={telemetry}
            onSimulateIncident={handleSimulateIncident}
            onActuateServos={handleActuateServos}
            onSetLeds={handleSetLeds}
            onPulsePir={handlePulsePir}
            onResetSimulation={handleResetSimulation}
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
                Demonstrating without a physical Raspberry Pi connected? Turn on <strong>Edge Simulator</strong> to stream live detection payloads directly into the dashboard.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSimulatedMode}
                className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300 transition shrink-0"
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Enable Simulator</span>
              </button>
            </div>
          </div>
        )}

        {/* Metric Cards Banner */}
        <MetricsCards
          incidents={incidents}
          onFilterChange={(filter) => {
            setActiveFilter(filter);
          }}
          activeFilter={activeFilter}
        />

        {/* Core Sentinel Live Gallery */}
        <IncidentGallery
          incidents={incidents}
          onSelectIncident={setSelectedIncident}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>Tingley Beach Sentinel • City of Albuquerque Open Space Division • Powered by Raspberry Pi 4 Edge AI</p>
        <p className="mt-1 text-[11px] text-slate-600">
          {isSimulatedMode
            ? 'Operating in Deterministic Simulated Sandbox (Cloud & Browser Native)'
            : 'Connected to Tingley Edge Camera Stream'}
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
        onRefreshAll={handleManualRefresh}
        showToast={showToast}
        onSimulateIncident={handleSimulateIncident}
        isSimulatedMode={isSimulatedMode}
      />
    </div>
  );
}
