"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, NotebookPen, FileX } from "lucide-react";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
	SheetClose,
} from "@/components/ui/sheet";
import Spinner from "@/components/spinner";
import StatusBadge from "@/components/status-badge";
import { Separator } from "@/components/ui/separator";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";

import { ServiceCategoryField } from "@/app/driver/request-absence/_form-components/service-category";
import { DateFields } from "@/app/driver/request-absence/_form-components/date";
import { ReasonField } from "@/app/driver/request-absence/_form-components/reason";
import { NoteField } from "@/app/driver/request-absence/_form-components/note";

import { LeaveScheduleSchema, LeaveScheduleData, getLeaveSchedule } from "@/apis/leave-schedule";
import { VehicleServiceSchema, VehicleServiceData, getVehicleService } from "@/apis/vehicle-service";
import { ScheduleData } from "@/apis/schedule";
import CancelDialog from "@/app/driver/request-absence/_form-components/cancel-dialog";
import ModifyDialog from "@/app/driver/request-absence/_form-components/modify-dialog";
import { useTranslations } from "next-intl";
import { format } from "date-fns";

type RequestType = "leave-schedule" | "vehicle-service";

interface RequestDetailsProps {
	requestId: number | string;
	requestType: RequestType;
	data?: LeaveScheduleData | VehicleServiceData;
	trigger?: React.ReactNode;
	mobile?: boolean;
	openInitially?: boolean;
	onRequestChange?: () => void | Promise<void>;
	coordinator?: boolean;
}

export default function RequestDetails({
	requestId,
	requestType,
	data,
	trigger,
	mobile = true,
	openInitially = false,
	onRequestChange,
	coordinator = false,
}: RequestDetailsProps) {
	const [isSheetOpen, setIsSheetOpen] = useState(openInitially);

	return (
		<Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
			{trigger && <SheetTrigger className="w-full">{trigger}</SheetTrigger>}
			<SheetContent
				className={`[&>button]:hidden ${
					mobile ? "max-w-screen sm:max-w-screen w-screen" : "max-w-xl sm:max-w-xl"
				}`}
			>
				<SheetHeader className="hidden">
					<SheetTitle>{requestType === "leave-schedule" ? "Leave Details" : "Service Details"}</SheetTitle>
					<SheetDescription>
						{requestType === "leave-schedule"
							? "View Leave Schedule Details"
							: "View Vehicle Service Details"}
					</SheetDescription>
				</SheetHeader>
				<RequestDetailsSheet
					requestId={requestId}
					requestType={requestType}
					data={data}
					coordinator={coordinator}
					setIsSheetOpen={setIsSheetOpen}
					onRequestChange={onRequestChange}
				/>
			</SheetContent>
		</Sheet>
	);
}

function RequestDetailsHeader({ requestId, requestType }: { requestId?: number | string; requestType: RequestType }) {
	const t = useTranslations("DriverRequest");

	return (
		<div className="flex items-center justify-between w-full">
			<SheetClose asChild>
				<Button variant="ghost" className="hover:bg-background hover:text-success hover:cursor-pointer">
					<ChevronLeft className="size-6" />
				</Button>
			</SheetClose>
			<p className="text-subtitle-1">
				{requestType === "leave-schedule" ? t("leave") : t("service")} #{requestId}
			</p>
			<div className="size-6"></div>
		</div>
	);
}

interface RequestDetailsSheetProps {
	requestId: number | string;
	requestType: RequestType;
	data?: LeaveScheduleData | VehicleServiceData;
	coordinator?: boolean;
	modify?: boolean;
	setIsSheetOpen?: (open: boolean) => void;
	onRequestChange?: () => void | Promise<void>;
}

