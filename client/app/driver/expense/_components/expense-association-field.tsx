"use client";

import { useState, useEffect } from "react";
import { Car, Construction } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExpenseData } from "@/apis/expense";
import { Separator } from "@/components/ui/separator";
import { TripData, getTrips } from "@/apis/trip";
import { format } from "date-fns/format";
import { shortenAddress } from "@/apis/location";
import { VehicleServiceData, getVehicleServices } from "@/apis/vehicle-service";
import StatusBadge from "@/components/status-badge";
import { ExpenseType } from "@/app/driver/expense/request-expense";

interface ExpenseAssociationFieldProps {
	form: UseFormReturn<ExpenseData>;
	expenseType: ExpenseType;
	disabled?: boolean;
}

export default function ExpenseAssociationField({ form, expenseType, disabled = false }: ExpenseAssociationFieldProps) {
	const t = useTranslations("DriverExpenses.form");
	const [trips, setTrips] = useState<TripData[]>([]);
	const [vehicleServices, setVehicleServices] = useState<VehicleServiceData[]>([]);

	useEffect(() => {
		const fetchTrip = async () => {
			try {
				const fetchedTrips = await getTrips({ driverId: form.getValues("driverId") || undefined });
				setTrips(fetchedTrips);
			} catch (error) {
				console.error("Failed to fetch trips:", error);
			}
		};

		const fetchVehicleServices = async () => {
			try {
				const fetchedServices = await getVehicleServices({ driverId: form.getValues("driverId") || undefined });
				setVehicleServices(fetchedServices);
			} catch (error) {
				console.error("Failed to fetch vehicle services:", error);
			}
		};

		if (expenseType === "trip") {
			fetchTrip();
		} else if (expenseType === "maintenance") {
			fetchVehicleServices();
		}
	}, [expenseType, form]);

	if (expenseType === "operational") {
		return null; // No association needed for operational expenses
	}

	if (expenseType === "trip") {
		return (
			<FormField
				control={form.control}
				name="tripId"
				render={({ field }) => (
					<FormItem>
						<div className="flex justify-between p-1">
							<div className="flex flex-row items-center gap-2 text-subtitle-1">
								<Car />
								{t("associatedTrip")}
							</div>
							<FormControl>
								<Select onValueChange={field.onChange} value={field.value ?? ""} disabled={disabled}>
									<SelectTrigger className="border-none shadow-none text-start">
										<SelectValue placeholder={t("selectTrip")} />
									</SelectTrigger>
									<SelectContent>
										{trips.length > 0 ? (
											trips.map((trip) => (
												<SelectItem key={trip.id} value={trip.id}>
													<div className="flex flex-col">
														<span className="flex flex-row gap-1 font-medium">
															{trip.id} -{" "}
															<StatusBadge status={trip.status} noBorder={true} /> -{" "}
															{format(trip.departureTime, "dd-MM-yyyy")}
														</span>
														<span className="text-sm truncate line-clamp-2 w-50">
															{trip.stops?.at(-1)?.location.type === "fixed"
																? trip.stops?.at(-1)?.location.name
																: shortenAddress(
																		trip.stops?.at(-1)?.location.address || "",
																	)}
														</span>
													</div>
												</SelectItem>
											))
										) : (
											<SelectItem value="none" disabled>
												{t("noTrips")}
											</SelectItem>
										)}
									</SelectContent>
								</Select>
							</FormControl>
						</div>
						<FormMessage className="text-end" />
						<Separator />
					</FormItem>
				)}
			/>
		);
	}

	if (expenseType === "maintenance") {
		return (
			<FormField
				control={form.control}
				name="vehicleServiceId"
				render={({ field }) => (
					<FormItem>
						<div className="flex justify-between p-1">
							<div className="flex flex-row items-center gap-2 text-subtitle-1">
								<Construction />
								{t("associatedService")}
							</div>
							<FormControl>
								<Select onValueChange={field.onChange} value={field.value ?? ""} disabled={disabled}>
									<SelectTrigger className="border-none shadow-none text-start">
										<SelectValue placeholder={t("selectService")} />
									</SelectTrigger>
									<SelectContent>
										{vehicleServices.length > 0 ? (
											vehicleServices.map((service) => (
												<SelectItem key={service.id} value={service.id}>
													<div className="flex flex-col">
														<span className="flex flex-row gap-1 font-medium">
															{service.id} -{" "}
															<StatusBadge status={service.status} noBorder={true} />
														</span>
														<span className="text-sm">
															{format(service.startTime, "dd/MM/yyyy")} -{" "}
															{format(service.endTime, "dd/MM/yyyy")}
														</span>
													</div>
												</SelectItem>
											))
										) : (
											<SelectItem value="none" disabled>
												{t("noServices")}
											</SelectItem>
										)}
									</SelectContent>
								</Select>
							</FormControl>
						</div>
						<FormMessage className="text-end" />
						<Separator />
					</FormItem>
				)}
			/>
		);
	}

	return null;
}
