import { useNavigate } from 'react-router-dom';
import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import { CubeSelector } from '@/components/CubeSelector';
import { CubeInfo } from '@/services/lindas';

export function CubesPage() {
  const navigate = useNavigate();

  const handleCubeSelect = (cube: CubeInfo) => {
    // Navigate to cube detail page with encoded IRI
    const encodedIri = encodeURIComponent(cube.iri);
    navigate(`/cubes/${encodedIri}`);
  };

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          color="inherit"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
          underline="hover"
        >
          Home
        </Link>
        <Typography color="text.primary">Data Cubes</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Data Cubes
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Browse available data cubes from LINDAS. Click on a cube to view its
          dimensions and observations.
        </Typography>
      </Box>

      {/* Cube selector */}
      <CubeSelector onSelect={handleCubeSelect} />
    </Box>
  );
}