export function RequestDetailsSheet({
	requestId,
	requestType,
	data,
	coordinator = false,
	modify = false,
	setIsSheetOpen,
	onRequestChange,
}: RequestDetailsSheetProps) {
	const t = useTranslations("DriverRequest");

	const [disableFields, setDisableFields] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [requestData, setRequestData] = useState<LeaveScheduleData | VehicleServiceData>();
	const [expenseIds, setExpenseIds] = useState<string[]>([]);
	const [conflictingSchedules, setConflictingSchedules] = useState<ScheduleData[]>([]);
	const [isProcessing, setIsProcessing] = useState(false);

	const isLeaveRequest = requestType === "leave-schedule";

	const form = useForm<LeaveScheduleData | VehicleServiceData>({
		resolver: zodResolver(isLeaveRequest ? LeaveScheduleSchema : VehicleServiceSchema),
		defaultValues: requestData,
	});

	useEffect(() => {
		if (modify) {
			setDisableFields(false);
		}
	}, [modify]);

	useEffect(() => {
		const fetchRequestData = async () => {
			setIsLoading(true);
			if (!data) {
				try {
					const fetchedData = isLeaveRequest
						? await getLeaveSchedule(requestId)
						: await getVehicleService(requestId);
					setRequestData(fetchedData);
					if (fetchedData && fetchedData.status !== "pending") {
						setDisableFields(true);
					}
					if (!isLeaveRequest) {
						const expenses = (fetchedData as VehicleServiceData).expenseIds;
						if (expenses.length > 0) {
							setExpenseIds(expenses);
						}
					}
				} catch (error) {
					console.error(`Failed to fetch ${requestType}:`, error);
				} finally {
					setIsLoading(false);
				}
			} else {
				setRequestData(data);
				if (data.status !== "pending") {
					setDisableFields(true);
				}
				if (!isLeaveRequest) {
					const expenses = (data as VehicleServiceData).expenseIds;
					if (expenses.length > 0) {
						setExpenseIds(expenses);
					}
				}
				setIsLoading(false);
			}
		};

		fetchRequestData();
	}, [data, requestId, requestType, isLeaveRequest]);

	useEffect(() => {
		if (requestData) {
			form.reset(requestData);
		}
	}, [requestData, form]);

	if (isLoading || !requestData) {
		return (
			<div className="flex flex-col w-full h-screen p-4">
				<RequestDetailsHeader requestType={requestType} />
				<div className="flex flex-col items-center justify-center w-full h-screen">
					<Spinner />
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col w-full h-screen p-4">
			<RequestDetailsHeader requestId={requestData.id} requestType={requestType} />

			{/* Status */}
			<div className="flex flex-row items-center justify-center w-full gap-2 mt-2">
				<span className="text-md text-muted-foreground">{t("status")}:</span>
				<StatusBadge status={requestData.status} />
			</div>

			<Form {...form}>
				<div className="flex flex-col justify-between h-full pt-2">
					<div className="flex-1 space-y-2">
						{/* Reject Reason */}
						{requestData.status === "rejected" && requestData.rejectReason && (
							<div className="flex flex-col gap-4">
								<div className="flex flex-row justify-between mt-4">
									<span className="flex flex-row items-center gap-2 px-1 text-red-500 text-subtitle-1">
										<FileX />
										{t("rejectReason")}
									</span>
									<span>{requestData.rejectReason}</span>
								</div>
								<Separator />
							</div>
						)}

						{!isLeaveRequest && <ServiceCategoryField disabled={disableFields} />}
						<DateFields form={form} disabled={disableFields} />
						<ReasonField form={form} disabled={disableFields} requestType={requestType} />
						{isLeaveRequest ? (
							<NoteField form={form} fieldName="notes" disabled={disableFields} />
						) : (
							<NoteField form={form} fieldName="description" disabled={disableFields} />
						)}

						{/* espenseId related to vehicle service */}
						{!isLeaveRequest && expenseIds.length > 0 && (
							<>
								<div className="flex flex-row items-center gap-2 py-4">
									<div className="flex-1">
										<Separator />
									</div>
									<p className="text-sm text-muted-foreground whitespace-nowrap">
										{t("requestForm.details")}
									</p>
									<div className="flex-1">
										<Separator />
									</div>
								</div>

								<div className="flex items-center justify-between p-1">
									<div className="flex flex-row items-center gap-2 text-subtitle-1">
										<NotebookPen />
										{t("requestForm.expenseId")}
									</div>
									<div className="text-body-2 text-muted-foreground">
										{expenseIds.map((id) => (
											<div key={id}>#{id}</div>
										))}
									</div>
								</div>
							</>
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
						<div className="flex flex-row gap-1">
							{requestData.status === "pending" && coordinator === false && (
								<>
									<CancelDialog
										requestData={requestData}
										requestType={requestType}
										onRequestChange={onRequestChange}
										setIsSheetOpen={setIsSheetOpen}
										disabled={expenseIds.length > 0}
										isProcessing={isProcessing}
										setIsProcessing={setIsProcessing}
									/>
									<ModifyDialog
										form={form}
										setRequestData={setRequestData}
										requestData={requestData}
										requestType={requestType}
										onRequestChange={onRequestChange}
										setIsSheetOpen={setIsSheetOpen}
										setConflictingSchedules={setConflictingSchedules}
										isProcessing={isProcessing}
										setIsProcessing={setIsProcessing}
									/>
								</>
							)}
						</div>
					</div>
				</div>
			</Form>
		</div>
	);
}
