import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

function safeCompare(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

export function verifyDeviceKey(
  request: NextRequest,
  body?: Record<string, unknown>
): NextResponse | null {
  const expectedKey = process.env.DEVICE_API_KEY;
  if (!expectedKey) {
    return NextResponse.json(
      { error: 'Server misconfiguration: DEVICE_API_KEY is not set' },
      { status: 500 }
    );
  }

  const provided =
    request.headers.get('x-api-key') ||
    (typeof body?.apiKey === 'string' ? body.apiKey : '');

  if (!provided || !safeCompare(provided, expectedKey)) {
    return NextResponse.json({ error: 'Unauthorized device key' }, { status: 401 });
  }

  return null;
}

export function verifyAdminPassword(
  request: NextRequest,
  body?: Record<string, unknown>
): NextResponse | null {
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword) {
    return NextResponse.json(
      { error: 'Server misconfiguration: ADMIN_PASSWORD is not set' },
      { status: 500 }
    );
  }

  const provided =
    request.headers.get('x-admin-password') ||
    (typeof body?.adminPassword === 'string' ? body.adminPassword : '');

  if (!provided || !safeCompare(provided, expectedPassword)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Admin credentials required.' },
      { status: 403 }
    );
  }

  return null;
}

export function verifyDeviceOrAdmin(
  request: NextRequest,
  body?: Record<string, unknown>
): NextResponse | null {
  const expectedDeviceKey = process.env.DEVICE_API_KEY;
  const expectedAdminPwd = process.env.ADMIN_PASSWORD;

  if (!expectedDeviceKey && !expectedAdminPwd) {
    return NextResponse.json(
      { error: 'Server misconfiguration: No authentication secret configured' },
      { status: 500 }
    );
  }

  const deviceKey =
    request.headers.get('x-api-key') ||
    (typeof body?.apiKey === 'string' ? body.apiKey : '');
  if (expectedDeviceKey && deviceKey && safeCompare(deviceKey, expectedDeviceKey)) {
    return null;
  }

  const adminPwd =
    request.headers.get('x-admin-password') ||
    (typeof body?.adminPassword === 'string' ? body.adminPassword : '');
  if (expectedAdminPwd && adminPwd && safeCompare(adminPwd, expectedAdminPwd)) {
    return null;
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function isValidAdminPassword(candidate: unknown): boolean {
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword || typeof candidate !== 'string' || !candidate) {
    return false;
  }
  return safeCompare(candidate, expectedPassword);
}

export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
