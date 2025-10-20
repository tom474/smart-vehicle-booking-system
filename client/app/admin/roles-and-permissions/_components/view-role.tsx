import { Key, NotepadText, Text, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import FieldSeparator from "@/components/form-field/field-separator";
import TextViewField from "@/components/ui/view-field";
import type { RoleData } from "@/apis/role";
import { apiURL } from "@/lib/utils";
import { getPermissions } from "@/apis/permission";
import { DataFetcher } from "@/components/data-fetcher";
import { PermissionsList } from "./permission-list";

interface RoleViewProps {
	data: RoleData;
}

export function RoleView({ data }: RoleViewProps) {
	const t = useTranslations("Admin.role");

	// const copyToClipboard = (text: string) => {
	//   navigator.clipboard.writeText(text);
	//   toast.message("Copied to clipboard", {
	//     description: `${text} has been copied to your clipboard.`,
	//   });
	// };

	const roleId = data.id;

	return (
		<FieldSeparator>
			<TextViewField icon={Text} title={t("title")} value={data.title} />

			<TextViewField
				icon={NotepadText}
				title={t("description")}
				value={data.description}
			/>

			<div className="flex flex-col gap-2">
				<TextViewField
					icon={Key}
					title={t("numberOfPermissions")}
					value={data.numberOfPermissions}
				/>

				<DataFetcher
					urlId={`${apiURL}/permissions`}
					fetcher={getPermissions({ roleId })}
					onFetchFinished={(perms) => (
						<PermissionsList permissions={perms} />
					)}
				/>
			</div>

			<TextViewField
				icon={Users}
				title={t("numberOfUsers")}
				value={data.numberOfUsers}
			/>
		</FieldSeparator>
	);
}
