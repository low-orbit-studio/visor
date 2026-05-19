import { describe, expect, it } from "vitest"
import { createServer } from "net"
import { findOpenPort } from "../commands/sandbox/ports.js"

describe("findOpenPort", () => {
  it("returns a port outside the reserved set", async () => {
    const port = await findOpenPort()
    expect(port).not.toBe(3000)
    expect(port).toBeGreaterThanOrEqual(4060)
  })

  it("skips a port that is in use", async () => {
    const blocker = createServer()
    await new Promise<void>((resolveListen) => blocker.listen(4060, "127.0.0.1", resolveListen))
    try {
      const port = await findOpenPort(4060)
      expect(port).not.toBe(4060)
      expect(port).toBeGreaterThan(4060)
    } finally {
      await new Promise<void>((resolveClose) => blocker.close(() => resolveClose()))
    }
  })
})
