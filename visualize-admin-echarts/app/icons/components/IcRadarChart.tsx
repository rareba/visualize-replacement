import * as React from "react";
function SvgIcRadarChart(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12 2l8.66 5v10L12 22l-8.66-5V7L12 2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M12 2v20M3.34 7l17.32 10M3.34 17l17.32-10"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeLinecap="round"
      />
      <path
        d="M12 8l4.33 2.5v5L12 18l-4.33-2.5v-5L12 8z"
        fill="currentColor"
        fillOpacity="0.3"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export default SvgIcRadarChart;
