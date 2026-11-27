import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getIncidentById, updateIncident, getAdminConfig } from '@/lib/store';
import { verifyAdminPassword, escapeHtml } from '@/lib/auth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(request: NextRequest) {
  const authError = verifyAdminPassword(request);
  if (authError) {
    return authError;
  }

  const config = getAdminConfig();
  return NextResponse.json({
    emailRecipient: config.emailRecipient,
    emailAlertsEnabled: config.emailAlertsEnabled,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authError = verifyAdminPassword(request, body);
    if (authError) {
      return authError;
    }

    const { incidentId, recipient, customMessage } = body;

    const config = getAdminConfig();
    const incident = incidentId ? getIncidentById(incidentId) : null;
    const targetEmail = (typeof recipient === 'string' && recipient.trim()) ||
      config.emailRecipient ||
      process.env.ALERT_EMAIL_RECIPIENT ||
      '';
    const apiKey = process.env.RESEND_API_KEY;

    if (!targetEmail || !EMAIL_REGEX.test(targetEmail)) {
      return NextResponse.json(
        { success: false, error: 'A valid recipient email address is required.' },
        { status: 400 }
      );
    }

    if (!config.emailAlertsEnabled && !recipient) {
      return NextResponse.json({
        success: false,
        message: 'Automated email alerts are currently disabled in Admin settings.',
      });
    }

    const safeTitle = escapeHtml(incident?.title || 'Incident Notification');
    const safeLocation = escapeHtml(incident?.location || 'Tingley Beach - Albuquerque, NM');
    const safeSpecies = escapeHtml(incident?.species);
    const safeCustomMessage = escapeHtml(customMessage);
    const safeDescription = escapeHtml(incident?.description || 'Automated detection triggered by edge camera unit.');
    const safeIncidentType = incident?.type === 'dead_wildlife'
      ? 'Dead Wildlife / Carcass'
      : incident?.type === 'illegal_fishing'
      ? 'Illegal / Unauthorized Fishing'
      : 'Routine Snapshot';

    const subject = incident
      ? `🚨 [ALERT] Tingley Beach Sentinel: ${incident.title}`
      : '🚨 [TEST ALERT] Tingley Beach Camera Monitoring System';

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="background-color: #dc2626; color: white; padding: 12px 16px; border-radius: 8px; font-weight: bold; font-size: 16px; display: flex; align-items: center;">
          <span>🚨 TINGLEY BEACH CAMERA ALERT</span>
        </div>
        
        <h2 style="color: #0f172a; margin-top: 20px; margin-bottom: 8px;">${safeTitle}</h2>
        <p style="color: #64748b; font-size: 14px; margin-top: 0;">Captured at ${escapeHtml(new Date(incident?.timestamp || Date.now()).toLocaleString('en-US', { timeZone: 'America/Denver' }))} (MDT)</p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #ef4444; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
          <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.5;">
            <strong>Location:</strong> ${safeLocation}<br/>
            <strong>Incident Type:</strong> ${safeIncidentType}<br/>
            ${safeSpecies ? `<strong>Identified Species:</strong> ${safeSpecies}<br/>` : ''}
            <strong>AI Confidence:</strong> ${incident ? (incident.confidence * 100).toFixed(1) + '%' : '94.2%'}<br/>
            <strong>Trigger:</strong> ${incident?.trigger === 'pir_motion' ? 'PIR Motion Sensor Interrupt' : 'Hourly Scheduled Timer'}<br/>
            <strong>Physical Actuators:</strong> 2x Micro Servos Rotated 180° | Red Alert LED Active
          </p>
        </div>

        ${safeCustomMessage ? `<p style="color: #1e293b; background: #fef3c7; padding: 10px; border-radius: 6px;"><strong>Dispatcher Note:</strong> ${safeCustomMessage}</p>` : ''}

        <p style="color: #475569; font-size: 14px; line-height: 1.5;">${safeDescription}</p>
        
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
          <p>Tingley Beach Wildlife Sentinel • Raspberry Pi 4 Autonomous Unit • Albuquerque Open Space</p>
        </div>
      </div>
    `;

    if (apiKey) {
      const resend = new Resend(apiKey);
      const emailResult = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'Tingley Sentinel <alerts@sandiapreprobotics.me>',
        to: [targetEmail],
        subject,
        html: htmlContent,
      });

      if (incidentId) {
        updateIncident(incidentId, {
          emailAlertSent: true,
          emailRecipient: targetEmail,
        });
      }

      return NextResponse.json({
        success: true,
        provider: 'resend',
        deliveryId: emailResult.data?.id,
        recipient: targetEmail,
        subject,
      });
    }

    // Fallback mode if API key not injected
    if (incidentId) {
      updateIncident(incidentId, {
        emailAlertSent: true,
        emailRecipient: targetEmail,
      });
    }

    return NextResponse.json({
      success: true,
      provider: 'simulated',
      message: 'Email processed successfully',
      recipient: targetEmail,
      subject,
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to send alert email',
      details: String(error),
    }, { status: 500 });
  }
}
