import { NextRequest, NextResponse } from 'next/server';
import { getIncidentById, updateIncident, deleteIncident } from '@/lib/store';
import { verifyAdminPassword } from '@/lib/auth';
import { Incident } from '@/types/incident';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const incident = getIncidentById(id);

  if (!incident) {
    return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, incident });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = verifyAdminPassword(request);
  if (authError) {
    return authError;
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const allowedUpdates: Partial<Incident> = {};
    if (body.status === 'unreviewed' || body.status === 'investigating' || body.status === 'resolved') {
      allowedUpdates.status = body.status;
    }
    if (body.severity === 'critical' || body.severity === 'high' || body.severity === 'medium' || body.severity === 'info') {
      allowedUpdates.severity = body.severity;
    }
    if (typeof body.notes === 'string') {
      allowedUpdates.notes = body.notes;
    }
    if (typeof body.emailAlertSent === 'boolean') {
      allowedUpdates.emailAlertSent = body.emailAlertSent;
    }
    if (typeof body.emailRecipient === 'string') {
      allowedUpdates.emailRecipient = body.emailRecipient;
    }

    const updated = updateIncident(id, allowedUpdates);

    if (!updated) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, incident: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update incident', details: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = verifyAdminPassword(request);
  if (authError) {
    return authError;
  }

  const { id } = await params;
  const deleted = deleteIncident(id);

  if (!deleted) {
    return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, id });
}
