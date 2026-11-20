'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Incident, DeviceTelemetry } from '@/types/incident';
import { Navbar } from '@/components/Navbar';
import { MetricsCards } from '@/components/MetricsCards';
import { IncidentGallery } from '@/components/IncidentGallery';
import { TingleyMap } from '@/components/TingleyMap';
import { IncidentModal } from '@/components/IncidentModal';
import { AdminPanelModal } from '@/components/AdminPanelModal';

export default function DashboardPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [telemetry, setTelemetry] = useState<DeviceTelemetry | null>(null);
  const [activeTab, setActiveTab] = useState<'gallery' | 'map'>('gallery');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
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
    const timer = setInterval(refreshAll, 10000); // 10s auto-refresh
    return () => clearInterval(timer);
  }, [refreshAll]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/95 px-4 py-3 text-xs font-medium text-white shadow-2xl backdrop-blur-md">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        telemetry={telemetry}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onRefresh={refreshAll}
        isRefreshing={isRefreshing}
      />

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 space-y-6">
        {/* Metric Cards Banner */}
        <MetricsCards
          incidents={incidents}
          onFilterChange={(filter) => {
            setActiveFilter(filter);
            setActiveTab('gallery');
          }}
          activeFilter={activeFilter}
        />

        {/* Tab View */}
        {activeTab === 'gallery' ? (
          <IncidentGallery
            incidents={incidents}
            onSelectIncident={setSelectedIncident}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
          />
        ) : (
          <TingleyMap
            incidents={incidents}
            onSelectIncident={setSelectedIncident}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>Tingley Beach Sentinel • City of Albuquerque Open Space Division • Powered by Raspberry Pi 4 Edge AI</p>
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
      />
    </div>
  );
}
