/**
 * Tests for Alert Component
 *
 * Tests the Swiss Federal CI Alert component.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Alert } from "./Alert";

describe("Alert", () => {
  it("should render alert with children", () => {
    render(<Alert>Alert message</Alert>);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Alert message")).toBeInTheDocument();
  });

  it("should render title when provided", () => {
    render(<Alert title="Alert Title">Alert body</Alert>);
    expect(screen.getByText("Alert Title")).toBeInTheDocument();
    expect(screen.getByText("Alert body")).toBeInTheDocument();
  });

  describe("severity", () => {
    it("should render info severity by default", () => {
      render(<Alert>Info alert</Alert>);
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("should render error severity", () => {
      render(<Alert severity="error">Error alert</Alert>);
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("should render warning severity", () => {
      render(<Alert severity="warning">Warning alert</Alert>);
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("should render success severity", () => {
      render(<Alert severity="success">Success alert</Alert>);
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  describe("close button", () => {
    it("should show close button when onClose is provided", () => {
      const handleClose = vi.fn();
      render(<Alert onClose={handleClose}>Closeable</Alert>);

      expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    });

    it("should call onClose when close button is clicked", () => {
      const handleClose = vi.fn();
      render(<Alert onClose={handleClose}>Closeable</Alert>);

      fireEvent.click(screen.getByRole("button", { name: "Close" }));
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("should not show close button when onClose is not provided", () => {
      render(<Alert>Not closeable</Alert>);
      expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
    });
  });

  describe("custom icon", () => {
    it("should render default icon for each severity", () => {
      render(<Alert severity="error">Error</Alert>);
      // Check that SVG icon is rendered
      expect(screen.getByRole("alert").querySelector("svg")).toBeInTheDocument();
    });

    it("should render custom icon when provided", () => {
      const CustomIcon = () => <span data-testid="custom-icon">!</span>;
      render(<Alert icon={<CustomIcon />}>Custom icon alert</Alert>);

      expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
    });
  });

  describe("action", () => {
    it("should render action when provided", () => {
      const action = <button data-testid="action-button">Retry</button>;
      render(<Alert action={action}>Alert with action</Alert>);

      expect(screen.getByTestId("action-button")).toBeInTheDocument();
    });
  });

  describe("styling", () => {
    it("should apply custom styles", () => {
      render(<Alert style={{ marginTop: 20 }}>Styled alert</Alert>);
      expect(screen.getByRole("alert")).toHaveStyle({ marginTop: "20px" });
    });

    it("should have proper role for accessibility", () => {
      render(<Alert>Accessible alert</Alert>);
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  describe("ref forwarding", () => {
    it("should forward ref", () => {
      const ref = vi.fn();
      render(<Alert ref={ref}>With ref</Alert>);
      expect(ref).toHaveBeenCalled();
    });
  });
});
