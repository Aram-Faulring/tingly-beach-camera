import { NextRequest, NextResponse } from 'next/server';
import {
  getAdminConfig,
  updateAdminConfig,
  deleteIncident,
  resetIncidents,
  getTelemetry,
  updateTelemetry,
  queueDeviceCommand,
} from '@/lib/store';
import { verifyAdminPassword, isValidAdminPassword } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const authError = verifyAdminPassword(request);
  if (authError) {
    return authError;
  }

  const config = getAdminConfig();
  const telemetry = getTelemetry();
  return NextResponse.json({
    success: true,
    config,
    telemetry,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, password } = body;

    // Login action
    if (action === 'auth') {
      if (!process.env.ADMIN_PASSWORD) {
        return NextResponse.json({
          success: false,
          authenticated: false,
          error: 'Server misconfiguration: ADMIN_PASSWORD is not configured',
        }, { status: 500 });
      }
      if (isValidAdminPassword(password)) {
        return NextResponse.json({
          success: true,
          authenticated: true,
          config: getAdminConfig(),
          telemetry: getTelemetry(),
        });
      } else {
        return NextResponse.json({
          success: false,
          authenticated: false,
          error: 'Incorrect admin password',
        }, { status: 401 });
      }
    }

    // Require authentication check for other actions
    const authError = verifyAdminPassword(request, body);
    if (authError) {
      return authError;
    }

    // 1. Update Admin Configuration (e.g. Email settings)
    if (action === 'update_config') {
      const { emailRecipient, emailAlertsEnabled, minConfidenceThreshold } = body;
      const updated = updateAdminConfig({
        ...(typeof emailRecipient === 'string' ? { emailRecipient } : {}),
        ...(typeof emailAlertsEnabled === 'boolean' ? { emailAlertsEnabled } : {}),
        ...(typeof minConfidenceThreshold === 'number' ? { minConfidenceThreshold } : {}),
      });

      return NextResponse.json({
        success: true,
        message: 'Admin settings saved successfully',
        config: updated,
      });
    }

    // 2. Hardware Actuator Commands
    if (action === 'actuator') {
      const { command, angle, ledColor } = body;
      const cmd = queueDeviceCommand(command, { angle, ledColor });

      // Dispatch to shared cloud queue so the physical Raspberry Pi daemon executes it
      try {
        await fetch('https://api.restful-api.dev/objects/ff808181a09d98f701a1f6f5bf537d79', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'tingley_command_queue',
            data: {
              command,
              angle: angle ?? (command === 'reset_servos' ? 0 : 180),
              ledColor: ledColor ?? (command === 'reset_servos' ? 'green' : 'red'),
              timestamp: Date.now(),
            },
          }),
        });
      } catch (err) {
        console.error('Failed to sync actuator command to cloud queue', err);
      }

      if (command === 'reset_servos') {
        updateTelemetry({
          servoAngles: [0, 0],
          ledState: { green: true, yellow: false, red: false },
        });
      } else if (command === 'deploy_servos') {
        updateTelemetry({
          servoAngles: [180, 180],
          ledState: { green: false, yellow: false, red: true },
        });
      } else if (command === 'set_leds') {
        updateTelemetry({
          ledState: {
            green: ledColor === 'green',
            yellow: ledColor === 'yellow',
            red: ledColor === 'red',
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: `Actuator command '${command}' dispatched to physical Pi`,
        command: cmd,
        telemetry: getTelemetry(),
      });
    }

    // 3. Delete Incident
    if (action === 'delete_incident') {
      const { id } = body;
      const deleted = deleteIncident(id);
      return NextResponse.json({
        success: deleted,
        message: deleted ? `Incident ${id} deleted` : 'Incident not found',
      });
    }

    // 4. Reset Demo Incidents
    if (action === 'reset_incidents') {
      const refreshed = resetIncidents();
      return NextResponse.json({
        success: true,
        message: 'Incidents restored to baseline',
        count: refreshed.length,
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({
      error: 'Admin operation failed',
      details: String(error),
    }, { status: 500 });
  }
}
