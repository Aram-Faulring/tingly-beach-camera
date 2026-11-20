export type IncidentType = 'dead_wildlife' | 'illegal_fishing' | 'routine_snapshot';
export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type IncidentStatus = 'unreviewed' | 'investigating' | 'resolved' | 'dismissed';
export type TriggerSource = 'pir_motion' | 'hourly_timer' | 'manual_trigger';

export interface BoundingBox {
  label: string;
  confidence: number;
  box: [number, number, number, number]; // [ymin, xmin, ymax, xmax] in percentages (0-100)
}

export interface Incident {
  id: string;
  timestamp: string;
  trigger: TriggerSource;
  type: IncidentType;
  title: string;
  description: string;
  species?: string;
  confidence: number;
  status: IncidentStatus;
  severity: IncidentSeverity;
  location: string;
  pondZone: 'central_pond' | 'south_pond' | 'children_pond' | 'bosque_bank';
  imageUrl: string;
  boundingBoxes?: BoundingBox[];
  servosTriggered: boolean;
  servoAngle: number; // 0 or 180 degrees
  ledState: {
    green: boolean;
    yellow: boolean;
    red: boolean;
  };
  emailAlertSent: boolean;
  emailRecipient?: string;
  notes?: string;
}

export interface DeviceTelemetry {
  deviceId: string;
  name: string;
  online: boolean;
  lastHeartbeat: string;
  uptimeHours: number;
  powerSource: string;
  voltageV: number;
  cpuTempC: number;
  cpuUsagePct: number;
  memoryUsageMb: number;
  memoryTotalMb: number;
  wifiSsid: string;
  wifiSignalDbm: number;
  cameraStatus: 'ready' | 'capturing' | 'error';
  pirSensorStatus: 'idle' | 'triggered';
  servoAngles: [number, number]; // [servo1, servo2]
  ledState: {
    green: boolean;
    yellow: boolean;
    red: boolean;
  };
  isSimulator?: boolean;
  simulatorOnline?: boolean;
}
