import * as React from "react"
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useAutosave, type UseAutosaveOptions } from "../use-autosave"

/** A write whose responses the test settles by hand, in any order. */
function deferredWrite() {
  const calls: Array<{ value: string; leaving: boolean; resolve: () => void; reject: (e: unknown) => void }> = []
  const write = vi.fn((value: string, { leaving }: { leaving: boolean }) =>
    new Promise<void>((resolve, reject) => {
      calls.push({ value, leaving, resolve, reject })
    })
  )
  return { write, calls }
}

function setup(options: UseAutosaveOptions<string> = {}, write = vi.fn()) {
  const hook = renderHook(({ value }) => useAutosave(value, write, options), { initialProps: { value: "Night Shift" } })
  return { ...hook, write }
}

/** Let resolved write promises settle. */
const settle = () => act(async () => {})

describe("useAutosave (VI-657)", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe("debounce", () => {
    it("typing fires write once, after the delay, with no click", async () => {
      const write = vi.fn()
      function Editor() {
        const [name, setName] = React.useState("")
        const { status } = useAutosave(name, write, { delay: 600 })
        return (
          <>
            <input aria-label="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <output>{status}</output>
          </>
        )
      }
      render(<Editor />)
      // One change per keystroke, 100ms apart: faster than the debounce.
      for (const typed of ["T", "Te", "Tec", "Tech", "Techn", "Techno"]) {
        act(() => {
          vi.advanceTimersByTime(100)
        })
        fireEvent.change(screen.getByLabelText("Name"), { target: { value: typed } })
      }
      expect(write).not.toHaveBeenCalled()
      expect(screen.getByText("unsaved")).toBeInTheDocument()
      act(() => {
        vi.advanceTimersByTime(599)
      })
      expect(write).not.toHaveBeenCalled()
      act(() => {
        vi.advanceTimersByTime(1)
      })
      expect(write).toHaveBeenCalledTimes(1)
      expect(write).toHaveBeenCalledWith("Techno", { leaving: false })
      await settle()
      expect(screen.getByText("saved")).toBeInTheDocument()
    })

    it("each change restarts the delay; only the last value is written", () => {
      const { rerender, write } = setup()
      rerender({ value: "Night" })
      act(() => {
        vi.advanceTimersByTime(400)
      })
      rerender({ value: "Night Owl" })
      act(() => {
        vi.advanceTimersByTime(400)
      })
      expect(write).not.toHaveBeenCalled()
      act(() => {
        vi.advanceTimersByTime(200)
      })
      expect(write).toHaveBeenCalledTimes(1)
      expect(write).toHaveBeenCalledWith("Night Owl", { leaving: false })
    })

    it("defaults to 600ms", () => {
      const { rerender, write } = setup()
      rerender({ value: "Night Owl" })
      act(() => {
        vi.advanceTimersByTime(599)
      })
      expect(write).not.toHaveBeenCalled()
      act(() => {
        vi.advanceTimersByTime(1)
      })
      expect(write).toHaveBeenCalledTimes(1)
    })

    it("the first value counts as saved and is not written", () => {
      const { result, write } = setup()
      act(() => {
        vi.advanceTimersByTime(5000)
      })
      expect(write).not.toHaveBeenCalled()
      expect(result.current.status).toBe("saved")
    })

    it("changing back to the saved value cancels the write", () => {
      const { result, rerender, write } = setup()
      rerender({ value: "Night Owl" })
      expect(result.current.status).toBe("unsaved")
      rerender({ value: "Night Shift" })
      expect(result.current.status).toBe("saved")
      act(() => {
        vi.advanceTimersByTime(5000)
      })
      expect(write).not.toHaveBeenCalled()
    })
  })

  describe("status", () => {
    it("saved → unsaved → saving → saved", async () => {
      const { write, calls } = deferredWrite()
      const { result, rerender } = setup({}, write)
      expect(result.current.status).toBe("saved")
      rerender({ value: "Night Owl" })
      expect(result.current.status).toBe("unsaved")
      act(() => {
        vi.advanceTimersByTime(600)
      })
      expect(result.current.status).toBe("saving")
      calls[0].resolve()
      await settle()
      expect(result.current.status).toBe("saved")
    })

    it("a failed write is refused with the error; retry writes again", async () => {
      const { write, calls } = deferredWrite()
      const { result, rerender } = setup({}, write)
      rerender({ value: "Night Owl" })
      act(() => {
        vi.advanceTimersByTime(600)
      })
      const error = new Error("offline")
      calls[0].reject(error)
      await settle()
      expect(result.current).toMatchObject({ status: "refused", reason: "failed", error })
      act(() => result.current.retry())
      expect(write).toHaveBeenCalledTimes(2)
      expect(calls[1].value).toBe("Night Owl")
      expect(result.current.status).toBe("saving")
      calls[1].resolve()
      await settle()
      expect(result.current).toMatchObject({ status: "saved", reason: null })
    })

    it("a write that throws synchronously is refused too", async () => {
      const write = vi.fn(() => {
        throw new Error("boom")
      })
      const { result, rerender } = setup({}, write)
      rerender({ value: "Night Owl" })
      act(() => {
        vi.advanceTimersByTime(600)
      })
      expect(result.current).toMatchObject({ status: "refused", reason: "failed" })
    })

    it("flush() writes a pending change without waiting", () => {
      const { result, rerender, write } = setup()
      rerender({ value: "Night Owl" })
      act(() => result.current.flush())
      expect(write).toHaveBeenCalledWith("Night Owl", { leaving: false })
    })
  })

  describe("flushes on leave", () => {
    it("a pending write is flushed on pagehide", () => {
      const { rerender, write } = setup()
      rerender({ value: "Night Owl" })
      act(() => {
        window.dispatchEvent(new Event("pagehide"))
      })
      expect(write).toHaveBeenCalledTimes(1)
      expect(write).toHaveBeenCalledWith("Night Owl", { leaving: true })
    })

    it("a pending write is flushed when the tab is hidden", () => {
      const { rerender, write } = setup()
      rerender({ value: "Night Owl" })
      const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden")
      act(() => {
        document.dispatchEvent(new Event("visibilitychange"))
      })
      visibility.mockRestore()
      expect(write).toHaveBeenCalledWith("Night Owl", { leaving: true })
    })

    it("a pending write is flushed on unmount", () => {
      const { rerender, unmount, write } = setup()
      rerender({ value: "Night Owl" })
      unmount()
      expect(write).toHaveBeenCalledTimes(1)
      expect(write).toHaveBeenCalledWith("Night Owl", { leaving: false })
    })

    it("a flushed write is not written again when the timer would have fired", () => {
      const { rerender, write } = setup()
      rerender({ value: "Night Owl" })
      act(() => {
        window.dispatchEvent(new Event("pagehide"))
      })
      act(() => {
        vi.advanceTimersByTime(5000)
      })
      expect(write).toHaveBeenCalledTimes(1)
    })

    it("mutation control: with nothing pending, leaving writes nothing", () => {
      const { unmount, write } = setup()
      act(() => {
        window.dispatchEvent(new Event("pagehide"))
      })
      unmount()
      expect(write).not.toHaveBeenCalled()
    })

    it("a change waiting behind a write in flight is flushed on leave too", () => {
      const { write, calls } = deferredWrite()
      const { rerender } = setup({}, write)
      rerender({ value: "A" })
      act(() => {
        vi.advanceTimersByTime(600)
      })
      rerender({ value: "B" })
      act(() => {
        vi.advanceTimersByTime(600)
      })
      expect(calls.map((c) => c.value)).toEqual(["A"]) // B waits for A
      act(() => {
        window.dispatchEvent(new Event("pagehide"))
      })
      expect(calls.map((c) => c.value)).toEqual(["A", "B"])
      expect(calls[1].leaving).toBe(true)
    })
  })

  describe("beforeunload", () => {
    const unload = () => {
      const event = new Event("beforeunload", { cancelable: true })
      act(() => {
        window.dispatchEvent(event)
      })
      return event
    }

    it("does not warn when everything is saved", () => {
      setup()
      expect(unload().defaultPrevented).toBe(false)
    })

    it("warns while a write is still in flight", () => {
      const { write } = deferredWrite()
      const { rerender } = setup({}, write)
      rerender({ value: "Night Owl" })
      act(() => {
        vi.advanceTimersByTime(600)
      })
      expect(unload().defaultPrevented).toBe(true)
    })

    it("does not warn once the write has landed", async () => {
      const { write, calls } = deferredWrite()
      const { rerender } = setup({}, write)
      rerender({ value: "Night Owl" })
      act(() => {
        vi.advanceTimersByTime(600)
      })
      calls[0].resolve()
      await settle()
      expect(unload().defaultPrevented).toBe(false)
    })

    it("starts a pending write, then warns because it is in flight", () => {
      const { write } = deferredWrite()
      const { rerender } = setup({}, write)
      rerender({ value: "Night Owl" })
      expect(unload().defaultPrevented).toBe(true)
      expect(write).toHaveBeenCalledWith("Night Owl", { leaving: true })
    })
  })

  describe("validation belongs to the caller", () => {
    const validate = (value: string) => value.trim().length > 0

    it("a refused value is never passed to write", () => {
      const { result, rerender, unmount, write } = setup({ validate })
      rerender({ value: "   " })
      act(() => {
        vi.advanceTimersByTime(600)
      })
      expect(result.current).toMatchObject({ status: "refused", reason: "invalid" })
      act(() => {
        window.dispatchEvent(new Event("pagehide"))
      })
      act(() => result.current.retry())
      act(() => result.current.flush())
      unmount()
      expect(write).not.toHaveBeenCalled()
    })

    it("mutation control: a value validate accepts is written", () => {
      const { rerender, write } = setup({ validate })
      rerender({ value: "Night Owl" })
      act(() => {
        vi.advanceTimersByTime(600)
      })
      expect(write).toHaveBeenCalledWith("Night Owl", { leaving: false })
    })

    it("fixing the value leaves refused and writes it", () => {
      const { result, rerender, write } = setup({ validate })
      rerender({ value: "" })
      act(() => {
        vi.advanceTimersByTime(600)
      })
      expect(result.current.status).toBe("refused")
      rerender({ value: "Night Owl" })
      expect(result.current.status).toBe("unsaved")
      act(() => {
        vi.advanceTimersByTime(600)
      })
      expect(write).toHaveBeenCalledWith("Night Owl", { leaving: false })
    })
  })

  describe("out-of-order responses: the newest value wins", () => {
    it("a change made while a write is in flight waits, then only the newest value is written", async () => {
      const { write, calls } = deferredWrite()
      const { result, rerender } = setup({}, write)
      rerender({ value: "A" })
      act(() => {
        vi.advanceTimersByTime(600)
      })
      rerender({ value: "B" })
      act(() => {
        vi.advanceTimersByTime(600)
      })
      rerender({ value: "C" })
      act(() => {
        vi.advanceTimersByTime(600)
      })
      expect(calls.map((c) => c.value)).toEqual(["A"])
      expect(result.current.status).toBe("unsaved")
      calls[0].resolve()
      await settle()
      expect(calls.map((c) => c.value)).toEqual(["A", "C"])
      expect(result.current.status).toBe("saving")
      calls[1].resolve()
      await settle()
      expect(result.current.status).toBe("saved")
    })

    it("a stale response never overwrites a newer state", async () => {
      const { write, calls } = deferredWrite()
      const { result, rerender } = setup({}, write)
      rerender({ value: "A" })
      act(() => {
        vi.advanceTimersByTime(600)
      })
      // Leaving writes B at once, alongside A.
      rerender({ value: "B" })
      act(() => {
        window.dispatchEvent(new Event("pagehide"))
      })
      expect(calls.map((c) => c.value)).toEqual(["A", "B"])
      calls[1].resolve() // B lands first
      await settle()
      expect(result.current.status).toBe("saved")
      calls[0].reject(new Error("A timed out")) // A's late failure
      await settle()
      expect(result.current).toMatchObject({ status: "saved", reason: null })
    })

    it("a stale success does not mark a newer failed write saved", async () => {
      const { write, calls } = deferredWrite()
      const { result, rerender } = setup({}, write)
      rerender({ value: "A" })
      act(() => {
        vi.advanceTimersByTime(600)
      })
      rerender({ value: "B" })
      act(() => {
        window.dispatchEvent(new Event("pagehide"))
      })
      calls[1].reject(new Error("B failed"))
      await settle()
      calls[0].resolve() // A's late success
      await settle()
      expect(result.current).toMatchObject({ status: "refused", reason: "failed" })
    })

    it("mutation control: when the failing write is the newest, it is refused", async () => {
      const { write, calls } = deferredWrite()
      const { result, rerender } = setup({}, write)
      rerender({ value: "A" })
      act(() => {
        vi.advanceTimersByTime(600)
      })
      calls[0].reject(new Error("A timed out"))
      await settle()
      expect(result.current.status).toBe("refused")
    })
  })

  it("isEqual decides what counts as a change", () => {
    const write = vi.fn()
    const { rerender } = renderHook(({ value }) => useAutosave(value, write, { isEqual: (a, b) => a.name === b.name }), {
      initialProps: { value: { name: "Night Shift" } },
    })
    rerender({ value: { name: "Night Shift" } }) // a new object, same content
    act(() => {
      vi.advanceTimersByTime(600)
    })
    expect(write).not.toHaveBeenCalled()
    rerender({ value: { name: "Night Owl" } })
    act(() => {
      vi.advanceTimersByTime(600)
    })
    expect(write).toHaveBeenCalledTimes(1)
  })

  it("does not warn about state updates after unmount while a write is in flight", async () => {
    const { write, calls } = deferredWrite()
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    const { rerender, unmount } = setup({}, write)
    rerender({ value: "Night Owl" })
    act(() => {
      vi.advanceTimersByTime(600)
    })
    unmount()
    calls[0].resolve()
    await settle()
    expect(error).not.toHaveBeenCalled()
    error.mockRestore()
  })
})

