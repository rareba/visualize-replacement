/**
 * Embed Page for Chart Builder Charts
 *
 * This page renders a chart from URL-encoded configuration.
 * Supports responsive iframe embedding with iframe-resizer.
 *
 * URL format: /embed/chart/[base64-encoded-config]?options...
 *
 * Query parameters:
 * - removeBorder: Remove container border and shadow
 * - optimizeSpace: Minimize padding for compact display
 * - hideTitle: Hide chart title
 * - hideLegend: Hide chart legend
 * - height: Custom height in pixels
 */

import { GetServerSideProps } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import { c as colors } from "@interactivethings/swiss-federal-ci";
import {
  decodeChartConfig,
  parseEmbedOptions,
  type EmbedPayload,
  type EmbedOptions,
} from "@/utils/chart-config-encoder";

// Dynamically import the chart component to avoid SSR issues
const EmbeddableChart = dynamic(
  () => import("@/components/chart-builder/EmbeddableChart").then((mod) => mod.EmbeddableChart),
  {
    ssr: false,
    loading: () => (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        color: colors.monochrome[500],
        fontFamily: "'Frutiger Neue', Arial, sans-serif",
      }}>
        Loading chart...
      </div>
    ),
  }
);

interface EmbedPageProps {
  payload: EmbedPayload | null;
  options: EmbedOptions;
  error?: string;
}

export default function EmbedChartPage({ payload, options, error }: EmbedPageProps) {
  // Content Security Policy for embedding
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://lindas.admin.ch",
    "frame-ancestors *",
  ].join("; ");

  if (error || !payload) {
    return (
      <>
        <Head>
          <title>Chart Error</title>
          <meta httpEquiv="Content-Security-Policy" content={csp} />
          <meta name="robots" content="noindex" />
        </Head>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            padding: 24,
            fontFamily: "'Frutiger Neue', Arial, sans-serif",
            color: colors.monochrome[700],
            backgroundColor: colors.monochrome[50],
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke={colors.red[500]}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h2 style={{ margin: "16px 0 8px", fontSize: 18, fontWeight: 600 }}>
            Unable to load chart
          </h2>
          <p style={{ margin: 0, fontSize: 14, textAlign: "center" }}>
            {error || "The chart configuration could not be decoded."}
          </p>
          <p style={{ margin: "12px 0 0", fontSize: 12, color: colors.monochrome[500] }}>
            Please check the embed URL or generate a new one.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{payload.chart.title || "Embedded Chart"}</title>
        <meta httpEquiv="Content-Security-Policy" content={csp} />
        <meta name="robots" content="noindex" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          html, body {
            width: 100%;
            height: 100%;
            overflow: hidden;
            background-color: ${options.removeBorder ? "transparent" : "#f5f5f5"};
          }
        `}</style>
        {/* iframe-resizer child script */}
        <script
          src="https://cdn.jsdelivr.net/npm/@iframe-resizer/child"
          async
        />
      </Head>

      <main
        style={{
          width: "100%",
          height: options.height ? `${options.height}px` : "100%",
          minHeight: 200,
        }}
      >
        <EmbeddableChart payload={payload} options={options} />
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<EmbedPageProps> = async (context) => {
  const { configId } = context.params as { configId: string };
  const searchParams = new URLSearchParams(
    Object.entries(context.query)
      .filter(([key]) => key !== "configId")
      .map(([key, value]) => [key, String(value)])
  );

  // Parse embed options
  const options = parseEmbedOptions(searchParams);

  // Decode configuration
  const payload = decodeChartConfig(configId);

  if (!payload) {
    return {
      props: {
        payload: null,
        options,
        error: "Invalid or corrupted chart configuration.",
      },
    };
  }

  // Validate payload structure
  if (!payload.chart || !payload.dataset) {
    return {
      props: {
        payload: null,
        options,
        error: "Chart configuration is incomplete.",
      },
    };
  }

  // Set cache headers for embed pages
  context.res.setHeader(
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate=86400"
  );

  return {
    props: {
      payload,
      options,
    },
  };
};
