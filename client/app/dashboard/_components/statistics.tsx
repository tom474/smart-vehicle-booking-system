"use client";

import { format, formatDistanceToNow } from "date-fns";
import { Car, MapPin, MapPinCheck, RotateCcw, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import react from "react";
import { getBookingRequests } from "@/apis/booking-request";
import { shortenAddress } from "@/apis/location";
import { getTripTickets } from "@/apis/trip-ticket";
import TicketOverview from "@/app/requester/bookings/ticket-overview";
import {
	ListItem,
	ListItemActions,
	ListItemHeader,
	ListItemTitle,
} from "@/components/list-item";
import { Button } from "@/components/ui/button";
import { Errorable } from "@/components/undefinable";
import { dateTimeFormat } from "@/lib/date-time-format";
import DashboardCard from "./dashboard-card";

// const recentTrips: TripTicketData[] = [
// 	{
// 		id: "TTK-1",
// 		userId: "USR-1",
// 		tripId: "TRP-1",
// 		departureLocation: {
// 			id: "LOC-1",
// 			type: "custom",
// 			name: "Shopping Mall",
// 			address: "789 Shopping St, City Center",
// 			latitude: 10.7769,
// 			longitude: 106.7009,
// 		},
// 		arrivalLocation: {
// 			id: "LOC-2",
// 			type: "custom",
// 			name: "University Campus",
// 			address: "321 University Ave, City Center",
// 			latitude: 10.7295,
// 			longitude: 106.7215,
// 		},
// 		departureTime: new Date("2025-04-18T10:45:00Z"),
// 		arrivalTime: new Date("2025-04-18T11:45:00Z"),
// 		driver: {
// 			id: "DRV-1",
// 			name: "John Doe",
// 			username: "johndoe",
// 			phoneNumber: "+1234567890",
// 			email: "johndoe@gmail.com",
// 			profileImageUrl: "",
// 			vehicleId: "VEH-1",
// 			vendorId: null,
// 			status: "active",
// 			availability: "available",
// 			roleId: "ROL-3",
// 			baseLocationId: "LOC-1",
// 			currentLocationId: "LOC-1",
// 			ownershipType: "company",
// 		},
// 		vehicle: {
// 			id: "VEH-1",
// 			licensePlate: "ABC-1234",
// 			model: "Toyota Camry",
// 			color: "blue",
// 			capacity: 5,
// 			availability: "available",
// 			ownershipType: "company",
// 		},
// 		status: "completed",
// 		bookingRequestId: "VBR-1",
// 		ticketStatus: "dropped_off",
// 	},
// 	{
// 		id: "TTK-2",
// 		userId: "USR-1",
// 		tripId: "TRP-1",
// 		departureLocation: {
// 			id: "LOC-1",
// 			type: "custom",
// 			name: "Shopping Mall",
// 			address: "789 Shopping St, City Center",
// 			latitude: 10.7769,
// 			longitude: 106.7009,
// 		},
// 		arrivalLocation: {
// 			id: "LOC-2",
// 			type: "custom",
// 			name: "University Campus",
// 			address: "321 University Ave, City Center",
// 			latitude: 10.7295,
// 			longitude: 106.7215,
// 		},
// 		departureTime: new Date("2025-04-18T10:45:00Z"),
// 		arrivalTime: new Date("2025-04-18T11:45:00Z"),
// 		driver: {
// 			id: "DRV-1",
// 			name: "John Doe",
// 			username: "johndoe",
// 			phoneNumber: "+1234567890",
// 			email: "johndoe@gmail.com",
// 			profileImageUrl: "",
// 			vehicleId: "VEH-1",
// 			vendorId: null,
// 			status: "active",
// 			availability: "available",
// 			roleId: "ROL-3",
// 			baseLocationId: "LOC-1",
// 			currentLocationId: "LOC-1",
// 			ownershipType: "company",
// 		},
// 		vehicle: {
// 			id: "VEH-1",
// 			licensePlate: "ABC-1234",
// 			model: "Toyota Camry",
// 			color: "blue",
// 			capacity: 5,
// 			availability: "available",
// 			ownershipType: "company",
// 		},
// 		status: "completed",
// 		bookingRequestId: "VBR-1",
// 		ticketStatus: "dropped_off",
// 	},
// ];

const Statistics: react.FC = () => {
	const t = useTranslations("RequesterBookings.bookingTripOverview");

	const [key, setKey] = react.useState(Math.random());
	const reload = () => {
		setKey(Math.random());
	};

	return (
		<div key={key} className="flex flex-col gap-4">
			<div className="flex justify-end">
				<Button onClick={reload} size="icon" variant="transparent">
					<RotateCcw />
				</Button>
			</div>
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3 min-h-[128px]">
				<DashboardCard
					title="On Going Trips"
					//fetchFn={async () =>
					//await new Promise<TripTicketData[]>((r) =>
					//r(recentTrips),
					//)
					//}
					fetchFn={async () =>
						await getTripTickets({ status: "on_going" })
					}
					onFetchFinished={(tripTickets) => {
						return (
							<div className="flex gap-8 max-h-[256px] overflow-y-auto">
								<div className="flex flex-col w-full gap-3">
									{tripTickets.length === 0 && (
										<Errorable
											errorMsg="There are no on-going trips"
											variant="missing"
										/>
									)}
									{tripTickets.map((booking) => (
										<TicketOverview
											key={booking.id}
											trip={booking}
											mobile={false}
										/>
									))}
								</div>
							</div>
						);
					}}
				/>
				<DashboardCard
					title="Completed trips"
					fetchFn={async () =>
						await getTripTickets({ status: "completed" })
					}
					onFetchFinished={(tripTickets) => {
						return (
							<div className="flex gap-8 max-h-[256px] overflow-y-auto">
								<div className="flex flex-col w-full gap-3">
									{tripTickets.length === 0 && (
										<Errorable
											errorMsg="There are no recently completed trips"
											variant="missing"
										/>
									)}

									{tripTickets.map((booking) => (
										<TicketOverview
											key={booking.id}
											trip={booking}
											mobile={false}
										/>
									))}
								</div>
							</div>
						);
					}}
				/>
				<DashboardCard
					title="Cancelled trips"
					fetchFn={async () =>
						await getTripTickets({ status: "cancelled" })
					}
					onFetchFinished={(tripTickets) => {
						return (
							<div className="flex gap-8 max-h-[256px] overflow-y-auto">
								<div className="flex flex-col w-full gap-3">
									{tripTickets.length === 0 && (
										<Errorable
											errorMsg="There are no recently cancelled trips"
											variant="missing"
										/>
									)}

									{tripTickets.map((booking) => (
										<TicketOverview
											key={booking.id}
											trip={booking}
											mobile={false}
										/>
									))}
								</div>
							</div>
						);
					}}
				/>
			</div>
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<DashboardCard
					title="Pending requests"
					fetchFn={async () =>
						await getBookingRequests({ status: "pending" })
					}
					onFetchFinished={(bookingReqs) => {
						return (
							<div className="flex flex-col gap-3 max-h-[512px] overflow-y-auto">
								{bookingReqs.length === 0 && (
									<Errorable
										errorMsg="There are no pending requests"
										variant="missing"
									/>
								)}
								{bookingReqs.map((req) => (
									<ListItem key={req.id} type="Warning">
										<ListItemHeader>
											<ListItemTitle>
												<div className="flex flex-col">
													<span className="text-body-2 text-muted-foreground italic">
														Booking request #
														{req.id}
													</span>
													<span>
														Depart on{" "}
														{format(
															req.departureTime,
															dateTimeFormat,
														)}
													</span>
												</div>
											</ListItemTitle>
											<ListItemActions className="items-start">
												{formatDistanceToNow(
													req.departureTime,
													{ addSuffix: true },
												)}
											</ListItemActions>
										</ListItemHeader>
										{/* <DataFetcher */}
										{/* 	urlId={`/api/trips?bookingRequestId=${req.id}`} */}
										{/* 	fetcher={getTrips({ */}
										{/* 		bookingRequestId: req.id, */}
										{/* 	})} */}
										{/* 	onFetchFinished={(trip) => { */}
										{/* 		if (trip.length === 0) return; */}
										{/**/}
										{/* 		return ( */}
										{/**/}
										{/* 		); */}
										{/* 	}} */}
										{/* /> */}
										<div className="flex flex-row items-center gap-2">
											<UserRound className="flex-shrink-0" />
											<div className="flex flex-col items-start min-w-0">
												<span className="text-subtitle-2">
													{req.contactName}
												</span>
												<span className="text-body-2 text-muted-foreground">
													{req.contactPhoneNumber}
												</span>
											</div>
										</div>
										<div className="flex flex-col items-start min-w-0 gap-2 text-body-2">
											<span className="flex flex-row items-center w-full gap-2 truncate">
												<MapPin className="flex-shrink-0" />
												<span className="min-w-0 truncate">
													<span className="text-subtitle-2">
														{t("from")}{" "}
													</span>
													<span className="truncate text-muted-foreground">
														{shortenAddress(
															req
																.departureLocation
																.address!,
														)}
													</span>
												</span>
											</span>
											<span className="flex flex-row items-center w-full gap-2 truncate">
												<MapPinCheck className="flex-shrink-0" />
												<span className="min-w-0 truncate">
													<span className="text-subtitle-2">
														{t("to")}{" "}
													</span>
													<span className="truncate text-muted-foreground">
														{shortenAddress(
															req.arrivalLocation
																.address!,
														)}
													</span>
												</span>
											</span>
										</div>
									</ListItem>
								))}
							</div>
						);
					}}
				/>
				<DashboardCard
					title="Urgent requests"
					fetchFn={async () =>
						await getBookingRequests({ priority: "urgent" })
					}
					onFetchFinished={(bookingReqs) => {
						return (
							<div className="flex flex-col max-h-[512px] gap-3 overflow-y-auto">
								{bookingReqs.length === 0 && (
									<Errorable
										errorMsg="There are no urgent requests"
										variant="missing"
									/>
								)}
								{bookingReqs.map((req) => (
									<ListItem
										key={req.id}
										type="Destructive"
										icon={Car}
									>
										<ListItemHeader>
											<ListItemTitle>
												<div className="flex flex-col">
													<span className="text-body-2 text-muted-foreground italic">
														Booking request #
														{req.id}
													</span>
													<span>
														Depart on{" "}
														{format(
															req.departureTime,
															dateTimeFormat,
														)}
													</span>
												</div>
											</ListItemTitle>
											<ListItemActions className="items-start">
												{formatDistanceToNow(
													req.departureTime,
													{ addSuffix: true },
												)}
											</ListItemActions>{" "}
										</ListItemHeader>
										<div className="flex flex-row items-center gap-2">
											<UserRound className="flex-shrink-0" />
											<div className="flex flex-col items-start min-w-0">
												<span className="text-subtitle-2">
													{req.contactName}
												</span>
												<span className="text-body-2 text-muted-foreground">
													{req.contactPhoneNumber}
												</span>
											</div>
										</div>
										<div className="flex flex-col items-start min-w-0 gap-2 text-body-2">
											<span className="flex flex-row items-center w-full gap-2 truncate">
												<MapPin className="flex-shrink-0" />
												<span className="min-w-0 truncate">
													<span className="text-subtitle-2">
														{t("from")}{" "}
													</span>
													<span className="truncate text-muted-foreground">
														{shortenAddress(
															req
																.departureLocation
																.address!,
														)}
													</span>
												</span>
											</span>
											<span className="flex flex-row items-center w-full gap-2 truncate">
												<MapPinCheck className="flex-shrink-0" />
												<span className="min-w-0 truncate">
													<span className="text-subtitle-2">
														{t("to")}{" "}
													</span>
													<span className="truncate text-muted-foreground">
														{shortenAddress(
															req.arrivalLocation
																.address!,
														)}
													</span>
												</span>
											</span>
										</div>
									</ListItem>
								))}
							</div>
						);
					}}
				/>
			</div>
			{/* <div className="grid grid-cols-1 gap-4 md:grid-cols-2"> */}
			{/* 	<DashboardCard */}
			{/* 		title="Vehicle availability" */}
			{/* 		fetchFn={async () => await getVehicles({})} */}
			{/* 		onFetchFinished={(vehicles) => ( */}
			{/* 			<VehicleUtilization vehicles={vehicles} /> */}
			{/* 		)} */}
			{/* 	/> */}
			{/* 	<DashboardCard */}
			{/* 		title="Driver availability" */}
			{/* 		fetchFn={async () => await getDrivers({})} */}
			{/* 		onFetchFinished={(drivers) => ( */}
			{/* 			<DriverAvailability drivers={drivers} /> */}
			{/* 		)} */}
			{/* 	/> */}
			{/* </div> */}
		</div>
	);
};

export default Statistics;
