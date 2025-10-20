import {
	Building2,
	Car,
	CheckCircle,
	Clock,
	Mail,
	Phone,
	Shield,
	User,
} from "lucide-react";
import type { FC } from "react";
import type { DriverData } from "@/apis/driver";
import Badge from "@/components/badge";
import FieldSeparator from "@/components/form-field/field-separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import TextViewField, { Grid } from "@/components/ui/view-field";
import { apiURL, mapRole } from "@/lib/utils";
import { Errorable } from "@/components/undefinable";
import { DataFetcher } from "@/components/data-fetcher";
import { getLocationById } from "@/apis/location";
import { getVendor } from "@/apis/vendor";
import { getVehicle } from "@/apis/vehicle";

interface Props {
	data: DriverData;
}

export const ViewDriver: FC<Props> = ({ data }) => {
	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((word) => word[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "active":
				return <Badge variant="success">Active</Badge>;
			case "inactive":
				return <Badge variant="warning">Inactive</Badge>;
			case "suspended":
				return <Badge variant="destructive">Suspended</Badge>;
			default:
				return <Badge variant="destructive">Unknown</Badge>;
		}
	};

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

	const ownershipVariants = {
		company: "success",
		vendor: "info",
	} as const;

	return (
		<div className="w-full space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-4">
					<Avatar className="size-16">
						<AvatarImage
							src={data.profileImageUrl ?? undefined}
							alt={data.name}
						/>
						<AvatarFallback className="text-lg">
							{getInitials(data.name)}
						</AvatarFallback>
					</Avatar>
					<div>
						<h2 className="text-2xl font-semibold">{data.name}</h2>
						<p className="flex items-center gap-2 mt-1 text-muted-foreground">
							<Shield className="size-4" />
							{mapRole(data.roleId)}
						</p>
					</div>
				</div>
			</div>

			<FieldSeparator>
				<Grid>
					<TextViewField
						icon={Mail}
						title="Email"
						value={
							<Errorable variant="missing" value={data.email} />
						}
						variant="dropdown"
					/>

					<TextViewField
						icon={Phone}
						title="Phone number"
						value={data.phoneNumber}
						variant="dropdown"
					/>
				</Grid>

				{/* <Grid icon={Car} title="Vehicle information"> */}
				{/*   <TextViewField */}
				{/*     title="License plate" */}
				{/*     value={data.vehicle} */}
				{/*     variant="dropdown" */}
				{/*   /> */}
				{/**/}
				{/*   <TextViewField */}
				{/*     title="Vendor" */}
				{/*     value={data.vendor} */}
				{/*     variant="dropdown" */}
				{/*   /> */}
				{/* </Grid> */}

				<TextViewField
					icon={CheckCircle}
					title="Status"
					value={getStatusBadge(data.status)}
				/>

				<TextViewField
					icon={Clock}
					title="Availability"
					value={getAvailabilityBadge(data.availability)}
				/>

				<TextViewField
					icon={Clock}
					title="Ownership Type"
					value={
						<Badge variant={ownershipVariants[data.ownershipType]}>
							{data.ownershipType}
						</Badge>
					}
				/>

				<TextViewField
					icon={Car}
					title="Vehicle"
					value={
						data.vehicleId ? (
							<DataFetcher
								urlId={`${apiURL}/vehicles/${data.vehicleId}`}
								fetcher={getVehicle(data.vehicleId)}
								onFetchFinished={(data) => data.model}
							/>
						) : (
							<Errorable variant="missing" shouldError />
						)
					}
				/>

				<TextViewField
					icon={User}
					title="Vendor"
					value={
						data.vendorId ? (
							<DataFetcher
								urlId={`${apiURL}/vendors/${data.vendorId}`}
								fetcher={getVendor(data.vendorId)}
								onFetchFinished={(data) => data.name}
							/>
						) : (
							<Errorable variant="missing" shouldError />
						)
					}
				/>

				<TextViewField
					icon={Building2}
					title="Base Location"
					value={
						data.baseLocationId ? (
							<DataFetcher
								urlId={`${apiURL}/locations/${data.baseLocationId}`}
								fetcher={getLocationById(data.baseLocationId)}
								onFetchFinished={(data) => data.name}
							/>
						) : (
							<Errorable variant="missing" shouldError />
						)
					}
				/>

				{/* <TextViewField */}
				{/*   icon={MapPin} */}
				{/*   title="Current location" */}
				{/*   value={data.currentLocation} */}
				{/* /> */}
			</FieldSeparator>
		</div>
	);
};

export default ViewDriver;
