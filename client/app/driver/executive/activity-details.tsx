"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ClockFading, ClockAlert } from "lucide-react";
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
import SectionDivider from "@/components/section-divider";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";

import DateTimeField from "@/app/driver/executive/_components/date-time";
import NoteField from "@/app/driver/executive/_components/note";
import CancelDialog from "@/app/driver/executive/_components/cancel-dialog";
import ModifyDialog from "@/app/driver/executive/_components/modify-dialog";

import { ExecutiveDailyActivityData, ExecutiveDailyActivitySchema, getExecutiveDailyActivity } from "@/apis/executive";
import WorkingHoursField from "@/app/driver/executive/_components/working-hours";
import UserField from "@/app/driver/executive/_components/user";
import { useTranslations } from "next-intl";

interface ActivityDetailsProps {
	activityId: number | string;
	data?: ExecutiveDailyActivityData;
	trigger?: React.ReactNode;
	mobile?: boolean;
	openInitially?: boolean;
	onActivityChange?: () => void | Promise<void>;
	coordinator?: boolean;
}

export default function ActivityDetails({
	activityId,
	data,
	trigger,
	mobile = true,
	openInitially = false,
	onActivityChange,
	coordinator = false,
}: ActivityDetailsProps) {
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
					<SheetTitle>Daily Activity Details</SheetTitle>
					<SheetDescription>View Daily Activity Details</SheetDescription>
				</SheetHeader>
				<ActivityDetailsSheet
					activityId={activityId}
					data={data}
					coordinator={coordinator}
					setIsSheetOpen={setIsSheetOpen}
					onActivityChange={onActivityChange}
				/>
			</SheetContent>
		</Sheet>
	);
}

function ActivityDetailsHeader({ activityId }: { activityId?: number | string }) {
	const t = useTranslations("DriverLogActivity.activityDetails");

	return (
		<div className="flex items-center justify-between w-full">
			<SheetClose asChild>
				<Button variant="ghost" className="hover:bg-background hover:text-success hover:cursor-pointer">
					<ChevronLeft className="size-6" />
				</Button>
			</SheetClose>
			<p className="text-subtitle-1">
				{t("header")} #{activityId}
			</p>
			<div className="size-6"></div>
		</div>
	);
}

interface ActivityDetailsSheetProps {
	activityId: number | string;
	data?: ExecutiveDailyActivityData;
	coordinator?: boolean;
	modify?: boolean;
	setIsSheetOpen?: (open: boolean) => void;
	onActivityChange?: () => void | Promise<void>;
}

export function ActivityDetailsSheet({
	activityId,
	data,
	coordinator = false,
	modify = false,
	setIsSheetOpen,
	onActivityChange,
}: ActivityDetailsSheetProps) {
	const t = useTranslations("DriverLogActivity.activityDetails");

	const [disableFields, setDisableFields] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [activityData, setActivityData] = useState<ExecutiveDailyActivityData>();
	const [isProcessing, setIsProcessing] = useState(false);

	const form = useForm<ExecutiveDailyActivityData>({
		resolver: zodResolver(ExecutiveDailyActivitySchema),
		defaultValues: activityData,
	});

	useEffect(() => {
		if (modify) {
			setDisableFields(false);
		}
	}, [modify]);

	useEffect(() => {
		const fetchExpenseData = async () => {
			setIsLoading(true);
			if (!data) {
				try {
					const fetchedData = await getExecutiveDailyActivity(activityId);
					setActivityData(fetchedData || undefined);
					if (fetchedData && fetchedData.status !== "pending") {
						setDisableFields(true);
					}
				} catch (error) {
					console.error(`Failed to fetch:`, error);
				} finally {
					setIsLoading(false);
				}
			} else {
				setActivityData(data);
				if (data.status !== "pending") {
					setDisableFields(true);
				}
				setIsLoading(false);
			}
		};

		fetchExpenseData();
	}, [activityId, data]);

	useEffect(() => {
		if (activityData) {
			form.reset(activityData);
		}
	}, [activityData, form]);

	if (isLoading || !activityData) {
		return (
			<div className="flex flex-col w-full h-screen p-4">
				<ActivityDetailsHeader />
				<div className="flex flex-col items-center justify-center w-full h-screen">
					<Spinner />
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col w-full h-screen p-4">
			<ActivityDetailsHeader activityId={activityData.id ?? undefined} />

			{/* Status */}
			<div className="flex flex-row items-center justify-center w-full gap-2 mt-2">
				<span className="text-md text-muted-foreground">{t("status")}:</span>
				<StatusBadge status={activityData.status!} />
			</div>

			<Form {...form}>
				<div className="flex flex-col justify-between h-full pt-2">
					<div className="flex-1 space-y-2">
						<DateTimeField
							form={form}
							name="startTime"
							label={t("startTime")}
							icon={ClockFading}
							disabled={disableFields}
						/>
						<DateTimeField
							form={form}
							name="endTime"
							label={t("endTime")}
							icon={ClockAlert}
							disabled={disableFields}
						/>
						<NoteField form={form} disabled={disableFields} />

						<SectionDivider title={t("details")} />

						<WorkingHoursField activityData={activityData} />

						<UserField activityData={activityData} type="executive" />

						<UserField activityData={activityData} type="driver" />

						<UserField activityData={activityData} type="vehicle" />
					</div>

					<div className="flex flex-row gap-1">
						{activityData.status === "pending" && coordinator === false && (
							<>
								<CancelDialog
									activityData={activityData}
									onActivityChange={onActivityChange}
									setIsSheetOpen={setIsSheetOpen}
									isProcessing={isProcessing}
									setIsProcessing={setIsProcessing}
								/>
								<ModifyDialog
									form={form}
									setActivityData={setActivityData}
									activityData={activityData}
									coordinator={coordinator}
									onActivityChange={onActivityChange}
									setIsSheetOpen={setIsSheetOpen}
									isProcessing={isProcessing}
									setIsProcessing={setIsProcessing}
								/>
							</>
						)}
					</div>
				</div>
			</Form>
		</div>
	);
}
