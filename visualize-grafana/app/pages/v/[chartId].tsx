import { GetServerSideProps } from "next";

/**
 * Legacy Chart View Redirect
 *
 * This page used to display published charts. Since chart creation
 * has been moved to Grafana, this page now redirects to the dataset browser.
 *
 * Users can create new visualizations by:
 * 1. Browsing to /browse
 * 2. Selecting a dataset
 * 3. Clicking "Create visualization" to open Grafana
 */
export const getServerSideProps: GetServerSideProps = async () => {
    return {
        redirect: {
            destination: "/browse",
            permanent: true,
        },
    };
};

export default function LegacyChartRedirect() {
    return null;
}
