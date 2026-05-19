import { createServer } from "net"

const RESERVED_PORTS = new Set<number>([3000])
const MAX_PORT_PROBES = 50
const DEFAULT_START_PORT = 4060

/**
 * Probe ports starting from `start`, skipping any in `RESERVED_PORTS` (e.g.
 * port 3000 per `feedback_no_port_3000`), until a free one is found.
 */
export async function findOpenPort(start: number = DEFAULT_START_PORT): Promise<number> {
  let port = start
  for (let i = 0; i < MAX_PORT_PROBES; i++) {
    if (RESERVED_PORTS.has(port)) {
      port++
      continue
    }
    const free = await tryPort(port)
    if (free) return port
    port++
  }
  throw new Error(
    `Could not find an open port between ${start} and ${start + MAX_PORT_PROBES} (port 3000 excluded)`
  )
}

function tryPort(port: number): Promise<boolean> {
  return new Promise((resolveProbe) => {
    const server = createServer()
    server.once("error", () => resolveProbe(false))
    server.once("listening", () => {
      server.close(() => resolveProbe(true))
    })
    server.listen(port, "127.0.0.1")
  })
}
