import { Incident, DeviceTelemetry } from '@/types/incident';
import { SAMPLE_IMAGES } from './sample-images';

export interface ScenarioDefinition {
  id: string;
  title: string;
  subtitle: string;
  type: Incident['type'];
  severity: Incident['severity'];
  location: string;
  pondZone: Incident['pondZone'];
  species?: string;
  confidence: number;
  description: string;
  notes: string;
  imageUrl: string;
  servosTriggered: boolean;
  servoAngle: number;
  ledState: { green: boolean; yellow: boolean; red: boolean };
  boundingBoxes?: Incident['boundingBoxes'];
}

export const SIMULATION_SCENARIOS: Record<string, ScenarioDefinition> = {
  dead_duck: {
    id: 'dead_duck',
    title: 'Deceased Waterfowl Detected: Mallard Duck',
    subtitle: 'Central Pond East Reeds • Carcass Flag',
    type: 'dead_wildlife',
    severity: 'critical',
    location: 'Tingley Beach - Central Pond (East Bank Reeds)',
    pondZone: 'central_pond',
    species: 'Mallard Duck (Anas platyrhynchos)',
    confidence: 0.942,
    description: 'PIR motion sensor triggered frame capture. YOLO edge inference flagged motionless deceased adult male Mallard duck floating near the eastern reeds of Central Pond.',
    notes: 'Micro servos actuated 180° to deploy physical marker flag. High priority wildlife carcass retrieval needed.',
    imageUrl: SAMPLE_IMAGES.dead_duck,
    servosTriggered: true,
    servoAngle: 180,
    ledState: { green: false, yellow: false, red: true },
    boundingBoxes: [
      {
        label: 'Dead Mallard Duck',
        confidence: 0.942,
        box: [57, 40, 77, 61],
      },
    ],
  },
  dead_goose: {
    id: 'dead_goose',
    title: 'Deceased Waterfowl Detected: Canada Goose',
    subtitle: 'South Pond Shallows • Carcass Flag',
    type: 'dead_wildlife',
    severity: 'critical',
    location: 'Tingley Beach - South Pond Shallows',
    pondZone: 'south_pond',
    species: 'Canada Goose (Branta canadensis)',
    confidence: 0.915,
    description: 'PIR motion sensor interrupt fired as wind moved surrounding reeds. Edge YOLO model identified motionless deceased Canada Goose specimen on southern gravel shoreline.',
    notes: 'Simulated motion trigger event. Physical servos rotated to 180° flag position.',
    imageUrl: SAMPLE_IMAGES.dead_goose,
    servosTriggered: true,
    servoAngle: 180,
    ledState: { green: false, yellow: false, red: true },
    boundingBoxes: [
      {
        label: 'Dead Canada Goose',
        confidence: 0.915,
        box: [45, 38, 68, 62],
      },
    ],
  },
  illegal_fishing: {
    id: 'illegal_fishing',
    title: 'Restricted Gear: Fishing Rod in Model Boat Pond',
    subtitle: 'Children’s Pond North Pier • After-Hours Violation',
    type: 'illegal_fishing',
    severity: 'high',
    location: "Tingley Beach - Children's & Model Boat Pond North Pier",
    pondZone: 'children_pond',
    confidence: 0.893,
    description: 'PIR motion sensor detected movement along north pier of Children’s & Model Boat pond. High-confidence fishing rod and active casting detected after park dusk cutoff.',
    notes: 'Reported to Open Space Rangers. Zone is strictly reserved for youth under 12 and model boats during park daylight hours.',
    imageUrl: SAMPLE_IMAGES.illegal_fishing,
    servosTriggered: true,
    servoAngle: 180,
    ledState: { green: false, yellow: true, red: true },
    boundingBoxes: [
      {
        label: 'Suspect Angler',
        confidence: 0.914,
        box: [51, 55, 79, 63],
      },
      {
        label: 'Fishing Rod (Restricted)',
        confidence: 0.887,
        box: [45, 38, 60, 56],
      },
    ],
  },
  dead_fish: {
    id: 'dead_fish',
    title: 'Deceased Rainbow Trout Washed on Shoreline',
    subtitle: 'Catch & Release Pond • Shoreline Fish Mortality',
    type: 'dead_wildlife',
    severity: 'medium',
    location: 'Tingley Beach - South Catch & Release Pond',
    pondZone: 'south_pond',
    species: 'Rainbow Trout (Oncorhynchus mykiss)',
    confidence: 0.968,
    description: 'Hourly scheduled baseline snapshot captured deceased Rainbow Trout washed ashore in shallow gravel bank. Fish showed zero movement across subsequent verification frames.',
    notes: 'Specimen logged in shallow gravel bank. Water quality inspection flagged.',
    imageUrl: SAMPLE_IMAGES.dead_fish,
    servosTriggered: true,
    servoAngle: 180,
    ledState: { green: false, yellow: false, red: true },
    boundingBoxes: [
      {
        label: 'Dead Rainbow Trout',
        confidence: 0.968,
        box: [41, 38, 61, 65],
      },
    ],
  },
  routine_day: {
    id: 'routine_day',
    title: 'Hourly Timed Baseline Capture',
    subtitle: 'Central Pond Pier • Surface & Water Nominal',
    type: 'routine_snapshot',
    severity: 'info',
    location: 'Tingley Beach - Central Pond North Pier View',
    pondZone: 'central_pond',
    confidence: 0.99,
    description: 'Automatic hourly heartbeat capture. Surface waters calm, zero carcasses or distressed wildlife detected, zero unauthorized persons.',
    notes: 'All clear. Ambient temperature 18.5°C, calm winds, water conditions nominal.',
    imageUrl: SAMPLE_IMAGES.routine_day,
    servosTriggered: false,
    servoAngle: 0,
    ledState: { green: true, yellow: false, red: false },
  },
};

