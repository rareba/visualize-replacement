import * as React from "react";
function SvgIcHeatmapChart(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="3" y="3" width="4" height="4" fill="currentColor" fillOpacity="0.9" rx="0.5" />
      <rect x="8" y="3" width="4" height="4" fill="currentColor" fillOpacity="0.6" rx="0.5" />
      <rect x="13" y="3" width="4" height="4" fill="currentColor" fillOpacity="0.3" rx="0.5" />
      <rect x="18" y="3" width="4" height="4" fill="currentColor" fillOpacity="0.1" rx="0.5" />
      <rect x="3" y="8" width="4" height="4" fill="currentColor" fillOpacity="0.7" rx="0.5" />
      <rect x="8" y="8" width="4" height="4" fill="currentColor" fillOpacity="1" rx="0.5" />
      <rect x="13" y="8" width="4" height="4" fill="currentColor" fillOpacity="0.5" rx="0.5" />
      <rect x="18" y="8" width="4" height="4" fill="currentColor" fillOpacity="0.2" rx="0.5" />
      <rect x="3" y="13" width="4" height="4" fill="currentColor" fillOpacity="0.4" rx="0.5" />
      <rect x="8" y="13" width="4" height="4" fill="currentColor" fillOpacity="0.8" rx="0.5" />
      <rect x="13" y="13" width="4" height="4" fill="currentColor" fillOpacity="0.6" rx="0.5" />
      <rect x="18" y="13" width="4" height="4" fill="currentColor" fillOpacity="0.3" rx="0.5" />
      <rect x="3" y="18" width="4" height="4" fill="currentColor" fillOpacity="0.2" rx="0.5" />
      <rect x="8" y="18" width="4" height="4" fill="currentColor" fillOpacity="0.5" rx="0.5" />
      <rect x="13" y="18" width="4" height="4" fill="currentColor" fillOpacity="0.9" rx="0.5" />
      <rect x="18" y="18" width="4" height="4" fill="currentColor" fillOpacity="0.7" rx="0.5" />
    </svg>
  );
}
export default SvgIcHeatmapChart;
