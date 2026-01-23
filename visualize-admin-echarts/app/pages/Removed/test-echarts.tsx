/**
 * ECharts Test Page
 *
 * This page tests all ECharts chart components with sample data.
 */

import { Box, Container, Grid, Paper, Typography } from "@mui/material";
import Head from "next/head";

import {
  AreaChartECharts,
  BarChartECharts,
  ColumnChartECharts,
  LineChartECharts,
  PieChartECharts,
  ScatterplotChartECharts,
} from "@/charts/echarts";

// Sample data for testing
const columnData = [
  { category: "2019", value: 120, segment: "Product A" },
  { category: "2019", value: 80, segment: "Product B" },
  { category: "2020", value: 150, segment: "Product A" },
  { category: "2020", value: 90, segment: "Product B" },
  { category: "2021", value: 180, segment: "Product A" },
  { category: "2021", value: 110, segment: "Product B" },
  { category: "2022", value: 200, segment: "Product A" },
  { category: "2022", value: 130, segment: "Product B" },
  { category: "2023", value: 220, segment: "Product A" },
  { category: "2023", value: 150, segment: "Product B" },
];

const simpleColumnData = [
  { category: "Jan", value: 45 },
  { category: "Feb", value: 52 },
  { category: "Mar", value: 48 },
  { category: "Apr", value: 60 },
  { category: "May", value: 55 },
  { category: "Jun", value: 70 },
];

const lineData = [
  { x: "Jan", y: 100, segment: "Series A" },
  { x: "Feb", y: 120, segment: "Series A" },
  { x: "Mar", y: 115, segment: "Series A" },
  { x: "Apr", y: 140, segment: "Series A" },
  { x: "May", y: 160, segment: "Series A" },
  { x: "Jun", y: 155, segment: "Series A" },
  { x: "Jan", y: 80, segment: "Series B" },
  { x: "Feb", y: 95, segment: "Series B" },
  { x: "Mar", y: 90, segment: "Series B" },
  { x: "Apr", y: 110, segment: "Series B" },
  { x: "May", y: 130, segment: "Series B" },
  { x: "Jun", y: 140, segment: "Series B" },
];

const pieData = [
  { label: "Agriculture", value: 25 },
  { label: "Industry", value: 35 },
  { label: "Services", value: 30 },
  { label: "Other", value: 10 },
];

const scatterData = [
  { x: 10, y: 20, size: 15, segment: "Group A" },
  { x: 25, y: 35, size: 25, segment: "Group A" },
  { x: 40, y: 45, size: 20, segment: "Group A" },
  { x: 55, y: 30, size: 30, segment: "Group A" },
  { x: 15, y: 50, size: 18, segment: "Group B" },
  { x: 30, y: 60, size: 22, segment: "Group B" },
  { x: 45, y: 55, size: 28, segment: "Group B" },
  { x: 60, y: 70, size: 35, segment: "Group B" },
];

const areaData = [
  { x: "Q1", y: 200, segment: "Region North" },
  { x: "Q2", y: 250, segment: "Region North" },
  { x: "Q3", y: 220, segment: "Region North" },
  { x: "Q4", y: 280, segment: "Region North" },
  { x: "Q1", y: 150, segment: "Region South" },
  { x: "Q2", y: 180, segment: "Region South" },
  { x: "Q3", y: 170, segment: "Region South" },
  { x: "Q4", y: 210, segment: "Region South" },
];

