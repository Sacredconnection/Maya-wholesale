import "server-only";

const DEFAULT_PORTAL_URL = "https://wholesale.mayaherbs.com";
const DEFAULT_REPLY_TO = "info@mayaherbs.com";

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const portalUrl = () => {
  try {
    const configured = new URL(process.env.PORTAL_URL || DEFAULT_PORTAL_URL);
    return configured.protocol === "https:" ? configured.origin : DEFAULT_PORTAL_URL;
  } catch {
    return DEFAULT_PORTAL_URL;
  }
};

const roleLabel = (role) => {
  const normalized = String(role || "").replace(/[_-]+/g, " ").trim();
  if (!normalized) return "Wholesale Partner";
  if (/[A-Z]/.test(normalized)) return normalized;
  return normalized.replace(/\b\w/g, (character) => character.toUpperCase());
};

const emailLayout = ({ eyebrow, title, intro, body, actionLabel, actionUrl }) => `
<!doctype html>
<html lang="en">
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#242f27;color:#e5e2e1;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#242f27;padding:32px 14px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#1a1a1a;border:1px solid #315b53;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:24px 30px;border-bottom:2px solid #989836;background:#151515;">
                <div style="font-size:22px;line-height:1;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Maya Herbs</div>
                <div style="margin-top:6px;font-size:10px;font-weight:700;color:#d8c58f;letter-spacing:2.2px;text-transform:uppercase;">Wholesale Partner Portal</div>
              </td>
            </tr>
            <tr>
              <td style="padding:38px 30px 34px;">
                <div style="font-size:11px;font-weight:700;color:#d8c58f;letter-spacing:1.8px;text-transform:uppercase;">${escapeHtml(eyebrow)}</div>
                <h1 style="margin:12px 0 18px;font-size:30px;line-height:1.15;color:#ffffff;">${escapeHtml(title)}</h1>
                <p style="margin:0 0 20px;font-size:16px;line-height:1.65;color:#d0d0cc;">${intro}</p>
                ${body}
                ${
                  actionLabel && actionUrl
                    ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin-top:30px;">
                        <tr>
                          <td style="border-radius:4px;background:#ec2300;">
                            <a href="${escapeHtml(actionUrl)}" style="display:inline-block;padding:15px 24px;color:#ffffff;text-decoration:none;font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">${escapeHtml(actionLabel)}</a>
                          </td>
                        </tr>
                      </table>`
                    : ""
                }
              </td>
            </tr>
            <tr>
              <td style="padding:22px 30px;background:#131313;border-top:1px solid #2d2d2d;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#929996;">
                  Questions? Reply to this email or contact
                  <a href="mailto:${DEFAULT_REPLY_TO}" style="color:#d8c58f;text-decoration:none;">${DEFAULT_REPLY_TO}</a>.
                </p>
                <p style="margin:12px 0 0;font-size:10px;color:#666d6a;">Maya Herbs Wholesale · Haarlem, the Netherlands</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

export function isTransactionalEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.TRANSACTIONAL_EMAIL_FROM);
}

async function sendTransactionalEmail({ to, subject, html, text, idempotencyKey }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.TRANSACTIONAL_EMAIL_FROM;
  if (!apiKey || !from) {
    throw new Error("Transactional email is not configured.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: process.env.TRANSACTIONAL_EMAIL_REPLY_TO || DEFAULT_REPLY_TO,
      subject,
      html,
      text,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result?.message || `Email provider responded with HTTP ${response.status}.`);
  }
  return result;
}

export async function sendApplicationReceivedEmail(customer) {
  const firstName = escapeHtml(customer.first_name || customer.username || "Partner");
  const subject = "We received your Maya Herbs wholesale application";
  return sendTransactionalEmail({
    to: customer.email,
    subject,
    idempotencyKey: `wholesale-application-received/${customer.id}`,
    html: emailLayout({
      eyebrow: "Application received",
      title: "Your application is under review",
      intro: `Hello ${firstName},`,
      body: `
        <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#b8bfbc;">
          Thank you for applying to the Maya Herbs wholesale program. Our team has received your business information and will review it shortly.
        </p>
        <div style="margin-top:24px;padding:18px 20px;background:#163731;border:1px solid #315b53;border-radius:6px;">
          <div style="font-size:11px;font-weight:800;color:#d8c58f;letter-spacing:1.2px;text-transform:uppercase;">What happens next</div>
          <p style="margin:9px 0 0;font-size:14px;line-height:1.65;color:#d0d7d4;">
            No action is required right now. You will receive another email as soon as your wholesale access is approved.
          </p>
        </div>`,
    }),
    text:
      `Hello ${customer.first_name || customer.username || "Partner"},\n\n` +
      "We received your Maya Herbs wholesale application. Our team is reviewing your business information. " +
      "No action is required right now; we will email you again as soon as your wholesale access is approved.\n\n" +
      `Questions? Contact ${DEFAULT_REPLY_TO}.`,
  });
}

export async function sendApplicationApprovedEmail(customer) {
  const firstName = escapeHtml(customer.first_name || customer.username || "Partner");
  const accessLevel = roleLabel(customer.role);
  const loginUrl = `${portalUrl()}/my-account?login=1&redirect=%2Fmy-account`;
  const subject = "Your Maya Herbs wholesale account is approved";
  return sendTransactionalEmail({
    to: customer.email,
    subject,
    idempotencyKey: `wholesale-application-approved/${customer.id}/${String(customer.role || "approved")}`,
    html: emailLayout({
      eyebrow: "Application approved",
      title: "Welcome to Maya Herbs Wholesale",
      intro: `Hello ${firstName},`,
      body: `
        <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#b8bfbc;">
          Your wholesale registration has been approved. You can now sign in to view the catalog, access your partner pricing, and place wholesale orders.
        </p>
        <div style="margin-top:24px;padding:18px 20px;background:#163731;border:1px solid #315b53;border-radius:6px;">
          <div style="font-size:11px;font-weight:800;color:#d8c58f;letter-spacing:1.2px;text-transform:uppercase;">Partner access level</div>
          <p style="margin:9px 0 0;font-size:18px;font-weight:800;color:#ffffff;">${escapeHtml(accessLevel)}</p>
        </div>`,
      actionLabel: "Access wholesale portal",
      actionUrl: loginUrl,
    }),
    text:
      `Hello ${customer.first_name || customer.username || "Partner"},\n\n` +
      `Your Maya Herbs wholesale registration has been approved. Your partner access level is ${accessLevel}.\n\n` +
      `Sign in: ${loginUrl}\n\nQuestions? Contact ${DEFAULT_REPLY_TO}.`,
  });
}
