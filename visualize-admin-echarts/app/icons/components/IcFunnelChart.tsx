import * as React from "react";
function SvgIcFunnelChart(props: React.SVGProps<SVGSVGElement>) {
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
        d="M3 4h18v3H3V4z"
        fill="currentColor"
      />
      <path
        d="M5 8.5h14v3H5v-3z"
        fill="currentColor"
        fillOpacity="0.8"
      />
      <path
        d="M7 13h10v3H7v-3z"
        fill="currentColor"
        fillOpacity="0.6"
      />
      <path
        d="M9 17.5h6v3H9v-3z"
        fill="currentColor"
        fillOpacity="0.4"
      />
    </svg>
  );
}
export default SvgIcFunnelChart;
