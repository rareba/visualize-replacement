import * as React from "react";
function SvgIcTreemapChart(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="3" y="3" width="10" height="10" fill="currentColor" rx="1" />
      <rect x="14" y="3" width="7" height="6" fill="currentColor" fillOpacity="0.7" rx="1" />
      <rect x="14" y="10" width="7" height="3" fill="currentColor" fillOpacity="0.5" rx="1" />
      <rect x="3" y="14" width="6" height="7" fill="currentColor" fillOpacity="0.6" rx="1" />
      <rect x="10" y="14" width="5" height="4" fill="currentColor" fillOpacity="0.4" rx="1" />
      <rect x="10" y="19" width="5" height="2" fill="currentColor" fillOpacity="0.3" rx="1" />
      <rect x="16" y="14" width="5" height="7" fill="currentColor" fillOpacity="0.5" rx="1" />
    </svg>
  );
}
export default SvgIcTreemapChart;
