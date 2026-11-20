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

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'tingley2026';

export async function GET() {
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
      if (password === ADMIN_PASSWORD) {
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
    const authHeader = request.headers.get('x-admin-password') || body.adminPassword;
    if (authHeader !== ADMIN_PASSWORD) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized. Admin credentials required.',
      }, { status: 403 });
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
        message: `Actuator command '${command}' dispatched`,
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
