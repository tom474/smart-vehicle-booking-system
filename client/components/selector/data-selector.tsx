import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import TableView, { type Props as TableViewProps } from "../dashboard-table/table-view"
import { ComponentProps, PropsWithChildren, useState } from "react"
import { Button } from "../ui/button"
import { ChevronDown, Eye, LucideIcon, Trash2 } from "lucide-react"
import SheetForm from "../dashboard-table/sheet-form"
import { Row } from "@tanstack/react-table"

interface Props<T> extends PropsWithChildren, Omit<ComponentProps<typeof DialogTrigger>, "onReset"> {
  targetData: string,
  label?: string,
  desc?: string,
  value?: string,
  values?: string[],
  multiple?: boolean;
  icon?: LucideIcon,


  getTargetId?: (row: Row<T>) => string;
  tableConfig?: TableViewProps<T>['tableConfig'],
  columns: TableViewProps<T>['columns'],
  renderView?: TableViewProps<T>['renderView'],
  fetcher: TableViewProps<T>['fetcher'],

  onRowSelect?: TableViewProps<T>['onRowClick']
  onReset?: DataSelectorBtnProps<T>['onRemove'];
}

export function DataSelector<T>({ targetData, label, desc, value, values, multiple, getTargetId, tableConfig, columns, fetcher, renderView, onRowSelect, onReset: handleReset, children, ...props }: Props<T>) {
  const [open, setOpen] = useState(false)
  const [targetId, setTargetId] = useState<string>()
  const [targetIds, setTargetIds] = useState<string[]>([])


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger {...props} asChild={children === undefined ? true : props.asChild}>
        {children ?? (
          !multiple ? <DataSelectorBtn label={label} value={value} targetStr={targetData} targetId={value || targetId} renderView={renderView} onRemove={handleReset} /> :
            <DataSelectorMultipleBtn label={label} values={values} targetStr={targetData} targetIds={values || targetIds} renderView={renderView} onRemove={handleReset} />
        )}
      </DialogTrigger>
      <DialogContent className="min-w-[80dvw] max-w-[80dvw] max-h-[80dvh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Select a {targetData.toLocaleLowerCase()}</DialogTitle>
          <DialogDescription>
            {desc ?? 'Click on a row to select a data'}
          </DialogDescription>
        </DialogHeader>
        <TableView
          tableConfig={tableConfig}
          onRowClick={(row) => {
            onRowSelect?.(row)
            if (multiple) {
              setTargetIds(prev => {
                const id = getTargetId?.(row)
                if (id) {
                  return [...prev, id]
                }

                return prev
              })
            } else {
              setTargetId(getTargetId?.(row))
            }
            setOpen(false)
          }}
          columns={columns}
          fetcher={fetcher}
          renderView={renderView}
        />
      </DialogContent>
    </Dialog>
  )
}

interface DataSelectorBtnProps<T> extends ComponentProps<typeof Button> {
  label?: string,
  value?: string,
  targetStr: string
  targetId?: string,
  renderView?: TableViewProps<T>['renderView'],
  onRemove?: (v: string) => void;
}

function DataSelectorBtn<T>({ label, value, targetStr, targetId, renderView, onRemove: handleRemove, ...props }: DataSelectorBtnProps<T>) {

  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <>
      {renderView && (targetId) && <SheetForm state="view" open={sheetOpen} onOpenChange={setSheetOpen} renderView={{
        fetcher: () => renderView.fetcher(targetId),
        render: renderView.render
      }}
      />}
      <div className="flex gap-2 w-full flex-1">
        <Button {...props} type="button" variant="outline" className="justify-start flex-1">
          {(!value || value.trim().length === 0) ? label ? label : `Assign ${targetStr.toLocaleLowerCase()}` : value}
          <div className="flex w-full justify-end">
            <ChevronDown />
          </div>
        </Button>
        {renderView && value && <Button
          type="button"
          onClick={() => {
            // onView(targetId)
            setSheetOpen(true)
          }}
          size="icon"
          variant="info"
          title="View Details"
        >
          <Eye className="size-4" />
        </Button>}
        {handleRemove && value && <Button
          type="button"
          onClick={() => targetId && handleRemove(targetId)}
          size="icon"
          variant="destructive"
          title="Deselect"
        >
          <Trash2 className="size-4" />
        </Button>}
      </div>

    </>
  )
}

interface DataSelectorMultipleBtnProps<T> extends Omit<DataSelectorBtnProps<T>, "value" | "targetId"> {
  values?: string[],
  targetIds: string[]
}

function DataSelectorMultipleBtn<T>({ label, values, targetStr, targetIds, renderView, onRemove: handleRemove, ...props }: DataSelectorMultipleBtnProps<T>) {

  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string>()

  function IdComp({ id }: { id: string }) {
    return (
      <div className="flex items-center gap-4 px-4 py-1 border rounded-sm">
        {id}
        <div className="flex items-center justify-center gap-2">
          {renderView && <Button
            type="button"
            onClick={() => {
              setSheetOpen(true)
              setSelectedId(id)
            }}
            size="fit"
            variant="transparent"
            title="View Details"
          >
            <Eye className="size-4" />
          </Button>}
          {handleRemove && <Button
            type="button"
            onClick={() => handleRemove(id)}
            size="fit"
            variant="transparent"
            title="Remove"
          >
            <Trash2 className="size-4" />
          </Button>}
        </div>
      </div>
    )
  }

  return (
    <>
      {renderView && values && targetIds && selectedId && <SheetForm state="view" open={sheetOpen} onOpenChange={setSheetOpen} renderView={{
        fetcher: () => renderView.fetcher(selectedId),
        render: renderView.render
      }}
      />}
      <div className="flex flex-col gap-2 w-full flex-1">
        <Button {...props} type="button" variant="outline" className="justify-start flex-1">
          {label ?? `Assign ${targetStr.toLocaleLowerCase()}`}
          <div className="flex w-full justify-end">
            <ChevronDown />
          </div>
        </Button>
        <div className="flex flex-wrap gap-2">
          {values?.map((id) => <IdComp key={id} id={id} />)}
        </div>
      </div>
    </>
  )
}


