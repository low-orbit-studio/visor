import { describe, expect, it, vi } from "vitest"
import { render } from "@testing-library/react"
import { RichText, dashes } from "../rich-text"

const ALLOWED = new Set(["STRONG", "EM", "B", "I", "A", "P", "UL", "LI", "SPAN", "BR"])
const SAFE = /^(https?:|mailto:)/i

describe("RichText markup (styled)", () => {
  it.each([
    ["*b*", "strong", "b"],
    ["_i_", "em", "i"],
    ["[l](https://x)", "a", "l"],
  ])("%s renders <%s>", (text, tag, content) => {
    const { container } = render(<RichText text={text} />)
    const el = container.querySelector(tag)
    expect(el).not.toBeNull()
    expect(el!.textContent).toBe(content)
  })

  it("a styled link carries the link class, opens in a new tab and sends no referrer", () => {
    const { container } = render(<RichText text="[l](https://x)" />)
    const a = container.querySelector("a")!
    expect(a.getAttribute("href")).toBe("https://x")
    expect(a.getAttribute("target")).toBe("_blank")
    expect(a.getAttribute("rel")).toBe("noreferrer")
    expect(a.className).toMatch(/link/)
  })

  it("a blank line makes two block-span paragraphs", () => {
    const { container } = render(<RichText text={"a\n\nb"} />)
    const paras = container.querySelectorAll(":scope > span")
    expect(paras).toHaveLength(2)
    expect([...paras].map((p) => p.textContent)).toEqual(["a", "b"])
    expect(paras[0]!.className).toMatch(/para/)
  })

  it('"- " lines make a role=list of role=listitem spans', () => {
    const { container } = render(<RichText text={"- a\n- b"} />)
    const list = container.querySelector('[role="list"]')!
    expect(list.tagName).toBe("SPAN")
    const items = list.querySelectorAll('[role="listitem"]')
    expect([...items].map((i) => i.textContent)).toEqual(["a", "b"])
  })

  it("a single newline is a <br>", () => {
    const { container } = render(<RichText text={"a\nb"} />)
    expect(container.querySelectorAll("br")).toHaveLength(1)
    expect(container.textContent).toBe("ab")
  })
})

describe("RichText markup (elements)", () => {
  it.each([
    ["*b*", "b"],
    ["_i_", "i"],
    ["[l](https://x)", "a"],
  ])("%s renders a bare <%s> with no class", (text, tag) => {
    const { container } = render(<RichText text={text} elements />)
    const el = container.querySelector(tag)!
    expect(el).not.toBeNull()
    expect(el.getAttribute("class")).toBeNull()
  })

  it("paragraphs are <p> and lists are <ul>/<li>, all without classes", () => {
    const { container } = render(<RichText text={"a\n\nb\n\n- c\n- d"} elements />)
    expect([...container.querySelectorAll("p")].map((p) => p.textContent)).toEqual(["a", "b"])
    expect([...container.querySelectorAll("ul > li")].map((li) => li.textContent)).toEqual(["c", "d"])
    expect(container.querySelector("[class]")).toBeNull()
  })
})

describe("RichText renders nothing outside the allowed set", () => {
  it("a kitchen-sink string produces only allowed tags", () => {
    const text = [
      "Hello *bold* and _italic_ and a [link](https://example.com) – and _a [nested](mailto:a@b.c) link_.",
      "Line two\nline three",
      "- one\n- *two*\n- [three](http://x.example)",
      '<script>alert(1)</script> <img src=x onerror=alert(1)> <iframe src="x"></iframe> <style>*{}</style>',
    ].join("\n\n")
    for (const elements of [false, true]) {
      const { container, unmount } = render(<RichText text={text} elements={elements} dashes />)
      for (const el of container.querySelectorAll("*")) expect(ALLOWED.has(el.tagName)).toBe(true)
      unmount()
    }
  })
})

describe("RichText hostile links", () => {
  it.each([
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "data:text/html,<script>",
    "vbscript:x",
    "file:///etc/passwd",
    "//evil.example",
    "/relative",
    "\u0001javascript:x",
    "%6Aavascript:x",
  ])("[x](%s) renders no <a>, only the label as text", (href) => {
    for (const elements of [false, true]) {
      const { container, unmount } = render(<RichText text={`[x](${href})`} elements={elements} />)
      expect(container.querySelector("a")).toBeNull()
      // A url stops at its first ")", so "alert(1))" leaves one ")" as text after the label.
      expect(container.textContent).toMatch(/^x\)?$/)
      unmount()
    }
  })

  it("a quote in the href stays inside the attribute and adds no handler", () => {
    const { container } = render(<RichText text={'[x](https://a"onmouseover="x)'} />)
    const links = container.querySelectorAll("a")
    expect(links).toHaveLength(1)
    expect(links[0]!.getAttribute("href")).toBe('https://a"onmouseover="x')
    expect(links[0]!.hasAttribute("onmouseover")).toBe(false)
  })

  it("every rendered link is http, https or mailto with rel=noreferrer", () => {
    const text =
      "[a](https://a.example) [b](http://b.example) [c](mailto:c@d.e) [d](javascript:x) [e](ftp://e) [f](HTTPS://F.EXAMPLE)"
    const { container } = render(<RichText text={text} />)
    const links = [...container.querySelectorAll("a")]
    expect(links.map((a) => a.textContent)).toEqual(["a", "b", "c", "f"])
    for (const a of links) {
      expect(a.getAttribute("href")).toMatch(SAFE)
      expect(a.getAttribute("rel")).toBe("noreferrer")
    }
  })
})

