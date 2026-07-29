import { isSameOrigin, securityError } from "@/lib/request-security";
import { deleteSession } from "@/lib/session";

export async function POST(request) {
  if (!isSameOrigin(request)) return securityError("Cross-origin request rejected.", 403);
  await deleteSession();
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
