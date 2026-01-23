import * as React from "react";
function SvgIcSunburstChart(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="12" cy="12" r="3" fill="currentColor" />
      <path
        d="M12 5a7 7 0 017 7h-4a3 3 0 00-3-3V5z"
        fill="currentColor"
        fillOpacity="0.8"
      />
      <path
        d="M19 12a7 7 0 01-7 7v-4a3 3 0 003-3h4z"
        fill="currentColor"
        fillOpacity="0.6"
      />
      <path
        d="M12 19a7 7 0 01-7-7h4a3 3 0 003 3v4z"
        fill="currentColor"
        fillOpacity="0.4"
      />
      <path
        d="M5 12a7 7 0 017-7v4a3 3 0 00-3 3H5z"
        fill="currentColor"
        fillOpacity="0.5"
      />
      <path
        d="M12 2a10 10 0 0110 10h-3a7 7 0 00-7-7V2z"
        fill="currentColor"
        fillOpacity="0.3"
      />
      <path
        d="M22 12a10 10 0 01-10 10v-3a7 7 0 007-7h3z"
        fill="currentColor"
        fillOpacity="0.25"
      />
      <path
        d="M12 22a10 10 0 01-10-10h3a7 7 0 007 7v3z"
        fill="currentColor"
        fillOpacity="0.2"
      />
      <path
        d="M2 12a10 10 0 0110-10v3a7 7 0 00-7 7H2z"
        fill="currentColor"
        fillOpacity="0.15"
      />
    </svg>
  );
}
export default SvgIcSunburstChart;
