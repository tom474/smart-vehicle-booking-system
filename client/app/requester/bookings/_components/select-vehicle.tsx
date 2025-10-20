import { useEffect, useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { SheetClose } from "@/components/ui/sheet";
import { ChevronLeft, Car, Search, User, Phone, Hash, Palette, Users } from "lucide-react";
import {
	ColorEnumSchema,
	VehicleData,
	OutsourceVehicleData,
	OutsourceVehicleSchema,
	assignVehicle,
	assignOutsourceVehicle,
} from "@/apis/vehicle";
import { VendorData, getVendors } from "@/apis/vendor";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";
import Spinner from "@/components/spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getDriver } from "@/apis/driver";
import { capitalize } from "@/lib/string-utils";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { apiErrHandler } from "@/lib/error-handling";

interface SelectVehicleProps {
	bookingRequestId?: string | number;
	vehicles: VehicleData[];
	onVehicleSelection: (vehicle: VehicleWithDriver | OutsourceVehicleData | null) => void;
	selectedVehicle: VehicleWithDriver | OutsourceVehicleData | null;
	getAvailableVehicles: boolean;
	setGetAvailableVehicles: (value: boolean) => void;
	onLoadMore?: () => void;
	hasNextPage?: boolean;
	isLoading?: boolean;
}

type VehicleWithDriver = VehicleData & {
	driverName?: string;
};

export default function SelectVehicle({
	bookingRequestId,
	vehicles,
	onVehicleSelection,
	selectedVehicle,
	getAvailableVehicles,
	setGetAvailableVehicles,
	onLoadMore,
	hasNextPage,
	isLoading,
}: SelectVehicleProps) {
	const t = useTranslations("RequesterBookings.assignVehicle");

	const [isProcessing, setIsProcessing] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [vendors, setVendors] = useState<VendorData[]>([]);
	const [newVehicles, setNewVehicles] = useState<VehicleWithDriver[]>([]);
	const vehicleScrollRef = useRef<HTMLDivElement>(null);

	const handleScroll = useCallback(() => {
		if (!vehicleScrollRef.current || isLoading || !hasNextPage) return;
		const { scrollTop, scrollHeight, clientHeight } = vehicleScrollRef.current;
		if (scrollTop + clientHeight >= scrollHeight - 5) {
			onLoadMore?.();
		}
	}, [onLoadMore, isLoading, hasNextPage]);

	useEffect(() => {
		const scrollContainer = vehicleScrollRef.current;
		if (scrollContainer) {
			scrollContainer.addEventListener("scroll", handleScroll);
			return () => scrollContainer.removeEventListener("scroll", handleScroll);
		}
	}, [handleScroll]);

	useEffect(() => {
		// Fetch vendors if needed in the future
		const fetchVendors = async () => {
			try {
				setIsProcessing(true);
				const data = await getVendors({ limit: 100 });
				setVendors(data);
				setIsProcessing(false);
			} catch (error) {
				console.error("Error fetching vendors:", error);
			}
		};
		fetchVendors();
	}, []);

	useEffect(() => {
		if (vehicles.length === 0) return;
		// Fetch driver names for vehicles that have a driverId but no driver name
		const fetchDriversForVehicles = async () => {
			setIsProcessing(true);
			const vehiclesWithDrivers: VehicleWithDriver[] = await Promise.all(
				vehicles.map(async (vehicle) => {
					if (vehicle.driverId) {
						try {
							const driverData = await getDriver(vehicle.driverId);
							return { ...vehicle, driverName: driverData.name };
						} catch (error) {
							console.error(`Error fetching driver for vehicle ${vehicle.id}:`, error);
							return vehicle;
						}
					}
					return vehicle;
				}),
			);
			setNewVehicles(vehiclesWithDrivers);
			setIsProcessing(false);
		};

		fetchDriversForVehicles();
	}, [vehicles]);

	// React Hook Form with Zod validation
	const form = useForm<OutsourceVehicleData>({
		resolver: zodResolver(OutsourceVehicleSchema),
		defaultValues: {
			driverName: "",
			phoneNumber: "",
			licensePlate: "",
			model: "",
			color: undefined,
			capacity: 1,
			vendorId: "empty",
		},
		mode: "onChange", // Validate on change for real-time feedback
	});

	const {
		handleSubmit,
		formState: { isValid },
		watch,
		reset,
	} = form;

	// Watch all form values to check if form has data
	const formValues = watch();
	const hasFormData = Object.values(formValues).some(
		(value) => value != null && (typeof value === "string" ? value.trim() !== "" : value > 1),
	);

	const filteredVehicles = newVehicles.filter(
		(vehicle) =>
			vehicle.id !== selectedVehicle?.id &&
			(vehicle.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
				vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
				vehicle.color.toLowerCase().includes(searchQuery.toLowerCase()) ||
				vehicle.driverName?.toLowerCase().includes(searchQuery.toLowerCase())), // Changed from driverId to driverName
	);

	const handleSelectVehicle = async (vehicle: VehicleData | null) => {
		setIsProcessing(true);
		try {
			if (vehicle) {
				await assignVehicle({
					bookingRequestId: bookingRequestId as string | number,
					vehicleId: vehicle.id,
				});
			}
			onVehicleSelection(vehicle);
			// Reset form when selecting a vehicle
			reset();
		} catch (error) {
			const apiErr = apiErrHandler(error);
			if (apiErr) {
				toast.error(apiErr);
			} else {
				toast.error(t("error"));
			}
		}
		setIsProcessing(false);
	};

	const onSubmit = async (data: OutsourceVehicleData) => {
		try {
			await assignOutsourceVehicle({
				bookingRequestId: bookingRequestId as string | number,
				outSourceVehicle: data,
			});
			onVehicleSelection(data);
		} catch (error) {
			const apiErr = apiErrHandler(error);
			if (apiErr) {
				toast.error(apiErr);
			} else {
				toast.error(t("errorOutsource"));
			}
		}
	};

	const isOutsourceVehicle = (vehicle: VehicleWithDriver | OutsourceVehicleData): vehicle is OutsourceVehicleData => {
		return "driverName" in vehicle && "phoneNumber" in vehicle;
	};

	const hasDriverName = (
		vehicle: VehicleWithDriver | OutsourceVehicleData,
	): vehicle is (VehicleWithDriver & { driverName: string }) | OutsourceVehicleData => {
		return "driverName" in vehicle && vehicle.driverName != null;
	};

	return (
		<div className="flex flex-col h-full max-h-screen gap-4 p-4">
			{isProcessing && (
				<div className="absolute inset-0 z-50 flex items-center justify-center opacity-50 bg-background">
					<div className="flex flex-row items-center gap-2 text-lg font-medium">
						<Spinner /> {t("processing")}
					</div>
				</div>
			)}

			<div className="flex flex-col flex-1 min-h-0 space-y-4">
				<div className="flex flex-row items-center justify-between">
					<SheetClose asChild>
						<Button variant="ghost" className="hover:bg-background hover:text-success hover:cursor-pointer">
							<ChevronLeft className="size-6" />
						</Button>
					</SheetClose>
					<h3 className="text-lg font-semibold">{t("sheetTitle")}</h3>
					<div className="size-6"></div>
				</div>

				{/* Selected Vehicle */}
				{selectedVehicle && (
					<div className="space-y-2">
						<h4 className="font-medium">{t("selectedVehicle.title")}</h4>
						<div className="flex items-center justify-between p-3 border rounded bg-blue-50">
							<div className="flex items-center gap-3">
								<div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
									<Car className="w-6 h-6 text-blue-600" />
								</div>
								<div>
									<p className="font-medium">{selectedVehicle.licensePlate}</p>
									<p className="text-sm text-muted-foreground">
										{`${selectedVehicle.model} • ${selectedVehicle.color ? capitalize(selectedVehicle.color) : "N/A"} • ${selectedVehicle.capacity} seats`}
									</p>
									{isOutsourceVehicle(selectedVehicle) && (
										<p className="text-sm text-muted-foreground">
											{t("driver")}: {selectedVehicle.driverName} • {selectedVehicle.phoneNumber}
										</p>
									)}
									{!isOutsourceVehicle(selectedVehicle) && hasDriverName(selectedVehicle) && (
										<p className="text-sm text-muted-foreground">
											{t("driver")}: {selectedVehicle.driverName}
										</p>
									)}
									{!isOutsourceVehicle(selectedVehicle) && selectedVehicle.driverId && (
										<p className="text-sm text-muted-foreground">
											{t("driver")}: {selectedVehicle.driverId}
										</p>
									)}
									<p className="text-xs text-muted-foreground">
										{isOutsourceVehicle(selectedVehicle)
											? "Vendor Vehicle"
											: selectedVehicle.ownershipType === "company"
												? "Company Vehicle"
												: "Vendor Vehicle"}
									</p>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Available Vehicles */}
				<div className="flex flex-col flex-1 min-h-0 gap-2">
					<div className="flex items-center justify-between">
						<h4 className="font-medium">{t("availableVehicles.title")}</h4>
						<div className="flex items-center gap-2 text-subtitle-2">
							<span className="text-sm">{t("availableVehicles.all")}</span>
							<Switch
								checked={getAvailableVehicles}
								onCheckedChange={(checked: boolean) => setGetAvailableVehicles(checked)}
							/>
							<span className="text-sm">{t("availableVehicles.available")}</span>
						</div>
					</div>

					{/* Search field */}
					<div className="relative">
						<Search className="absolute transform -translate-y-1/2 left-3 top-1/2 text-muted-foreground size-4" />
						<Input
							type="text"
							placeholder={t("availableVehicles.searchVehicles")}
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-10"
						/>
					</div>

					{/* Vehicle list */}
					<div ref={vehicleScrollRef} className="flex-1 min-h-0 space-y-2 overflow-y-auto">
						{filteredVehicles.length > 0 ? (
							filteredVehicles.map((vehicle) => (
								<div
									key={vehicle.id}
									className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
								>
									<div className="flex items-center gap-3">
										<div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
											<Car className="w-5 h-5 text-gray-600" />
										</div>
										<div>
											<p className="font-medium">{vehicle.licensePlate}</p>
											<p className="text-sm text-muted-foreground">
												{vehicle.model} • {capitalize(vehicle.color)} • {vehicle.capacity}{" "}
												{t("seats")}
											</p>
											{vehicle.driverName && (
												<p className="text-sm text-muted-foreground">
													{t("driver")}: {vehicle.driverName}
												</p>
											)}
											<p className="text-xs text-muted-foreground">
												{vehicle.ownershipType === "company"
													? t("availableVehicles.companyVehicle")
													: t("availableVehicles.vendorVehicle")}
											</p>
										</div>
									</div>
									<Button size="sm" onClick={() => handleSelectVehicle(vehicle)}>
										{t("availableVehicles.select")}
									</Button>
								</div>
							))
						) : (
							<p className="py-4 text-sm text-center text-muted-foreground">
								{searchQuery ? `No vehicles found matching "${searchQuery}"` : "No available vehicles"}
							</p>
						)}
						{/* Loading indicator */}
						{isLoading && (
							<div className="flex justify-center py-4">
								<div className="text-sm text-muted-foreground">Loading more vehicles...</div>
							</div>
						)}
						{/* End of list indicator */}
						{!hasNextPage && !searchQuery && (
							<div className="flex justify-center py-4">
								<div className="text-sm text-muted-foreground">No more vehicles to load</div>
							</div>
						)}
					</div>
				</div>

				<Separator />

				{/* Outsource Vehicle Form */}
				<Form {...form}>
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
						<h4 className="font-medium">{t("outsourcedVehicles.title")}</h4>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="driverName"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="flex items-center gap-2">
											<User className="w-4 h-4" />
											{t("outsourcedVehicles.driverName")}
										</FormLabel>
										<FormControl>
											<Input placeholder={t("outsourcedVehicles.enterDriverName")} {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="phoneNumber"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="flex items-center gap-2">
											<Phone className="w-4 h-4" />
											{t("outsourcedVehicles.phoneNumber")}
										</FormLabel>
										<FormControl>
											<Input placeholder={t("outsourcedVehicles.enterPhoneNumber")} {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="licensePlate"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="flex items-center gap-2">
											<Hash className="w-4 h-4" />
											{t("outsourcedVehicles.licensePlate")}
										</FormLabel>
										<FormControl>
											<Input placeholder={t("outsourcedVehicles.enterLicensePlate")} {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="model"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="flex items-center gap-2">
											<Car className="w-4 h-4" />
											{t("outsourcedVehicles.vehicleModel")}
										</FormLabel>
										<FormControl>
											<Input placeholder={t("outsourcedVehicles.enterVehicleModel")} {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-3 gap-4">
							<FormField
								control={form.control}
								name="color"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="flex items-center gap-2">
											<Palette className="w-4 h-4" />
											{t("outsourcedVehicles.vehicleColor")}
										</FormLabel>
										<FormControl>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value ?? undefined}
											>
												<SelectTrigger className="w-full">
													<SelectValue placeholder={t("outsourcedVehicles.vehicleColor")} />
												</SelectTrigger>
												<SelectContent>
													{/* <SelectItem value="empty">
														{t("outsourcedVehicles.noColor")}
													</SelectItem> */}
													{Object.values(ColorEnumSchema.enum).map((color) => (
														<SelectItem key={color} value={color}>
															{color.charAt(0).toUpperCase() + color.slice(1)}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="capacity"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="flex items-center gap-2">
											<Users className="w-4 h-4" />
											{t("outsourcedVehicles.capacity")}
										</FormLabel>
										<FormControl>
											<Input
												type="number"
												min="1"
												max="50"
												placeholder={t("outsourcedVehicles.enterCapacity")}
												{...field}
												onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="vendorId"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="flex items-center gap-2">
											<Users className="w-4 h-4" />
											{t("outsourcedVehicles.vendor")}
										</FormLabel>
										<FormControl>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value ?? undefined}
											>
												<FormControl>
													<SelectTrigger className="w-full">
														<SelectValue
															placeholder={t("outsourcedVehicles.selectVendor")}
														/>
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="empty">
														{t("outsourcedVehicles.noVendor")}
													</SelectItem>
													{vendors.map((vendor) => (
														<SelectItem key={vendor.id} value={vendor.id.toString()}>
															{vendor.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</form>
				</Form>
			</div>

			{isValid && hasFormData && (
				<span className="text-subtitle-3 text-destructive">
					{t("outsourcedVehicles.confirmVehicleWarning")}
				</span>
			)}

			{/* Confirm button */}
			<div>
				<SheetClose asChild>
					<Button
						variant="default"
						className="w-full"
						disabled={!selectedVehicle && !isValid}
						onClick={() => {
							if (isValid && hasFormData) {
								handleSubmit(onSubmit)();
							} else {
								onVehicleSelection(selectedVehicle);
							}
						}}
					>
						{isValid && hasFormData ? t("confirmOutsourceVehicle") : t("confirmSelectedVehicle")}
					</Button>
				</SheetClose>
			</div>
		</div>
	);
}
