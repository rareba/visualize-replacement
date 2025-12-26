import { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useEffect } from "react";
import { Box, Typography, Button, Paper, CircularProgress } from "@mui/material";

import { generateGrafanaDashboardWithQuery } from "@/utils/grafana-sparql";

type PageProps = {
    grafanaUrl: string;
    dashboardUid: string;
    cubeIri: string | null;
    redirectUrl: string | null;
    error?: string;
};

/**
 * Grafana Dashboard Redirect Page
 *
 * This page redirects users to the Grafana template dashboard
 * with pre-built SPARQL queries for immediate data access.
 *
 * URL: /create/grafana?cube=<cubeIri>
 *
 * The redirect includes:
 * - var-cube: The cube IRI
 * - var-query: Pre-built SPARQL query for observations (pivoted to columns)
 * - var-dimensionsQuery: Pre-built SPARQL query for dimension metadata
 *
 * The template dashboard displays:
 * - Table with all observations (columns auto-detected)
 * - Dimensions reference table
 * - Instructions for creating custom charts
 */
export const getServerSideProps: GetServerSideProps<PageProps> = async ({
    query,
}) => {
    const cubeIri = (query.cube as string) || null;

    const grafanaUrl =
        process.env.NEXT_PUBLIC_GRAFANA_URL || "http://localhost:3003";
    const dashboardUid =
        process.env.NEXT_PUBLIC_GRAFANA_DASHBOARD_UID || "lindas-template";

    // If we have a cube IRI, redirect directly to Grafana template dashboard
    // The new function passes pre-built SPARQL queries for immediate data access
    if (cubeIri) {
        const redirectUrl = generateGrafanaDashboardWithQuery(
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

    // If no cube, show error page with link to browse
    return {
        props: {
            grafanaUrl,
            dashboardUid,
            cubeIri: null,
            redirectUrl: null,
            error: "No dataset selected. Please select a dataset from the browser first.",
        },
    };
};

/**
 * Error/Loading component
 */
const GrafanaRedirectPage: NextPage<PageProps> = ({
    grafanaUrl,
    dashboardUid,
    cubeIri,
    redirectUrl,
    error,
}) => {
    // Client-side redirect fallback
    useEffect(() => {
        if (cubeIri && redirectUrl) {
            window.location.href = redirectUrl;
        }
    }, [cubeIri, redirectUrl]);

    if (error) {
        return (
            <>
                <Head>
                    <title>Error - Create Visualization</title>
                </Head>
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: "100vh",
                        padding: 4,
                        backgroundColor: "#f5f5f5",
                    }}
                >
                    <Paper
                        sx={{
                            padding: 4,
                            maxWidth: 500,
                            textAlign: "center",
                        }}
                    >
                        <Typography variant="h4" gutterBottom color="error">
                            No Dataset Selected
                        </Typography>
                        <Typography variant="body1" paragraph color="text.secondary">
                            {error}
                        </Typography>
                        <Link href="/browse" passHref legacyBehavior>
                            <Button variant="contained" component="a" sx={{ mt: 2 }}>
                                Browse Datasets
                            </Button>
                        </Link>
                    </Paper>
                </Box>
            </>
        );
    }

    // Loading state (should rarely be seen due to server-side redirect)
    return (
        <>
            <Head>
                <title>Opening Grafana...</title>
            </Head>
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "100vh",
                    padding: 4,
                    backgroundColor: "#f5f5f5",
                }}
            >
                <Paper
                    sx={{
                        padding: 4,
                        maxWidth: 500,
                        textAlign: "center",
                    }}
                >
                    <CircularProgress size={48} sx={{ mb: 3 }} />
                    <Typography variant="h5" gutterBottom>
                        Opening Grafana Dashboard
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                        Preparing your visualization sandbox with the selected dataset...
                    </Typography>
                    {redirectUrl && (
                        <Typography variant="caption" color="text.secondary">
                            If you are not redirected automatically,{" "}
                            <a
                                href={redirectUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: "inherit" }}
                            >
                                click here
                            </a>
                            .
                        </Typography>
                    )}
                </Paper>
            </Box>
        </>
    );
};

export default GrafanaRedirectPage;
