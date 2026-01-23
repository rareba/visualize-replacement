/**
 * Component for embedding Superset dashboards and charts.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { embedDashboard } from '@superset-ui/embedded-sdk';
import { Box, CircularProgress, Typography, Alert, Paper } from '@mui/material';
import { supersetService } from '@/services/superset';

const SUPERSET_URL = import.meta.env.VITE_SUPERSET_URL || 'http://localhost:8088';

interface SupersetEmbedProps {
  type: 'dashboard' | 'chart';
  id: string;
  height?: string | number;
  filters?: Record<string, any>;
}

export function SupersetEmbed({
  type,
  id,
  height = '600px',
  filters: _filters,
}: SupersetEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Note: _filters can be used in future for dashboard filter presets
  void _filters;

  const fetchGuestToken = useCallback(async () => {
    try {
      // For demo purposes, we'll use environment variables for credentials
      // In production, this should be handled by a backend service
      const username = import.meta.env.VITE_SUPERSET_USERNAME || 'admin';
      const password = import.meta.env.VITE_SUPERSET_PASSWORD || 'admin';

      // Login to get access token
      const loginResponse = await supersetService.loginToSuperset(
        username,
        password
      );

      // Get guest token for the specific resource
      let guestToken: string;
      if (type === 'dashboard') {
        guestToken = await supersetService.getDashboardGuestToken(
          loginResponse.access_token,
          id
        );
      } else {
        guestToken = await supersetService.getChartGuestToken(
          loginResponse.access_token,
          id
        );
      }

      return guestToken;
    } catch (err) {
      console.error('Failed to fetch guest token:', err);
      throw new Error('Failed to authenticate with Superset');
    }
  }, [type, id]);

  useEffect(() => {
    let isMounted = true;

    const initEmbed = async () => {
      if (!containerRef.current) return;

      try {
        setLoading(true);
        setError(null);

        if (type === 'dashboard') {
          // Use Superset embedded SDK for dashboards
          await embedDashboard({
            id,
            supersetDomain: SUPERSET_URL,
            mountPoint: containerRef.current,
            fetchGuestToken,
            dashboardUiConfig: {
              hideTitle: false,
              hideChartControls: false,
              hideTab: false,
              filters: {
                visible: true,
                expanded: false,
              },
            },
          });
        } else {
          // For charts, we embed via iframe with guest token
          const token = await fetchGuestToken();

          if (containerRef.current && isMounted) {
            // Clear container using DOM methods
            while (containerRef.current.firstChild) {
              containerRef.current.removeChild(containerRef.current.firstChild);
            }

            // Create and append iframe safely
            const iframe = document.createElement('iframe');
            // Build URL safely using URL API
            const embedUrl = new URL('/superset/explore/', SUPERSET_URL);
            embedUrl.searchParams.set('standalone', 'true');
            embedUrl.searchParams.set('guest_token', token);
            embedUrl.searchParams.set('slice_id', id);

            iframe.src = embedUrl.toString();
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            iframe.allow = 'fullscreen';
            iframe.sandbox.add('allow-scripts', 'allow-same-origin', 'allow-forms');

            containerRef.current.appendChild(iframe);
          }
        }

        if (isMounted) {
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to embed Superset:', err);
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load embedded content'
          );
          setLoading(false);
        }
      }
    };

    initEmbed();

    return () => {
      isMounted = false;
    };
  }, [type, id, fetchGuestToken]);

  if (error) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="error">
          <Typography variant="body1" gutterBottom>
            Failed to load {type}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {error}
          </Typography>
        </Alert>
      </Paper>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height,
        bgcolor: 'background.paper',
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.paper',
            zIndex: 1,
          }}
        >
          <CircularProgress />
          <Typography sx={{ ml: 2 }} color="text.secondary">
            Loading {type}...
          </Typography>
        </Box>
      )}
      <Box
        ref={containerRef}
        sx={{
          width: '100%',
          height: '100%',
          '& iframe': {
            width: '100%',
            height: '100%',
          },
        }}
      />
    </Box>
  );
}
