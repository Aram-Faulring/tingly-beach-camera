'use client';

import React from 'react';
import { Incident } from '@/types/incident';
import {
  X,
  Skull,
  AlertTriangle,
  Clock,
  MapPin,
  RotateCw,
  Cpu,
  Mail,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Download,
} from 'lucide-react';

interface IncidentModalProps {
  incident: Incident | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: 'unreviewed' | 'investigating' | 'resolved' | 'dismissed') => void;
  onDispatchEmail: (incident: Incident) => void;
}

export function IncidentModal({
  incident,
  onClose,
  onUpdateStatus,
  onDispatchEmail,
}: IncidentModalProps) {
  if (!incident) return null;

  const isDead = incident.type === 'dead_wildlife';
  const isFishing = incident.type === 'illegal_fishing';
  const isRoutine = incident.type === 'routine_snapshot';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-950/95 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div
              className={`rounded-lg p-2 ${
                isDead
                  ? 'bg-rose-500/10 text-rose-400'
                  : isFishing
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'bg-emerald-500/10 text-emerald-400'
              }`}
            >
              {isDead && <Skull className="h-5 w-5" />}
              {isFishing && <AlertTriangle className="h-5 w-5" />}
              {isRoutine && <Clock className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-slate-400">
                  {incident.id.toUpperCase()}
                </span>
                <span
                  className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                    incident.status === 'unreviewed'
                      ? 'bg-rose-500/20 text-rose-300'
                      : incident.status === 'investigating'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {incident.status.toUpperCase()}
                </span>
              </div>
              <h2 className="text-base font-bold text-white sm:text-lg">{incident.title}</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg border border-slate-800 p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-5">
          {/* Main Capture Frame with HUD */}
          <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={incident.imageUrl}
              alt={incident.title}
              className="w-full object-contain max-h-[460px]"
            />

            {/* Bounding Box Highlights overlay */}
            {incident.boundingBoxes?.map((box, idx) => (
              <div
                key={idx}
                className="pointer-events-none absolute border-2 border-red-500 bg-red-500/15"
                style={{
                  top: `${box.box[0]}%`,
                  left: `${box.box[1]}%`,
                  height: `${box.box[2] - box.box[0]}%`,
                  width: `${box.box[3] - box.box[1]}%`,
                }}
              >
                <span className="absolute -top-6 left-0 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
                  {box.label} ({(box.confidence * 100).toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: AI Inference & Detection Breakdown */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" /> Edge Vision Inference Breakdown
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Trigger Source:</span>
                  <span className="font-semibold text-slate-200">
                    {incident.trigger === 'pir_motion'
                      ? 'PIR Motion Sensor Interrupt (GPIO 17)'
                      : 'Scheduled Hourly Timer (60 min default)'}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Detection Type:</span>
                  <span className="font-semibold text-white">
                    {isDead ? 'Deceased Animal / Carcass' : isFishing ? 'Illegal Fishing Activity' : 'Baseline Snapshot'}
                  </span>
                </div>

                {incident.species && (
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Species Classification:</span>
                    <span className="font-bold text-rose-400">{incident.species}</span>
                  </div>
                )}

                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Model Confidence:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {(incident.confidence * 100).toFixed(2)}%
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Timestamp (MDT):</span>
                  <span className="text-slate-300">
                    {new Date(incident.timestamp).toLocaleString('en-US', {
                      timeZone: 'America/Denver',
                      dateStyle: 'medium',
                      timeStyle: 'medium',
                    })}
                  </span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Location / Pond Zone:</span>
                  <span className="text-slate-300 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-sky-400" />
                    {incident.location}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Edge Hardware Actuators & Dispatch */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Cpu className="h-4 w-4" /> Hardware Actuation & Notification
              </h3>

              <div className="space-y-2 text-xs">
                {/* Servos */}
                <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RotateCw className="h-4 w-4 text-indigo-400" />
                    <div>
                      <div className="font-semibold text-slate-200">Micro Servos (2x SG90)</div>
                      <div className="text-[11px] text-slate-400">180° Incident Deployment Rule</div>
                    </div>
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                      incident.servosTriggered
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {incident.servosTriggered ? 'ROTATED 180°' : 'AT REST (0°)'}
                  </span>
                </div>

                {/* Traffic LEDs */}
                <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className={`h-2.5 w-2.5 rounded-full ${incident.ledState.red ? 'bg-red-500 shadow-sm shadow-red-500' : 'bg-red-950'}`}></span>
                      <span className={`h-2.5 w-2.5 rounded-full ${incident.ledState.yellow ? 'bg-amber-400 shadow-sm shadow-amber-400' : 'bg-amber-950'}`}></span>
                      <span className={`h-2.5 w-2.5 rounded-full ${incident.ledState.green ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-emerald-950'}`}></span>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-200">Traffic Light LEDs (2x)</div>
                      <div className="text-[11px] text-slate-400">Local visual alert indicator</div>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-slate-300">
                    {incident.ledState.red ? 'RED: ALERT' : 'GREEN: IDLE'}
                  </span>
                </div>

                {/* Email Dispatch Status */}
                <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-amber-400" />
                    <div>
                      <div className="font-semibold text-slate-200">Resend Email Alert</div>
                      <div className="text-[11px] text-slate-400">{incident.emailRecipient || 'wildlife-response@cabq.gov'}</div>
                    </div>
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                      incident.emailAlertSent ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {incident.emailAlertSent ? 'DISPATCHED' : 'PENDING'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Incident Description & Notes */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <h4 className="text-xs font-semibold text-slate-300">Full Description & Action Log</h4>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">{incident.description}</p>
            {incident.notes && (
              <p className="mt-2 text-xs text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <strong className="text-slate-300">Field Notes:</strong> {incident.notes}
              </p>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 bg-slate-950/95 px-5 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDispatchEmail(incident)}
              className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition"
            >
              <Mail className="h-3.5 w-3.5" />
              Dispatch Alert Email
            </button>
          </div>

          {/* Workflow Status buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateStatus(incident.id, 'investigating')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                incident.status === 'investigating'
                  ? 'bg-amber-600 text-white'
                  : 'border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Mark Investigating
            </button>

            <button
              onClick={() => onUpdateStatus(incident.id, 'resolved')}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                incident.status === 'resolved'
                  ? 'bg-emerald-600 text-white'
                  : 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Mark Resolved
            </button>

            <button
              onClick={onClose}
              className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
