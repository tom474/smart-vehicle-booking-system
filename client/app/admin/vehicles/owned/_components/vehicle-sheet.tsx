"use client";

import { Building2, Car, CheckCircle, MapPin, User } from "lucide-react";
import { useTranslations } from "next-intl";
import type { VehicleData } from "@/apis/vehicle";
import Badge from "@/components/badge";
import FieldSeparator from "@/components/form-field/field-separator";
import TextViewField, { Grid } from "@/components/ui/view-field";

interface VehicleViewerProps {
	vehicle: VehicleData;
}

export function ViewVehicle({ vehicle: data }: VehicleViewerProps) {
	const t = useTranslations("Admin.vehicle");

	const getAvailabilityBadge = (availability: string) => {
		switch (availability) {
			case "available":
				return <Badge variant="success">Available</Badge>;
			case "busy":
				return <Badge variant="warning">Busy</Badge>;
			case "unavailable":
				return <Badge variant="destructive">Unavailable</Badge>;
			case "offline":
				return <Badge variant="destructive">Offline</Badge>;
			default:
				return <Badge variant="destructive">Unknown</Badge>;
		}
	};

	return (
		<FieldSeparator>
			<Grid icon={Car} title={t("vehicleInfo")}>
				<TextViewField title={t("licensePlate")} value={data.licensePlate} variant="dropdown" />

				<TextViewField title={t("model")} value={data.model} variant="dropdown" />

				<TextViewField title={t("color")} value={data.color} variant="dropdown" />

				<TextViewField title={t("capacity")} value={data.capacity} variant="dropdown" />
			</Grid>

			<TextViewField
				icon={CheckCircle}
				title={t("availability")}
				value={getAvailabilityBadge(data.availability)}
			/>

			<TextViewField icon={User} title={t("driver")} value={data.driverId} errorMsg={t("notAssigned")} />

			<TextViewField icon={Building2} title={t("vendor")} value={data.vendorId} errorMsg={t("notAssigned")} />

			<TextViewField icon={User} title={t("executive")} value={data.executiveId} errorMsg={t("notAssigned")} />

			<TextViewField icon={MapPin} title={t("baseLocation")} value={data.baseLocationId || t("notAssigned")} />

			<TextViewField
				icon={MapPin}
				title={t("currentLocation")}
				value={data.currentLocationId || t("notAssigned")}
			/>

			{/* <TextViewField
				icon={Route}
				title={t("numberOfTrips")}
				value={data.numberOfTrips?.toString() || "0"}
			/> */}
		</FieldSeparator>
	);
}
