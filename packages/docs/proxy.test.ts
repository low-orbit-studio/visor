import { describe, it, expect, afterEach, vi } from "vitest";
import type { NextRequest } from "next/server";
import { proxy, config } from "./proxy";

/** Minimal NextRequest stand-in — proxy only reads the authorization header. */
function makeRequest(authHeader?: string): NextRequest {
  return {
    headers: new Headers(authHeader ? { authorization: authHeader } : {}),
  } as unknown as NextRequest;
}

/** Build a Basic auth header from a `user:password` credential. */
function basic(credential: string): string {
  return `Basic ${Buffer.from(credential, "utf8").toString("base64")}`;
}

const CREDENTIAL = "justin:s3cr3t";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("proxy — private theme gallery gate (VI-329)", () => {
  it("matches /themes/private and its sub-paths", () => {
    expect(config.matcher).toContain("/themes/private");
    expect(config.matcher).toContain("/themes/private/:path*");
  });

  it("bypasses the gate in local dev (no VERCEL)", () => {
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("THEMES_PRIVATE_BASIC_AUTH", "");
    const res = proxy(makeRequest());
    expect(res.status).not.toBe(401);
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("allows a request with the correct credential in a deployed env", () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("THEMES_PRIVATE_BASIC_AUTH", CREDENTIAL);
    const res = proxy(makeRequest(basic(CREDENTIAL)));
    expect(res.status).not.toBe(401);
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("denies a deployed request with no authorization header", () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("THEMES_PRIVATE_BASIC_AUTH", CREDENTIAL);
    const res = proxy(makeRequest());
    expect(res.status).toBe(401);
    expect(res.headers.get("www-authenticate")).toContain("Basic");
  });

  it("denies a deployed request with a wrong credential", () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("THEMES_PRIVATE_BASIC_AUTH", CREDENTIAL);
    const res = proxy(makeRequest(basic("justin:wrong")));
    expect(res.status).toBe(401);
  });

  it("fails closed when the secret is unconfigured in a deployed env", () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("THEMES_PRIVATE_BASIC_AUTH", "");
    const res = proxy(makeRequest(basic(CREDENTIAL)));
    expect(res.status).toBe(401);
  });

  it("denies a non-Basic authorization scheme", () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("THEMES_PRIVATE_BASIC_AUTH", CREDENTIAL);
    const res = proxy(makeRequest("Bearer sometoken"));
    expect(res.status).toBe(401);
  });
});
