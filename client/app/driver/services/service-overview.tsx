import { useEffect, useState } from "react";
import { ChevronRight, ClockAlert, ClockFading, Car } from "lucide-react";
import StatusBadge from "@/components/status-badge";
import { VehicleServiceData } from "@/apis/vehicle-service";
import RequestDetails from "@/app/driver/request-absence/request-details";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { VehicleData, getVehicle } from "@/apis/vehicle";

export default function ServiceOverview({
	service,
	mobile = true,
	onlyOverview = false,
	onServiceChange,
}: {
	service: VehicleServiceData;
	mobile?: boolean;
	onlyOverview?: boolean;
	onServiceChange?: () => void | Promise<void>;
}) {
	if (onlyOverview) {
		return <OverviewDetails service={service} />;
	}

	return (
		<RequestDetails
			requestId={service.id}
			requestType="vehicle-service"
			data={service}
			trigger={<OverviewDetails service={service} />}
			mobile={mobile}
			onRequestChange={onServiceChange}
		/>
	);
}

function OverviewDetails({ service }: { service: VehicleServiceData }) {
	const t = useTranslations("DriverServices");
	const [vehicle, setVehicle] = useState<VehicleData | null>(null);
	const [status, setStatus] = useState<
		"approved" | "pending" | "rejected" | "cancelled" | "completed" | "on_going"
	>();

	useEffect(() => {
		if (service.status === "approved") {
			const now = new Date();
			const startTime = new Date(service.startTime);
			const endTime = new Date(service.endTime);

			if (now >= startTime && now <= endTime) {
				setStatus("on_going");
			} else {
				setStatus("approved");
			}
		} else {
			setStatus(service.status);
		}
	}, [service]);

	useEffect(() => {
		const fetchVehicle = async () => {
			if (!service.vehicleId) return;
			try {
				const vehicleData = await getVehicle(service.vehicleId);
				setVehicle(vehicleData);
			} catch (error) {
				console.error("Failed to fetch vehicle data:", error);
			}
		};
		if (service.vehicleId) {
			fetchVehicle();
		}
	}, [service.vehicleId]);

	return (
		<div key={service.id} className="flex flex-row gap-4">
			<div
				className={
					`w-1.5 flex-shrink-0 rounded-tr-md rounded-br-md ` +
					`${
						status === "approved"
							? "bg-success"
							: status === "pending"
								? "bg-warning"
								: status === "rejected"
									? "bg-destructive"
									: status === "completed"
										? "bg-info"
										: `bg-info`
					}`
				}
			></div>
			<div className="flex-1 min-w-0 space-y-2">
				<div className="flex flex-row items-center gap-2">
					<span className="text-subtitle-1">
						{t("service")}:{" "}
						{service.serviceType === "maintenance" ? (
							<span className="text-warning">{t("routineMaintenance")}</span>
						) : (
							<span className="text-destructive">{t("urgentRepair")}</span>
						)}
					</span>
				</div>
				<div className="flex flex-row items-center gap-2">
					<Car className="flex-shrink-0" />
					<div className="flex flex-col items-start min-w-0">
						<span className="text-subtitle-2">{vehicle?.licensePlate}</span>
						<span className="text-body-2 text-muted-foreground">{vehicle?.model}</span>
					</div>
				</div>
				<div className="flex flex-col items-start min-w-0 gap-2 text-body-2">
					<span className="flex flex-row items-center w-full gap-2 truncate">
						<ClockAlert className="flex-shrink-0" />
						<span className="min-w-0 truncate">
							<span className="text-subtitle-2">{t("from")} </span>
							<span className="truncate text-muted-foreground">
								{format(service.startTime, "dd/MM/yyyy")}
							</span>
						</span>
					</span>
					<span className="flex flex-row items-center w-full gap-2 truncate">
						<ClockFading className="flex-shrink-0" />
						<span className="min-w-0 truncate">
							<span className="text-subtitle-2">{t("to")} </span>
							<span className="truncate text-muted-foreground">
								{format(service.endTime, "dd/MM/yyyy")}
							</span>
						</span>
					</span>
				</div>
				<StatusBadge status={status!} />
			</div>
			<div className="flex flex-row items-center justify-center flex-shrink-0 h-full">
				<ChevronRight />
			</div>
		</div>
	);
}
