import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { useDismiss } from "@/hooks/useDismiss";

/**
 * A minimal harness that opens a dropdown, keeps a ref via useDismiss, and
 * exposes a debug state flag so tests can assert when it closes.
 */
function Harness({ disableOutsideClick }: { disableOutsideClick?: boolean }) {
  const [open, setOpen] = useState(true);
  const ref = useDismiss<HTMLDivElement>({
    isOpen: open,
    onClose: () => setOpen(false),
    disableOutsideClick,
  });

  return (
    <div>
      <span data-testid="state">{open ? "open" : "closed"}</span>
      {open && (
        <div ref={ref} data-testid="menu">
          <button data-testid="inside">inside</button>
        </div>
      )}
      <button data-testid="outside">outside</button>
    </div>
  );
}

describe("useDismiss", () => {
  afterEach(() => {
    cleanup();
  });

  it("closes when Escape is pressed", () => {
    render(<Harness />);
    expect(screen.getByTestId("state").textContent).toBe("open");
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(screen.getByTestId("state").textContent).toBe("closed");
  });

  it("closes when a mousedown fires outside the referenced container", () => {
    render(<Harness />);
    const outside = screen.getByTestId("outside");
    act(() => {
      outside.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });
    expect(screen.getByTestId("state").textContent).toBe("closed");
  });

  it("does NOT close when mousedown fires inside the referenced container", () => {
    render(<Harness />);
    const inside = screen.getByTestId("inside");
    act(() => {
      inside.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });
    expect(screen.getByTestId("state").textContent).toBe("open");
  });

  it("ignores outside clicks when disableOutsideClick is set", () => {
    render(<Harness disableOutsideClick />);
    const outside = screen.getByTestId("outside");
    act(() => {
      outside.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });
    // Escape should still work though
    expect(screen.getByTestId("state").textContent).toBe("open");
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(screen.getByTestId("state").textContent).toBe("closed");
  });

  it("does not react to events when initial state is closed", () => {
    // Arrange a harness where open starts false, onClose must never fire.
    const onClose = vi.fn();
    function ClosedHarness() {
      useDismiss<HTMLDivElement>({ isOpen: false, onClose });
      return <div data-testid="shell" />;
    }
    render(<ClosedHarness />);
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});
