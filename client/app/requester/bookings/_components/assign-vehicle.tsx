import { Button } from "@/components/ui/button";
import { VehicleData, OutsourceVehicleData, getVehicles, getAvailableVehicleForBookingRequestId } from "@/apis/vehicle";
import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import SelectVehicle from "@/app/requester/bookings/_components/select-vehicle";
import { useTranslations } from "next-intl";
import { getTrips } from "@/apis/trip";
import { useRouter } from "next/navigation";

interface AssignVehicleProps {
	bookingRequestId?: string | number;
	onTripChange?: () => void | Promise<void>;
	disabled?: boolean;
	mobile?: boolean;
	detach?: boolean;
	open?: boolean;
	onOpenChange?: Dispatch<SetStateAction<boolean>>;
}

export default function AssignVehicle({
	bookingRequestId,
	onTripChange,
	disabled = false,
	mobile = false,
	detach,
	open,
	onOpenChange,
}: AssignVehicleProps) {
	const t = useTranslations("RequesterBookings.assignVehicle");
	const router = useRouter();

	const [vehicles, setVehicles] = useState<VehicleData[]>([]);
	const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | OutsourceVehicleData | null>(null);
	const [getAvailableVehicles, setGetAvailableVehicles] = useState<boolean>(false);

	// Infinite scroll states
	const [page, setPage] = useState(1);
	const [hasNextPage, setHasNextPage] = useState(true);
	const [isLoading, setIsLoading] = useState(false);

	const fetchVehicles = async (pageNum = 1, reset = false) => {
		try {
			setIsLoading(true);
			let data: VehicleData[] = [];
			if (bookingRequestId) {
				if (getAvailableVehicles) {
					data = await getAvailableVehicleForBookingRequestId(bookingRequestId);
				} else {
					data = await getVehicles({ page: pageNum, limit: 10 });
				}
				const filteredData = data.filter((vehicle) => vehicle.driverId !== null);
				if (reset) {
					setVehicles(filteredData);
				} else {
					setVehicles((prev) => [...prev, ...filteredData]);
				}
				setHasNextPage(filteredData.length === 10);
			}
		} catch (error) {
			console.error("Failed to fetch vehicles:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const fetchSelectedVehicle = async () => {
		try {
			// Fetch assigned vehicle for the booking request if any
			if (bookingRequestId) {
				const trips = await getTrips({
					bookingRequestId: bookingRequestId,
				});
				if (trips.length !== 0) {
					if (trips[0].vehicle) {
						setSelectedVehicle(trips[0].vehicle);
					} else if (trips[0].outsourcedVehicle) {
						setSelectedVehicle(trips[0].outsourcedVehicle);
					}
				}
			}
		} catch (error) {
			console.error("Failed to fetch selected vehicle:", error);
		}
	};

	useEffect(() => {
		fetchVehicles(1, true);
		fetchSelectedVehicle();
		setPage(1);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [bookingRequestId, getAvailableVehicles]);

	const handleLoadMore = () => {
		if (!isLoading && hasNextPage) {
			const nextPage = page + 1;
			setPage(nextPage);
			fetchVehicles(nextPage);
		}
	};

	const handleVehicleSelection = (vehicle: VehicleData | OutsourceVehicleData | null) => {
		router.refresh();
		setSelectedVehicle(vehicle);
		onTripChange?.();
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			{!detach && (
				<SheetTrigger
					asChild
					className={`flex flex-row items-center ${disabled ? "pointer-events-none opacity-60" : ""}`}
					disabled={disabled}
				>
					<Button variant="default">{t("assignButton")}</Button>
				</SheetTrigger>
			)}
			<SheetContent
				className={`[&>button]:hidden ${
					mobile ? "max-w-screen sm:max-w-screen w-screen" : "max-w-xl sm:max-w-xl w-xl"
				}`}
			>
				<SheetHeader className="hidden">
					<SheetTitle>Select Vehicle</SheetTitle>
					<SheetDescription>Choose a vehicle for your booking or add an outsource vehicle.</SheetDescription>
				</SheetHeader>
				<SelectVehicle
					bookingRequestId={bookingRequestId}
					vehicles={vehicles}
					onVehicleSelection={handleVehicleSelection}
					selectedVehicle={selectedVehicle}
					getAvailableVehicles={getAvailableVehicles}
					setGetAvailableVehicles={setGetAvailableVehicles}
					onLoadMore={handleLoadMore}
					hasNextPage={hasNextPage}
					isLoading={isLoading}
				/>
			</SheetContent>
		</Sheet>
	);
}
