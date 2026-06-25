import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Interim edge gate for the private theme gallery (VI-329).
 *
 * VI-320 shipped `/themes/private` and it is live in production WITHOUT an
 * access gate, publicly exposing private client/internal themes. The durable
 * fix is Cloudflare Access at the DNS edge (ticket decision D1, zero app code).
 * Until that is configured, this proxy is a stopgap HTTP Basic Auth gate that
 * closes the exposure.
 *
 * Configure `THEMES_PRIVATE_BASIC_AUTH` (format `user:password`) in the
 * visor.design Vercel project for Production + Preview. Remove this file and
 * the env var once Cloudflare Access is live and verified.
 *
 * Runs on the Node.js runtime — Next.js 16 proxy does not support the edge
 * runtime, so `Buffer` is available for base64 decoding.
 */

const REALM = "Visor Private Themes";

function unauthorized(): NextResponse {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"`,
    },
  });
}

export function proxy(request: NextRequest): NextResponse {
  // Only gate deployed environments. Local `next dev` (no VERCEL) is left open
  // so the gallery stays workable without configuring a secret.
  if (!process.env.VERCEL) {
    return NextResponse.next();
  }

  const expected = process.env.THEMES_PRIVATE_BASIC_AUTH;
  const header = request.headers.get("authorization");

  // Fail closed: an unconfigured secret in a deployed env denies access rather
  // than leaking the gallery.
  if (!expected || !header) {
    return unauthorized();
  }

  const [scheme, encoded] = header.split(" ");
  if (scheme !== "Basic" || !encoded) {
    return unauthorized();
  }

  // Compare the full decoded `user:password` against the configured value so a
  // colon inside the password is preserved.
  const decoded = Buffer.from(encoded, "base64").toString("utf8");
  if (decoded !== expected) {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/themes/private", "/themes/private/:path*"],
};
