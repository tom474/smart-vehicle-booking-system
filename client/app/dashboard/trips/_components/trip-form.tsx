import { closestCorners, DndContext, type DragEndEvent, type UniqueIdentifier } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { Banknote, Car, CheckCircle, Clock, Flag, GripVertical, MapPin, User, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { type CSSProperties, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import type { StopData } from "@/apis/stop";
import { getTrips, type TripData } from "@/apis/trip";
import Badge from "@/components/badge";
import TableView from "@/components/dashboard-table/table-view";
import FieldSeparator from "@/components/form-field/field-separator";
import Spinner from "@/components/spinner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Timeline,
	TimelineContent,
	TimelineDate,
	TimelineHeader,
	TimelineIndicator,
	TimelineItem,
	TimelineSeparator,
	TimelineTitle,
} from "@/components/ui/timeline";
import TextViewField, { Grid } from "@/components/ui/view-field";
import { dateTimeFormat } from "@/lib/date-time-format";
import { tripColumns } from "../_columns/trip";
import { StopsColumn } from "./stop-column";
import { apiErrHandler } from "@/lib/error-handling";

interface TripViewProps {
	data: TripData;
}

export function TripView({ data: trip }: TripViewProps) {
	const t = useTranslations("Coordinator.trip");

	const statusVariantMap = {
		scheduling: "info",
		scheduled: "info",
		on_going: "info",
		completed: "success",
		cancelled: "destructive",
	} as const;

	const availabilityVariantMap = {
		available: "success",
		unavailable: "destructive",
		on_leave: "destructive",
		on_trip: "warning",
		on_return: "destructive",
	} as const;

	return (
		<div className="flex flex-col h-full gap-2">
			<FieldSeparator>
				{/* Status & Totalcost */}
				<TextViewField
					icon={CheckCircle}
					title={t("status")}
					value={<Badge variant={statusVariantMap[trip.status]}>{trip.status.replace("_", " ")}</Badge>}
				/>

				<TextViewField
					icon={Banknote}
					title={t("totalCost")}
					value={`${Intl.NumberFormat("vi-VN").format(Number(trip.totalCost))} vnd`}
				/>

				<Grid icon={Clock} title={t("timeline")}>
					<TextViewField
						title={t("departure")}
						value={format(trip.departureTime, dateTimeFormat)}
						variant="dropdown"
					/>

					<TextViewField
						title={t("arrival")}
						value={format(trip.arrivalTime, dateTimeFormat)}
						variant="dropdown"
					/>
				</Grid>

				<Grid icon={Car} title={t("resources")}>
					{trip.driver && (
						<div className="flex flex-col col-span-2 gap-2">
							<div className="flex items-center gap-3">
								{trip.driver.profileImageUrl ? (
									<Avatar className="w-10 h-10">
										<AvatarImage src={trip.driver.profileImageUrl} />
										<AvatarFallback>{trip.driver.name.charAt(0)}</AvatarFallback>
									</Avatar>
								) : (
									<div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary">
										<User className="w-5 h-5" />
									</div>
								)}
								<div>
									<h5 className="font-medium">{trip.driver.name}</h5>
									<div className="flex gap-2 mt-1">
										<Badge variant={availabilityVariantMap[trip.driver.availability]}>
											{trip.driver.availability}
										</Badge>
										<Badge variant={trip.driver.status === "active" ? "success" : "destructive"}>
											{trip.driver.status}
										</Badge>
									</div>
								</div>
							</div>
						</div>
					)}

					{(trip.vehicle || trip.outsourcedVehicle) && (
						<div className="col-span-2">
							<Grid icon={Car} title={trip.vehicle?.model || trip.outsourcedVehicle?.model}>
								<TextViewField
									title={t("vehicle.color")}
									value={trip.vehicle?.color || trip.outsourcedVehicle?.color}
									variant="dropdown"
								/>

								<TextViewField
									title={t("vehicle.capacity")}
									value={trip.vehicle?.capacity || trip.outsourcedVehicle?.capacity}
									variant="dropdown"
								/>
							</Grid>
						</div>
					)}
				</Grid>

				<TextViewField icon={Users} title={t("passengers")} value={trip.numberOfPassengers} />

				{/* Stops Section */}
				{trip.stops && trip.stops.length > 0 && (
					<div className="space-y-4">
						<h4 className="flex items-center w-full gap-2 text-subtitle-1">
							<TextViewField
								icon={Flag}
								title={t("routeStops", {
									count: trip.stops.length,
								})}
								value={<AddRequest parentTrip={trip} />}
							/>
						</h4>

						<div className="space-y-3">
							<StopsColumn stops={trip.stops} />
						</div>
					</div>
				)}
			</FieldSeparator>
		</div>
	);
}

interface StopsColumnProps {
	stops: StopData[];
}

export const StopsColumnLegacy = ({ stops: stopData }: StopsColumnProps) => {
	const [stops, setStops] = useState(stopData);

	type errorStr = string | undefined;
	const [error, setError] = useState<errorStr>();

	const getStopPos = (id: UniqueIdentifier) => stops.findIndex((stop) => stop.id === id);

	/// Return an error string, otherwise undefined
	const handleDragEnd = (e: DragEndEvent): errorStr => {
		const { active, over } = e;

		if (!over) return;
		if (active.id === over.id) return;

		const originalPos = getStopPos(active.id);
		const newPos = getStopPos(over.id);

		const activeStop = stops[originalPos];
		const overStop = stops[newPos];

		// validate drop-off position
		if (activeStop.type === "drop_off" && newPos === 0) {
			return "Drop-off stop can't be set at the first stop.";
		}

		// validate date
		if (activeStop.arrivalTime > overStop.arrivalTime) {
			return "Cannot move to a position where date is sooner than this.";
		}

		if (active.data.current) {
		}
		setStops((prev) => {
			return arrayMove(prev, originalPos, newPos);
		});
	};

	return (
		<>
			{error && <p className="italic text-destructive">{error}</p>}
			<DndContext
				collisionDetection={closestCorners}
				onDragEnd={(e) => {
					const error = handleDragEnd(e);
					setError(error);
				}}
			>
				<SortableContext items={stops} strategy={verticalListSortingStrategy}>
					<Timeline defaultValue={1}>
						{stops.map((stop) => (
							<Stop key={stop.id} stop={stop} />
						))}
					</Timeline>
				</SortableContext>
			</DndContext>
		</>
	);
};

interface StopProps {
	stop: StopData;
}

const Stop = ({ stop }: StopProps) => {
	const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
		id: stop.id,
	});

	const style: CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	const handleRemoveStop = () => {
		toast.promise(new Promise((r) => setTimeout(r, 3000)), {
			loading: "Removing the request...",
			success: `Request with trip id #PlaceholderId successfully removed. Requests have been returned to the optimization queue.`,
			error: `Could not remove request #PlaceholderId, please try again later`,
		});
	};

	return (
		<TimelineItem step={stop.order}>
			<TimelineSeparator />
			<TimelineIndicator />
			<div
				className="flex bg-white hover:cursor-grab"
				ref={setNodeRef}
				style={style}
				{...attributes}
				{...listeners}
			>
				<div className="w-full">
					<TimelineHeader>
						<TimelineDate>
							{stop.actualArrivalTime
								? `Arrived: ${format(stop.actualArrivalTime, "PPp")}`
								: `Est. ${format(stop.arrivalTime, "PPp")}`}
						</TimelineDate>
						<TimelineTitle>{stop.type === "pickup" ? "Pickup" : "Drop-off"}</TimelineTitle>
					</TimelineHeader>
					<TimelineContent>
						<div className="flex items-center gap-1">
							<MapPin className="size-4 text-muted-foreground" />
							{stop.location.address}
						</div>
						{/* <div className="flex items-center gap-1">
							Capacity: {stop.currentCapacity}
						</div> */}
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button className="mt-2" size="xs" variant="destructive">
									Remove
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>
										Are you sure you want to remove this request from the trip?
									</AlertDialogTitle>
									<AlertDialogDescription>
										This trip upon removed will return to the scheduling pool.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>Cancel</AlertDialogCancel>
									{/* <AlertDialogAction> */}
									<AlertDialogAction onClick={() => handleRemoveStop()}>Continue</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</TimelineContent>
				</div>
				<div className="my-auto">
					<GripVertical className="text-muted-foreground" />
				</div>
			</div>
		</TimelineItem>
	);
};

