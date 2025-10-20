import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Table } from "@tanstack/react-table"
import { ReactNode, useEffect, useMemo, useRef, useState } from "react"

export type NumberFilterMeta = {
  type: "number",
  min?: number
  minId?: string,
  max?: number
  maxId?: string,
  step?: number
  label?: (value: number) => ReactNode
}

interface FilterNumberProps<T> {
  table: Table<T>
  schema: NumberFilterMeta
  value: string[]
  setValue: (val: string[] | undefined) => void
}

export function FilterNumber<T>({
  table,
  schema,
  value,
  setValue
}: FilterNumberProps<T>) {
  const {
    min = 0,
    max = 100,
    step = 1,
    label,
  } = schema

  // Convert prop value -> number[]
  const initialRange = useMemo(() => {
    if (value.length === 2) {
      const nums = value.map((v) => Number(v))
      if (nums.every((n) => !isNaN(n))) return nums
    }
    return [min, max]
  }, [value, min, max])



  // Local draft value (only updated on slider move)
  const [draftRange, setDraftRange] = useState<number[]>(initialRange)

  const [isEditingMin, setIsEditingMin] = useState(false);
  const inputMinRef = useRef<HTMLInputElement | null>(null);

  const [isEditingMax, setIsEditingMax] = useState(false);
  const inputMaxRef = useRef<HTMLInputElement | null>(null);

  const [inputValues, setInputValues] = useState<string[]>(() =>
    initialRange.map(String)
  )

  const applyChange = () => {
    const strVals = draftRange.map(String)
    setValue(strVals.length ? [strVals.join()] : undefined)
    table.setColumnFilters((old) => {
      const without = old.filter(
        (f) => f.id !== schema.minId && f.id !== schema.maxId
      )
      return [
        ...without,
        ...(schema.minId ? [{ id: schema.minId, value: draftRange[0] }] : []),
        ...(schema.maxId ? [{ id: schema.maxId, value: draftRange[1] }] : []),
      ]
    })
  }

  useEffect(() => {
    setInputValues(draftRange.map(String))
  }, [draftRange])

  const handleInputChange = (index: number, inputValue: string) => {
    const newInputValues = [...inputValues]
    newInputValues[index] = inputValue
    setInputValues(newInputValues)

    // Only update draft range if the input is a valid number
    const numValue = Number(inputValue)
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(min, Math.min(max, numValue))
      const newDraftRange = [...draftRange]
      newDraftRange[index] = clampedValue

      // Ensure min <= max
      if (index === 0 && clampedValue > newDraftRange[1]) {
        newDraftRange[1] = clampedValue
      } else if (index === 1 && clampedValue < newDraftRange[0]) {
        newDraftRange[0] = clampedValue
      }

      setDraftRange(newDraftRange)
    }
  }

  return (
    <div className="flex flex-col gap-4 min-w-[256px]">
      <div className="flex justify-between text-sm text-muted-foreground">
        <div className="flex">
          {isEditingMin ? (
            <input
              type="number"
              ref={inputMinRef}
              min={min}
              max={max}
              step={step}
              value={inputValues[0]}
              autoFocus
              onChange={(e) => handleInputChange(0, e.target.value)}
              onBlur={() => setIsEditingMin(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  inputMinRef.current?.blur(); // lose focus when pressing Enter
                }
              }}
              style={{ width: `${Math.max(String(inputValues[0]).length, 1)}ch` }}
              className="p-0 text-sm bg-background [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          ) : (
            <span onClick={() => setIsEditingMin(true)} className="cursor-pointer">{label?.(draftRange[0]) ?? draftRange[0]}</span>
          )}
        </div>
        <div className="flex">
          {isEditingMax ? (
            <input
              type="number"
              ref={inputMaxRef}
              min={min}
              max={max}
              step={step}
              value={inputValues[0]}
              autoFocus
              onChange={(e) => handleInputChange(1, e.target.value)}
              onBlur={() => setIsEditingMax(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  inputMaxRef.current?.blur(); // lose focus when pressing Enter
                }
              }}
              style={{ width: `${Math.max(String(inputValues[1]).length, 1)}ch` }}
              className="p-0 text-sm bg-background [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          ) : (
            <span onClick={() => setIsEditingMax(true)} className="cursor-pointer">{label?.(draftRange[1]) ?? draftRange[1]}</span>
          )}
        </div>
      </div>
      <Slider
        className="bg-muted"
        min={min}
        max={max}
        step={step}
        value={draftRange}
        onValueChange={setDraftRange}
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

