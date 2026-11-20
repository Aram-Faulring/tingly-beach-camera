import { NextRequest, NextResponse } from 'next/server';
import { getIncidents, addIncident, getAdminConfig, updateTelemetry } from '@/lib/store';
import { Incident, IncidentType, IncidentStatus } from '@/types/incident';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') as IncidentType | null;
  const status = searchParams.get('status') as IncidentStatus | null;

  let list = getIncidents();
  if (type) {
    list = list.filter((i) => i.type === type);
  }
  if (status) {
    list = list.filter((i) => i.status === status);
  }

  return NextResponse.json({
    success: true,
    count: list.length,
    incidents: list,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify API key if provided in headers
    const apiKey = request.headers.get('x-api-key') || body.apiKey;
    const expectedKey = process.env.DEVICE_API_KEY || 'tingley-edge-secret-key-2026';
    
    if (apiKey && apiKey !== expectedKey) {
      return NextResponse.json({ error: 'Unauthorized device key' }, { status: 401 });
    }

    const adminConfig = getAdminConfig();

    const newIncident: Incident = {
      id: `inc-${Date.now().toString().slice(-6)}`,
      timestamp: body.timestamp || new Date().toISOString(),
      trigger: body.trigger || 'pir_motion',
      type: body.type || 'dead_wildlife',
      title: body.title || 'Edge AI Detection Triggered',
      description: body.description || 'Raspberry Pi 4 detected anomaly at Tingley Beach.',
      species: body.species,
      confidence: typeof body.confidence === 'number' ? body.confidence : 0.91,
      status: 'unreviewed',
      severity: body.severity || (body.type === 'routine_snapshot' ? 'info' : 'critical'),
      location: body.location || 'Tingley Beach - Central Pond',
      pondZone: body.pondZone || 'central_pond',
      imageUrl: body.imageUrl || body.imageBase64 || '/placeholder.svg',
      boundingBoxes: body.boundingBoxes || [],
      servosTriggered: body.servosTriggered ?? (body.type !== 'routine_snapshot'),
      servoAngle: body.type !== 'routine_snapshot' ? 180 : 0,
      ledState: body.type === 'routine_snapshot' 
        ? { green: true, yellow: false, red: false }
        : { green: false, yellow: false, red: true },
      emailAlertSent: adminConfig.emailAlertsEnabled && body.sendEmail !== false,
      emailRecipient: adminConfig.emailRecipient,
      notes: body.notes || 'Ingested from Raspberry Pi 4 edge camera.',
    };

    addIncident(newIncident);

    // Update telemetry state
    updateTelemetry({
      lastHeartbeat: new Date().toISOString(),
      cameraStatus: 'ready',
      pirSensorStatus: body.trigger === 'pir_motion' ? 'triggered' : 'idle',
      servoAngles: newIncident.servosTriggered ? [180, 180] : [0, 0],
      ledState: newIncident.ledState,
    });

    return NextResponse.json({
      success: true,
      message: 'Incident ingested successfully',
      incident: newIncident,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to process incident payload',
      details: String(error),
    }, { status: 500 });
  }
}
