import { useState } from "react";
import { getPermission, type PermissionData } from "@/apis/permission";
import SheetForm from "@/components/dashboard-table/sheet-form";
import FieldSeparator from "@/components/form-field/field-separator";
import { Button } from "@/components/ui/button";
import { PermissionView } from "./view-permission";

interface PermissionsListSheetProps {
  permissions: PermissionData[];
}

export function PermissionsList({ permissions }: PermissionsListSheetProps) {
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);
  const [permissionId, setPermissionId] = useState<string>();

  const viewPermission = (id: string) => {
    setIsSheetOpen(true);
    setPermissionId(id);
  };

  return (
    <>
      <div className="space-y-4 p-3">
        {permissions.length > 0 ? (
          <FieldSeparator>
            {permissions.map((permission) => (
              <div key={permission.id} className="">
                <Button
                  onClick={() => viewPermission(permission.id)}
                  size="fit"
                  variant="link"
                >
                  <span className="text-subtitle-1 text-foreground hover:text-primary">
                    {permission.title}
                  </span>
                </Button>
                <p className="text-sm text-muted-foreground">
                  {permission.description || "No description"}
                </p>
              </div>
            ))}
          </FieldSeparator>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No permissions assigned
          </p>
        )}
      </div>
      <SheetForm
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        config={{
          title: "Viewing permission",
          description: `#${permissionId}`,
        }}
        state="view"
        renderView={
          permissionId
            ? {
              fetcher: () => getPermission(permissionId),
              render: (data) => <PermissionView data={data} />,
            }
            : undefined
        }
      />
    </>
  );
}
