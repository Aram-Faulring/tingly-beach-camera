import { NextRequest, NextResponse } from 'next/server';
import { getTelemetry, updateTelemetry } from '@/lib/store';

export async function GET() {
  return NextResponse.json({
    success: true,
    telemetry: getTelemetry(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const updated = updateTelemetry(body);
    return NextResponse.json({
      success: true,
      telemetry: updated,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update telemetry', details: String(error) }, { status: 500 });
  }
}
