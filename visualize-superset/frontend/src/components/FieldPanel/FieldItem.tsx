import { Chip } from '@mui/material';
import { useDraggable } from '@dnd-kit/core';
import type { CubeColumn } from '@/services/lindas';

interface FieldItemProps {
  column: CubeColumn;
}

export function FieldItem({ column }: FieldItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: column.name,
    data: { column },
  });

  const getTypeColor = () => {
    switch (column.type) {
      case 'temporalDimension':
        return '#1976d2';
      case 'measure':
        return '#2e7d32';
      default:
        return '#7b1fa2';
    }
  };

  const getIcon = () => {
    switch (column.type) {
      case 'temporalDimension':
        return '📅';
      case 'measure':
        return '#';
      default:
        return '🏷️';
    }
  };

  return (
    <Chip
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      label={`${getIcon()} ${column.label || column.name}`}
      sx={{
        touchAction: 'none',
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: getTypeColor(),
        color: 'white',
        '&:hover': {
          backgroundColor: `${getTypeColor()}cc`,
        },
        '& .MuiChip-label': {
          fontWeight: 500,
        },
      }}
      size="small"
    />
  );
}
