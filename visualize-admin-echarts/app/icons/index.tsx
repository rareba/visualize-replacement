import { ComponentProps } from "react";

import { ChartType } from "@/config-types";
import { IconName, Icons } from "@/icons/components";

export { Icons } from "./components";
export type { IconName } from "./components";

export const Icon = ({
  size = 24,
  color,
  name,
  ...props
}: {
  size?: number | string;
  color?: string;
  name: IconName;
} & ComponentProps<"svg">) => {
  const { style, ...otherProps } = props;
  const IconComponent = Icons[name];

  if (!IconComponent) {
    console.warn("No icon", name);
    return null;
  }

  return (
    <IconComponent
      width={size}
      height={size}
      color={color}
      style={{ minWidth: size, minHeight: size, ...style }}
      {...otherProps}
    />
  );
};

export const getChartIcon = (chartType: ChartType): IconName => {
  switch (chartType) {
    case "area":
      return "areasChart";
    case "column":
      return "chartColumn";
    case "bar":
      return "chartBar";
    case "line":
      return "lineChart";
    case "map":
      return "mapChart";
    case "pie":
      return "pieChart";
    case "donut":
      return "donutChart";
    case "scatterplot":
      return "scatterplotChart";
    case "table":
      return "tableChart";
    case "radar":
      return "radarChart";
    case "heatmap":
      return "heatmapChart";
    case "boxplot":
      return "chartBar"; // Using bar chart icon as placeholder
    case "waterfall":
      return "chartColumn"; // Using column chart icon as placeholder
    case "comboLineSingle":
      return "multilineChart";
    case "comboLineDual":
      return "dualAxisChart";
    case "comboLineColumn":
      return "columnLineChart";
    // 3D Charts (ECharts GL)
    case "bar3d":
      return "chartColumn"; // Using column icon for 3D bar
    case "scatter3d":
      return "scatterplotChart"; // Using scatter icon for 3D scatter
    case "surface":
      return "areasChart"; // Using area icon for surface
    case "line3d":
      return "lineChart"; // Using line icon for 3D line
    case "globe":
      return "mapChart"; // Using map icon for globe
    case "pie3d":
      return "pieChart"; // Using pie icon for 3D pie
    case "candlestick":
      return "chartColumn"; // Using column icon for candlestick
    case "themeriver":
      return "areasChart"; // Using area icon for theme river
    default:
      const _exhaustiveCheck: never = chartType;
      return _exhaustiveCheck;
  }
};
