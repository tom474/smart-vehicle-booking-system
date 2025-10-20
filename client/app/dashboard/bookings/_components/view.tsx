import { format } from "date-fns";
import { AlertTriangle, Clock, FileText, MapPin, Package, Route, User, Users } from "lucide-react";
import type { z } from "zod/v4";
import type { BookingRequestData, BookingRequestSchema } from "@/apis/booking-request";
import Badge from "@/components/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface Props {
	data: BookingRequestData;
}

function ViewBooking({ data }: Props) {
	const getStatusVariant = (status: z.infer<typeof BookingRequestSchema.shape.status>) => {
		switch (status) {
			case "pending":
				return "warning";
			case "approved":
				return "success";
			case "cancelled":
				return "destructive";
			case "completed":
				return "success";
		}
	};

	const getPriorityVariant = (priority: z.infer<typeof BookingRequestSchema.shape.priority>) => {
		switch (priority) {
			case "normal":
				return "info";
			case "high":
				return "warning";
			case "urgent":
				return "destructive";
		}
	};

	const formatDateTime = (date: Date) => {
		return format(date, "PP p");
	};

	// const handleCancel = () => {
	// 	toast.promise(cancelBookingRequest(data.id), {
	// 		loading: "Cancelling booking request...",
	// 		success: `Booking request #${data.id} approved successfully`,
	// 		error: `Could not approve leave request #${data.id}, please try again later`,
	// 	})
	// }

	return (
		<div className="flex flex-col gap-4">
			{/* Basic Information */}
			<div>
				<h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
					<FileText className="h-5 w-5" />
					Basic Information
				</h3>

				<div className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<p className="text-sm font-medium text-muted-foreground">Request ID</p>
							<p className="text-sm font-mono bg-muted px-2 py-1 rounded">{data.id}</p>
						</div>
						<div className="space-y-2">
							<p className="text-sm font-medium text-muted-foreground">Requester ID</p>
							<p className="text-sm font-mono bg-muted px-2 py-1 rounded">{data.requesterId}</p>
						</div>
					</div>

					<div className="grid grid-cols-3 gap-4">
						<div className="space-y-2">
							<p className="text-sm font-medium text-muted-foreground">Status</p>
							<div>
								<Badge variant={getStatusVariant(data.status)}>{data.status}</Badge>
							</div>
						</div>
						<div className="space-y-2">
							<p className="text-sm font-medium text-muted-foreground">Priority</p>
							<div className="flex items-center gap-2">
								{data.priority === "urgent" && <AlertTriangle className="h-4 w-4 text-red-500" />}
								<Badge variant={getPriorityVariant(data.priority)}>{data.priority}</Badge>
							</div>
						</div>
						<div className="space-y-2">
							<p className="text-sm font-medium text-muted-foreground">Trip Type</p>
							<div>{data.type.replace("_", " ")}</div>
						</div>
					</div>

					{data.isReserved !== undefined && (
						<div className="space-y-2">
							<p className="text-sm font-medium text-muted-foreground">Reserved</p>
							<p className="text-sm">{data.isReserved ? "Yes" : "No"}</p>
						</div>
					)}
				</div>
			</div>

			<Separator />

			{/* Passenger Information */}
			<div>
				<h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
					<Users className="h-5 w-5" />
					Passenger Information
				</h3>

				<div className="space-y-4">
					<div className="space-y-2">
						<p className="text-sm font-medium text-muted-foreground">Number of Passengers</p>
						<p className="text-lg font-semibold flex items-center gap-2">
							<User className="h-4 w-4" />
							{data.numberOfPassengers}
						</p>
					</div>

					{data.passengerIds && (
						<div className="space-y-2">
							<p className="text-sm font-medium text-muted-foreground">Passenger IDs</p>
							<div className="flex flex-wrap gap-2">
								{data.passengerIds.map((passengerId) => (
									<div
										key={passengerId}
										className="flex px-3 text-body-2 font-bold border rounded-sm"
									>
										{passengerId}
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</div>

			<Separator />

			{/* Trip Details */}
			<div>
				<h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
					<Route className="h-5 w-5" />
					Trip Details
				</h3>

				<div className="space-y-4">
					<div className="grid grid-cols-1 gap-4">
						<div className="space-y-2">
							<p className="text-sm font-medium text-muted-foreground">Departure Location</p>
							<p className="text-sm flex items-start gap-2">
								<MapPin className="h-4 w-4 mt-0.5 text-green-600" />
								{data.departureLocation.address}
							</p>
						</div>

						<div className="space-y-2">
							<p className="text-sm font-medium text-muted-foreground">Arrival Location</p>
							<p className="text-sm flex items-start gap-2">
								<MapPin className="h-4 w-4 mt-0.5 text-red-600" />
								{data.arrivalLocation.address}
							</p>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<p className="text-sm font-medium text-muted-foreground">Departure Time</p>
							<p className="text-sm flex items-center gap-2">
								<Clock className="h-4 w-4" />
								{formatDateTime(data.departureTime)}
							</p>
						</div>

						<div className="space-y-2">
							<p className="text-sm font-medium text-muted-foreground">Arrival Deadline</p>
							<p className="text-sm flex items-center gap-2">
								<Clock className="h-4 w-4" />
								{formatDateTime(data.arrivalTime)}
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Round Trip Details */}
			{data.type === "round_trip" && data.returnDepartureTime && (
				<>
					<Separator />
					<div>
						<h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
							<Route className="h-5 w-5 transform rotate-180" />
							Return Trip Details
						</h3>

						<div className="space-y-4">
							<div className="grid grid-cols-1 gap-4">
								<div className="space-y-2">
									<p className="text-sm font-medium text-muted-foreground">
										Return Departure Location
									</p>
									<p className="text-sm flex items-start gap-2">
										<MapPin className="h-4 w-4 mt-0.5 text-green-600" />
										{data.returnDepartureLocation?.address}
									</p>
								</div>

								<div className="space-y-2">
									<p className="text-sm font-medium text-muted-foreground">Return Arrival Location</p>
									<p className="text-sm flex items-start gap-2">
										<MapPin className="h-4 w-4 mt-0.5 text-red-600" />
										{data.returnArrivalLocation?.address}
									</p>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<p className="text-sm font-medium text-muted-foreground">Return Departure Time</p>
									<p className="text-sm flex items-center gap-2">
										<Clock className="h-4 w-4" />
										{formatDateTime(data.returnDepartureTime)}
									</p>
								</div>

								<div className="space-y-2">
									<p className="text-sm font-medium text-muted-foreground">Return Arrival Deadline</p>
									<p className="text-sm flex items-center gap-2">
										<Clock className="h-4 w-4" />
										{data.returnArrivalTime && formatDateTime(data.returnArrivalTime)}
									</p>
								</div>
							</div>
						</div>
					</div>
				</>
			)}

			<Separator />

			{/* Additional Information */}
			<div>
				<h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
					<Package className="h-5 w-5" />
					Additional Information
				</h3>

				<div className="space-y-4">
					{data.tripPurpose && (
						<div className="space-y-2">
							<p className="text-sm font-medium text-muted-foreground">Trip Purpose</p>
							<p className="text-sm">{data.tripPurpose}</p>
						</div>
					)}

					{data.contactName && (
						<div className="space-y-2">
							<p className="text-sm font-medium text-muted-foreground">Contact Name</p>
							<p className="text-sm flex items-start gap-2">
								<Package className="h-4 w-4 mt-0.5" />
								{data.contactName}
							</p>
						</div>
					)}

					{data.contactPhoneNumber && (
						<div className="space-y-2">
							<p className="text-sm font-medium text-muted-foreground">Contact Phone Number</p>
							<p className="text-sm">{data.contactPhoneNumber}</p>
						</div>
					)}

					{data.note && (
						<div className="space-y-2">
							<p className="text-sm font-medium text-muted-foreground">Special Notes</p>
							<p className="text-sm bg-muted p-3 rounded border-l-4 border-primary">{data.note}</p>
						</div>
					)}
				</div>
			</div>
			<div>
				<Button className="w-full" variant="destructive">
					Cancel
				</Button>
			</div>
		</div>
	);
}

export default ViewBooking;
