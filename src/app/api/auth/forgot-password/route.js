import { requestWordPressPasswordReset } from "@/lib/wp-auth";
import { wordpressPasswordResetUrl } from "@/lib/deployment-urls.mjs";
import {
  cleanText,
  isSameOrigin,
  isValidEmail,
  readJsonBody,
  RequestBodyError,
  securityError,
} from "@/lib/request-security";

export function GET() {
  return Response.redirect(wordpressPasswordResetUrl(), 302);
}

export async function POST(request) {
  if (!isSameOrigin(request)) return securityError("Cross-origin request rejected.", 403);

  let body;
  try {
    body = await readJsonBody(request, 4 * 1024);
  } catch (error) {
    if (error instanceof RequestBodyError) return securityError(error.message, error.status);
    return securityError("Invalid JSON body.", 400);
  }

  const email = cleanText(body.email, 254).toLowerCase();
  if (!isValidEmail(email)) return securityError("Enter a valid email address.", 400);

  const forwardedFor = request.headers.get("x-forwarded-for") || "";
  const clientIp = cleanText(forwardedFor.split(",")[0], 64);

  try {
    await requestWordPressPasswordReset(email, clientIp);
  } catch (error) {
    console.error("POST /api/auth/forgot-password failed:", error);
    if (error?.status === 429) {
      return securityError("Too many requests. Please wait before trying again.", 429);
    }
    return securityError("Password recovery is temporarily unavailable. Please try again.", 502);
  }

  return Response.json(
    { message: "If an account matches that email, a reset link is on its way." },
    { headers: { "Cache-Control": "no-store" } }
  );
}
