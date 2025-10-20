"use client"

import { ReactNode, useId } from "react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetId: string
  title?: ReactNode
  description?: ReactNode
  bodyRenderer?: (id: string) => ReactNode
  destructiveLabel?: string
  onSubmit: (id: string) => void
}

function DestructiveActionAlertDialog({
  open,
  onOpenChange,
  targetId,
  title,
  description,
  bodyRenderer,
  destructiveLabel,
  onSubmit
}: Props) {
  const formId = useId()

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader className="gap-4">
          <div>
            <AlertDialogTitle>{title ?? "Are you sure you want to do this?"}</AlertDialogTitle>
            <AlertDialogDescription className="">
              {description ?? "This action is permanent and can't be undone"}
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        {bodyRenderer?.(targetId)}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button type="submit" form={formId} onClick={() => {
            onSubmit(targetId)
            onOpenChange(false)
          }} variant="destructive">
            {destructiveLabel ?? "Submit"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default DestructiveActionAlertDialog
export type { Props as DestructiveActionAlertDialogProps }
