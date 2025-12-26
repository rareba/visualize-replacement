import { GetServerSideProps } from "next";

/**
 * Redirect browse page to the new chart builder
 *
 * The old dataset browser has been replaced with the integrated
 * dataset browser in the ECharts chart builder.
 */
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/chart-builder",
      permanent: false,
    },
  };
};

export default function BrowseRedirect() {
  return null;
}
