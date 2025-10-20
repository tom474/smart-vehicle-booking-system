"use client";

import { useState } from "react";
import { ChevronLeft, Plus, ClockFading, ClockAlert } from "lucide-react";
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

import {
	ExecutiveDailyActivityData,
	ExecutiveDailyActivitySchema,
	createExecutiveDailyActivity,
	getExecutiveIdByDriverId,
} from "@/apis/executive";
import ActivityDetails from "@/app/driver/executive/activity-details";
import { getUserFromToken } from "@/lib/utils";

import DateTimeField from "@/app/driver/executive/_components/date-time";
import NoteField from "@/app/driver/executive/_components/note";
import { useTranslations } from "next-intl";
import { apiErrHandler } from "@/lib/error-handling";

interface CreateActivityProps {
	mobile?: boolean;
	onActivityChange?: () => void | Promise<void>;
	coordinator?: boolean;
}

export default function LogActivity({ mobile, onActivityChange }: CreateActivityProps) {
	const t = useTranslations("DriverLogActivity");

	const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
	const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
	const [submittedActivityId, setSubmittedActivityId] = useState<number | string>();

	const handleRequestCreated = async (requestId: number | string) => {
		setIsCreateSheetOpen(false);
		setSubmittedActivityId(requestId);
		setIsDetailsSheetOpen(true);
	};

	return (
		<>
			<Sheet open={isCreateSheetOpen} onOpenChange={setIsCreateSheetOpen}>
				<SheetTrigger asChild>
					{!mobile ? (
						<Button className="bg-success hover:bg-success/90">{t("logBtn")}</Button>
					) : (
						<Button className="fixed z-10 ml-auto rounded-full bottom-20 right-4 bg-success size-10">
							<Plus className="size-6" />
						</Button>
					)}
				</SheetTrigger>
				<SheetContent
					className={`[&>button]:hidden ${
						mobile ? "max-w-screen sm:max-w-screen w-screen" : "max-w-xl sm:max-w-xl"
					}`}
				>
					<SheetHeader className="hidden">
						<SheetTitle>Log Executive Daily Activity</SheetTitle>
						<SheetDescription>Log Executive Daily Activity</SheetDescription>
					</SheetHeader>
					<CreateForm
						onRequestCreated={async (requestId: number | string) => {
							if (onActivityChange) {
								await onActivityChange();
							}
							await handleRequestCreated(requestId);
						}}
					/>
				</SheetContent>
			</Sheet>

			{isDetailsSheetOpen && submittedActivityId && (
				<ActivityDetails
					activityId={submittedActivityId}
					mobile={mobile}
					openInitially={isDetailsSheetOpen}
					onActivityChange={async () => {
						if (onActivityChange) {
							await onActivityChange();
						}
					}}
				/>
			)}
		</>
	);
}

function FormHeader() {
	const t = useTranslations("DriverLogActivity.logActivity");

	return (
		<div className="flex items-center justify-between w-full">
			<SheetClose asChild>
				<Button variant="ghost" className="hover:bg-background hover:text-success hover:cursor-pointer">
					<ChevronLeft className="size-6" />
				</Button>
			</SheetClose>
			<div className="text-headline-3">{t("header")}</div>
			<div className="size-6"></div>
		</div>
	);
}

interface CreateFormProps {
	onRequestCreated?: (requestId: number | string) => void | Promise<void>;
}

function CreateForm({ onRequestCreated }: CreateFormProps) {
	const t = useTranslations("DriverLogActivity.logActivity");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const form = useForm<ExecutiveDailyActivityData>({
		resolver: zodResolver(ExecutiveDailyActivitySchema),
		mode: "onChange",
		reValidateMode: "onChange",
		defaultValues: {
			status: "pending",
			startTime: undefined,
			endTime: undefined,
		},
	});

	const onSubmit = async (data: ExecutiveDailyActivityData) => {
		try {
			setIsSubmitting(true);
			const user = getUserFromToken();
			if (!user) {
				toast.error(t("driverNotFound"));
				return;
			}
			const executiveId = await getExecutiveIdByDriverId(user.id);
			if (executiveId === null) {
				toast.error(t("executiveNotFound"));
				return;
			}
			const createdRequest = await createExecutiveDailyActivity(executiveId, data);
			toast.success(t("success"));
			if (onRequestCreated && createdRequest.id !== undefined && createdRequest.id !== null) {
				await onRequestCreated(createdRequest.id);
			} else {
				return;
			}
		} catch (error) {
			const apiErr = apiErrHandler(error);
			if (apiErr) {
				toast.error(apiErr);
			} else {
				toast.error(t("error"));
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="flex flex-col w-full h-screen p-4">
			<FormHeader />

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col justify-between h-full pt-2">
					<div className="flex-1 space-y-2">
						<DateTimeField
							form={form}
							name="startTime"
							label={t("startTime")}
							icon={ClockFading}
							disabled={false}
						/>
						<DateTimeField
							form={form}
							name="endTime"
							label={t("endTime")}
							icon={ClockAlert}
							disabled={false}
						/>
						<NoteField form={form} disabled={false} />
					</div>
					<div>
						<Button
							variant="default"
							className="w-full bg-success hover:bg-success/90"
							type="submit"
							disabled={isSubmitting}
						>
							{isSubmitting ? t("submitting") : t("submitBtn")}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
