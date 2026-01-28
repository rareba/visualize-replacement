import { Box, Typography, Paper, Chip } from '@mui/material';
import { useDroppable } from '@dnd-kit/core';
import type { CubeColumn } from '@/services/lindas';

interface FieldWellProps {
  id: string;
  title: string;
  description?: string;
  fields: CubeColumn[];
  onRemoveField: (fieldName: string) => void;
  icon?: string;
  acceptTypes?: ('dimension' | 'temporalDimension' | 'measure')[];
}

// Helper to get icon for field type
const getFieldIcon = (type: string) => {
  switch (type) {
    case 'temporalDimension':
      return '📅';
    case 'measure':
      return '#';
    default:
      return '🏷️';
  }
};

// Helper to get color for field type
const getFieldColor = (type: string) => {
  switch (type) {
    case 'temporalDimension':
      return '#1976d2';
    case 'measure':
      return '#2e7d32';
    default:
      return '#7b1fa2';
  }
};

export function FieldWell({ id, title, description, fields, onRemoveField, icon, acceptTypes }: FieldWellProps) {
  const { setNodeRef, isOver, active } = useDroppable({ id });

  // Check if the currently dragged item can be accepted
  const canAccept = active?.data?.current?.column
    ? acceptTypes?.includes(active.data.current.column.type)
    : true;

  const isOverValid = isOver && canAccept;
  const isOverInvalid = isOver && !canAccept;

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {icon} {title}
        {acceptTypes && (
          <Typography component="span" variant="caption" color="text.disabled" sx={{ ml: 1 }}>
            ({acceptTypes.includes('measure') ? 'measures only' : 'dimensions only'})
          </Typography>
        )}
      </Typography>
      <Paper
        ref={setNodeRef}
        sx={{
          p: 1.5,
          minHeight: 60,
          border: '2px dashed',
          borderColor: isOverInvalid
            ? 'error.main'
            : isOverValid
              ? 'success.main'
              : 'grey.300',
          backgroundColor: isOverInvalid
            ? 'error.50'
            : isOverValid
              ? 'success.50'
              : 'background.paper',
          transition: 'all 0.2s',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0.5,
          alignItems: 'center',
        }}
      >
        {fields.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>
            Drop {description || 'fields'} here
          </Typography>
        ) : (
          fields.map((field) => (
            <Chip
              key={field.name}
              label={`${getFieldIcon(field.type)} ${field.label || field.name}`}
              size="small"
              onDelete={() => onRemoveField(field.name)}
              sx={{
                backgroundColor: `${getFieldColor(field.type)}20`,
                borderColor: getFieldColor(field.type),
                border: '1px solid',
                '& .MuiChip-label': {
                  fontWeight: 500,
                  color: getFieldColor(field.type),
                },
                '& .MuiChip-deleteIcon': {
                  color: `${getFieldColor(field.type)}cc`,
                  '&:hover': {
                    color: getFieldColor(field.type),
                  },
                },
              }}
            />
          ))
        )}
      </Paper>
    </Box>
  );
}
