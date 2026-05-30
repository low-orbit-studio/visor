import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { computeSyncTarget, useSyncedScroll } from "../use-synced-scroll";

/** jsdom reports 0 for layout metrics; define them so the ratio math has a range. */
function setMetrics(el: HTMLElement, scrollHeight: number, clientHeight: number) {
  Object.defineProperty(el, "scrollHeight", { configurable: true, value: scrollHeight });
  Object.defineProperty(el, "clientHeight", { configurable: true, value: clientHeight });
}

function Harness({ enabled }: { enabled: boolean }) {
  const { leftRef, rightRef } = useSyncedScroll(enabled);
  return (
    <>
      <div data-testid="left" ref={leftRef} />
      <div data-testid="right" ref={rightRef} />
    </>
  );
}

describe("computeSyncTarget", () => {
  it("maps 1:1 when both panes share the same scrollable range", () => {
    expect(
      computeSyncTarget(
        { scrollTop: 250, scrollHeight: 1000, clientHeight: 500 },
        { scrollHeight: 1000, clientHeight: 500 },
      ),
    ).toBe(250);
  });

  it("maps proportionally when the ranges differ", () => {
    // srcMax = 600, ratio = 0.5; dstMax = 1500 → 750
    expect(
      computeSyncTarget(
        { scrollTop: 300, scrollHeight: 1000, clientHeight: 400 },
        { scrollHeight: 2000, clientHeight: 500 },
      ),
    ).toBe(750);
  });

  it("returns 0 when the source cannot scroll", () => {
    expect(
      computeSyncTarget(
        { scrollTop: 0, scrollHeight: 400, clientHeight: 400 },
        { scrollHeight: 1000, clientHeight: 500 },
      ),
    ).toBe(0);
  });

  it("returns 0 when the destination cannot scroll", () => {
    expect(
      computeSyncTarget(
        { scrollTop: 100, scrollHeight: 1000, clientHeight: 500 },
        { scrollHeight: 400, clientHeight: 400 },
      ),
    ).toBe(0);
  });
});

describe("useSyncedScroll", () => {
  it("mirrors a scroll from one pane onto the other when enabled", () => {
    const { getByTestId } = render(<Harness enabled />);
    const left = getByTestId("left");
    const right = getByTestId("right");
    setMetrics(left, 1000, 500);
    setMetrics(right, 1000, 500);

    left.scrollTop = 250;
    fireEvent.scroll(left);

    expect(right.scrollTop).toBe(250);
  });

  it("leaves the panes independent when disabled", () => {
    const { getByTestId } = render(<Harness enabled={false} />);
    const left = getByTestId("left");
    const right = getByTestId("right");
    setMetrics(left, 1000, 500);
    setMetrics(right, 1000, 500);

    left.scrollTop = 250;
    fireEvent.scroll(left);

    expect(right.scrollTop).toBe(0);
  });
});
