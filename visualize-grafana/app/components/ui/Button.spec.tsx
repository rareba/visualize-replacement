/**
 * Tests for Button Component
 *
 * Tests the Swiss Federal CI Button component.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  it("should render button with text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("should handle click events", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  describe("variants", () => {
    it("should render primary variant", () => {
      render(<Button variant="primary">Primary</Button>);
      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      // Primary variant has red background
      expect(button.style.backgroundColor).toBeTruthy();
    });

    it("should render secondary variant", () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("should render outline variant", () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("should render text variant", () => {
      render(<Button variant="text">Text</Button>);
      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("should render danger variant", () => {
      render(<Button variant="danger">Delete</Button>);
      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });
  });

  describe("sizes", () => {
    it("should render small size", () => {
      render(<Button size="small">Small</Button>);
      const button = screen.getByRole("button");
      expect(button.style.fontSize).toBe("12px");
    });

    it("should render medium size (default)", () => {
      render(<Button>Medium</Button>);
      const button = screen.getByRole("button");
      expect(button.style.fontSize).toBe("14px");
    });

    it("should render large size", () => {
      render(<Button size="large">Large</Button>);
      const button = screen.getByRole("button");
      expect(button.style.fontSize).toBe("16px");
    });
  });

  describe("disabled state", () => {
    it("should disable button when disabled is true", () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("should not trigger click when disabled", () => {
      const handleClick = vi.fn();
      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      );

      fireEvent.click(screen.getByRole("button"));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it("should have reduced opacity when disabled", () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole("button");
      expect(button.style.opacity).toBe("0.6");
    });
  });

  describe("loading state", () => {
    it("should disable button when loading", () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("should show spinner when loading", () => {
      render(<Button loading>Loading</Button>);
      const svg = screen.getByRole("button").querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should not show start icon when loading", () => {
      const StartIcon = () => <span data-testid="start-icon">Start</span>;
      render(
        <Button loading startIcon={<StartIcon />}>
          Loading
        </Button>
      );

      expect(screen.queryByTestId("start-icon")).not.toBeInTheDocument();
    });
  });

  describe("icons", () => {
    it("should render start icon", () => {
      const StartIcon = () => <span data-testid="start-icon">Start</span>;
      render(<Button startIcon={<StartIcon />}>With Icon</Button>);

      expect(screen.getByTestId("start-icon")).toBeInTheDocument();
    });

    it("should render end icon", () => {
      const EndIcon = () => <span data-testid="end-icon">End</span>;
      render(<Button endIcon={<EndIcon />}>With Icon</Button>);

      expect(screen.getByTestId("end-icon")).toBeInTheDocument();
    });

    it("should render both icons", () => {
      const StartIcon = () => <span data-testid="start-icon">S</span>;
      const EndIcon = () => <span data-testid="end-icon">E</span>;
      render(
        <Button startIcon={<StartIcon />} endIcon={<EndIcon />}>
          Both
        </Button>
      );

      expect(screen.getByTestId("start-icon")).toBeInTheDocument();
      expect(screen.getByTestId("end-icon")).toBeInTheDocument();
    });
  });

  describe("fullWidth", () => {
    it("should take full width when fullWidth is true", () => {
      render(<Button fullWidth>Full Width</Button>);
      const button = screen.getByRole("button");
      expect(button.style.width).toBe("100%");
    });

    it("should be auto width by default", () => {
      render(<Button>Auto Width</Button>);
      const button = screen.getByRole("button");
      expect(button.style.width).toBe("auto");
    });
  });

  describe("custom styles", () => {
    it("should merge custom styles", () => {
      render(<Button style={{ marginTop: 10 }}>Styled</Button>);
      const button = screen.getByRole("button");
      expect(button.style.marginTop).toBe("10px");
    });
  });

  describe("accessibility", () => {
    it("should have accessible button role", () => {
      render(<Button>Accessible</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should support aria-label", () => {
      render(<Button aria-label="Close dialog">X</Button>);
      expect(screen.getByRole("button", { name: "Close dialog" })).toBeInTheDocument();
    });

    it("should forward ref", () => {
      const ref = vi.fn();
      render(<Button ref={ref}>Ref</Button>);
      expect(ref).toHaveBeenCalled();
    });
  });
});