interface AddRequestProps {
	/// The ID of the parent trip to exclude
	parentTrip: TripData;
}

const AddRequest = ({ parentTrip }: AddRequestProps) => {
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm">Add a request</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px] md:max-w-[1024px]">
				<DialogHeader>
					<DialogTitle>Select a request</DialogTitle>
					<DialogDescription>
						Selected request will be merged together with the current request
					</DialogDescription>
				</DialogHeader>
				<TripList parentTrip={parentTrip} onOpenChange={setOpen} />
			</DialogContent>
		</Dialog>
	);
};

interface TripListProps {
	/// The ID of the parent trip to exclude
	parentTrip: TripData;

	onOpenChange: (v: boolean) => void;
}

const TripList = ({ parentTrip, onOpenChange }: TripListProps) => {
	const { data, error, isLoading } = useSWR("/api/trips", () => getTrips({}));

	if (isLoading)
		return (
			<div className="items-center justify-center size-full">
				<Spinner />
			</div>
		);
	if (error) return <h1>Error getting avaiable requests</h1>;
	if (!data) return <p>No available requests could be found</p>;

	const handleRowSelect = (id: string) => {
		toast.promise(new Promise((r) => setTimeout(r, 3000)), {
			loading: "Adding the request...",
			success: `Request with trip id #${id} successfully added.`,
			error: (e) => {
				const apiErr = apiErrHandler(e);
				if (apiErr) return apiErr;

				return `Could not add request #${id}, please try again later`;
			},
		});
	};

	return (
		<TableView
			onRowClick={(row) => {
				console.log(row.original);
				handleRowSelect(row.original.id);
				onOpenChange(false);
			}}
			columns={tripColumns}
			// TODO: Filter out request base on same date
			fetcher={
				new Promise<TripData[]>((r) =>
					r(
						data.filter((d) => {
							return (
								d.id !== parentTrip.id &&
								d.departureTime.getDay() === parentTrip.departureTime.getDay() &&
								d.status !== "scheduled" &&
								d.status !== "completed"
							);
						}),
					),
				)
			}
		/>
	);

	// return data
	//   .filter((d) => d.id !== thisId)
	//   .map((trip) => (
	//     <Button
	//       variant="transparent"
	//       className="justify-start hover:bg-muted"
	//       key={trip.id}
	//     >
	//       <div>{trip.id}</div>
	//     </Button>
	//   ))
};

export default TripView;
