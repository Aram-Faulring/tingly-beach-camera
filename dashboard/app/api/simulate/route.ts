import { NextRequest, NextResponse } from 'next/server';
import { addIncident, updateTelemetry, resetIncidents, getTelemetry } from '@/lib/store';
import { createSimulatedIncident, SIMULATION_SCENARIOS, createSimulatedTelemetry } from '@/lib/simulation-engine';

export async function GET() {
  return NextResponse.json({
    success: true,
    scenarios: Object.values(SIMULATION_SCENARIOS),
    telemetry: getTelemetry(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const scenario = body.scenario || 'dead_duck';

    // 1. Actuator simulation command
    if (scenario === 'actuate_servos') {
      const angle = body.angle ?? 180;
      const updated = updateTelemetry({
        servoAngles: [angle, angle],
        ledState: angle === 0 
          ? { green: true, yellow: false, red: false }
          : { green: false, yellow: false, red: true },
      });
      return NextResponse.json({
        success: true,
        message: `Servos actuated to ${angle}°`,
        telemetry: updated,
      });
    }

    if (scenario === 'set_leds') {
      const ledColor = body.ledColor || 'green';
      const updated = updateTelemetry({
        ledState: {
          green: ledColor === 'green',
          yellow: ledColor === 'yellow',
          red: ledColor === 'red',
        },
      });
      return NextResponse.json({
        success: true,
        message: `Traffic LEDs set to ${ledColor}`,
        telemetry: updated,
      });
    }

    if (scenario === 'trigger_pir') {
      const updated = updateTelemetry({
        pirSensorStatus: 'triggered',
      });
      return NextResponse.json({
        success: true,
        message: 'PIR motion sensor interrupt triggered',
        telemetry: updated,
      });
    }

    if (scenario === 'reset') {
      resetIncidents();
      const resetTelem = updateTelemetry(createSimulatedTelemetry());
      return NextResponse.json({
        success: true,
        message: 'Simulation reset to baseline state',
        telemetry: resetTelem,
      });
    }

    // 2. Incident trigger scenario
    const newIncident = createSimulatedIncident(scenario);
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
