import { GetServerSideProps, NextPage } from "next";
import Head from "next/head";

type PageProps = {
    grafanaUrl: string;
    dashboardId: string;
    panelId: string;
    theme: string;
};

/**
 * Grafana Embed Page
 * 
 * Allows external websites to embed Grafana panels through visualize URLs.
 * This provides a consistent embed experience similar to the original visualize embed.
 * 
 * URL: /embed/grafana/[dashboardId]?panelId=1&theme=light
 */
export const getServerSideProps: GetServerSideProps<PageProps> = async ({
    query,
    params,
}) => {
    const dashboardId = params?.dashboardId as string;
    const panelId = (query.panelId as string) || "1";
    const theme = (query.theme as string) || "light";

    const grafanaUrl =
        process.env.NEXT_PUBLIC_GRAFANA_URL || "http://localhost:3003";

    return {
        props: {
            grafanaUrl,
            dashboardId,
            panelId,
            theme,
        },
    };
};

const GrafanaEmbedPage: NextPage<PageProps> = ({
    grafanaUrl,
    dashboardId,
    panelId,
    theme,
}) => {
    // Full embed URL for Grafana panel
    const embedUrl = `${grafanaUrl}/d-solo/${dashboardId}?panelId=${panelId}&theme=${theme}`;

    return (
        <>
            <Head>
                <title>Embedded Visualization</title>
                <meta name="robots" content="noindex" />
            </Head>
            <div
                style={{
                    width: "100%",
                    height: "100vh",
                    margin: 0,
                    padding: 0,
                    overflow: "hidden",
                }}
            >
                <iframe
                    src={embedUrl}
                    style={{
                        width: "100%",
                        height: "100%",
                        border: "none",
                    }}
                    title="Grafana Visualization"
                    allowFullScreen
                />
            </div>
        </>
    );
};

export default GrafanaEmbedPage;
