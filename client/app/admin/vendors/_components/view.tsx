import { CheckCircle, Mail, MapPin, Phone, User, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import type { VendorData } from "@/apis/vendor";
import Badge from "@/components/badge";
import FieldSeparator from "@/components/form-field/field-separator";
import TextViewField, { Grid } from "@/components/ui/view-field";

interface Props {
	data: VendorData;
}

function ViewVendor({ data }: Props) {
	const t = useTranslations("Admin.vendor");

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "active":
				return <Badge variant="success">Active</Badge>;
			case "inactive":
				return <Badge variant="destructive">Inactive</Badge>;
			case "suspended":
				return <Badge variant="warning">Suspended</Badge>;
			default:
				return <Badge variant="destructive">Unknown</Badge>;
		}
	};

	return (
		<FieldSeparator>
			<Grid>
				<TextViewField
					icon={User}
					title={t("name")}
					value={data.name}
					variant="dropdown"
				/>

				<TextViewField
					icon={Mail}
					title={t("email")}
					value={data.email}
					variant="dropdown"
				/>

				<TextViewField
					icon={Phone}
					title={t("phoneNumber")}
					value={data.phoneNumber}
					variant="dropdown"
				/>
			</Grid>

			<TextViewField
				icon={CheckCircle}
				title={t("status")}
				value={getStatusBadge(data.status)}
			/>

			<TextViewField
				icon={Users}
				title={t("contactPerson")}
				value={data.contactPerson}
			/>

			<TextViewField
				icon={MapPin}
				title={t("address")}
				value={data.address}
			/>

			<Grid>
				<TextViewField
					title={t("numberOfDrivers")}
					value={data.numberOfDrivers.toString()}
					variant="dropdown"
				/>

				<TextViewField
					title={t("numberOfVehicles")}
					value={data.numberOfVehicles.toString()}
					variant="dropdown"
				/>
			</Grid>
		</FieldSeparator>
	);
}

export default ViewVendor;
