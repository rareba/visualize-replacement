import * as React from "react";
function SvgIcGaugeChart(props: React.SVGProps<SVGSVGElement>) {
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
        d="M12 4a8 8 0 100 16 8 8 0 000-16z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M12 4a8 8 0 018 8h-3a5 5 0 00-5-5V4z"
        fill="currentColor"
        fillOpacity="0.3"
      />
      <path
        d="M12 12l4-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <path
        d="M6.5 18.5l1-1M17.5 18.5l-1-1M4.5 12h1.5M18 12h1.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}
export default SvgIcGaugeChart;
