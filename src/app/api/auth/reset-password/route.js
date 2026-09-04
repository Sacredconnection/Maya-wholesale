import { resetWordPressPassword } from "@/lib/wp-auth";
import {
  cleanText,
  isSameOrigin,
  readJsonBody,
  RequestBodyError,
  securityError,
} from "@/lib/request-security";

export async function POST(request) {
  if (!isSameOrigin(request)) return securityError("Cross-origin request rejected.", 403);

  let body;
  try {
    body = await readJsonBody(request, 8 * 1024);
  } catch (error) {
    if (error instanceof RequestBodyError) return securityError(error.message, error.status);
    return securityError("Invalid JSON body.", 400);
  }

  const login = cleanText(body.login, 160);
  const key = cleanText(body.key, 128);
  const password = typeof body.password === "string" ? body.password : "";

  if (!login || !key) return securityError("This password reset link is invalid.", 400);
  if (password.length < 12 || password.length > 256) {
    return securityError("Use a password with at least 12 characters.", 400);
  }

  try {
    await resetWordPressPassword({ login, key, password });
    return Response.json(
      { message: "Your password has been updated." },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("POST /api/auth/reset-password failed:", error);
    if (error?.status >= 400 && error?.status < 500) {
      return securityError(
        error.message || "This password reset link is invalid or has expired.",
        error.status
      );
    }
    return securityError("Your password could not be updated. Please try again.", 502);
  }
}
