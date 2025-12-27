import { GetServerSideProps } from "next";

/**
 * Redirect browse sub-routes to the new chart builder
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
