import { ReactNode, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Table } from '@tanstack/react-table'

export type DateRangeMeta = {
  type: "date-range",
  min?: Date
  minId?: string,
  max?: Date
  maxId?: string,
  label?: (value: Date) => ReactNode
}

interface FilterDateRangeProps<T> {
  table: Table<T>
  schema: DateRangeMeta
  value: string[]
  setValue: (val: string[] | undefined) => void
}

export function FilterDateRange<T>({
  table,
  schema,
  value,
  setValue
}: FilterDateRangeProps<T>) {
  const {
    min = new Date(new Date().getFullYear() - 1, 0, 1), // Default: start of last year
    max = new Date(new Date().getFullYear() + 1, 0, 1), // Default: start of next year
    label,
  } = schema

  // Convert prop value -> Date[]
  const initialRange = useMemo(() => {
    if (value.length === 2) {
      const dates = value.map((v) => new Date(v))
      if (dates.every((d) => !isNaN(d.getTime()))) return dates
    }
    // Default: today and tomorrow
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return [today, tomorrow]
  }, [value])

  // Local draft value (only updated on date picker change)
  const [draftRange, setDraftRange] = useState<Date[]>(initialRange)

  const applyChange = () => {
    const isoStrings = draftRange.map(d => d.toISOString())
    setValue(isoStrings.length ? [isoStrings.join(',')] : undefined)
    table.setColumnFilters((old) => {
      console.log(old)
      const without = old.filter(
        (f) => f.id !== schema.minId && f.id !== schema.maxId
      )
      return [
        ...without,
        ...(schema.minId ? [{ id: schema.minId, value: draftRange[0].toISOString() }] : []),
        ...(schema.maxId ? [{ id: schema.maxId, value: draftRange[1].toISOString() }] : []),
      ]
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{label?.(draftRange[0]) ?? formatDate(draftRange[0])}</span>
        <span>{label?.(draftRange[1]) ?? formatDate(draftRange[1])}</span>
      </div>

      <Calendar
        mode="range"
        defaultMonth={draftRange[0]}
        selected={{
          from: draftRange[0],
          to: draftRange[1]
        }}
        onSelect={(range) => {
          if (range?.from && range?.to) {
            setDraftRange([range.from, range.to])
          } else if (range?.from) {
            setDraftRange([range.from, range.from])
          }
        }}
        numberOfMonths={2}
        disabled={(date) =>
          date < min || date > max
        }
      />

      <Button
        variant="secondary"
        onClick={applyChange}
        size="sm"
        className="self-end"
      >
        Apply
      </Button>
    </div>
  )
}
