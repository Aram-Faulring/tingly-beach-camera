'use client';

import React, { useState } from 'react';
import { X, Mail, Send, CheckCircle2, ShieldAlert, Sparkles, Key } from 'lucide-react';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EmailModal({ isOpen, onClose }: EmailModalProps) {
  const [recipient, setRecipient] = useState('wildlife-response@cabq.gov');
  const [customNote, setCustomNote] = useState('');
  const [alertWildlife, setAlertWildlife] = useState(true);
  const [alertFishing, setAlertFishing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [statusResult, setStatusResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSendTest = async () => {
    setLoading(true);
    setStatusResult(null);
    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient,
          customMessage: customNote || 'Manual test alert dispatched from Tingley Beach Sentinel dashboard.',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusResult({
          success: true,
          message: data.provider === 'resend'
            ? `Email successfully sent via Resend API to ${recipient} (ID: ${data.deliveryId})`
            : `Email simulation verified! Dispatched to ${recipient}`,
        });
      } else {
        setStatusResult({
          success: false,
          message: data.error || 'Failed to dispatch email',
        });
      }
    } catch (err) {
      setStatusResult({
        success: false,
        message: String(err),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-sky-500/10 p-2 text-sky-400">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Email Alert Dispatch Settings</h3>
              <p className="text-xs text-slate-400">Vercel Serverless Function & Resend Integration</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          {/* Recipient Input */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Primary Dispatch Recipient (Rangers / Wildlife Officials):
            </label>
            <input
              type="email"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              placeholder="e.g. open-space-rangers@cabq.gov"
            />
          </div>

          {/* Trigger Toggles */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 space-y-2.5">
            <span className="font-semibold text-slate-200 block">Automatic Dispatch Rules:</span>
            
            <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={alertWildlife}
                onChange={(e) => setAlertWildlife(e.target.checked)}
                className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
              />
              <span>🚨 Critical Alert: Dead Wildlife / Carcass Flagged</span>
            </label>

            <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={alertFishing}
                onChange={(e) => setAlertFishing(e.target.checked)}
                className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
              />
              <span>🎣 High Alert: Unauthorized Fishing Detected</span>
            </label>
          </div>

          {/* Custom Note for Test */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Add Dispatcher Test Note:
            </label>
            <textarea
              rows={2}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Optional message to include with test dispatch..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none resize-none"
            />
          </div>

          {/* Resend API Key Info Callout */}
          <div className="rounded-xl border border-sky-500/20 bg-sky-950/20 p-3 text-[11px] text-sky-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <Key className="h-3.5 w-3.5" />
              <span>Resend Environment Variable</span>
            </div>
            <p className="text-slate-400">
              Set <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded">RESEND_API_KEY</code> in Vercel project environment settings for live email delivery. When not set, the dashboard simulates dispatch and renders previews.
            </p>
          </div>

          {statusResult && (
            <div
              className={`flex items-center gap-2 rounded-xl p-3 text-xs ${
                statusResult.success
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{statusResult.message}</span>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSendTest}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-sky-500 transition disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            {loading ? 'Sending...' : 'Send Test Alert Email'}
          </button>
        </div>
      </div>
    </div>
  );
}