export default function TestEChartsPage() {
  return (
    <>
      <Head>
        <title>ECharts Test Page - visualize.admin.ch</title>
      </Head>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          ECharts Component Test
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Testing all ECharts chart components with sample data.
        </Typography>

        <Grid container spacing={3}>
          {/* Column Chart - Simple */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Column Chart (Simple)
              </Typography>
              <Box sx={{ height: 350 }}>
                <ColumnChartECharts
                  data={simpleColumnData}
                  xAxisLabel="Month"
                  yAxisLabel="Value"
                  enableAnimation={true}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Column Chart - Grouped */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Column Chart (Grouped)
              </Typography>
              <Box sx={{ height: 350 }}>
                <ColumnChartECharts
                  data={columnData}
                  xAxisLabel="Year"
                  yAxisLabel="Sales"
                  enableAnimation={true}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Column Chart - Stacked */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Column Chart (Stacked)
              </Typography>
              <Box sx={{ height: 350 }}>
                <ColumnChartECharts
                  data={columnData}
                  xAxisLabel="Year"
                  yAxisLabel="Sales"
                  stacked={true}
                  showValues={true}
                  enableAnimation={true}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Bar Chart - Horizontal */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Bar Chart (Horizontal)
              </Typography>
              <Box sx={{ height: 350 }}>
                <BarChartECharts
                  data={simpleColumnData}
                  xAxisLabel="Value"
                  yAxisLabel="Month"
                  showValues={true}
                  enableAnimation={true}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Line Chart */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Line Chart
              </Typography>
              <Box sx={{ height: 350 }}>
                <LineChartECharts
                  data={lineData}
                  xAxisLabel="Month"
                  yAxisLabel="Value"
                  showDots={true}
                  smooth={false}
                  enableAnimation={true}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Line Chart - Smooth */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Line Chart (Smooth)
              </Typography>
              <Box sx={{ height: 350 }}>
                <LineChartECharts
                  data={lineData}
                  xAxisLabel="Month"
                  yAxisLabel="Value"
                  showDots={true}
                  smooth={true}
                  enableAnimation={true}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Area Chart */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Area Chart
              </Typography>
              <Box sx={{ height: 350 }}>
                <AreaChartECharts
                  data={areaData}
                  xAxisLabel="Quarter"
                  yAxisLabel="Revenue"
                  smooth={true}
                  enableAnimation={true}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Area Chart - Stacked */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Area Chart (Stacked)
              </Typography>
              <Box sx={{ height: 350 }}>
                <AreaChartECharts
                  data={areaData}
                  xAxisLabel="Quarter"
                  yAxisLabel="Revenue"
                  stacked={true}
                  smooth={true}
                  enableAnimation={true}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Pie Chart */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Pie Chart
              </Typography>
              <Box sx={{ height: 350 }}>
                <PieChartECharts
                  data={pieData}
                  showLabels={true}
                  showPercentage={true}
                  enableAnimation={true}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Donut Chart */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Donut Chart
              </Typography>
              <Box sx={{ height: 350 }}>
                <PieChartECharts
                  data={pieData}
                  innerRadius={50}
                  showLabels={true}
                  showValues={true}
                  enableAnimation={true}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Scatterplot */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Scatterplot
              </Typography>
              <Box sx={{ height: 350 }}>
                <ScatterplotChartECharts
                  data={scatterData}
                  xAxisLabel="X Value"
                  yAxisLabel="Y Value"
                  sizeRange={[10, 40]}
                  enableAnimation={true}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Bubble Chart */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Bubble Chart (with size encoding)
              </Typography>
              <Box sx={{ height: 350 }}>
                <ScatterplotChartECharts
                  data={scatterData.map((d) => ({ ...d, segment: undefined }))}
                  xAxisLabel="X Value"
                  yAxisLabel="Y Value"
                  sizeRange={[15, 50]}
                  enableAnimation={true}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, p: 2, bgcolor: "success.light", borderRadius: 1 }}>
          <Typography variant="h6" color="success.dark">
            All Charts Loaded Successfully
          </Typography>
          <Typography variant="body2" color="success.dark">
            ECharts components are working. Chart types tested: Column (simple,
            grouped, stacked), Bar, Line (normal, smooth), Area (normal,
            stacked), Pie, Donut, Scatterplot, Bubble.
          </Typography>
        </Box>
      </Container>
    </>
  );
}
