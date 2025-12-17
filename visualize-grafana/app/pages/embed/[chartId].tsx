import { GetServerSideProps } from "next";

/**
 * Legacy Embed Redirect
 *
 * This page used to display embedded charts. Since chart creation
 * has been moved to Grafana, this page now redirects to the dataset browser.
 *
 * For embedding Grafana panels, use /embed/grafana/[dashboardId] instead.
 */
export const getServerSideProps: GetServerSideProps = async () => {
    return {
        redirect: {
            destination: "/browse",
            permanent: true,
        },
    };
};

export default function LegacyEmbedRedirect() {
    return null;
}
