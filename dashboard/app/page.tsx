'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Incident, DeviceTelemetry } from '@/types/incident';
import { Navbar } from '@/components/Navbar';
import { MetricsCards } from '@/components/MetricsCards';
import { IncidentList } from '@/components/IncidentList';
import { TingleyMap } from '@/components/TingleyMap';
import { HardwareBreadboard } from '@/components/HardwareBreadboard';
import { IncidentModal } from '@/components/IncidentModal';
import { SimulateModal } from '@/components/SimulateModal';
import { EmailModal } from '@/components/EmailModal';
import { RefreshCw, ShieldAlert, Cpu, Layers } from 'lucide-react';

export default function DashboardPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [telemetry, setTelemetry] = useState<DeviceTelemetry | null>(null);
  const [activeTab, setActiveTab] = useState<'incidents' | 'map' | 'hardware'>('incidents');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch incidents
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

  // Fetch device telemetry
  const fetchTelemetry = useCallback(async () => {
    try {
      const res = await fetch('/api/telemetry');
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data.telemetry || null);
      }
    } catch (err) {
      console.error('Failed to load telemetry', err);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchIncidents(), fetchTelemetry()]);
    setIsRefreshing(false);
  }, [fetchIncidents, fetchTelemetry]);

  useEffect(() => {
    refreshAll();
    const timer = setInterval(refreshAll, 12000); // 12-second live refresh
    return () => clearInterval(timer);
  }, [refreshAll]);

  // Update incident status
  const handleUpdateStatus = async (
    id: string,
    status: 'unreviewed' | 'investigating' | 'resolved' | 'dismissed'
  ) => {
    try {
      const res = await fetch(`/api/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = await res.json();
        setIncidents((prev) =>
          prev.map((item) => (item.id === id ? data.incident : item))
        );
        if (selectedIncident?.id === id) {
          setSelectedIncident(data.incident);
        }
        showToast(`Incident marked as ${status}`);
      }
    } catch (err) {
      console.error(err);
      showToast('Error updating incident status');
    }
  };

  // Dispatch email notification
  const handleDispatchEmail = async (incident: Incident) => {
    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentId: incident.id,
          recipient: incident.emailRecipient || 'wildlife-response@cabq.gov',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Alert email dispatched for ${incident.id}`);
        refreshAll();
      } else {
        showToast(`Failed to send email: ${data.error}`);
      }
    } catch (err) {
      showToast('Email dispatch error');
    }
  };

  // Trigger simulate
  const handleSimulate = async (scenario: string) => {
    const res = await fetch('/api/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario }),
    });
    if (res.ok) {
      await refreshAll();
      showToast('New event simulated from Raspberry Pi!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl border border-emerald-500/30 bg-slate-900/95 px-4 py-2.5 text-xs font-semibold text-emerald-300 shadow-2xl backdrop-blur">
          {toastMessage}
        </div>
      )}

      {/* Main Navigation Header */}
      <Navbar
        telemetry={telemetry}
        onOpenSimulate={() => setIsSimulateOpen(true)}
        onOpenEmail={() => setIsEmailOpen(true)}
        onOpenHardware={() => setActiveTab('hardware')}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Top Metrics Row */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">Live Monitoring Console</h2>
              <p className="text-xs text-slate-400">
                Continuous edge vision telemetry from Tingley Beach camera post
              </p>
            </div>

            <button
              onClick={refreshAll}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>
          </div>

          <MetricsCards
            incidents={incidents}
            onFilterChange={(f) => {
              setActiveFilter(f);
              if (activeTab !== 'incidents') setActiveTab('incidents');
            }}
            activeFilter={activeFilter}
          />
        </div>

        {/* Tab Navigation for Mobile & Visual toggle */}
        <div className="flex md:hidden rounded-lg bg-slate-900 border border-slate-800 p-1">
          <button
            onClick={() => setActiveTab('incidents')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium ${
              activeTab === 'incidents' ? 'bg-emerald-600 text-white' : 'text-slate-400'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            Alerts
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium ${
              activeTab === 'map' ? 'bg-emerald-600 text-white' : 'text-slate-400'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Map
          </button>
          <button
            onClick={() => setActiveTab('hardware')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium ${
              activeTab === 'hardware' ? 'bg-emerald-600 text-white' : 'text-slate-400'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            Hardware
          </button>
        </div>

        {/* Main Content View by Active Tab */}
        {activeTab === 'incidents' && (
          <IncidentList
            incidents={incidents}
            onSelectIncident={(i) => setSelectedIncident(i)}
            onUpdateStatus={handleUpdateStatus}
            onDispatchEmail={handleDispatchEmail}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
          />
        )}

        {activeTab === 'map' && (
          <TingleyMap
            incidents={incidents}
            onSelectIncident={(i) => setSelectedIncident(i)}
          />
        )}

        {activeTab === 'hardware' && (
          <HardwareBreadboard telemetry={telemetry} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-5 text-center text-xs text-slate-500">
        <p>
          Tingley Beach Camera Sentinel • Raspberry Pi 4 Model B (USB-C 5V/3A) • Edge Vision & Servo Rig • Deployed to Vercel
        </p>
      </footer>

      {/* Modals */}
      <IncidentModal
        incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
        onUpdateStatus={handleUpdateStatus}
        onDispatchEmail={handleDispatchEmail}
      />

      <SimulateModal
        isOpen={isSimulateOpen}
        onClose={() => setIsSimulateOpen(false)}
        onSimulate={handleSimulate}
      />

      <EmailModal
        isOpen={isEmailOpen}
        onClose={() => setIsEmailOpen(false)}
      />
    </div>
  );
}
