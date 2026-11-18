import nextConfig from "../next.config.mjs";

describe("Security Headers", () => {
  it("never contains unsafe-eval in CSP", async () => {
    expect(nextConfig.headers).toBeDefined();
    const headers = nextConfig.headers ? await nextConfig.headers() : [];
    const globalHeaderRule = headers.find((h) => h.source === "/:path*");
    expect(globalHeaderRule).toBeDefined();

    const csp = globalHeaderRule?.headers.find(
      (item) => item.key === "Content-Security-Policy",
    )?.value;

    expect(csp).toBeDefined();
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("connect-src 'self'");
  });
});
