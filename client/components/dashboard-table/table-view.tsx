"use client";

import type { ColumnDef, Row } from "@tanstack/react-table";
import { type ReactNode, useState } from "react";
import DashboardTable, { TableFetcherType } from "@/components/dashboard-table";
import { type ColumnProps } from "@/types/column-props";
import SheetForm, { SheetFormConfig, type SheetState } from "./sheet-form";
import DestructiveActionAlertDialog from "./destructive-alert";
import { capitalize } from "@/lib/string-utils";

interface Desc {
  title?: string;
  description?: string;
}

export interface Props<T> {
  targetDataStr?: string;

  columns: ({ onView, onDestructiveAction }: ColumnProps) => ColumnDef<T>[];
  onRowClick?: (row: Row<T>) => void;
  fetcher: TableFetcherType<T>;

  tableConfig?: {
    columnVisibility?: Partial<Record<keyof T | string, boolean>>
  }

  preventClickOutside?: SheetFormConfig["preventClickOutside"];
  hideHeader?: SheetFormConfig["hideHeader"];

  renderCreate?: ((setIsSheetOpen?: React.Dispatch<React.SetStateAction<boolean>>) => ReactNode) | ReactNode;
  renderView?: {
    fetcher: (id: string) => Promise<T | null>;
    render: (data: T) => ReactNode;
  } & Desc;
  renderEdit?: {
    fetcher: (id: string) => Promise<T | null>;
    render: (data: T) => ReactNode;
  };
  renderDestructiveAction?: {
    onSubmit: (id: string) => void;
    alertTitle?: ReactNode;
    alertDescription?: ReactNode;
    bodyRenderer?: (id: string) => ReactNode;
    destructiveLabel?: string;
  };
}

function TableView<T>({
  targetDataStr,
  columns,
  onRowClick,
  fetcher,

  tableConfig,

  preventClickOutside,
  hideHeader,
  renderCreate,
  renderView,
  renderEdit,
  renderDestructiveAction,
}: Props<T>) {
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);
  const [sheetState, setSheetState] = useState<SheetState>();
  const [viewRenderer, setViewRenderer] = useState<
    | {
      fetcher: () => Promise<T | null>;
      render: (data: T) => ReactNode;
    }
    | undefined
  >(undefined);
  const [editRenderer, setEditRenderer] = useState<
    | {
      fetcher: () => Promise<T | null>;
      render: (data: T) => ReactNode;
    }
    | undefined
  >(undefined);

  const [isAlertOpen, setIsAlertOpen] = useState<boolean>(false);
  const [targetId, setTargetId] = useState<string>();
  // let targetId: string = ""

  const onCreate = () => {
    openSheet("create");
    setTargetId(undefined);
  };

  const onView = (id: string) => {
    openSheet("view");
    setTargetId(id);
    if (renderView) {
      setViewRenderer({
        fetcher: () => renderView.fetcher(id),
        render: renderView.render,
      });
    }
  };

  const onEdit = (id: string) => {
    openSheet("edit");
    setTargetId(id);
    if (renderEdit) {
      setEditRenderer({
        fetcher: () => renderEdit.fetcher(id),
        render: renderEdit.render,
      });
    }
  };

  const onDestructiveAction = (id: string) => {
    setIsAlertOpen(true);
    setTargetId(id);
    // targetId = id
  };

  const openSheet = (state: SheetState) => {
    setSheetState(state);
    setIsSheetOpen(true);
  };

  return (
    <>
      {renderDestructiveAction && targetId && (
        <DestructiveActionAlertDialog
          open={isAlertOpen}
          onOpenChange={setIsAlertOpen}
          targetId={targetId}
          title={renderDestructiveAction.alertTitle}
          description={renderDestructiveAction.alertDescription}
          bodyRenderer={renderDestructiveAction.bodyRenderer}
          destructiveLabel={renderDestructiveAction.destructiveLabel}
          onSubmit={renderDestructiveAction.onSubmit}
        />
      )}
      {sheetState && (
        <SheetForm
          open={isSheetOpen}
          config={{
            title: `${capitalize(sheetState)} ${targetDataStr ?? ""}`,
            description: `${targetDataStr ?? ""} ${targetId !== undefined ? "#" : ""}${targetId ?? ""}`,
            preventClickOutside,
            hideHeader: hideHeader
          }}
          onOpenChange={setIsSheetOpen}
          state={sheetState}
          renderCreate={typeof renderCreate === 'function'
            ? renderCreate(setIsSheetOpen)
            : renderCreate}
          renderView={viewRenderer}
          renderEdit={editRenderer}
        />
      )}
      <DashboardTable
        columnVisibility={tableConfig?.columnVisibility as Record<string, boolean>}
        columns={columns({
          onView: renderView && onView,
          onEdit: renderEdit && onEdit,
          onDestructiveAction: renderDestructiveAction && onDestructiveAction,
        })}
        onRowClick={onRowClick}
        onCreate={renderCreate ? onCreate : undefined}
        //        onRowClick={onRowClick ? onRowClick : (row) => {
        //        onView(row.getValue('id'))
        //    }}
        fetcher={fetcher}
      />
    </>
  )
}

/**
 *  Helper function to turn all key of an object to a default provided state
 *  
 *  By default all state of a column visibility will be true, so if you only need
 *  to set false to some columns then this helper is not needed.
 *
 *  If you instead want all columns state to be false by default and set some columns
 *  to true instead, use this function.
 *
 *  Only me know how this code worked at the time of writing this, 
 *  now ony god know how this code work.
 * */
export function visibilityState<T extends Record<string, unknown>>(
  dataType: T,
  initialState: boolean,
  override: Partial<Record<keyof T, boolean>> = {}
): Record<keyof T, boolean> {
  return Object.keys(dataType).reduce((acc, key) => {
    acc[key as keyof T] = override[key as keyof T] ?? initialState;
    return acc;
  }, {} as Record<keyof T, boolean>);
}

export default TableView
