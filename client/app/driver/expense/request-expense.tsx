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

import { ExpenseData, ExpenseSchema, createExpense } from "@/apis/expense";
import ExpenseDetails from "@/app/driver/expense/expense-details";
import { getUserFromToken } from "@/lib/utils";

import DescriptionField from "@/app/driver/expense/_components/description";
import AmountField from "@/app/driver/expense/_components/amount";
import AttachmentsField from "@/app/driver/expense/_components/attachments";
import ExpenseAssociationField from "@/app/driver/expense/_components/expense-association-field";
import ExpenseTypeField from "@/app/driver/expense/_components/expense-type-field";
import ExpenseTypeSelect from "@/app/driver/expense/_components/expense-type-select";
import { useTranslations } from "next-intl";
import { apiErrHandler } from "@/lib/error-handling";

export type ExpenseType = "trip" | "maintenance" | "operational";

interface CreateExpenseProps {
	mobile?: boolean;
	onExpenseChange?: () => void | Promise<void>;
	coordinator?: boolean;
	expenseType: ExpenseType;
}

export default function RequestForm({ mobile, onExpenseChange, expenseType }: CreateExpenseProps) {
	const t = useTranslations("DriverExpenses");

	const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
	const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
	const [submittedExpenseId, setSubmittedExpenseId] = useState<number | string>();

	const handleRequestCreated = async (requestId: number | string) => {
		setIsCreateSheetOpen(false);
		setSubmittedExpenseId(requestId);
		setIsDetailsSheetOpen(true);
	};

	const getButtonText = () => {
		return t("logExpense");
	};

	return (
		<>
			<Sheet open={isCreateSheetOpen} onOpenChange={setIsCreateSheetOpen}>
				<SheetTrigger asChild>
					{!mobile ? (
						<Button className="bg-success hover:bg-success/90">{getButtonText()}</Button>
					) : (
						<Button className="fixed z-10 ml-auto rounded-full bottom-20 right-4 bg-success">
							{t("logExpense")}
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
						expenseType={expenseType}
						onRequestCreated={async (requestId: number | string) => {
							if (onExpenseChange) {
								await onExpenseChange();
							}
							await handleRequestCreated(requestId);
						}}
					/>
				</SheetContent>
			</Sheet>

			{isDetailsSheetOpen && submittedExpenseId && (
				<ExpenseDetails
					expenseId={submittedExpenseId}
					expenseType={expenseType}
					mobile={mobile}
					openInitially={isDetailsSheetOpen}
					onExpenseChange={async () => {
						if (onExpenseChange) {
							await onExpenseChange();
						}
					}}
				/>
			)}
		</>
	);
}

interface FormHeaderProps {
	expenseType: ExpenseType;
}

function FormHeader({}: FormHeaderProps) {
	const t = useTranslations("DriverExpenses");

	return (
		<div className="flex items-center justify-between w-full">
			<SheetClose asChild>
				<Button variant="ghost" className="hover:bg-background hover:text-success hover:cursor-pointer">
					<ChevronLeft className="size-6" />
				</Button>
			</SheetClose>
			<div className="text-headline-3">{t("logExpense")}</div>
			<div className="size-6"></div>
		</div>
	);
}

interface CreateFormProps {
	expenseType: ExpenseType;
	onRequestCreated?: (requestId: number | string) => void | Promise<void>;
}

function CreateForm({ expenseType, onRequestCreated }: CreateFormProps) {
	const t = useTranslations("DriverExpenses");
	const [selectedType, setSelectedType] = useState<ExpenseType | "">("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const form = useForm<ExpenseData>({
		resolver: zodResolver(ExpenseSchema),
		mode: "onChange",
		reValidateMode: "onChange",
		defaultValues: {
			id: "",
			status: "pending",
			type: expenseType,
			driverId: "",
			tripId: undefined,
			vehicleServiceId: undefined,
			amount: 0,
			receiptImageUrl: undefined,
			description: undefined,
		},
	});

	useEffect(() => {
		const driver = getUserFromToken();

		// Reset form with driver data after currentDriver is loaded
		form.reset({
			id: "",
			status: "pending",
			type: selectedType || expenseType,
			driverId: driver?.id,
			tripId: undefined,
			vehicleServiceId: undefined,
			amount: 0,
			receiptImageUrl: undefined,
			description: undefined,
			attachments: undefined,
		});
	}, [form, selectedType, expenseType]);

	const onSubmit = async (data: ExpenseData) => {
		try {
			setIsSubmitting(true);
			console.log("Submitting request with data:", data);
			const createdRequest = await createExpense(data);
			toast.success(t("success"));
			if (onRequestCreated) {
				await onRequestCreated(createdRequest.id);
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

	// Manual validation function
	const isFormValid = () => {
		const values = form.watch();

		if (!values.type || !values.amount || values.amount <= 0) {
			return false;
		}

		if (values.type === "trip" && !values.tripId) {
			return false;
		}

		if (values.type === "maintenance" && !values.vehicleServiceId) {
			return false;
		}

		if (values.type === "operational" && !values.description) {
			return false;
		}

		// attachments must have exactly 1 file (receipt)
		if (!values.attachments || values.attachments.length === 0) {
			return false;
		}

		return true;
	};

	return (
		<div className="flex flex-col w-full h-screen p-4">
			<FormHeader expenseType={expenseType} />

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col justify-between h-full pt-2">
					<div className="flex-1 space-y-2">
						{/* Expense Type Selection */}
						<ExpenseTypeSelect
							form={form}
							selectedType={selectedType}
							setSelectedType={setSelectedType}
							disabled={false}
						/>

						{/* Render other fields only if expenseType is selected */}
						{selectedType && (
							<>
								<AmountField form={form} disabled={false} />
								{selectedType !== "operational" ? (
									<>
										<ExpenseAssociationField
											form={form}
											expenseType={selectedType}
											disabled={false}
										/>
										<DescriptionField form={form} disabled={false} />
									</>
								) : (
									<ExpenseTypeField form={form} disabled={false} />
								)}
								<AttachmentsField form={form} disabled={false} />
							</>
						)}
					</div>
					<div>
						<Button
							variant="default"
							className="w-full bg-success hover:bg-success/90"
							type="submit"
							disabled={isSubmitting || !isFormValid()}
						>
							{isSubmitting ? t("submitting") : t("submitRequest")}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
