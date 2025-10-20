import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { useState } from "react"

export type DateTimeFilterMeta = {
  type: "date-time"
  min?: Date
  max?: Date
  label?: (date: Date) => React.ReactNode
}

interface FilterDateTimeProps {
  schema: DateTimeFilterMeta
  value: string[]
  setValue: (val: string[] | undefined) => void
}

export function FilterDateTime({
  schema,
  value,
  setValue,
}: FilterDateTimeProps) {
  const { min, max, label } = schema

  // Initial single date (if value exists)
  const initialDate = value?.[0] ? new Date(value[0]) : undefined

  const [draftDate, setDraftDate] = useState<Date | undefined>(initialDate)

  const applyChange = () => {
    if (draftDate) {
      setValue([draftDate.toISOString()])
    } else {
      setValue(undefined)
    }
  }

  return (
    <div className="flex flex-col gap-4 w-fit self-center">
      <Calendar
        className="w-full"
        mode="single"
        selected={draftDate}
        onSelect={setDraftDate}
        disabled={[
          ...(min ? [{ before: min }] : []),
          ...(max ? [{ after: max }] : []),
        ]}
      />

      {draftDate && (
        <div className="flex justify-center text-sm text-muted-foreground">
          <span>{label?.(draftDate) ?? draftDate.toLocaleDateString()}</span>
        </div>
      )}

      <Button
        variant="secondary"
        size="sm"
        className="self-end"
        onClick={applyChange}
      >
        Apply
      </Button>
    </div>
  )
}

