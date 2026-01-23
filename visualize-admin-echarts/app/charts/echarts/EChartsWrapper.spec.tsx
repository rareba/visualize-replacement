/**
 * EChartsWrapper Component Tests
 *
 * Tests the wrapper component for Apache ECharts integration.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// Mock echarts-for-react with forwardRef to properly handle refs
vi.mock("echarts-for-react", () => {
  const React = require("react");
  return {
    default: React.forwardRef(
      (
        {
          option,
          style,
          className,
          showLoading,
        }: {
          option: unknown;
          style?: React.CSSProperties;
          className?: string;
          showLoading?: boolean;
        },
        ref: React.ForwardedRef<unknown>
      ) => {
        // Expose a mock getEchartsInstance method via ref
        React.useImperativeHandle(ref, () => ({
          getEchartsInstance: () => ({
            resize: vi.fn(),
          }),
        }));

        return (
          <div
            data-testid="echarts-mock"
            data-option={JSON.stringify(option)}
            data-show-loading={showLoading}
            style={style}
            className={className}
          />
        );
      }
    ),
  };
});

import { render, cleanup } from "@testing-library/react";
import React from "react";
import { EChartsWrapper } from "./EChartsWrapper";
import { SWISS_FEDERAL_ANIMATION, SWISS_FEDERAL_COLORS } from "./theme";

describe("EChartsWrapper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe("Basic Rendering", () => {
    it("should render the ECharts component", () => {
      const option = {
        series: [{ type: "bar" as const, data: [1, 2, 3] }],
      };

      const { getByTestId } = render(<EChartsWrapper option={option} />);

      expect(getByTestId("echarts-mock")).toBeDefined();
    });

    it("should pass option to ECharts", () => {
      const option = {
        series: [{ type: "bar" as const, data: [1, 2, 3] }],
      };

      const { getByTestId } = render(<EChartsWrapper option={option} />);

      const element = getByTestId("echarts-mock");
      const passedOption = JSON.parse(element.dataset.option || "{}");

      // Should contain the series
      expect(passedOption.series).toBeDefined();
    });

    it("should apply default width and height", () => {
      const option = {
        series: [{ type: "bar" as const, data: [1, 2, 3] }],
      };

      const { getByTestId } = render(<EChartsWrapper option={option} />);

      const element = getByTestId("echarts-mock");
      expect(element.style.width).toBe("100%");
      expect(element.style.height).toBe("100%");
    });
  });

  describe("Style Properties", () => {
    it("should apply custom width as number", () => {
      const option = {
        series: [{ type: "bar" as const, data: [1, 2, 3] }],
      };

      const { getByTestId } = render(
        <EChartsWrapper option={option} width={500} />
      );

      const element = getByTestId("echarts-mock");
      expect(element.style.width).toBe("500px");
    });

    it("should apply custom width as string", () => {
      const option = {
        series: [{ type: "bar" as const, data: [1, 2, 3] }],
      };

      const { getByTestId } = render(
        <EChartsWrapper option={option} width="80%" />
      );

      const element = getByTestId("echarts-mock");
      expect(element.style.width).toBe("80%");
    });

    it("should apply custom height as number", () => {
      const option = {
        series: [{ type: "bar" as const, data: [1, 2, 3] }],
      };

      const { getByTestId } = render(
        <EChartsWrapper option={option} height={300} />
      );

      const element = getByTestId("echarts-mock");
      expect(element.style.height).toBe("300px");
    });

    it("should apply custom height as string", () => {
      const option = {
        series: [{ type: "bar" as const, data: [1, 2, 3] }],
      };

      const { getByTestId } = render(
        <EChartsWrapper option={option} height="50vh" />
      );

      const element = getByTestId("echarts-mock");
      expect(element.style.height).toBe("50vh");
    });

    it("should apply custom className", () => {
      const option = {
        series: [{ type: "bar" as const, data: [1, 2, 3] }],
      };

      const { getByTestId } = render(
        <EChartsWrapper option={option} className="custom-chart" />
      );

      const element = getByTestId("echarts-mock");
      expect(element.className).toBe("custom-chart");
    });

    it("should merge custom style with dimensions", () => {
      const option = {
        series: [{ type: "bar" as const, data: [1, 2, 3] }],
      };

      const { getByTestId } = render(
        <EChartsWrapper
          option={option}
          width={500}
          height={300}
          style={{ backgroundColor: "red" }}
        />
      );

      const element = getByTestId("echarts-mock");
      expect(element.style.width).toBe("500px");
      expect(element.style.height).toBe("300px");
      expect(element.style.backgroundColor).toBe("red");
    });
  });

  describe("Loading State", () => {
    it("should show loading when loading prop is true", () => {
      const option = {
        series: [{ type: "bar" as const, data: [1, 2, 3] }],
      };

      const { getByTestId } = render(
        <EChartsWrapper option={option} loading={true} />
      );

      const element = getByTestId("echarts-mock");
      expect(element.dataset.showLoading).toBe("true");
    });

    it("should show loading when showLoading prop is true", () => {
      const option = {
        series: [{ type: "bar" as const, data: [1, 2, 3] }],
      };

      const { getByTestId } = render(
        <EChartsWrapper option={option} showLoading={true} />
      );

      const element = getByTestId("echarts-mock");
      expect(element.dataset.showLoading).toBe("true");
    });

    it("should not show loading by default", () => {
      const option = {
        series: [{ type: "bar" as const, data: [1, 2, 3] }],
      };

      const { getByTestId } = render(<EChartsWrapper option={option} />);

      const element = getByTestId("echarts-mock");
      expect(element.dataset.showLoading).toBe("false");
    });
  });

  describe("Theme Integration", () => {
    it("should merge option with Swiss Federal theme", () => {
      const option = {
        series: [{ type: "bar" as const, data: [1, 2, 3] }],
      };

      const { getByTestId } = render(<EChartsWrapper option={option} />);

      const element = getByTestId("echarts-mock");
      const passedOption = JSON.parse(element.dataset.option || "{}");

      // Theme should include Swiss Federal colors
      expect(passedOption.color).toEqual(SWISS_FEDERAL_COLORS.palette);
    });

    it("should preserve custom option properties when merging with theme", () => {
      const option = {
        title: { text: "My Chart" },
        series: [{ type: "bar" as const, data: [1, 2, 3] }],
      };

      const { getByTestId } = render(<EChartsWrapper option={option} />);

      const element = getByTestId("echarts-mock");
      const passedOption = JSON.parse(element.dataset.option || "{}");

      expect(passedOption.title.text).toBe("My Chart");
    });
  });

  describe("Animation Configuration", () => {
    it("should enable animation by default", () => {
      const option = {
        series: [{ type: "bar" as const, data: [1, 2, 3] }],
      };

      const { getByTestId } = render(<EChartsWrapper option={option} />);

      const element = getByTestId("echarts-mock");
      const passedOption = JSON.parse(element.dataset.option || "{}");

      expect(passedOption.animation).toBe(true);
    });

    it("should disable animation when enableAnimation is false", () => {
      const option = {
        series: [{ type: "bar" as const, data: [1, 2, 3] }],
      };

      const { getByTestId } = render(
        <EChartsWrapper option={option} enableAnimation={false} />
      );

      const element = getByTestId("echarts-mock");
      const passedOption = JSON.parse(element.dataset.option || "{}");

      expect(passedOption.animation).toBe(false);
    });

    it("should use default animation duration", () => {
      const option = {
        series: [{ type: "bar" as const, data: [1, 2, 3] }],
      };

      const { getByTestId } = render(<EChartsWrapper option={option} />);

      const element = getByTestId("echarts-mock");
      const passedOption = JSON.parse(element.dataset.option || "{}");

      expect(passedOption.animationDuration).toBe(SWISS_FEDERAL_ANIMATION.duration);
    });

    it("should use custom animation duration when provided", () => {
      const option = {
        series: [{ type: "bar" as const, data: [1, 2, 3] }],
      };

      const { getByTestId } = render(
        <EChartsWrapper option={option} animationDuration={1000} />
      );

      const element = getByTestId("echarts-mock");
      const passedOption = JSON.parse(element.dataset.option || "{}");

      expect(passedOption.animationDuration).toBe(1000);
    });
  });

  describe("Accessibility", () => {
    it("should not include aria by default", () => {
      const option = {
        series: [{ type: "bar" as const, data: [1, 2, 3] }],
      };

      const { getByTestId } = render(<EChartsWrapper option={option} />);

      const element = getByTestId("echarts-mock");
      const passedOption = JSON.parse(element.dataset.option || "{}");

      expect(passedOption.aria).toBeUndefined();
    });

    it("should include aria configuration when ariaLabel is provided", () => {
      const option = {
        series: [{ type: "bar" as const, data: [1, 2, 3] }],
      };

      const { getByTestId } = render(
        <EChartsWrapper option={option} ariaLabel="A bar chart showing data" />
      );

      const element = getByTestId("echarts-mock");
      const passedOption = JSON.parse(element.dataset.option || "{}");

      expect(passedOption.aria).toBeDefined();
      expect(passedOption.aria.enabled).toBe(true);
      expect(passedOption.aria.label.description).toBe("A bar chart showing data");
    });
  });

  describe("Display Name", () => {
    it("should have displayName set", () => {
      expect(EChartsWrapper.displayName).toBe("EChartsWrapper");
    });
  });
});
