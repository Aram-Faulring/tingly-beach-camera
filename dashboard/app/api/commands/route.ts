import { NextRequest, NextResponse } from 'next/server';
import { getPendingDeviceCommands, clearDeviceCommands } from '@/lib/store';
import { verifyDeviceKey } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const authError = verifyDeviceKey(request);
  if (authError) {
    return authError;
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
