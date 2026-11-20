import { Incident, DeviceTelemetry } from '@/types/incident';
import { SAMPLE_IMAGES } from './sample-images';

export interface AdminConfig {
  emailRecipient: string;
  emailAlertsEnabled: boolean;
  minConfidenceThreshold: number;
  autoActuateServos: boolean;
  maintenanceMode: boolean;
}

export interface DeviceCommand {
  id: string;
  command: string;
  params?: Record<string, unknown>;
  timestamp: string;
}

// Global singleton in development/production serverless instances
declare global {
  // eslint-disable-next-line no-var
  var __tingley_incidents: Incident[] | undefined;
  // eslint-disable-next-line no-var
  var __tingley_telemetry: DeviceTelemetry | undefined;
  // eslint-disable-next-line no-var
  var __tingley_admin_config: AdminConfig | undefined;
  // eslint-disable-next-line no-var
  var __tingley_device_commands: DeviceCommand[] | undefined;
}

const INITIAL_ADMIN_CONFIG: AdminConfig = {
  emailRecipient: process.env.ALERT_EMAIL_RECIPIENT || 'cuddles_caterer_3c@icloud.com',
  emailAlertsEnabled: true,
  minConfidenceThreshold: 0.65,
  autoActuateServos: true,
  maintenanceMode: false,
};

const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'inc-001',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 min ago
    trigger: 'pir_motion',
    type: 'dead_wildlife',
    title: 'Deceased Waterfowl Detected: Mallard Duck',
    description: 'PIR motion sensor triggered frame capture. YOLO edge inference flagged motionless deceased adult male Mallard duck floating near the eastern reeds of Central Pond.',
    species: 'Mallard Duck (Anas platyrhynchos)',
    confidence: 0.942,
    status: 'unreviewed',
    severity: 'critical',
    location: 'Tingley Beach - Central Pond (East Bank Reeds)',
    pondZone: 'central_pond',
    imageUrl: SAMPLE_IMAGES.dead_duck,
    boundingBoxes: [
      {
        label: 'Dead Mallard Duck',
        confidence: 0.942,
        box: [57, 40, 77, 61],
      },
    ],
    servosTriggered: true,
    servoAngle: 180,
    ledState: { green: false, yellow: false, red: true },
    emailAlertSent: true,
    emailRecipient: 'cuddles_caterer_3c@icloud.com',
    notes: 'Micro servos actuated 180° to deploy physical marker flag. High priority wildlife carcass retrieval needed.',
  },
  {
    id: 'inc-002',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
    trigger: 'pir_motion',
    type: 'illegal_fishing',
    title: 'Unauthorized Night Fishing in Restricted Pond',
    description: 'Motion sensor triggered after park closing hours (dusk cutoff). Person detected actively deploying fishing rod and line on Children’s Pond bank.',
    confidence: 0.887,
    status: 'investigating',
    severity: 'high',
    location: "Tingley Beach - Children's & Model Boat Pond",
    pondZone: 'children_pond',
    imageUrl: SAMPLE_IMAGES.illegal_fishing,
    boundingBoxes: [
      {
        label: 'Suspect',
        confidence: 0.914,
        box: [51, 55, 79, 63],
      },
      {
        label: 'Fishing Rod (Restricted Zone)',
        confidence: 0.887,
        box: [45, 38, 60, 56],
      },
    ],
    servosTriggered: true,
    servoAngle: 180,
    ledState: { green: false, yellow: true, red: true },
    emailAlertSent: true,
    emailRecipient: 'cuddles_caterer_3c@icloud.com',
    notes: 'Reported to Open Space Rangers. Zone is strictly reserved for youth under 12 and model boats during park daylight hours.',
  },
  {
    id: 'inc-003',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    trigger: 'hourly_timer',
    type: 'dead_wildlife',
    title: 'Deceased Rainbow Trout Washed on Shoreline',
    description: 'Hourly scheduled baseline snapshot captured deceased Rainbow Trout washed ashore in shallow gravel bank. Fish showed zero movement across subsequent verification frames.',
    species: 'Rainbow Trout (Oncorhynchus mykiss)',
    confidence: 0.968,
    status: 'resolved',
    severity: 'medium',
    location: 'Tingley Beach - South Catch & Release Pond',
    pondZone: 'south_pond',
    imageUrl: SAMPLE_IMAGES.dead_fish,
    boundingBoxes: [
      {
        label: 'Dead Rainbow Trout',
        confidence: 0.968,
        box: [41, 38, 61, 65],
      },
    ],
    servosTriggered: true,
    servoAngle: 180,
    ledState: { green: false, yellow: false, red: true },
    emailAlertSent: true,
    emailRecipient: 'cuddles_caterer_3c@icloud.com',
    notes: 'Specimen removed by groundskeeper at 09:30. Water quality logged normal.',
  },
  {
    id: 'inc-004',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(), // 1 hour ago
    trigger: 'hourly_timer',
    type: 'routine_snapshot',
    title: 'Hourly Baseline Environmental Check',
    description: 'Scheduled hourly heartbeat capture. Water level nominal, no surface obstructions, no wildlife distress, no unauthorized persons present.',
    confidence: 0.99,
    status: 'resolved',
    severity: 'info',
    location: 'Tingley Beach - Central Pond North Pier View',
    pondZone: 'central_pond',
    imageUrl: SAMPLE_IMAGES.routine_day,
    servosTriggered: false,
    servoAngle: 0,
    ledState: { green: true, yellow: false, red: false },
    emailAlertSent: false,
    notes: 'All clear. Ambient temperature 18.5°C, calm winds.',
  },
];

