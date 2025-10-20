import Spinner from "@/components/spinner"
import { Checkbox } from "@/components/ui/checkbox"
import { ReactNode } from "react"
import useSWR from "swr"

// export type EnumLabels<T extends readonly string[]> = Partial<Record<T[number], ReactNode>> | ((value: T[number]) => ReactNode);

export interface EnumFilterPromiseMeta {
  type: "enum-promise",
  optionsPromise: () => Promise<string[]>
  labels?: (opt: string) => ReactNode
}


interface FilterEnumPromiseProps {
  schema: EnumFilterPromiseMeta
  value: string[]
  setValue: (val: string[] | undefined) => void
}

export function FilterEnumPromise({ schema, value, setValue }: FilterEnumPromiseProps) {
  const optionsPromise = schema.optionsPromise

  const { data, isLoading, error } = useSWR('/api/vendors', () => optionsPromise())

  const toggleValue = (opt: string) => {
    const newValue = value.includes(opt)
      ? value.filter((v) => v !== opt)
      : [...value, opt]
    setValue(newValue.length ? newValue : undefined)
  }

  if (isLoading) return <Spinner />
  if (error) return <p className="text-destructive italic font-bold">Error fetching data</p>
  if (!data) return <p>No data</p>

  return (
    <div className="flex flex-col gap-2">
      {data.map((opt) => (
        <label key={opt} className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={value.includes(opt)}
            onCheckedChange={() => toggleValue(opt)}
          />
          {schema.labels ? (
            typeof schema.labels === "function" ? schema.labels(opt) : <span>{schema.labels[opt]}</span>
          ) : <span>{opt}</span>}
        </label>))}
    </div>
  )
}

