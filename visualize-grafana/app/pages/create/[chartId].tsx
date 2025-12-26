import { GetServerSideProps } from "next";

/**
 * Redirect old create pages to the new chart builder
 *
 * The old D3-based configurator has been replaced with the ECharts chart builder.
 * All create routes now redirect to /chart-builder which provides:
 * - Dataset browser to search and add LINDAS cubes
 * - Multiple dataset support
 * - ECharts-based visualization
 */
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/chart-builder",
      permanent: false,
    },
  };
};

export default function CreateRedirect() {
  return null;
}