export function createSimulatedIncident(scenarioKey: string): Incident {
  const scenario = SIMULATION_SCENARIOS[scenarioKey] || SIMULATION_SCENARIOS.dead_duck;
  const isRoutine = scenario.type === 'routine_snapshot';

  return {
    id: `sim-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5)}`,
    timestamp: new Date().toISOString(),
    trigger: isRoutine ? 'hourly_timer' : 'pir_motion',
    type: scenario.type,
    title: scenario.title,
    description: scenario.description,
    species: scenario.species,
    confidence: scenario.confidence,
    status: isRoutine ? 'resolved' : 'unreviewed',
    severity: scenario.severity,
    location: scenario.location,
    pondZone: scenario.pondZone,
    imageUrl: scenario.imageUrl,
    boundingBoxes: scenario.boundingBoxes ? [...scenario.boundingBoxes] : [],
    servosTriggered: scenario.servosTriggered,
    servoAngle: scenario.servoAngle,
    ledState: { ...scenario.ledState },
    emailAlertSent: !isRoutine,
    notes: scenario.notes,
  };
}

export function createSimulatedTelemetry(base?: Partial<DeviceTelemetry>): DeviceTelemetry {
  return {
    deviceId: 'tingley-pi4-01-sim',
    name: 'Tingley Beach Sentinel Pi 4 (Simulated)',
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
    ...base,
  };
}

export function simulateTelemetryTick(current: DeviceTelemetry | null): DeviceTelemetry {
  const prev = current || createSimulatedTelemetry();
  // Minor realistic fluctuations
  const tempDelta = (Math.random() - 0.5) * 0.4;
  const newTemp = Math.round((Math.max(43.5, Math.min(51.0, (prev.cpuTempC || 46.8) + tempDelta))) * 10) / 10;
  const loadDelta = Math.round((Math.random() - 0.5) * 4);
  const newLoad = Math.max(12, Math.min(48, (prev.cpuUsagePct || 22) + loadDelta));
  const memDelta = Math.round((Math.random() - 0.5) * 10);
  const newMem = Math.max(1120, Math.min(1280, (prev.memoryUsageMb || 1180) + memDelta));
  const voltage = Math.round((5.11 + Math.random() * 0.03) * 100) / 100;

  return {
    ...prev,
    cpuTempC: newTemp,
    cpuUsagePct: newLoad,
    memoryUsageMb: newMem,
    voltageV: voltage,
    online: true,
    lastHeartbeat: new Date().toISOString(),
  };
}
