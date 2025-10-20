import { format } from "date-fns/format";
import {
	CalendarIcon,
	Car,
	CheckCircle,
	Clock,
	DollarSign,
	MessageSquare,
	NotepadText,
	User,
	Wrench,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import useSWR from "swr";
import { getDriver } from "@/apis/driver";
import { getVehicle } from "@/apis/vehicle";
import {
	approveVehicleServiceRequest,
	rejectVehicleServiceRequest,
	type VehicleServiceData,
} from "@/apis/vehicle-service-request";
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
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import TextViewField from "@/components/ui/view-field";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { apiErrHandler } from "@/lib/error-handling";

interface Props {
	data: VehicleServiceData;
}
export const ViewVsr = ({ data: vsr }: Props) => {
	const router = useRouter();

	const tToast = useTranslations("Coordinator.vehicleService.toast");

	const handleApprove = () => {
		toast.promise(approveVehicleServiceRequest(vsr.id), {
			loading: tToast("approve.loading"),
			success: () => {
				router.refresh();
				return tToast("approve.success", {
					id: vsr.id,
				});
			},
			error: (e) => {
				const apiErr = apiErrHandler(e);
				if (apiErr) return apiErr;

				return tToast("approve.error", {
					id: vsr.id,
				});
			},
		});
	};

	return (
		<div className="flex flex-col h-full gap-2">
			<FieldSeparator>
				<DriverInfo id={vsr.driverId} />

				<VehicleInfo id={vsr.vehicleId} />

				<TextViewField
					icon={MessageSquare}
					title="Reason"
					value={vsr.reason || "N/A"}
				/>

				<TextViewField
					icon={NotepadText}
					title="Description"
					value={vsr.description || "N/A"}
				/>

				<TextViewField
					icon={Wrench}
					title="Service Type"
					value={
						vsr.serviceType.charAt(0).toUpperCase() +
						vsr.serviceType.slice(1)
					}
				/>

				<TextViewField
					icon={Clock}
					title="From"
					value={new Date(vsr.startTime).toLocaleString()}
				/>

				<TextViewField
					icon={Clock}
					title="To"
					value={new Date(vsr.endTime).toLocaleString()}
				/>

				<TextViewField
					icon={CheckCircle}
					title="Status"
					value={
						vsr.status.charAt(0).toUpperCase() + vsr.status.slice(1)
					}
				/>

				<TextViewField
					icon={CalendarIcon}
					title="Schedule"
					value={
						vsr.schedule
							? `Schedule ID: ${vsr.schedule.id || "N/A"}`
							: "No schedule assigned"
					}
				/>

				<TextViewField
					icon={DollarSign}
					title="Expenses"
					value={
						vsr.expenses?.length
							? `${vsr.expenses.length} expense(s) recorded`
							: "No expenses recorded"
					}
				/>

				<TextViewField
					icon={CalendarIcon}
					title="Created At"
					value={new Date(vsr.createdAt).toLocaleString()}
				/>

				{vsr.updatedAt && (
					<TextViewField
						icon={CalendarIcon}
						title="Updated At"
						value={new Date(vsr.updatedAt).toLocaleString()}
					/>
				)}
			</FieldSeparator>

			{/* Actions */}

			{vsr.status === "pending" && (
				<div className="flex items-end h-full gap-3 pt-4">
					<Button
						variant="success"
						className="flex-1"
						onClick={() => handleApprove()}
					>
						Approve
					</Button>
					<RejectButton service={vsr} />
					{/* <Button */}
					{/* 	variant="default" */}
					{/* 	className="flex-1" */}
					{/* 	// onClick={() => onEdit?.(request.id)} */}
					{/* > */}
					{/* 	Edit */}
					{/* </Button> */}
				</div>
			)}
		</div>
	);
};

const RejectButton = ({ service }: { service: VehicleServiceData }) => {
	const handleReject = () => {
		toast.promise(rejectVehicleServiceRequest(service.id, "Rejected"), {
			loading: "Rejecting vehicle service...",
			success: `Vehicle service #${service.id} rejected successfully`,
			error: (e) => {
				const apiErr = apiErrHandler(e);
				if (apiErr) return apiErr;

				return `Could not reject vehicle service #${service.id}, please try again later`;
			},
		});
	};

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button variant="destructive" className="flex-1">
					Reject
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader className="gap-4">
					<AlertDialogTitle>
						Are you sure you want to reject this vehicle service
						request?
					</AlertDialogTitle>
					<AlertDialogDescription className="">
						This action is permanent and can not be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={() => handleReject()}>
						Continue
					</AlertDialogAction>
					{/* <Button */}
					{/* 	type="submit" */}
					{/* 	onClick={() => { */}
					{/* 		onSubmit(targetId) */}
					{/* 	}} */}
					{/* 	variant="destructive" */}
					{/* > */}
					{/* 	{destructiveLabel ?? "Submit"} */}
					{/* </Button> */}
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

interface DateTimePickerProps {
	value?: Date;
	onChange: (date?: Date) => void;
}

export function DateTimePicker({ value, onChange }: DateTimePickerProps) {
	const handleDateChange = (date?: Date) => {
		if (!date) return;

		// Preserve the existing time when changing the date
		const newDate = new Date(date);
		if (value) {
			newDate.setHours(value.getHours());
			newDate.setMinutes(value.getMinutes());
			newDate.setSeconds(value.getSeconds());
		}
		onChange(newDate);
	};

	const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const time = e.target.value;
		if (!time || !value) return;

		const [hours, minutes] = time.split(":").map(Number);
		const newDate = new Date(value);
		newDate.setHours(hours);
		newDate.setMinutes(minutes);
		onChange(newDate);
	};

	return (
		<div className="flex gap-2">
			<Popover>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						className={cn(
							"w-[180px] pl-3 text-left font-normal",
							!value && "text-muted-foreground",
						)}
					>
						{value ? (
							format(value, "PPP")
						) : (
							<span>Pick a date</span>
						)}
						<CalendarIcon className="w-4 h-4 ml-auto opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0" align="start">
					<Calendar
						mode="single"
						selected={value}
						onSelect={handleDateChange}
						disabled={(date) =>
							date < new Date(new Date().setHours(0, 0, 0, 0))
						}
						initialFocus
					/>
				</PopoverContent>
			</Popover>

			<Input
				type="time"
				step="60"
				value={value ? format(value, "HH:mm") : ""}
				onChange={handleTimeChange}
				className="w-[100px] [&::-webkit-calendar-picker-indicator]:hidden"
			/>
		</div>
	);
}

interface DriverInfoProps {
	id: string;
}

const DriverInfo = ({ id }: DriverInfoProps) => {
	const { data, error, isLoading } = useSWR(`/api/driver/${id}`, () =>
		getDriver(id),
	);

	if (isLoading) return <Spinner />;
	if (error) return "There was an error";
	if (!data) return `Cant find driver with ID ${id}`;

	return <TextViewField icon={User} title="Driver" value={data.name} />;

	// return (
	//   <div>
	//     <h4 className="font-semibold">Driver</h4>
	//     <p>
	//       {data.name} ({data.username})
	//     </p>
	//     <p className="text-sm text-muted-foreground">
	//       {data.email} • {data.phoneNumber}
	//     </p>
	//   </div>
	// );
};

interface VehicleInfoProps {
	id: string;
}

const VehicleInfo = ({ id }: VehicleInfoProps) => {
	const { data, error, isLoading } = useSWR(`/api/driver/${id}`, () =>
		getVehicle(id),
	);

	if (isLoading) return <Spinner />;
	if (error) return "There was an error";
	if (!data) return `Cant find driver with ID ${id}`;

	return <TextViewField icon={Car} title="Vehicle" value={data.model} />;

	// return (
	//   <div>
	//     <div>
	//       <h4 className="font-semibold">Vehicle</h4>
	//       <p>{data.model}</p>
	//       <p className="text-sm text-muted-foreground">
	//         Plate: {data.licensePlate}
	//       </p>
	//     </div>
	//   </div>
	// );
};

// interface ExpensesInfoProps {
//   id: string;
// }
//
// const ExpensesInfo = ({ id }: ExpensesInfoProps) => {
//   const { data, error, isLoading } = useSWR(`/api/driver/${id}`, () =>
//     getExpense(id),
//   );
//
//   if (isLoading) return <Spinner />;
//   if (error) return "There was an error";
//   if (!data) return `Cant find driver with ID ${id}`;
//
//   return <TextViewField icon={User} title="Driver" value={data.id} />;
//
//   // return (
//   //   <div>
//   //     <div>
//   //       <h4 className="font-semibold">{data.id}</h4>
//   //       <p className="text-sm text-muted-foreground">Amount: {data.amount}</p>
//   //     </div>
//   //   </div>
//   // );
// };
