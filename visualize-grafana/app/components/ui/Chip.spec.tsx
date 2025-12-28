/**
 * Tests for Chip Component
 *
 * Tests the Swiss Federal CI Chip component.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Chip } from "./Chip";

describe("Chip", () => {
  it("should render chip with label", () => {
    render(<Chip label="Test Chip" />);
    expect(screen.getByText("Test Chip")).toBeInTheDocument();
  });

  describe("variants", () => {
    it("should render filled variant by default", () => {
      render(<Chip label="Filled" />);
      const chip = screen.getByText("Filled").closest("span");
      expect(chip).toBeInTheDocument();
    });

    it("should render outlined variant", () => {
      render(<Chip label="Outlined" variant="outlined" />);
      const chip = screen.getByText("Outlined").closest("span");
      expect(chip).toBeInTheDocument();
    });
  });

  describe("colors", () => {
    it("should render default color", () => {
      render(<Chip label="Default" color="default" />);
      expect(screen.getByText("Default")).toBeInTheDocument();
    });

    it("should render primary color", () => {
      render(<Chip label="Primary" color="primary" />);
      expect(screen.getByText("Primary")).toBeInTheDocument();
    });

    it("should render secondary color", () => {
      render(<Chip label="Secondary" color="secondary" />);
      expect(screen.getByText("Secondary")).toBeInTheDocument();
    });

    it("should render success color", () => {
      render(<Chip label="Success" color="success" />);
      expect(screen.getByText("Success")).toBeInTheDocument();
    });

    it("should render error color", () => {
      render(<Chip label="Error" color="error" />);
      expect(screen.getByText("Error")).toBeInTheDocument();
    });

    it("should render warning color", () => {
      render(<Chip label="Warning" color="warning" />);
      expect(screen.getByText("Warning")).toBeInTheDocument();
    });
  });

  describe("sizes", () => {
    it("should render medium size by default", () => {
      render(<Chip label="Medium" />);
      const chip = screen.getByText("Medium").closest("span");
      expect(chip).toHaveStyle({ height: "32px" });
    });

    it("should render small size", () => {
      render(<Chip label="Small" size="small" />);
      const chip = screen.getByText("Small").closest("span");
      expect(chip).toHaveStyle({ height: "24px" });
    });
  });

  describe("icon", () => {
    it("should render icon when provided", () => {
      const Icon = () => <span data-testid="chip-icon">+</span>;
      render(<Chip label="With Icon" icon={<Icon />} />);

      expect(screen.getByTestId("chip-icon")).toBeInTheDocument();
    });
  });

  describe("delete functionality", () => {
    it("should render delete button when onDelete is provided", () => {
      const handleDelete = vi.fn();
      render(<Chip label="Deletable" onDelete={handleDelete} />);

      expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
    });

    it("should call onDelete when delete button is clicked", () => {
      const handleDelete = vi.fn();
      render(<Chip label="Deletable" onDelete={handleDelete} />);

      fireEvent.click(screen.getByRole("button", { name: "Remove" }));
      expect(handleDelete).toHaveBeenCalledTimes(1);
    });

    it("should stop propagation on delete click", () => {
      const handleDelete = vi.fn();
      const handleClick = vi.fn();
      render(<Chip label="Deletable" onDelete={handleDelete} onClick={handleClick} />);

      fireEvent.click(screen.getByRole("button", { name: "Remove" }));
      expect(handleDelete).toHaveBeenCalled();
      expect(handleClick).not.toHaveBeenCalled();
    });

    it("should not render delete button when onDelete is not provided", () => {
      render(<Chip label="Not Deletable" />);
      expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
    });
  });

  describe("clickable", () => {
    it("should have pointer cursor when clickable", () => {
      render(<Chip label="Clickable" clickable />);
      const chip = screen.getByText("Clickable").closest("span");
      expect(chip).toHaveStyle({ cursor: "pointer" });
    });

    it("should have pointer cursor when onClick is provided", () => {
      const handleClick = vi.fn();
      render(<Chip label="Clickable" onClick={handleClick} />);
      const chip = screen.getByText("Clickable").closest("span");
      expect(chip).toHaveStyle({ cursor: "pointer" });
    });

    it("should have default cursor when not clickable", () => {
      render(<Chip label="Not Clickable" />);
      const chip = screen.getByText("Not Clickable").closest("span");
      expect(chip).toHaveStyle({ cursor: "default" });
    });

    it("should call onClick when clicked", () => {
      const handleClick = vi.fn();
      const { container } = render(<Chip label="Clickable" onClick={handleClick} />);

      const chip = container.querySelector("span");
      if (chip) {
        fireEvent.click(chip);
      }
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("styling", () => {
    it("should apply custom styles", () => {
      render(<Chip label="Styled" style={{ marginLeft: 10 }} />);
      const chip = screen.getByText("Styled").closest("span");
      expect(chip).toHaveStyle({ marginLeft: "10px" });
    });

    it("should have pill-shaped border radius", () => {
      render(<Chip label="Pill" />);
      const chip = screen.getByText("Pill").closest("span");
      // Medium size is 32px height, so radius should be 16px
      expect(chip).toHaveStyle({ borderRadius: "16px" });
    });
  });

  describe("ref forwarding", () => {
    it("should forward ref", () => {
      const ref = vi.fn();
      render(<Chip label="With Ref" ref={ref} />);
      expect(ref).toHaveBeenCalled();
    });
  });
});
