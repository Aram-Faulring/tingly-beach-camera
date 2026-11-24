'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Unlock,
  Mail,
  Send,
  RotateCw,
  Cpu,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Play,
  Zap,
  Sliders,
  Check,
} from 'lucide-react';
import { DeviceTelemetry } from '@/types/incident';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: DeviceTelemetry | null;
  onRefreshAll: () => Promise<void>;
  showToast: (msg: string) => void;
  onSimulateIncident?: (scenario: string) => Promise<void> | void;
  isSimulatedMode?: boolean;
}

export function AdminPanelModal({
  isOpen,
  onClose,
  telemetry,
  onRefreshAll,
  showToast,
  onSimulateIncident,
  isSimulatedMode,
}: AdminPanelModalProps) {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  // Email Config State
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(true);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [emailSavedSuccess, setEmailSavedSuccess] = useState(false);

  // Actuator State
  const [actuatorLoading, setActuatorLoading] = useState<string | null>(null);

  const fetchAdminConfig = async (pwd: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin', {
        headers: { 'x-admin-password': pwd },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setEmailRecipient(data.config.emailRecipient || 'cuddles_caterer_3c@icloud.com');
          setEmailAlertsEnabled(data.config.emailAlertsEnabled ?? true);
        }
        return true;
      }
    } catch (err) {
      console.error('Failed to load admin config', err);
    }
    return false;
  };

  // Check saved session auth
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('tingley_admin_token');
      if (saved) {
        queueMicrotask(() => {
          fetchAdminConfig(saved).then((ok) => {
            if (ok) setIsAuthenticated(true);
          });
        });
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');

    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auth', password }),
      });

      const data = await res.json();
      if (res.ok && data.authenticated) {
        setIsAuthenticated(true);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('tingley_admin_token', password);
        }
        if (data.config) {
          setEmailRecipient(data.config.emailRecipient || '');
          setEmailAlertsEnabled(data.config.emailAlertsEnabled ?? true);
        }
        showToast('Admin access granted');
      } else {
        setAuthError(data.error || 'Invalid password. Try again.');
      }
    } catch {
      setAuthError('Connection error. Could not verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('tingley_admin_token');
    }
    showToast('Admin session locked');
  };

  const currentPwd = password || (typeof window !== 'undefined' ? sessionStorage.getItem('tingley_admin_token') : null) || 'tingley2026';

  const handleSaveEmailConfig = async () => {
    setIsSavingEmail(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': currentPwd,
        },
        body: JSON.stringify({
          action: 'update_config',
          emailRecipient,
          emailAlertsEnabled,
        }),
      });

      if (res.ok) {
        setEmailSavedSuccess(true);
        setTimeout(() => setEmailSavedSuccess(false), 3000);
        showToast('Email alert recipient updated!');
      } else {
        showToast('Failed to update email recipient');
      }
    } catch (err) {
      console.error(err);
      showToast('Error saving email configuration');
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handleSendTestEmail = async () => {
    setIsSendingTestEmail(true);
    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: emailRecipient,
          customMessage: 'Admin Test Verification: Live email dispatch confirmed from Tingley Beach Sentinel.',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Test email dispatched to ${emailRecipient}`);
      } else {
        showToast(data.message || 'Error dispatching test email');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to trigger email send');
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const handleActuatorCommand = async (command: string, params?: Record<string, unknown>) => {
    setActuatorLoading(command);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': currentPwd,
        },
        body: JSON.stringify({
          action: 'actuator',
          command,
          ...params,
        }),
      });

      if (res.ok) {
        showToast(`Command sent: ${command}`);
        await onRefreshAll();
      } else {
        showToast(`Failed command: ${command}`);
      }
    } catch (err) {
      console.error(err);
      showToast('Actuator communication error');
    } finally {
      setActuatorLoading(null);
    }
  };

  const handleSimulateIncident = async (scenario: 'dead_duck' | 'dead_goose' | 'illegal_fishing' | 'dead_fish' | 'routine_day') => {
    setActuatorLoading(`sim_${scenario}`);
    try {
      if (onSimulateIncident) {
        await onSimulateIncident(scenario);
      } else {
        const res = await fetch('/api/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenario }),
        });

        if (res.ok) {
          showToast(`Simulated: ${scenario.replace('_', ' ')}`);
          await onRefreshAll();
        } else {
          showToast('Simulation trigger failed');
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Simulation error');
    } finally {
      setActuatorLoading(null);
    }
  };

  const handleResetIncidents = async () => {
    if (!confirm('Reset all demo incidents to default state?')) return;
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': currentPwd,
        },
        body: JSON.stringify({ action: 'reset_incidents' }),
      });

      if (res.ok) {
        showToast('Incidents reset to baseline');
        await onRefreshAll();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to reset incidents');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-950/95 px-6 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isAuthenticated ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-400'}`}>
              {isAuthenticated ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Admin Sentinel Management
                {isAuthenticated && (
                  <span className="rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 font-medium border border-emerald-500/30">
                    Authenticated
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Authorized control panel for hardware actuation, incident dispatch, and email routing
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="text-xs text-slate-400 hover:text-rose-400 transition px-2.5 py-1 rounded-md border border-slate-800 hover:border-rose-900 bg-slate-900"
              >
                Lock
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {!isAuthenticated ? (
            /* Login Gate */
            <form onSubmit={handleLogin} className="space-y-4 py-6">
              <div className="text-center max-w-sm mx-auto space-y-2">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Lock className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold text-white">Restricted Administrator Access</h3>
                <p className="text-xs text-slate-400">
                  Enter the sentinel secret password to manage hardware actuators, configure alert recipients, and run manual diagnostics.
                </p>
              </div>

              <div className="max-w-sm mx-auto space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Secret Admin Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password..."
                    autoFocus
                    required
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                {authError && (
                  <p className="text-xs text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    {authError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-500 transition disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Unlock className="h-4 w-4" />
                      Unlock Admin Panel
                    </>
                  )}
                </button>

                <p className="text-[11px] text-center text-slate-500 pt-1">
                  Default password: <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300/80">tingley2026</code>
                </p>
              </div>
            </form>
          ) : (
            /* Authenticated Admin Management Sections */
            <div className="space-y-6">
              {/* Section 1: Email Alert Routing */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-sky-400" />
                    <h3 className="text-sm font-semibold text-white">Email Alert Recipient Settings</h3>
                  </div>
                  <span className="text-[11px] text-slate-400">Resend Automated Dispatch</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Recipient Email Address
                    </label>
                    <input
                      type="email"
                      value={emailRecipient}
                      onChange={(e) => setEmailRecipient(e.target.value)}
                      placeholder="e.g. ranger@cabq.gov or your-email@gmail.com"
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      All critical detections (dead wildlife carcasses & illegal night fishing) will dispatch instant photo alerts here.
                    </p>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-slate-950/80 p-3 border border-slate-800">
                    <div>
                      <div className="text-xs font-medium text-white">Automated Incident Emails</div>
                      <div className="text-[11px] text-slate-400">
                        Automatically trigger email alerts on PIR motion detection events
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEmailAlertsEnabled(!emailAlertsEnabled)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        emailAlertsEnabled ? 'bg-emerald-600' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          emailAlertsEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handleSaveEmailConfig}
                      disabled={isSavingEmail}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-xs font-medium text-white hover:bg-sky-500 transition disabled:opacity-50"
                    >
                      {isSavingEmail ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : emailSavedSuccess ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Saved!
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Save Recipient
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleSendTestEmail}
                      disabled={isSendingTestEmail}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition disabled:opacity-50"
                    >
                      {isSendingTestEmail ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5 text-sky-400" />
                          Send Test Alert
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 2: Physical Hardware Actuators */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <RotateCw className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-sm font-semibold text-white">Physical Hardware Actuators</h3>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Servos: [{telemetry?.servoAngles[0] ?? 0}°, {telemetry?.servoAngles[1] ?? 0}°]
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2 rounded-lg bg-slate-950/80 p-3 border border-slate-800">
                    <div className="text-xs font-medium text-slate-300">Dual SG90 Servos (GPIO 12/13)</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleActuatorCommand('reset_servos')}
                        disabled={actuatorLoading === 'reset_servos'}
                        className="flex-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200 font-medium transition"
                      >
                        Reset to 0° (Rest)
                      </button>
                      <button
                        onClick={() => handleActuatorCommand('deploy_servos')}
                        disabled={actuatorLoading === 'deploy_servos'}
                        className="flex-1 rounded-md bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 px-2.5 py-1.5 text-xs font-medium transition"
                      >
                        Deploy 180° (Alert)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-lg bg-slate-950/80 p-3 border border-slate-800">
                    <div className="text-xs font-medium text-slate-300">Traffic Light LEDs (2x Modules)</div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleActuatorCommand('set_leds', { ledColor: 'green' })}
                        className="flex-1 rounded-md bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/60 py-1.5 text-xs font-medium transition text-center"
                      >
                        Green
                      </button>
                      <button
                        onClick={() => handleActuatorCommand('set_leds', { ledColor: 'yellow' })}
                        className="flex-1 rounded-md bg-amber-950/50 hover:bg-amber-900/60 text-amber-400 border border-amber-800/60 py-1.5 text-xs font-medium transition text-center"
                      >
                        Yellow
                      </button>
                      <button
                        onClick={() => handleActuatorCommand('set_leds', { ledColor: 'red' })}
                        className="flex-1 rounded-md bg-rose-950/50 hover:bg-rose-900/60 text-rose-400 border border-rose-800/60 py-1.5 text-xs font-medium transition text-center"
                      >
                        Red
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Scenario Simulator */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4 text-amber-400" />
                    <h3 className="text-sm font-semibold text-white">Trigger Test Incident</h3>
                  </div>
                  <span className="text-[11px] text-slate-400">PIR Motion & Edge AI Simulation</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <button
                    onClick={() => handleSimulateIncident('dead_duck')}
                    disabled={Boolean(actuatorLoading)}
                    className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-rose-900/40 bg-rose-950/20 hover:bg-rose-900/30 text-rose-300 text-xs transition"
                  >
                    <span className="font-semibold">🦆 Dead Mallard</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Critical Alert</span>
                  </button>

                  <button
                    onClick={() => handleSimulateIncident('dead_goose')}
                    disabled={Boolean(actuatorLoading)}
                    className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-rose-900/40 bg-rose-950/20 hover:bg-rose-900/30 text-rose-300 text-xs transition"
                  >
                    <span className="font-semibold">🪿 Dead Goose</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Waterfowl Alert</span>
                  </button>

                  <button
                    onClick={() => handleSimulateIncident('illegal_fishing')}
                    disabled={Boolean(actuatorLoading)}
                    className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-amber-900/40 bg-amber-950/20 hover:bg-amber-900/30 text-amber-300 text-xs transition"
                  >
                    <span className="font-semibold">🎣 Illegal Fishing</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">High Severity</span>
                  </button>

                  <button
                    onClick={() => handleSimulateIncident('dead_fish')}
                    disabled={Boolean(actuatorLoading)}
                    className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-purple-900/40 bg-purple-950/20 hover:bg-purple-900/30 text-purple-300 text-xs transition"
                  >
                    <span className="font-semibold">🐟 Dead Trout</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Carcass Flag</span>
                  </button>

                  <button
                    onClick={() => handleSimulateIncident('routine_day')}
                    disabled={Boolean(actuatorLoading)}
                    className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-emerald-900/40 bg-emerald-950/20 hover:bg-emerald-900/30 text-emerald-300 text-xs transition col-span-2 sm:col-span-1"
                  >
                    <span className="font-semibold">🕒 Baseline Check</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Routine Nominal</span>
                  </button>
                </div>
              </div>

              {/* Section 4: System Reset & Telemetry */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <button
                  onClick={handleResetIncidents}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Reset Incidents to Default
                </button>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Cpu className="h-3.5 w-3.5 text-slate-500" />
                  <span>CPU: {telemetry?.cpuTempC ?? 46.8}°C</span>
                  <span className="text-slate-700">|</span>
                  <span>RAM: {telemetry?.memoryUsageMb ?? 1180}MB</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
