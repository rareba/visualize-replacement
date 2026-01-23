/**
 * Component for browsing and selecting data cubes from LINDAS.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  TextField,
  Typography,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Skeleton,
  InputAdornment,
  Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import StorageIcon from '@mui/icons-material/Storage';
import { lindasService, CubeInfo, Endpoint } from '@/services/lindas';

interface CubeSelectorProps {
  onSelect?: (cube: CubeInfo) => void;
}

export function CubeSelector({ onSelect }: CubeSelectorProps) {
  const [search, setSearch] = useState('');
  const [endpoint, setEndpoint] = useState<Endpoint>('prod');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  const handleSearchChange = (value: string) => {
    setSearch(value);
    // Simple debounce
    setTimeout(() => setDebouncedSearch(value), 300);
  };

  const {
    data: cubes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['cubes', endpoint, debouncedSearch],
    queryFn: () =>
      lindasService.listCubes(endpoint, debouncedSearch || undefined, 50),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleCubeClick = (cube: CubeInfo) => {
    if (onSelect) {
      onSelect(cube);
    }
  };

  return (
    <Box>
      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <TextField
          fullWidth
          placeholder="Search cubes..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          size="small"
        />

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Endpoint</InputLabel>
          <Select
            value={endpoint}
            label="Endpoint"
            onChange={(e) => setEndpoint(e.target.value as Endpoint)}
          >
            <MenuItem value="prod">Production</MenuItem>
            <MenuItem value="int">Integration</MenuItem>
            <MenuItem value="test">Test</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Error state */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load cubes. Please try again later.
        </Alert>
      )}

      {/* Loading state */}
      {isLoading && (
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="80%" height={32} />
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="100%" height={60} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Cubes list */}
      {cubes && cubes.length > 0 && (
        <Grid container spacing={2}>
          {cubes.map((cube) => (
            <Grid item xs={12} sm={6} md={4} key={cube.iri}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'box-shadow 0.2s',
                  '&:hover': {
                    boxShadow: 4,
                  },
                }}
              >
                <CardActionArea
                  onClick={() => handleCubeClick(cube)}
                  sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box
                      sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}
                    >
                      <StorageIcon color="primary" sx={{ mt: 0.5 }} />
                      <Typography variant="h6" component="h3" sx={{ lineHeight: 1.3 }}>
                        {cube.title}
                      </Typography>
                    </Box>

                    {cube.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {cube.description}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {cube.publisher && (
                        <Chip
                          size="small"
                          label={cube.publisher}
                          variant="outlined"
                        />
                      )}
                      {cube.identifier && (
                        <Chip
                          size="small"
                          label={cube.identifier}
                          color="primary"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Empty state */}
      {cubes && cubes.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <StorageIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No cubes found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {search
              ? 'Try adjusting your search terms'
              : 'No data cubes available in this endpoint'}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
