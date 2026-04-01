import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { TestimonialSection } from "../testimonial-section"
import { checkA11y } from "../../../test-utils/a11y"

const singleTestimonial = [
  {
    quote: "This design system has transformed how our team works.",
    author: "Jane Smith",
    role: "Design Lead",
    company: "Acme Corp",
    avatarSrc: "https://example.com/avatar.jpg",
  },
]

const multipleTestimonials = [
  {
    quote: "Incredible component library with great theming support.",
    author: "Alice Johnson",
    role: "Frontend Engineer",
    company: "TechCo",
  },
  {
    quote: "The token system makes it so easy to stay consistent.",
    author: "Bob Williams",
    role: "Product Designer",
  },
  {
    quote: "Best design system we have ever used for our projects.",
    author: "Carol Davis",
    company: "StartupXYZ",
    avatarSrc: "https://example.com/carol.jpg",
    avatarFallback: "CD",
  },
]

describe("TestimonialSection", () => {
  it("renders heading when provided", () => {
    render(
      <TestimonialSection
        heading="What our customers say"
        testimonials={singleTestimonial}
      />
    )
    expect(screen.getByText("What our customers say")).toBeInTheDocument()
  })

  it("does not render heading when not provided", () => {
    render(<TestimonialSection testimonials={singleTestimonial} />)
    expect(screen.queryByRole("heading")).not.toBeInTheDocument()
  })

  it("renders single testimonial as blockquote", () => {
    render(<TestimonialSection testimonials={singleTestimonial} />)
    const blockquote = screen.getByRole("blockquote")
    expect(blockquote).toBeInTheDocument()
    expect(blockquote).toHaveTextContent(
      "This design system has transformed how our team works."
    )
  })

  it("renders single testimonial without a grid class", () => {
    const { container } = render(
      <TestimonialSection testimonials={singleTestimonial} />
    )
    // Single layout should not contain multiple cards
    const cards = container.querySelectorAll("[data-slot='card']")
    expect(cards.length).toBe(0)
  })

  it("renders multiple testimonials in a grid of cards", () => {
    const { container } = render(
      <TestimonialSection testimonials={multipleTestimonials} />
    )
    const cards = container.querySelectorAll("[data-slot='card']")
    expect(cards.length).toBe(3)
  })

  it("renders all testimonial quotes for multiple testimonials", () => {
    render(<TestimonialSection testimonials={multipleTestimonials} />)
    expect(
      screen.getByText("Incredible component library with great theming support.")
    ).toBeInTheDocument()
    expect(
      screen.getByText("The token system makes it so easy to stay consistent.")
    ).toBeInTheDocument()
    expect(
      screen.getByText("Best design system we have ever used for our projects.")
    ).toBeInTheDocument()
  })

  it("renders avatar when avatarSrc is provided", () => {
    const { container } = render(
      <TestimonialSection testimonials={singleTestimonial} />
    )
    // Radix Avatar renders lazily; verify the avatar root is present in the DOM
    const avatar = container.querySelector("[data-slot='avatar']")
    expect(avatar).toBeInTheDocument()
  })

  it("renders avatar fallback from first letter of author name when no avatarFallback provided", () => {
    const testimonials = [
      {
        quote: "Great product.",
        author: "Frank Jones",
        avatarSrc: "https://example.com/frank.jpg",
      },
    ]
    render(<TestimonialSection testimonials={testimonials} />)
    // AvatarFallback should have the first letter of the author
    const fallbacks = screen.getAllByText("F")
    expect(fallbacks.length).toBeGreaterThanOrEqual(1)
  })

  it("renders custom avatarFallback when provided", () => {
    render(<TestimonialSection testimonials={multipleTestimonials} />)
    expect(screen.getByText("CD")).toBeInTheDocument()
  })

  it("renders author attribution with role and company", () => {
    render(<TestimonialSection testimonials={singleTestimonial} />)
    expect(screen.getByText("Jane Smith")).toBeInTheDocument()
    expect(screen.getByText("Design Lead, Acme Corp")).toBeInTheDocument()
  })

  it("renders attribution with only role when company is absent", () => {
    const testimonials = [
      {
        quote: "Love it.",
        author: "Bob Williams",
        role: "Product Designer",
      },
    ]
    render(<TestimonialSection testimonials={testimonials} />)
    expect(screen.getByText("Product Designer")).toBeInTheDocument()
  })

  it("renders attribution with only company when role is absent", () => {
    const testimonials = [
      {
        quote: "Amazing.",
        author: "Carol Davis",
        company: "StartupXYZ",
      },
    ]
    render(<TestimonialSection testimonials={testimonials} />)
    expect(screen.getByText("StartupXYZ")).toBeInTheDocument()
  })

  it("uses semantic blockquote element for quotes", () => {
    render(<TestimonialSection testimonials={singleTestimonial} />)
    expect(screen.getByRole("blockquote")).toBeInTheDocument()
  })

  it("uses semantic cite element for attribution", () => {
    const { container } = render(
      <TestimonialSection testimonials={singleTestimonial} />
    )
    const cite = container.querySelector("cite")
    expect(cite).toBeInTheDocument()
  })

  it("applies custom className to root section", () => {
    const { container } = render(
      <TestimonialSection
        testimonials={singleTestimonial}
        className="custom-section"
      />
    )
    const section = container.querySelector("section")
    expect(section).toHaveClass("custom-section")
  })
})

describe("TestimonialSection accessibility", () => {
  it("has no WCAG 2.1 AA violations with single testimonial", async () => {
    const { container } = render(
      <TestimonialSection
        heading="Customer Stories"
        testimonials={singleTestimonial}
      />
    )
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations with multiple testimonials", async () => {
    const { container } = render(
      <TestimonialSection
        heading="What People Say"
        testimonials={multipleTestimonials}
      />
    )
    await checkA11y(container)
  })
})
