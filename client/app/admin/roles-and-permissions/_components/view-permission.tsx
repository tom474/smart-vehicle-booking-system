import { NotepadText, Text } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PermissionData } from "@/apis/permission";
import FieldSeparator from "@/components/form-field/field-separator";
import TextViewField from "@/components/ui/view-field";

interface PermissionViewProps {
  data: PermissionData;
}

export function PermissionView({ data }: PermissionViewProps) {
  const t = useTranslations("Admin.permission");

  // const copyToClipboard = (text: string) => {
  //   navigator.clipboard.writeText(text);
  //   toast.message("Copied to clipboard", {
  //     description: `${text} has been copied to your clipboard.`,
  //   });
  // };

  return (
    <FieldSeparator>
      <TextViewField icon={Text} title={t("title")} value={data.title} />

      <TextViewField
        icon={NotepadText}
        title={t("description")}
        value={data.description}
      />
    </FieldSeparator>
  );
}
