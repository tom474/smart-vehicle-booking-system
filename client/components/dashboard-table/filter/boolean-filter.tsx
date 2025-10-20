import { Checkbox } from "@/components/ui/checkbox"

export interface BooleanFilterMeta {
  type: "boolean",
}

export function FilterBoolean({
  value,
  setValue,
}: {
  value: string[]
  setValue: (val: string[] | undefined) => void
}) {
  const checked = value?.[0] === "true"

  const toggle = () => {
    if (checked) {
      setValue(undefined) // clear filter
    } else {
      setValue(["true"]) // only one state = true
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Checkbox checked={checked} onClick={e => e.stopPropagation()} onCheckedChange={toggle} />
    </div>
  )
}
