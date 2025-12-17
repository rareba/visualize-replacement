import { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useState, useCallback, useEffect } from "react";
import {
    Box,
    Typography,
    Button,
    Paper,
    TextField,
    Alert,
    Snackbar,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Divider,
    Card,
    CardContent,
    Grid,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import { AppLayout } from "@/components/layout";

type SavedDashboard = {
    id: string;
    name: string;
    cubeIri: string;
    savedAt: string;
    json: string;
};

/**
 * Dashboard Manager Page
 *
 * Allows users to:
 * - Import dashboard JSON from Grafana exports
 * - Save dashboards to localStorage
 * - Download saved dashboards as JSON files
 * - Open Grafana import page to restore dashboards
 */
const DashboardsPage: NextPage = () => {
    const [importJson, setImportJson] = useState("");
    const [savedDashboards, setSavedDashboards] = useState<SavedDashboard[]>([]);
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: "success" | "error" | "info";
    }>({
        open: false,
        message: "",
        severity: "success",
    });

    const grafanaUrl =
        process.env.NEXT_PUBLIC_GRAFANA_URL || "http://localhost:3003";

    // Load saved dashboards from localStorage on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("grafana-dashboards");
            if (saved) {
                try {
                    setSavedDashboards(JSON.parse(saved));
                } catch (e) {
                    console.error("Failed to parse saved dashboards:", e);
                }
            }
        }
    }, []);

    const handleImportDashboard = useCallback(() => {
        try {
            const dashboardData = JSON.parse(importJson);

            // Validate basic dashboard structure
            if (!dashboardData.uid && !dashboardData.title && !dashboardData.panels) {
                throw new Error("Invalid dashboard JSON structure");
            }

            // Extract cube IRI from template variables if present
            const cubeVariable = dashboardData.templating?.list?.find(
                (v: { name: string }) => v.name === "cube"
            );

            const newDashboard: SavedDashboard = {
                id: crypto.randomUUID(),
                name: dashboardData.title || "Imported Dashboard",
                cubeIri: cubeVariable?.current?.value || "",
                savedAt: new Date().toISOString(),
                json: importJson,
            };

            const updated = [...savedDashboards, newDashboard];
            setSavedDashboards(updated);
            localStorage.setItem("grafana-dashboards", JSON.stringify(updated));
            setImportJson("");
            setSnackbar({
                open: true,
                message: "Dashboard saved successfully!",
                severity: "success",
            });
        } catch (error) {
            setSnackbar({
                open: true,
                message:
                    "Invalid JSON format. Please check your dashboard export and try again.",
                severity: "error",
            });
        }
    }, [importJson, savedDashboards]);

    const handleDeleteDashboard = useCallback(
        (id: string) => {
            const updated = savedDashboards.filter((d) => d.id !== id);
            setSavedDashboards(updated);
            localStorage.setItem("grafana-dashboards", JSON.stringify(updated));
            setSnackbar({
                open: true,
                message: "Dashboard deleted.",
                severity: "info",
            });
        },
        [savedDashboards]
    );

    const handleExportDashboard = useCallback((dashboard: SavedDashboard) => {
        const blob = new Blob([dashboard.json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${dashboard.name.replace(/\s+/g, "-").toLowerCase()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, []);

    const handleOpenGrafanaImport = useCallback(() => {
        window.open(`${grafanaUrl}/dashboard/import`, "_blank");
    }, [grafanaUrl]);

    const handleCopyToClipboard = useCallback(async (dashboard: SavedDashboard) => {
        try {
            await navigator.clipboard.writeText(dashboard.json);
            setSnackbar({
                open: true,
                message: "Dashboard JSON copied to clipboard!",
                severity: "success",
            });
        } catch (e) {
            setSnackbar({
                open: true,
                message: "Failed to copy to clipboard",
                severity: "error",
            });
        }
    }, []);

    return (
        <AppLayout>
            <Head>
                <title>Dashboard Manager - visualize.admin.ch</title>
            </Head>
            <Box sx={{ maxWidth: 1200, mx: "auto", py: 4, px: 3 }}>
                <Typography variant="h3" gutterBottom>
                    Dashboard Manager
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                    Save and manage your Grafana dashboards. Export dashboards from
                    Grafana and store them here for future use.
                </Typography>

                <Grid container spacing={4}>
                    {/* How to Export Section */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h5" gutterBottom>
                                    How to Export from Grafana
                                </Typography>
                                <Typography
                                    variant="body2"
                                    component="div"
                                    color="text.secondary"
                                >
                                    <ol style={{ paddingLeft: "1.2rem", margin: 0 }}>
                                        <li>Open your dashboard in Grafana</li>
                                        <li>
                                            Click the <strong>Share</strong> icon (or press{" "}
                                            <code>s</code>)
                                        </li>
                                        <li>
                                            Select the <strong>Export</strong> tab
                                        </li>
                                        <li>
                                            Toggle <strong>Export for sharing externally</strong>
                                        </li>
                                        <li>
                                            Click <strong>Copy to clipboard</strong>
                                        </li>
                                        <li>Paste the JSON below to save it</li>
                                    </ol>
                                </Typography>
                                <Button
                                    variant="outlined"
                                    startIcon={<OpenInNewIcon />}
                                    onClick={() =>
                                        window.open(`${grafanaUrl}/dashboards`, "_blank")
                                    }
                                    sx={{ mt: 2 }}
                                >
                                    Open Grafana Dashboards
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* How to Import Section */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h5" gutterBottom>
                                    How to Import to Grafana
                                </Typography>
                                <Typography
                                    variant="body2"
                                    component="div"
                                    color="text.secondary"
                                >
                                    <ol style={{ paddingLeft: "1.2rem", margin: 0 }}>
                                        <li>Download or copy a saved dashboard below</li>
                                        <li>
                                            Open Grafana and go to{" "}
                                            <strong>Dashboards &gt; Import</strong>
                                        </li>
                                        <li>Paste the JSON or upload the file</li>
                                        <li>
                                            Click <strong>Load</strong> then <strong>Import</strong>
                                        </li>
                                    </ol>
                                </Typography>
                                <Button
                                    variant="outlined"
                                    startIcon={<OpenInNewIcon />}
                                    onClick={handleOpenGrafanaImport}
                                    sx={{ mt: 2 }}
                                >
                                    Open Grafana Import
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Import Section */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h5" gutterBottom>
                                Save Dashboard JSON
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={8}
                                placeholder="Paste your Grafana dashboard JSON here..."
                                value={importJson}
                                onChange={(e) => setImportJson(e.target.value)}
                                variant="outlined"
                                sx={{ mb: 2, fontFamily: "monospace" }}
                            />
                            <Button
                                variant="contained"
                                onClick={handleImportDashboard}
                                disabled={!importJson.trim()}
                            >
                                Save Dashboard
                            </Button>
                        </Paper>
                    </Grid>

                    {/* Saved Dashboards List */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h5" gutterBottom>
                                Saved Dashboards
                            </Typography>
                            {savedDashboards.length === 0 ? (
                                <Alert severity="info">
                                    No saved dashboards yet. Create visualizations in Grafana,
                                    export them, and save them here for future use.
                                </Alert>
                            ) : (
                                <List>
                                    {savedDashboards.map((dashboard, index) => (
                                        <Box key={dashboard.id}>
                                            {index > 0 && <Divider />}
                                            <ListItem sx={{ py: 2 }}>
                                                <ListItemText
                                                    primary={
                                                        <Typography variant="subtitle1" fontWeight="medium">
                                                            {dashboard.name}
                                                        </Typography>
                                                    }
                                                    secondary={
                                                        <>
                                                            {dashboard.cubeIri && (
                                                                <Typography
                                                                    variant="caption"
                                                                    display="block"
                                                                    sx={{
                                                                        fontFamily: "monospace",
                                                                        wordBreak: "break-all",
                                                                    }}
                                                                >
                                                                    Cube: {dashboard.cubeIri}
                                                                </Typography>
                                                            )}
                                                            <Typography variant="caption" display="block">
                                                                Saved:{" "}
                                                                {new Date(dashboard.savedAt).toLocaleString()}
                                                            </Typography>
                                                        </>
                                                    }
                                                />
                                                <ListItemSecondaryAction>
                                                    <IconButton
                                                        edge="end"
                                                        onClick={() => handleCopyToClipboard(dashboard)}
                                                        title="Copy JSON to clipboard"
                                                    >
                                                        <OpenInNewIcon />
                                                    </IconButton>
                                                    <IconButton
                                                        edge="end"
                                                        onClick={() => handleExportDashboard(dashboard)}
                                                        title="Download JSON file"
                                                        sx={{ ml: 1 }}
                                                    >
                                                        <DownloadIcon />
                                                    </IconButton>
                                                    <IconButton
                                                        edge="end"
                                                        onClick={() => handleDeleteDashboard(dashboard.id)}
                                                        title="Delete"
                                                        sx={{ ml: 1 }}
                                                        color="error"
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </ListItemSecondaryAction>
                                            </ListItem>
                                        </Box>
                                    ))}
                                </List>
                            )}
                        </Paper>
                    </Grid>
                </Grid>

                {/* Back to Browse */}
                <Box sx={{ mt: 4, textAlign: "center" }}>
                    <Link href="/browse" passHref legacyBehavior>
                        <Button variant="outlined" component="a">
                            Back to Dataset Browser
                        </Button>
                    </Link>
                </Box>
            </Box>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    severity={snackbar.severity}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </AppLayout>
    );
};

export default DashboardsPage;
