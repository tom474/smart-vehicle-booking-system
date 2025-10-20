interface ColumnProps {
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onDestructiveAction?: (id: string) => void
}

export type { ColumnProps }
