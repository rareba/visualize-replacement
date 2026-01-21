import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { HomePage } from './pages/HomePage';
import { CubesPage } from './pages/CubesPage';
import { CubeDetailPage } from './pages/CubeDetailPage';
import { DashboardPage } from './pages/DashboardPage';
import { ChartPage } from './pages/ChartPage';
import { GraphQLPlayground } from './pages/GraphQLPlayground';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/cubes" element={<CubesPage />} />
        <Route path="/cubes/:cubeId" element={<CubeDetailPage />} />
        <Route path="/dashboard/:dashboardId" element={<DashboardPage />} />
        <Route path="/chart/:chartId" element={<ChartPage />} />
        <Route path="/graphql" element={<GraphQLPlayground />} />
      </Routes>
    </Layout>
  );
}

export default App;