const INITIAL_TELEMETRY: DeviceTelemetry = {
  deviceId: 'tingley-pi4-01',
  name: 'Tingley Beach Sentinel Pi 4',
  online: true,
  lastHeartbeat: new Date().toISOString(),
  uptimeHours: 94.2,
  powerSource: 'AC Wall Adapter (USB-C 5V / 3A)',
  voltageV: 5.12,
  cpuTempC: 46.8,
  cpuUsagePct: 22,
  memoryUsageMb: 1180,
  memoryTotalMb: 4096,
  wifiSsid: 'ABQ-OpenSpace-Guest-5G',
  wifiSignalDbm: -56,
  cameraStatus: 'ready',
  pirSensorStatus: 'idle',
  servoAngles: [0, 0],
  ledState: { green: true, yellow: false, red: false },
};

export function getAdminConfig(): AdminConfig {
  if (!global.__tingley_admin_config) {
    global.__tingley_admin_config = { ...INITIAL_ADMIN_CONFIG };
  }
  return global.__tingley_admin_config;
}

export function updateAdminConfig(updates: Partial<AdminConfig>): AdminConfig {
  const config = getAdminConfig();
  Object.assign(config, updates);
  return config;
}

export function getIncidents(): Incident[] {
  if (!global.__tingley_incidents) {
    global.__tingley_incidents = [...INITIAL_INCIDENTS];
  }
  return global.__tingley_incidents;
}

export function getIncidentById(id: string): Incident | undefined {
  return getIncidents().find((inc) => inc.id === id);
}

export function addIncident(incident: Incident): Incident {
  const incidents = getIncidents();
  incidents.unshift(incident);
  
  // Update telemetry servo and LED status
  const telemetry = getTelemetry();
  if (incident.servosTriggered) {
    telemetry.servoAngles = [180, 180];
    telemetry.ledState = { green: false, yellow: false, red: true };
  }
  return incident;
}

export function updateIncident(id: string, updates: Partial<Incident>): Incident | null {
  const incidents = getIncidents();
  const index = incidents.findIndex((inc) => inc.id === id);
  if (index === -1) return null;
  
  incidents[index] = { ...incidents[index], ...updates };
  return incidents[index];
}

export function deleteIncident(id: string): boolean {
  const incidents = getIncidents();
  const index = incidents.findIndex((inc) => inc.id === id);
  if (index === -1) return false;
  incidents.splice(index, 1);
  return true;
}

export function resetIncidents(): Incident[] {
  global.__tingley_incidents = [...INITIAL_INCIDENTS];
  global.__tingley_telemetry = { ...INITIAL_TELEMETRY };
  return global.__tingley_incidents;
}

export function getTelemetry(): DeviceTelemetry {
  if (!global.__tingley_telemetry) {
    global.__tingley_telemetry = { ...INITIAL_TELEMETRY };
  }
  return global.__tingley_telemetry;
}

export function updateTelemetry(updates: Partial<DeviceTelemetry>): DeviceTelemetry {
  const telemetry = getTelemetry();
  Object.assign(telemetry, updates, { lastHeartbeat: new Date().toISOString() });
  return telemetry;
}

export function queueDeviceCommand(command: string, params?: Record<string, unknown>): DeviceCommand {
  if (!global.__tingley_device_commands) {
    global.__tingley_device_commands = [];
  }
  const cmd: DeviceCommand = {
    id: `cmd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    command,
    params,
    timestamp: new Date().toISOString(),
  };
  global.__tingley_device_commands.push(cmd);
  return cmd;
}

export function getPendingDeviceCommands(): DeviceCommand[] {
  if (!global.__tingley_device_commands) {
    global.__tingley_device_commands = [];
  }
  return global.__tingley_device_commands;
}

export function clearDeviceCommands(): void {
  global.__tingley_device_commands = [];
}
