import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import {
  PasswordManagersProvider,
  usePasswordManagersContext,
  usePasswordManagersValue,
} from "../password-managers-context"

function ContextProbe() {
  const value = usePasswordManagersContext()
  return <span data-testid="probe">{value ?? "undefined"}</span>
}

function ResolverProbe({ prop }: { prop?: "ignore" | "allow" }) {
  const resolved = usePasswordManagersValue(prop)
  return <span data-testid="resolved">{resolved}</span>
}

describe("PasswordManagersProvider", () => {
  it("provides value to descendants", () => {
    render(
      <PasswordManagersProvider value="allow">
        <ContextProbe />
      </PasswordManagersProvider>
    )
    expect(screen.getByTestId("probe")).toHaveTextContent("allow")
  })

  it("nesting allows inner provider to override outer", () => {
    render(
      <PasswordManagersProvider value="ignore">
        <PasswordManagersProvider value="allow">
          <ContextProbe />
        </PasswordManagersProvider>
      </PasswordManagersProvider>
    )
    expect(screen.getByTestId("probe")).toHaveTextContent("allow")
  })
})

describe("usePasswordManagersContext", () => {
  it("returns undefined outside any provider", () => {
    render(<ContextProbe />)
    expect(screen.getByTestId("probe")).toHaveTextContent("undefined")
  })
})

describe("usePasswordManagersValue", () => {
  it("falls back to 'ignore' when neither prop nor context is set", () => {
    render(<ResolverProbe />)
    expect(screen.getByTestId("resolved")).toHaveTextContent("ignore")
  })

  it("returns context value when no prop is set", () => {
    render(
      <PasswordManagersProvider value="allow">
        <ResolverProbe />
      </PasswordManagersProvider>
    )
    expect(screen.getByTestId("resolved")).toHaveTextContent("allow")
  })

  it("explicit prop wins over context value (allow over ignore)", () => {
    render(
      <PasswordManagersProvider value="ignore">
        <ResolverProbe prop="allow" />
      </PasswordManagersProvider>
    )
    expect(screen.getByTestId("resolved")).toHaveTextContent("allow")
  })

  it("explicit prop wins over context value (ignore over allow)", () => {
    render(
      <PasswordManagersProvider value="allow">
        <ResolverProbe prop="ignore" />
      </PasswordManagersProvider>
    )
    expect(screen.getByTestId("resolved")).toHaveTextContent("ignore")
  })

  it("explicit prop wins over default when no provider is present", () => {
    render(<ResolverProbe prop="allow" />)
    expect(screen.getByTestId("resolved")).toHaveTextContent("allow")
  })
})
