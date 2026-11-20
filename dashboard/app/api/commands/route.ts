import { NextRequest, NextResponse } from 'next/server';
import { getPendingDeviceCommands, clearDeviceCommands } from '@/lib/store';

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  const expectedKey = process.env.DEVICE_API_KEY || 'tingley-edge-secret-key-2026';

  if (apiKey && apiKey !== expectedKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const commands = getPendingDeviceCommands();
  // Clear after delivering
  const returned = [...commands];
  clearDeviceCommands();

  return NextResponse.json({
    success: true,
    count: returned.length,
    commands: returned,
  });
}
