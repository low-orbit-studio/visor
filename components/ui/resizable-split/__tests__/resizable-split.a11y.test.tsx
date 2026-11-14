import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import { axe } from "../../../../test-utils/axe"
import { ResizableSplit } from "../resizable-split"

describe("ResizableSplit a11y", () => {
  it("has no axe violations", async () => {
    const { container } = render(
      <ResizableSplit defaultSize={320} minStart={240} minEnd={320} dividerLabel="Resize editor and preview">
        <div>Editor</div>
        <div>Preview</div>
      </ResizableSplit>
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
