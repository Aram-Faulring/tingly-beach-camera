import { NextRequest, NextResponse } from 'next/server';
import { getIncidentById, updateIncident, getIncidents } from '@/lib/store';

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
  const { id } = await params;
  try {
    const body = await request.json();
    const updated = updateIncident(id, body);

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
  const { id } = await params;
  const incidents = getIncidents();
  const index = incidents.findIndex((i) => i.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
  }

  const [removed] = incidents.splice(index, 1);
  return NextResponse.json({ success: true, removed });
}
