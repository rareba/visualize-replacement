/**
 * Tests for Actions Component
 *
 * Tests the homepage actions section with contribute, newsletter, and feedback options.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Actions } from "./actions";

// Mock useIsMobile hook
vi.mock("@/utils/use-is-mobile", () => ({
  useIsMobile: vi.fn(() => false),
}));

import { useIsMobile } from "@/utils/use-is-mobile";

describe("Actions", () => {
  const defaultProps = {
    contribute: {
      headline: "Contribute",
      description: "Help improve this tool",
      buttonLabel: "GitHub",
      buttonUrl: "https://github.com/example",
    },
    newsletter: {
      headline: "Newsletter",
      description: "Stay updated",
      buttonLabel: "Subscribe",
      buttonUrl: "https://newsletter.example.com",
    },
    bugReport: {
      headline: "Report Bug",
      description: "Found an issue?",
      buttonLabel: "Report",
      buttonUrl: "https://bugs.example.com",
    },
    featureRequest: {
      headline: "Feature Request",
      description: "Have an idea?",
      buttonLabel: "Request",
      buttonUrl: "https://features.example.com",
    },
  };

  it("should render all four action sections", () => {
    render(<Actions {...defaultProps} />);

    expect(screen.getByText("Contribute")).toBeInTheDocument();
    expect(screen.getByText("Newsletter")).toBeInTheDocument();
    expect(screen.getByText("Report Bug")).toBeInTheDocument();
    expect(screen.getByText("Feature Request")).toBeInTheDocument();
  });

  it("should render descriptions", () => {
    render(<Actions {...defaultProps} />);

    expect(screen.getByText("Help improve this tool")).toBeInTheDocument();
    expect(screen.getByText("Stay updated")).toBeInTheDocument();
    expect(screen.getByText("Found an issue?")).toBeInTheDocument();
    expect(screen.getByText("Have an idea?")).toBeInTheDocument();
  });

  it("should render buttons with correct labels", () => {
    render(<Actions {...defaultProps} />);

    expect(screen.getByText("GitHub")).toBeInTheDocument();
    expect(screen.getByText("Subscribe")).toBeInTheDocument();
    expect(screen.getByText("Report")).toBeInTheDocument();
    expect(screen.getByText("Request")).toBeInTheDocument();
  });

  it("should render buttons with correct URLs", () => {
    render(<Actions {...defaultProps} />);

    const githubButton = screen.getByText("GitHub").closest("a, button");
    expect(githubButton).toHaveAttribute("href", "https://github.com/example");

    const newsletterButton = screen.getByText("Subscribe").closest("a, button");
    expect(newsletterButton).toHaveAttribute(
      "href",
      "https://newsletter.example.com"
    );
  });

  it("should open links in new tab", () => {
    render(<Actions {...defaultProps} />);

    // MUI Button with href renders as a link element
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);

    links.forEach((link) => {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    });
  });

  it("should render h2 headings", () => {
    render(<Actions {...defaultProps} />);

    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings.length).toBe(4);
  });

  describe("responsive layout", () => {
    it("should use column layout on mobile", () => {
      vi.mocked(useIsMobile).mockReturnValue(true);

      render(<Actions {...defaultProps} />);

      // Component should render without errors in mobile mode
      expect(screen.getByText("Contribute")).toBeInTheDocument();
    });

    it("should use row layout on desktop", () => {
      vi.mocked(useIsMobile).mockReturnValue(false);

      render(<Actions {...defaultProps} />);

      // Component should render without errors in desktop mode
      expect(screen.getByText("Contribute")).toBeInTheDocument();
    });
  });

  it("should handle special characters in text", () => {
    const propsWithSpecialChars = {
      ...defaultProps,
      contribute: {
        ...defaultProps.contribute,
        headline: "Contribute & Help",
        description: 'Make a "difference"',
      },
    };

    render(<Actions {...propsWithSpecialChars} />);

    expect(screen.getByText("Contribute & Help")).toBeInTheDocument();
    expect(screen.getByText('Make a "difference"')).toBeInTheDocument();
  });

  it("should handle long descriptions", () => {
    const longDescription =
      "This is a very long description that explains in detail what the user should do and why they should do it. It provides comprehensive information about the action.";

    const propsWithLongDesc = {
      ...defaultProps,
      newsletter: {
        ...defaultProps.newsletter,
        description: longDescription,
      },
    };

    render(<Actions {...propsWithLongDesc} />);

    expect(screen.getByText(longDescription)).toBeInTheDocument();
  });
});
