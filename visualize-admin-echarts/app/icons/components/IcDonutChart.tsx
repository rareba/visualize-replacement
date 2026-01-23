import * as React from "react";
function SvgIcDonutChart(props: React.SVGProps<SVGSVGElement>) {
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
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 3a9 9 0 100 18 9 9 0 000-18zm0 1.5a7.5 7.5 0 110 15 7.5 7.5 0 010-15zm0 3a4.5 4.5 0 100 9 4.5 4.5 0 000-9zm0 1.5a3 3 0 110 6 3 3 0 010-6z"
        fill="currentColor"
      />
      <path
        d="M12 3v4.5M12 16.5V21M3 12h4.5M16.5 12H21"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
export default SvgIcDonutChart;
