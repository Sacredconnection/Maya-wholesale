import { wordpressPasswordResetUrl } from "@/lib/deployment-urls.mjs";

export function GET() {
  return Response.redirect(wordpressPasswordResetUrl(), 302);
}
