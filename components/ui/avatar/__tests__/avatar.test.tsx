import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Avatar, AvatarFallback } from "../avatar"

describe("Avatar", () => {
  it("renders with fallback text", () => {
    render(
      <Avatar>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    )
    expect(screen.getByText("JD")).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    render(
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    )
    const fallback = screen.getByText("AB").closest("[data-slot='avatar']")
    expect(fallback).toBeInTheDocument()
  })

  it("applies data-size default", () => {
    render(
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    )
    const avatar = screen.getByText("AB").closest("[data-slot='avatar']")
    expect(avatar).toHaveAttribute("data-size", "default")
  })

  it("applies data-size sm", () => {
    render(
      <Avatar size="sm">
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    )
    const avatar = screen.getByText("AB").closest("[data-slot='avatar']")
    expect(avatar).toHaveAttribute("data-size", "sm")
  })

  it("applies data-size lg", () => {
    render(
      <Avatar size="lg">
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    )
    const avatar = screen.getByText("AB").closest("[data-slot='avatar']")
    expect(avatar).toHaveAttribute("data-size", "lg")
  })

  it("renders with custom className", () => {
    render(
      <Avatar className="custom-avatar">
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    )
    const avatar = screen.getByText("AB").closest("[data-slot='avatar']")
    expect(avatar).toHaveClass("custom-avatar")
  })

  it("forwards ref", () => {
    const ref = { current: null }
    render(
      <Avatar ref={ref}>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    )
    expect(ref.current).not.toBeNull()
  })
})

describe("AvatarFallback", () => {
  it("renders fallback content", () => {
    render(
      <Avatar>
        <AvatarFallback>XY</AvatarFallback>
      </Avatar>
    )
    expect(screen.getByText("XY")).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    render(
      <Avatar>
        <AvatarFallback>XY</AvatarFallback>
      </Avatar>
    )
    expect(screen.getByText("XY")).toHaveAttribute("data-slot", "avatar-fallback")
  })
})
