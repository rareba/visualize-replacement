import { Box, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { FieldItem } from './FieldItem';
import type { CubeColumn } from '@/services/lindas';

interface FieldPanelProps {
  columns: CubeColumn[];
  type: 'dimensions' | 'measures';
}

export function FieldPanel({ columns, type }: FieldPanelProps) {
  // Filter columns based on type
  const filteredColumns = columns.filter(col => {
    if (type === 'dimensions') {
      return col.type === 'dimension' || col.type === 'temporalDimension';
    } else {
      return col.type === 'measure';
    }
  });

  const getTypeLabel = () => type === 'dimensions' ? 'Dimensions' : 'Measures';

  const getTypeDescription = () => {
    if (type === 'dimensions') {
      return '🏷️ Categorical fields for grouping';
    } else {
      return '# Numeric fields for values';
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box>
            <Typography variant="subtitle2" fontWeight="medium">
              {getTypeLabel()} ({filteredColumns.length})
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {getTypeDescription()}
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 1 }}>
          {filteredColumns.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
              No {type.toLowerCase()} available
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {filteredColumns.map((column) => (
                <FieldItem
                  key={column.name}
                  column={column}
                />
              ))}
            </Box>
          )}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
