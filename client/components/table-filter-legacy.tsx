import { Button } from "@/components/ui/button";

import { Filter, Plus } from "lucide-react";
import { Input } from "./ui/input";
import { Table } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { ZodDefault, ZodEnum, ZodNullable, ZodObject, ZodOptional, ZodPipe, ZodString, ZodTypeAny } from "zod/v4";

interface TableFilterProps<T> {
  table: Table<T>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema?: ZodObject<any>,
}

export function TableFilterLegacy<T>({
  table,
  schema,
}: TableFilterProps<T>) {
  const [search, setSearch] = useState("");
  const filteredColumns = table
    .getAllLeafColumns()
    .filter((col) => {
      const headerLabel =
        typeof col.columnDef.header === "string" ? col.columnDef.header : col.id;
      return headerLabel.toLowerCase().includes(search.toLowerCase()) && headerLabel.toLowerCase() !== "actions";
    });

  const schemaShape = schema?.shape as Record<string, ZodTypeAny> ?? {};

  const [pendingFilters, setPendingFilters] = useState<Record<string, string>>(
    () =>
      table
        .getAllLeafColumns()
        .reduce((acc, col) => {
          acc[col.id] = (col.getFilterValue() as string) ?? "";
          return acc;
        }, {} as Record<string, string>)
  );

  const activeFilterCount = useMemo(
    () =>
      Object.values(pendingFilters).filter(
        (val) => val != null && val !== ""
      ).length,
    [pendingFilters]
  );

  const reset = () => {
    setPendingFilters(
      Object.keys(schemaShape).reduce((acc, key) => {
        acc[key] = "";
        return acc;
      }, {} as Record<string, string>)
    );
    table.resetColumnFilters();
  };

  const onApply = () => {
    table.getAllLeafColumns().forEach((col) => {
      col.setFilterValue(pendingFilters[col.id] || undefined);
    });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="icon" variant="transparent" className="relative">
          <Filter />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col min-w-[50dvw] max-w-[50dvw] max-h-[80dvh]">
        <DialogHeader>
          <DialogTitle>Filter</DialogTitle>
          <DialogDescription>
            {/* Make changes to your profile here. Click save when you&apos;re */}
            {/* done. */}
          </DialogDescription>
        </DialogHeader>
        {/* Search bar */}
        <Input
          placeholder="Search columns..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex flex-col gap-2 flex-1 overflow-x-visible overflow-y-auto">
          <div className="flex flex-col flex-1 min-h-0 gap-8 overflow-x-visible overflow-y-auto">

            {filteredColumns.map((col) => {
              const colId = col.id;
              const headerLabel =
                typeof col.columnDef.header === "string"
                  ? col.columnDef.header
                  : colId;

              function unwrapZodType(type: ZodTypeAny): ZodTypeAny {
                if (type instanceof ZodOptional || type instanceof ZodNullable || type instanceof ZodDefault) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  return unwrapZodType((type as any)._def.innerType);
                } else if (type instanceof ZodPipe) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  return unwrapZodType((type as any)._def.in);
                }
                return type;
              }

              const fieldSchema = unwrapZodType(schemaShape[colId]);

              // console.log(colId, schemaShape[colId], fieldSchema)

              const hasValue =
                pendingFilters[colId] != null && pendingFilters[colId] !== "";


              return (
                <div key={colId} className="flex flex-col gap-2">
                  <div className="flex gap-2 text-headline-3">
                    {headerLabel} {hasValue && (
                      <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                    )}
                  </div>

                  {fieldSchema instanceof ZodString && (
                    <Input
                      placeholder={`Filter ${headerLabel}...`}
                      value={pendingFilters[colId] ?? ""}
                      onChange={(e) =>
                        setPendingFilters((prev) => ({
                          ...prev,
                          [colId]: e.target.value,
                        }))
                      }
                      className="w-full"
                    />
                  )}

                  {fieldSchema instanceof ZodEnum && (
                    <div className="flex gap-4">
                      {fieldSchema.options.map((opt) => (
                        <div className="flex items-center gap-2 px-4 py-1 border rounded-lg" key={opt}>
                          {opt}
                          <Plus className="size-4 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  )}

                  {fieldSchema === undefined && (
                    <Input
                      placeholder={`Filter ${headerLabel}...`}
                      value={pendingFilters[colId] ?? ""}
                      onChange={(e) =>
                        setPendingFilters((prev) => ({
                          ...prev,
                          [colId]: e.target.value,
                        }))
                      }
                      className="w-full"
                    />
                  )}

                </div>
              )
            })}

          </div>

          <div className="flex items-end gap-2">
            <div className="flex w-full justify-between">
              <Button variant="link" className="flex-1" size="fit" onClick={() => reset()}>
                Reset
              </Button>
              <Button className="w-32" size="sm" onClick={() => onApply()} >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