describe("RichText raw HTML", () => {
  it.each([
    "<script>alert(1)</script>",
    "<img src=x onerror=alert(1)>",
    '<a href="javascript:x">y</a>',
    "<b>x</b>",
  ])("%s creates no element and shows as literal text", (html) => {
    for (const elements of [false, true]) {
      const { container, unmount } = render(<RichText text={html} elements={elements} />)
      expect(container.querySelector("script,img,iframe,style,a,b")).toBeNull()
      expect(container.querySelector("[onerror]")).toBeNull()
      expect(container.textContent).toBe(html)
      unmount()
    }
  })
})

describe("RichText on hostile length", () => {
  it("50,000 characters of [, *, _ and ]( render without hanging", () => {
    const pieces = ["[", "*", "_", "]("]
    let text = ""
    for (let i = 0; text.length < 50_000; i++) text += pieces[i % pieces.length]
    const started = performance.now()
    const { container } = render(<RichText text={text} />)
    expect(container.textContent!.length).toBeGreaterThan(0)
    expect(performance.now() - started).toBeLessThan(5_000)
  })

  // "[" and "[a](" repeated made the kit's regex backtrack quadratically (about 2s at 50,000).
  it.each(["[", "*", "_", "](", "[a](", "[]"])("50,000 of %s repeated render without hanging", (piece) => {
    const text = piece.repeat(Math.ceil(50_000 / piece.length))
    const started = performance.now()
    const { container } = render(<RichText text={text} />)
    expect(performance.now() - started).toBeLessThan(1_000)
    expect(container.querySelector("a")).toBeNull()
    expect(container.textContent!.length).toBeGreaterThan(0)
  })

  it("a label may not hold a bracket, so the inner [link] is the link", () => {
    const { container } = render(<RichText text="[a [b](https://x.example)" />)
    expect(container.querySelector("a")!.textContent).toBe("b")
    expect(container.textContent).toBe("[a b")
  })
})

describe("RichText nesting", () => {
  it("one paragraph inside a <p> adds no block element and no nesting warning", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    const { container } = render(
      <p>
        <RichText text="Hello *there*, see [the guide](https://x.example)." />
      </p>
    )
    const p = container.querySelector("p")!
    expect(p.querySelector("p,div,ul,li,span")).toBeNull()
    expect(error).not.toHaveBeenCalled()
    error.mockRestore()
  })

  it("paragraphs and lists inside a <p> are spans, so React raises no nesting warning", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    const { container } = render(
      <p>
        <RichText text={"One\n\n- a\n- b"} />
      </p>
    )
    expect(container.querySelector("p p, p ul, p div")).toBeNull()
    expect(error).not.toHaveBeenCalled()
    error.mockRestore()
  })

  it("a link inside italics stays a link", () => {
    const { container } = render(<RichText text="_see [the guide](https://x.example)_" />)
    const a = container.querySelector("em > a")!
    expect(a).not.toBeNull()
    expect(a.getAttribute("href")).toBe("https://x.example")
  })
})

describe("dashes", () => {
  it("off by default: no en-dash span", () => {
    const { container } = render(<RichText text="Fri – Sun" />)
    expect(container.querySelector('[class*="nd"]')).toBeNull()
    expect(container.textContent).toBe("Fri – Sun")
  })

  it("on: each en dash is wrapped once", () => {
    const { container } = render(<RichText text="Fri – Sun, 9–5 and *Mon – Tue*" dashes />)
    const spans = container.querySelectorAll('[class*="nd"]')
    expect(spans).toHaveLength(3)
    for (const s of spans) {
      expect(s.textContent).toBe("–")
      expect(s.querySelector("span")).toBeNull()
    }
    expect(container.textContent).toBe("Fri – Sun, 9–5 and Mon – Tue")
  })

  it('dashes("a–b") returns two text runs with one wrapped dash', () => {
    const { container } = render(<>{dashes("a–b")}</>)
    expect(container.querySelectorAll("span")).toHaveLength(1)
    expect(container.textContent).toBe("a–b")
    const texts = [...container.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent)
    expect(texts).toEqual(["a", "b"])
  })

  it('dashes("ab") returns the same string', () => {
    const s = "ab"
    expect(dashes(s)).toBe(s)
  })
})

describe("known quirk (kept for parity with the kit)", () => {
  it("foo_bar_baz italicises bar", () => {
    const { container } = render(<RichText text="foo_bar_baz" />)
    expect(container.querySelector("em")!.textContent).toBe("bar")
    expect(container.textContent).toBe("foobarbaz")
  })
})
