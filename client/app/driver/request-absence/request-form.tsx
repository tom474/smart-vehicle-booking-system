"use client";

import { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
	SheetClose,
} from "@/components/ui/sheet";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Form } from "@/components/ui/form";
import { getUserFromToken } from "@/lib/utils";
import { getDriver } from "@/apis/driver";
import { ScheduleData, getSchedule, checkConflictSchedule } from "@/apis/schedule";

import { ServiceCategoryField } from "@/app/driver/request-absence/_form-components/service-category";
import { DateFields } from "@/app/driver/request-absence/_form-components/date";
import { ReasonField } from "@/app/driver/request-absence/_form-components/reason";
import { NoteField } from "@/app/driver/request-absence/_form-components/note";

import { LeaveScheduleSchema, LeaveScheduleData, createLeaveSchedule } from "@/apis/leave-schedule";
import { VehicleServiceSchema, VehicleServiceData, createVehicleService } from "@/apis/vehicle-service";
import RequestDetails from "@/app/driver/request-absence/request-details";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { apiErrHandler } from "@/lib/error-handling";

type RequestType = "leave-schedule" | "vehicle-service";

interface CreateRequestProps {
	mobile?: boolean;
	onRequestChange?: () => void | Promise<void>;
	coordinator?: boolean;
	requestType: RequestType;
}

export default function RequestForm({ mobile, onRequestChange, coordinator = false, requestType }: CreateRequestProps) {
	const t = useTranslations("DriverRequest");

	const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
	const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
	const [submittedRequestId, setSubmittedRequestId] = useState<number | string>();

	const handleRequestCreated = async (requestId: number | string) => {
		setIsCreateSheetOpen(false);
		setSubmittedRequestId(requestId);
		setIsDetailsSheetOpen(true);
	};

	const getButtonText = () => {
		return requestType === "leave-schedule" ? t("createNewLeave") : t("createNewService");
	};

	const getButtonTextShort = () => {
		return requestType === "leave-schedule" ? t("createLeave") : t("createService");
	};

	return (
		<>
			<Sheet open={isCreateSheetOpen} onOpenChange={setIsCreateSheetOpen}>
				<SheetTrigger asChild>
					{!mobile ? (
						<Button className="bg-success hover:bg-success/90">{getButtonText()}</Button>
					) : (
						<Button className="fixed z-10 ml-auto rounded-full bottom-20 right-4 bg-success">
							{/* <Plus className="size-6" /> */}
							{getButtonTextShort()}
						</Button>
					)}
				</SheetTrigger>
				<SheetContent
					className={`[&>button]:hidden ${
						mobile ? "max-w-screen sm:max-w-screen w-screen" : "max-w-xl sm:max-w-xl"
					}`}
				>
					<SheetHeader className="hidden">
						<SheetTitle>{getButtonText()}</SheetTitle>
						<SheetDescription>{getButtonText()}</SheetDescription>
					</SheetHeader>
					<CreateForm
						requestType={requestType}
						onRequestCreated={async (requestId: number | string) => {
							if (onRequestChange) {
								await onRequestChange();
							}
							await handleRequestCreated(requestId);
						}}
					/>
				</SheetContent>
			</Sheet>

			{isDetailsSheetOpen && submittedRequestId && (
				<RequestDetails
					requestId={submittedRequestId}
					requestType={requestType}
					mobile={mobile}
					coordinator={coordinator}
					openInitially={isDetailsSheetOpen}
					onRequestChange={onRequestChange}
				/>
			)}
		</>
	);
}

interface FormHeaderProps {
	requestType: RequestType;
}

function FormHeader({ requestType }: FormHeaderProps) {
	const t = useTranslations("DriverRequest");

	return (
		<div className="flex items-center justify-between w-full">
			<SheetClose asChild>
				<Button variant="ghost" className="hover:bg-background hover:text-success hover:cursor-pointer">
					<ChevronLeft className="size-6" />
				</Button>
			</SheetClose>
			<div className="text-headline-3">
				{requestType === "leave-schedule" ? t("submitNewLeave") : t("submitVehicleService")}
			</div>
			<div className="size-6"></div>
		</div>
	);
}

interface CreateFormProps {
	requestType: RequestType;
	onRequestCreated?: (requestId: number | string) => void | Promise<void>;
}

