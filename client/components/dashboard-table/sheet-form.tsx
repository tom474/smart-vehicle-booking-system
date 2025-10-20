import Spinner from "@/components/spinner"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { type ReactNode, useEffect, useState } from "react"
import { Button } from "../ui/button"
import { ChevronLeft } from "lucide-react"

type SheetState = "create" | "view" | "edit"

interface Props<T> {
  open?: boolean
  onOpenChange?: (open: boolean) => void

  state: SheetState
  config?: SheetFormConfig

  renderCreate?: ReactNode
  renderView?: {
    fetcher: () => Promise<T | null>
    render: (data: T) => ReactNode
  }
  renderEdit?: {
    fetcher: () => Promise<T | null>
    render: (data: T) => ReactNode
  }
}

export interface SheetFormConfig {
  title?: ReactNode
  description?: ReactNode
  hideHeader?: boolean
  preventClickOutside?: boolean
}

function SheetForm<T>({
  open,
  onOpenChange,
  state,
  config,
  renderCreate,
  renderView,
  renderEdit,
}: Props<T>) {
  const [error, setError] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [component, setComponent] = useState<ReactNode>()

  useEffect(() => {
    let isMounted = true

    const fetch = async (
      promise: () => Promise<T | null>,
      render: (data: T) => ReactNode,
    ) => {
      if (!isMounted) return
      setError(undefined)
      setIsLoading(true)
      try {
        const data = await promise()
        if (!data) throw Error("Could not find corresponding data")
        setComponent(render(data))
        setIsLoading(false)
      } catch (e: unknown) {
        setError("Error in fetching data")
        setIsLoading(false)
        console.log(e)
      }
    }

    const errorBlock = (msg: string) => {
      return <p className="text-destructive">{msg}</p>
    }

    if (state === "create") {
      setComponent(renderCreate ?? errorBlock("No create component provided"))
    } else if (state === "view") {
      if (renderView) {
        fetch(renderView.fetcher, renderView.render)
      } else {
        setComponent(errorBlock("No view component provided"))
      }
    } else if (state === "edit") {
      if (renderEdit) {
        fetch(renderEdit.fetcher, renderEdit.render)
      } else {
        setComponent(errorBlock("No view component provided"))
      }
    }

    return () => {
      isMounted = false
    }
  }, [state, renderCreate, renderView, renderEdit])

  const title = (): string => {
    switch (state) {
      case 'create': return "Creating"
      case 'view': return ""
      case 'edit': return "Editing"
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-w-xl sm:max-w-xl p-4 [&>button:first-of-type]:hidden"
        onInteractOutside={(e) => config?.preventClickOutside && e.preventDefault()}
        onEscapeKeyDown={(e) => config?.preventClickOutside && e.preventDefault()}
      >
        <SheetHeader className="p-0 hidden">
          <SheetTitle className="text-center">{config?.title ?? title()}</SheetTitle>
          <SheetDescription className="text-center italic">{config?.description ?? ""}</SheetDescription>
        </SheetHeader>
        {!config?.hideHeader && (
          <div className="flex items-center justify-between w-full">
            <SheetClose asChild>
              <Button
                variant="ghost"
                size='fit'
                className="hover:bg-background hover:text-success hover:cursor-pointer"
              >
                <ChevronLeft className="size-6" />
              </Button>
            </SheetClose>
            <p className="text-subtitle-1">
              {title()} {config?.description ?? "N/A"}
            </p>
            <div className="size-6"></div>
          </div>
        )}

        {!isLoading ? (
          !error ? (
            <div className="overflow-visible overflow-y-auto h-full">
              {component}
            </div>
          ) : (
            <p className="italic text-destructive">
              An error occured, could not fetch the required data
              {/* <span>{error}</span> */}
            </p>
          )
        ) : (
          <div className="flex items-center justify-center h-full size-full">
            <Spinner />
          </div>
        )}
      </SheetContent>
    </Sheet >
  )
}

export default SheetForm
export type { SheetState }
