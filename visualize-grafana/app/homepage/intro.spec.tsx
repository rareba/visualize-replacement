/**
 * Tests for Intro Component
 *
 * Tests the homepage intro section with title, teaser, and button.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Intro } from "./intro";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock Icon component
vi.mock("@/icons", () => ({
  Icon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`} />,
}));

describe("Intro", () => {
  const defaultProps = {
    title: "Create Visualizations",
    teaser: "Build beautiful charts from Swiss federal data",
    buttonLabel: "Browse Datasets",
  };

  it("should render title", () => {
    render(<Intro {...defaultProps} />);

    expect(screen.getByText("Create Visualizations")).toBeInTheDocument();
  });

  it("should render title as h1", () => {
    render(<Intro {...defaultProps} />);

    const title = screen.getByRole("heading", { level: 1 });
    expect(title).toHaveTextContent("Create Visualizations");
  });

  it("should render teaser text", () => {
    render(<Intro {...defaultProps} />);

    expect(
      screen.getByText("Build beautiful charts from Swiss federal data")
    ).toBeInTheDocument();
  });

  it("should render button with label", () => {
    render(<Intro {...defaultProps} />);

    expect(
      screen.getByRole("button", { name: /Browse Datasets/i })
    ).toBeInTheDocument();
  });

  it("should link button to /browse", () => {
    render(<Intro {...defaultProps} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/browse");
  });

  it("should render arrow icon", () => {
    render(<Intro {...defaultProps} />);

    expect(screen.getByTestId("icon-arrowRight")).toBeInTheDocument();
  });

  it("should handle long title text", () => {
    const longTitle =
      "This is a very long title that should still be rendered properly without breaking the layout";

    render(<Intro {...defaultProps} title={longTitle} />);

    expect(screen.getByText(longTitle)).toBeInTheDocument();
  });

  it("should handle long teaser text", () => {
    const longTeaser =
      "This is a comprehensive description of the visualization tool that helps users understand what they can accomplish with the platform. It includes details about features and capabilities.";

    render(<Intro {...defaultProps} teaser={longTeaser} />);

    expect(screen.getByText(longTeaser)).toBeInTheDocument();
  });

  it("should handle empty button label", () => {
    render(<Intro {...defaultProps} buttonLabel="" />);

    // Button should still exist but be empty
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("should handle special characters in text", () => {
    render(
      <Intro
        title="Charts & Graphs"
        teaser={'Create <visualizations> with "ease"'}
        buttonLabel="Let's Go!"
      />
    );

    expect(screen.getByText("Charts & Graphs")).toBeInTheDocument();
    expect(
      screen.getByText('Create <visualizations> with "ease"')
    ).toBeInTheDocument();
    expect(screen.getByText("Let's Go!")).toBeInTheDocument();
  });
});
