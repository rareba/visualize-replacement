import { GetServerSideProps, NextPage } from "next";
import Head from "next/head";

import { AppLayout } from "@/components/layout";
import { Configurator, ConfiguratorStateProvider } from "@/configurator";
import { AddNewDatasetPanel } from "@/configurator/components/add-new-dataset-panel";
import { generateGrafanaDashboardUrl } from "@/utils/grafana-sparql";

type PageProps = {
  locale: string;
  chartId: string;
};

export const getServerSideProps: GetServerSideProps<PageProps> = async ({
  params,
  locale,
  query,
}) => {
  const chartId = params!.chartId as string;

  // For new chart creation, redirect to Grafana sandbox
  if (chartId === "new") {
    const cubeIri = query.cube as string | undefined;

    if (cubeIri) {
      const grafanaUrl =
        process.env.NEXT_PUBLIC_GRAFANA_URL || "http://localhost:3003";
      const dashboardUid =
        process.env.NEXT_PUBLIC_GRAFANA_DASHBOARD_UID || "lindas-template";

      const redirectUrl = generateGrafanaDashboardUrl(
        grafanaUrl,
        dashboardUid,
        cubeIri
      );

      return {
        redirect: {
          destination: redirectUrl,
          permanent: false,
        },
      };
    }

    // No cube provided, redirect to browse
    return {
      redirect: {
        destination: "/browse",
        permanent: false,
      },
    };
  }

  // For existing charts, show the configurator (legacy support)
  return {
    props: {
      locale: locale!,
      chartId,
    },
  };
};

const ChartConfiguratorPage: NextPage<PageProps> = ({ chartId }) => {
  return (
    <>
      <Head>
        {/* Disables responsive scaling for this page (other pages still work) */}
        <meta name="viewport" content="width=1280"></meta>
      </Head>
      <AppLayout editing>
        <ConfiguratorStateProvider chartId={chartId}>
          <Configurator />
          <AddNewDatasetPanel />
        </ConfiguratorStateProvider>
      </AppLayout>
    </>
  );
};

export default ChartConfiguratorPage;
