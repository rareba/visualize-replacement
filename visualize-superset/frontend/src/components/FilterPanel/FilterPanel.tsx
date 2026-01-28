import { Box, Typography, Paper, Accordion, AccordionSummary, AccordionDetails, Select, MenuItem, FormControl, TextField, IconButton, Button } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Close as CloseIcon, Add as AddIcon } from '@mui/icons-material';
import type { CubeColumn } from '@/services/lindas';

export interface Filter {
  id: string;
  column: CubeColumn;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'greater_equal' | 'less_equal';
  value: string;
}

interface FilterPanelProps {
  columns: CubeColumn[];
  filters: Filter[];
  onAddFilter: (filter: Filter) => void;
  onRemoveFilter: (filterId: string) => void;
  onUpdateFilter: (filterId: string, updates: Partial<Filter>) => void;
}

export function FilterPanel({ columns, filters, onAddFilter, onRemoveFilter, onUpdateFilter }: FilterPanelProps) {
  const addNewFilter = () => {
    if (columns.length === 0) return;

    const firstColumn = columns[0];
    const newFilter: Filter = {
      id: `filter-${Date.now()}`,
      column: firstColumn,
      operator: 'equals',
      value: '',
    };
    onAddFilter(newFilter);
  };

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle2" fontWeight="medium">
          Filters ({filters.length})
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 1 }}>
        {filters.length === 0 ? (
          <Button
            fullWidth
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addNewFilter}
            size="small"
          >
            Add Filter
          </Button>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {filters.map((filter) => (
              <Paper key={filter.id} sx={{ p: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <Select
                      value={filter.column.name}
                      onChange={(e) => {
                        const column = columns.find(c => c.name === e.target.value);
                        if (column) onUpdateFilter(filter.id, { column });
                      }}
                    >
                      {columns.map((col) => (
                        <MenuItem key={col.name} value={col.name}>
                          {col.label || col.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ flex: 1 }}>
                    <Select
                      value={filter.operator}
                      onChange={(e) => onUpdateFilter(filter.id, { operator: e.target.value as Filter['operator'] })}
                    >
                      <MenuItem value="equals">equals</MenuItem>
                      <MenuItem value="not_equals">not equals</MenuItem>
                      <MenuItem value="contains">contains</MenuItem>
                      <MenuItem value="greater_than">greater than</MenuItem>
                      <MenuItem value="less_than">less than</MenuItem>
                      <MenuItem value="greater_equal">≥</MenuItem>
                      <MenuItem value="less_equal">≤</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    size="small"
                    value={filter.value}
                    onChange={(e) => onUpdateFilter(filter.id, { value: e.target.value })}
                    placeholder="Value"
                    sx={{ flex: 1 }}
                  />

                  <IconButton
                    size="small"
                    onClick={() => onRemoveFilter(filter.id)}
                    color="error"
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
              </Paper>
            ))}

            <Button
              fullWidth
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addNewFilter}
              size="small"
              sx={{ mt: 1 }}
            >
              Add Filter
            </Button>
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
