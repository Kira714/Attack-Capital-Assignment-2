/**
 * Email Integration via Resend API
 * Send and receive emails
 */
const resendApiKey = process.env.RESEND_API_KEY;

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  body: string;
  from?: string;
  replyTo?: string;
}

export interface EmailResponse {
  messageId: string;
  status: 'sent' | 'failed';
  sentAt: Date;
  error?: string;
}

/**
 * Send email via Resend
 */
export async function sendEmail(params: SendEmailParams): Promise<EmailResponse> {
  if (!resendApiKey) {
    throw new Error('Resend API key not configured');
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: params.from || 'onboarding@resend.dev',
        to: Array.isArray(params.to) ? params.to : [params.to],
        subject: params.subject,
        html: params.body,
        reply_to: params.replyTo,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send email');
    }

    return {
      messageId: data.id,
      status: 'sent' as const,
      sentAt: new Date(),
    };
  } catch (error: any) {
    console.error('Error sending email:', error);
    return {
      messageId: '',
      status: 'failed' as const,
      sentAt: new Date(),
      error: error.message || 'Failed to send email',
    };
  }
}

/**
 * Check if Resend is configured
 */
export function isEmailConfigured(): boolean {
  return !!resendApiKey;
}

