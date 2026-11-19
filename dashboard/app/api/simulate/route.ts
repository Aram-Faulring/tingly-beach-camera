import { NextRequest, NextResponse } from 'next/server';
import { addIncident, updateTelemetry } from '@/lib/store';
import { SAMPLE_IMAGES } from '@/lib/sample-images';
import { Incident } from '@/types/incident';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const scenario = body.scenario || 'dead_goose';

    let newIncident: Incident;

    if (scenario === 'dead_goose') {
      newIncident = {
        id: `inc-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        trigger: 'pir_motion',
        type: 'dead_wildlife',
        title: 'Deceased Waterfowl Detected: Canada Goose',
        description: 'PIR motion sensor interrupt fired as wind moved surrounding reeds. Edge YOLO model identified motionless deceased Canada Goose specimen on southern gravel shoreline.',
        species: 'Canada Goose (Branta canadensis)',
        confidence: 0.915,
        status: 'unreviewed',
        severity: 'critical',
        location: 'Tingley Beach - South Pond Shallows',
        pondZone: 'south_pond',
        imageUrl: SAMPLE_IMAGES.dead_goose,
        boundingBoxes: [
          {
            label: 'Dead Canada Goose',
            confidence: 0.915,
            box: [45, 38, 68, 62],
          },
        ],
        servosTriggered: true,
        servoAngle: 180,
        ledState: { green: false, yellow: false, red: true },
        emailAlertSent: true,
        emailRecipient: 'wildlife-response@cabq.gov',
        notes: 'Simulated motion trigger event. Physical servos rotated to 180° flag position.',
      };
    } else if (scenario === 'illegal_fishing') {
      newIncident = {
        id: `inc-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        trigger: 'pir_motion',
        type: 'illegal_fishing',
        title: 'Restricted Gear: Fishing Rod in Model Boat Pond',
        description: 'PIR motion sensor detected movement along north pier of Children’s & Model Boat pond. High-confidence fishing rod and active casting detected.',
        confidence: 0.893,
        status: 'unreviewed',
        severity: 'high',
        location: "Tingley Beach - Model Boat Pond North Pier",
        pondZone: 'children_pond',
        imageUrl: SAMPLE_IMAGES.illegal_fishing,
        boundingBoxes: [
          {
            label: 'Suspect Angler',
            confidence: 0.92,
            box: [51, 55, 79, 63],
          },
          {
            label: 'Fishing Rod',
            confidence: 0.893,
            box: [45, 38, 60, 56],
          },
        ],
        servosTriggered: true,
        servoAngle: 180,
        ledState: { green: false, yellow: true, red: true },
        emailAlertSent: true,
        emailRecipient: 'open-space-rangers@cabq.gov',
        notes: 'Simulated unauthorized fishing detection. Servos rotated 180° to alert marker position.',
      };
    } else {
      newIncident = {
        id: `inc-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        trigger: 'hourly_timer',
        type: 'routine_snapshot',
        title: 'Hourly Timed Baseline Capture',
        description: 'Automatic hourly heartbeat capture. Surface waters calm, zero carcasses or distressed wildlife detected, zero unauthorized persons.',
        confidence: 0.99,
        status: 'resolved',
        severity: 'info',
        location: 'Tingley Beach - Central Pond North Bank',
        pondZone: 'central_pond',
        imageUrl: SAMPLE_IMAGES.routine_day,
        servosTriggered: false,
        servoAngle: 0,
        ledState: { green: true, yellow: false, red: false },
        emailAlertSent: false,
        notes: 'Automated hourly routine check.',
      };
    }

    addIncident(newIncident);

    // Update telemetry state
    updateTelemetry({
      pirSensorStatus: newIncident.trigger === 'pir_motion' ? 'triggered' : 'idle',
      servoAngles: newIncident.servosTriggered ? [180, 180] : [0, 0],
      ledState: newIncident.ledState,
    });

    return NextResponse.json({
      success: true,
      message: `Scenario '${scenario}' simulated successfully`,
      incident: newIncident,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to simulate scenario', details: String(error) }, { status: 500 });
  }
}
