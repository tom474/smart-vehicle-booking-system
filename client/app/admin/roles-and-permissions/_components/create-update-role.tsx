import { NotepadText, Text } from "lucide-react";
import { useTranslations } from "next-intl";
import FieldSeparator from "@/components/form-field/field-separator";
import {
  createRole,
  updateRole,
  UpdateRoleSchema,
  type RoleData,
  type UpdateRoleData,
} from "@/apis/role";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField } from "@/components/ui/form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import TextInputField from "@/components/form-field/input";
import { apiErrHandler } from "@/lib/error-handling";
import { Button } from "@/components/ui/button";

interface RoleViewProps {
  defaultValue?: RoleData;
}

export function CreateUpdateRole({ defaultValue }: RoleViewProps) {
  const router = useRouter();

  const t = useTranslations("Admin.role");
  const tToast = useTranslations("Admin.role.toast");

  const form = useForm<UpdateRoleData>({
    resolver: zodResolver(UpdateRoleSchema),
    defaultValues: defaultValue,
  });

  const onSubmit = (values: UpdateRoleData) => {
    console.log(values);
    toast.promise(createRole(values), {
      loading: tToast("update.loading"),
      success: () => {
        router.refresh();
        return tToast("update.success");
      },
      error: (e) => {
        const apiErr = apiErrHandler(e);
        if (apiErr) return apiErr;

        return tToast("update.error");
      },
    });
  };

  const onUpdate = (values: UpdateRoleData) => {
    if (!defaultValue) return;
    console.log(values);
    toast.promise(updateRole(defaultValue.id, values), {
      loading: tToast("update.loading"),
      success: () => {
        router.refresh();
        return tToast("update.success");
      },
      error: (e) => {
        console.log("TOAST: ", e);

        const apiErr = apiErrHandler(e);
        if (apiErr) return apiErr;

        return tToast("update.error");
      },
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          if (defaultValue) {
            form.handleSubmit(onUpdate)(e);
          } else {
            form.handleSubmit(onSubmit)(e);
          }
        }}
        className="flex flex-col gap-6 h-full"
      >
        <FieldSeparator>
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <TextInputField
                {...field}
                variant="dropdown"
                icon={Text}
                title={t("title")}
                placeholder={t("title")}
              />
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <TextInputField
                {...field}
                variant="dropdown"
                icon={NotepadText}
                title={t("description")}
                placeholder={t("description")}
              />
            )}
          />

          {/* <div className="flex flex-col gap-2"> */}
          {/* 	<TextViewField */}
          {/* 		icon={Key} */}
          {/* 		title={t("numberOfPermissions")} */}
          {/* 		value={data.numberOfPermissions} */}
          {/* 	/> */}
          {/* </div> */}
          {/**/}
          {/* <TextViewField */}
          {/* 	icon={Users} */}
          {/* 	title={t("numberOfUsers")} */}
          {/* 	value={data.numberOfUsers} */}
          {/* /> */}
        </FieldSeparator>
        <div className="flex h-full justify-end items-end">
          <Button type="submit" variant="secondary">
            {defaultValue ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
