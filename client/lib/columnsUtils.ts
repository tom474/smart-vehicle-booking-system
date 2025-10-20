import { ColumnProps } from "@/types/column-props";
import { ColumnDef } from "@tanstack/react-table";

type ColFn<TData> = ({ }: ColumnProps) => ColumnDef<TData>[]


export function excludeActions<T>(column: ColFn<T>, actionsColKey?: string): () => ColumnDef<T>[] {
  const col = column({})
  const excludeKey = actionsColKey ?? "actions"
  return () => col.filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cd) => (cd as any).accessorKey !== excludeKey,
  )
}

// export function excludeActionsWithView<T>(column: ColFn<T>) {
//   const col = column({})
//   const filteredCol = col.filter(
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     (cd) => (cd as any).accessorKey !== "actions",
//   )
//
//   const viewAppendedCol = ({ onView }: ColumnProps) => col.push(
//     {
//       accessorKey: "view",
//       enableSorting: false,
//       enableHiding: false,
//       header: () => <div className="text-right"> </div>,
//       cell: ({ row }) => {
//         const driverId = row.original.id
//         return (
//           <div className="flex items-center justify-end gap-2">
//             <ColumnActions
//               targetId={driverId}
//               onView={onView}
//             />
//           </div>
//         )
//       },
//
//     }
//   )
// }
