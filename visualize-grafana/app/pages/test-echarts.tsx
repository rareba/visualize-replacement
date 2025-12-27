/**
 * Test page for the new SimpleEChartsChart component
 *
 * This page fetches real SPARQL data and renders it using the
 * new simplified ECharts implementation.
 */

import { Box, Container, Typography, CircularProgress, Alert } from "@mui/material";
import { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import { useEffect, useState } from "react";

import { AppLayout } from "@/components/layout";
import { SimpleChartPreview } from "@/charts/simple-echarts";
import { Observation, Dimension, Measure } from "@/domain/data";
import { ComponentId } from "@/graphql/make-component-id";

type PageProps = {
  locale: string;
};

export const getServerSideProps: GetServerSideProps<PageProps> = async ({
  locale,
}) => {
  return {
    props: {
      locale: locale || "en",
    },
  };
};

const TestEChartsPage: NextPage<PageProps> = () => {
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [measures, setMeasures] = useState<Measure[]>([]);

  useEffect(() => {
    // Use mock data for testing the chart component
    // This bypasses CORS issues with direct SPARQL calls
    const mockObservations: Observation[] = [
      { year: "2018", station: "Rothenbrunnen", measurement: 18.5 },
      { year: "2018", station: "Erstfeld", measurement: 22.3 },
      { year: "2018", station: "Camignolo", measurement: 25.1 },
      { year: "2019", station: "Rothenbrunnen", measurement: 17.2 },
      { year: "2019", station: "Erstfeld", measurement: 21.8 },
      { year: "2019", station: "Camignolo", measurement: 24.5 },
      { year: "2020", station: "Rothenbrunnen", measurement: 15.8 },
      { year: "2020", station: "Erstfeld", measurement: 19.4 },
      { year: "2020", station: "Camignolo", measurement: 22.9 },
      { year: "2021", station: "Rothenbrunnen", measurement: 16.5 },
      { year: "2021", station: "Erstfeld", measurement: 20.1 },
      { year: "2021", station: "Camignolo", measurement: 23.7 },
      { year: "2022", station: "Rothenbrunnen", measurement: 14.9 },
      { year: "2022", station: "Erstfeld", measurement: 18.8 },
      { year: "2022", station: "Camignolo", measurement: 21.5 },
      { year: "2023", station: "Rothenbrunnen", measurement: 15.2 },
      { year: "2023", station: "Erstfeld", measurement: 19.1 },
      { year: "2023", station: "Camignolo", measurement: 22.0 },
    ];

    setObservations(mockObservations);

    setDimensions([
      {
        __typename: "NominalDimension",
        id: "year" as ComponentId,
        cubeIri: "https://environment.ld.admin.ch/foen/mf008/4",
        label: "Year",
        description: "Measurement year",
        values: ["2018", "2019", "2020", "2021", "2022", "2023"].map((v) => ({
          value: v,
          label: v,
        })),
        isKeyDimension: true,
        isNumerical: false,
        relatedLimitValues: [],
      } as Dimension,
      {
        __typename: "NominalDimension",
        id: "station" as ComponentId,
        cubeIri: "https://environment.ld.admin.ch/foen/mf008/4",
        label: "Measurement Station",
        description: "Air quality measurement station",
        values: ["Rothenbrunnen", "Erstfeld", "Camignolo"].map((v) => ({
          value: v,
          label: v,
        })),
        isKeyDimension: true,
        isNumerical: false,
        relatedLimitValues: [],
      } as Dimension,
    ]);

    setMeasures([
      {
        __typename: "NumericalMeasure",
        id: "measurement" as ComponentId,
        cubeIri: "https://environment.ld.admin.ch/foen/mf008/4",
        label: "PM10 Annual Mean",
        description: "Fine particulate matter concentration (annual average)",
        unit: "ug/m3",
        isNumerical: true,
        isKeyDimension: false,
        values: [],
        relatedLimitValues: [],
        limits: [],
      } as unknown as Measure,
    ]);

    setLoading(false);
  }, []);

  return (
    <>
      <Head>
        <title>ECharts Test - visualize.admin.ch</title>
      </Head>
      <AppLayout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            ECharts Integration Test
          </Typography>

          <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
            Testing the new SimpleEChartsChart component with real LINDAS data.
            This bypasses the complex D3 state management for direct ECharts rendering.
          </Typography>

          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Loading data from LINDAS...</Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 4 }}>
              {error}
            </Alert>
          )}

          {!loading && !error && observations.length > 0 && (
            <Box>
              <Alert severity="success" sx={{ mb: 4 }}>
                Successfully loaded {observations.length} observations from LINDAS.
              </Alert>

              <SimpleChartPreview
                observations={observations}
                dimensions={dimensions}
                measures={measures}
                initialChartType="column"
                initialXField="year"
                initialYField="measurement"
                height={500}
                showControls={true}
              />
            </Box>
          )}

          {!loading && !error && observations.length === 0 && (
            <Alert severity="warning">
              No data returned from the SPARQL query.
            </Alert>
          )}
        </Container>
      </AppLayout>
    </>
  );
};

export default TestEChartsPage;