function CreateForm({ requestType, onRequestCreated }: CreateFormProps) {
	const t = useTranslations("DriverRequest");
	const [conflictingSchedules, setConflictingSchedules] = useState<ScheduleData[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const isLeaveRequest = requestType === "leave-schedule";

	const form = useForm<LeaveScheduleData | VehicleServiceData>({
		resolver: zodResolver(isLeaveRequest ? LeaveScheduleSchema : VehicleServiceSchema),
		mode: "onChange",
		reValidateMode: "onChange",
		defaultValues: isLeaveRequest
			? {
					id: "",
					driverId: "",
					status: "pending",
					startTime: undefined,
					endTime: undefined,
					reason: null,
					notes: null,
				}
			: {
					id: "",
					driverId: "",
					vehicleId: "",
					status: "pending",
					serviceType: "maintenance",
					startTime: undefined,
					endTime: undefined,
					reason: null,
					description: null,
				},
	});

	useEffect(() => {
		const fetchVehicleId = async () => {
			const driverToken = getUserFromToken();
			if (!driverToken) {
				console.error("Failed to get driver from token");
				return;
			}
			const driver = await getDriver(driverToken.id);

			// Reset form once with all the data
			const resetData = isLeaveRequest
				? {
						id: "",
						driverId: driver?.id,
						status: "pending" as const,
						startTime: undefined,
						endTime: undefined,
						reason: null,
						notes: null,
					}
				: {
						id: "",
						driverId: driver?.id,
						vehicleId: driver?.vehicleId ?? undefined,
						status: "pending" as const,
						serviceType: "maintenance" as const,
						startTime: undefined,
						endTime: undefined,
						reason: null,
						description: null,
					};

			form.reset(resetData);
		};

		fetchVehicleId();
	}, [form, isLeaveRequest]);

	const onSubmit = async (data: LeaveScheduleData | VehicleServiceData) => {
		try {
			setIsSubmitting(true);
			const checkConflict = await checkConflictSchedule(null, data.driverId!, data.startTime!, data.endTime!);
			if (checkConflict.isConflicted) {
				toast.error(t("toast.conflict"));
				const conflictingScheduleIds = checkConflict.conflictingScheduleIds;
				setConflictingSchedules(
					await Promise.all(conflictingScheduleIds.map(async (id: string | number) => await getSchedule(id))),
				);
				return;
			}

			const createdRequest = isLeaveRequest
				? await createLeaveSchedule(data as LeaveScheduleData)
				: await createVehicleService(data as VehicleServiceData);

			toast.success(t("toast.success"));
			if (onRequestCreated) {
				await onRequestCreated(createdRequest.id);
			}
		} catch (error) {
			const apiErr = apiErrHandler(error);
			if (apiErr) {
				toast.error(apiErr);
			} else {
				toast.error(t("toast.error"));
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	// Manual validation function
	const isFormValid = () => {
		const values = form.watch();

		if (isLeaveRequest) {
			const leaveData = values as LeaveScheduleData;
			return !!(leaveData.startTime && leaveData.endTime);
		} else {
			const serviceData = values as VehicleServiceData;
			return !!(serviceData.startTime && serviceData.endTime && serviceData.reason);
		}
	};

	return (
		<div className="flex flex-col w-full h-screen p-4">
			<FormHeader requestType={requestType} />

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col justify-between h-full pt-2">
					<div className="flex-1 space-y-2">
						{!isLeaveRequest && <ServiceCategoryField />}
						<DateFields form={form} />
						<ReasonField form={form} requestType={requestType} />
						{isLeaveRequest ? (
							<NoteField form={form} fieldName="notes" />
						) : (
							<NoteField form={form} fieldName="description" />
						)}
					</div>
					<div>
						{conflictingSchedules.length > 0 && (
							<div className="p-4 mb-4 overflow-auto border border-red-300 rounded-lg bg-red-50 max-h-50">
								<div className="mb-1 text-red-600 text-subtitle-1">
									{t("requestForm.conflictingSchedules")}:
								</div>
								<div className="text-red-700 space-y-1.25">
									{conflictingSchedules.map((schedule) => (
										<div className="flex flex-col text-caption" key={schedule.id}>
											<div className="text-subtitle-2">{schedule.title}</div>
											<div className="text-body-2">{schedule.description}</div>
											<div className="text-body-2">
												{format(schedule.startTime, "HH:mm, dd/MM/yyyy")} -
												{format(schedule.endTime, "HH:mm, dd/MM/yyyy")}
											</div>
										</div>
									))}
								</div>
							</div>
						)}
						<Button
							variant="default"
							className="w-full bg-success hover:bg-success/90"
							type="submit"
							onClick={() => {
								onSubmit(form.getValues());
							}}
							disabled={isSubmitting || !isFormValid()}
						>
							{isSubmitting ? t("submitting") : t("submit")}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
