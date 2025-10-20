"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Image as ImageIcon, FileX } from "lucide-react";
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

import { ExpenseData, ExpenseSchema, getExpense } from "@/apis/expense";

import DescriptionField from "@/app/driver/expense/_components/description";
import AmountField from "@/app/driver/expense/_components/amount";
import AttachmentsField from "@/app/driver/expense/_components/attachments";
import ExpenseAssociationField from "@/app/driver/expense/_components/expense-association-field";
import ExpenseTypeField from "@/app/driver/expense/_components/expense-type-field";
import ExpenseTypeSelect from "@/app/driver/expense/_components/expense-type-select";
import CancelDialog from "@/app/driver/expense/_components/cancel-dialog";
import ModifyDialog from "@/app/driver/expense/_components/modify-dialog";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";

type ExpenseType = "trip" | "maintenance" | "operational";

interface ExpenseDetailsProps {
	expenseId: number | string;
	expenseType: ExpenseType;
	data?: ExpenseData;
	trigger?: React.ReactNode;
	mobile?: boolean;
	openInitially?: boolean;
	onExpenseChange?: () => void | Promise<void>;
	coordinator?: boolean;
}

export default function ExpenseDetails({
	expenseId,
	expenseType,
	data,
	trigger,
	mobile = true,
	openInitially = false,
	onExpenseChange,
	coordinator = false,
}: ExpenseDetailsProps) {
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
					<SheetTitle>Expense Details</SheetTitle>
					<SheetDescription>View Expense Details</SheetDescription>
				</SheetHeader>
				<ExpenseDetailsSheet
					expenseId={expenseId}
					expenseType={expenseType}
					data={data}
					coordinator={coordinator}
					setIsSheetOpen={setIsSheetOpen}
					onExpenseChange={onExpenseChange}
				/>
			</SheetContent>
		</Sheet>
	);
}

function ExpenseDetailsHeader({ expenseId, expenseType }: { expenseId?: number | string; expenseType: ExpenseType }) {
	const t = useTranslations("DriverExpenses");

	return (
		<div className="flex items-center justify-between w-full">
			<SheetClose asChild>
				<Button variant="ghost" className="hover:bg-background hover:text-success hover:cursor-pointer">
					<ChevronLeft className="size-6" />
				</Button>
			</SheetClose>
			<p className="text-subtitle-1">
				{expenseType === "trip"
					? t("tripExpense")
					: expenseType === "maintenance"
						? t("vehicleServiceExpense")
						: t("operationalExpense")}
				{expenseId ? ` #${expenseId}` : ""}
			</p>
			<div className="size-6"></div>
		</div>
	);
}

interface ExpenseDetailsSheetProps {
	expenseId: number | string;
	expenseType: ExpenseType;
	data?: ExpenseData;
	coordinator?: boolean;
	modify?: boolean;
	setIsSheetOpen?: (open: boolean) => void;
	onExpenseChange?: () => void | Promise<void>;
}

export function ExpenseDetailsSheet({
	expenseId,
	expenseType,
	data,
	coordinator = false,
	modify = false,
	setIsSheetOpen,
	onExpenseChange,
}: ExpenseDetailsSheetProps) {
	const t = useTranslations("DriverExpenses");

	const [disableFields, setDisableFields] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [expenseData, setExpenseData] = useState<ExpenseData>();
	const [selectedType, setSelectedType] = useState<ExpenseType | "">(expenseType);
	const [isProcessing, setIsProcessing] = useState(false);

	const form = useForm<ExpenseData>({
		resolver: zodResolver(ExpenseSchema),
		defaultValues: expenseData,
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
					const fetchedData = await getExpense(expenseId);
					setExpenseData(fetchedData || undefined);
					if (fetchedData && fetchedData.status !== "pending") {
						setDisableFields(true);
					}
					setSelectedType(expenseType);
				} catch (error) {
					console.error(`Failed to fetch ${expenseType}:`, error);
				} finally {
					setIsLoading(false);
				}
			} else {
				setExpenseData(data);
				if (data.status !== "pending") {
					setDisableFields(true);
				}
				setSelectedType(expenseType);
				setIsLoading(false);
			}
		};

		fetchExpenseData();
	}, [expenseId, expenseType, data]);

	useEffect(() => {
		if (expenseData) {
			form.reset(expenseData);
		}
	}, [expenseData, form]);

	if (isLoading || !expenseData) {
		return (
			<div className="flex flex-col w-full h-screen p-4">
				<ExpenseDetailsHeader expenseType={expenseType} />
				<div className="flex flex-col items-center justify-center w-full h-screen">
					<Spinner />
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col w-full h-screen p-4">
			<ExpenseDetailsHeader expenseId={expenseData.id} expenseType={expenseType} />

			{/* Status */}
			<div className="flex flex-row items-center justify-center w-full gap-2 mt-2">
				<span className="text-md text-muted-foreground">{t("status.status")}:</span>
				<StatusBadge status={expenseData.status} />
			</div>

			<Form {...form}>
				<div className="flex flex-col justify-between h-full pt-2 overflow-y-auto">
					<div className="flex-1 space-y-2">
						{/* Reject Reason */}
						{expenseData.status === "rejected" && expenseData.rejectReason && (
							<div className="flex flex-col gap-4">
								<div className="flex flex-row justify-between mt-4">
									<span className="text-subtitle-1 text-red-500 flex flex-row gap-2 items-center px-1">
										<FileX />
										{t("status.rejectReason")}
									</span>
									<span>{expenseData.rejectReason}</span>
								</div>
								<Separator />
							</div>
						)}

						{/* Expense Type Selection */}
						<ExpenseTypeSelect
							form={form}
							selectedType={selectedType}
							setSelectedType={setSelectedType}
							disabled={disableFields}
						/>

						<AmountField form={form} disabled={disableFields} />
						{selectedType !== "operational" ? (
							<>
								<ExpenseAssociationField
									form={form}
									expenseType={selectedType as ExpenseType}
									disabled={disableFields}
								/>
								<DescriptionField
									form={form}
									disabled={disableFields}
									hasSeparator={expenseData.receiptImageUrl ? true : false}
								/>
							</>
						) : (
							<ExpenseTypeField form={form} disabled={disableFields} />
						)}
						{!disableFields && <AttachmentsField form={form} disabled={disableFields} />}
						{!disableFields && expenseData.receiptImageUrl && (
							<div className="text-red-500 text-caption">{t("form.replaceImage")}</div>
						)}

						{/* Attachment Image Preview */}
						{expenseData.receiptImageUrl && (
							<div className="pt-2 space-y-2">
								<div className="flex items-center gap-2 p-1 text-subtitle-1">
									<ImageIcon />
									{t("form.attachmentImage")}
								</div>
								<div className="flex items-center justify-center p-2 rounded bg-muted">
									<Image
										src={`/api/image-proxy?sas=${encodeURIComponent(
											`${expenseData.receiptImageUrl}&v=${expenseData.updatedAt || Date.now()}`,
										)}`}
										alt="Receipt"
										className="object-cover w-full max-w-sm border rounded"
										width="0"
										height="0"
										sizes="100vw"
									/>
								</div>
							</div>
						)}

						{expenseData.createdAt && expenseData.updatedAt && (
							<>
								<SectionDivider title={t("form.details")} />
								<div className="flex flex-row justify-between mt-4">
									<span className="text-subtitle-1">{t("form.createdAt")}:</span>
									<span className="text-muted-foreground">
										{format(expenseData.createdAt, "HH:mm, dd/MM/yyyy")}
									</span>
								</div>
								<div className="flex flex-row justify-between">
									<span className="text-subtitle-1">{t("form.updatedAt")}:</span>
									<span className="text-muted-foreground">
										{format(expenseData.updatedAt, "HH:mm, dd/MM/yyyy")}
									</span>
								</div>
							</>
						)}
					</div>

					<div className="sticky bottom-0 flex flex-row gap-1">
						{expenseData.status === "pending" && coordinator === false && (
							<>
								<CancelDialog
									expenseData={expenseData}
									onExpenseChange={onExpenseChange}
									setIsSheetOpen={setIsSheetOpen}
									isProcessing={isProcessing}
									setIsProcessing={setIsProcessing}
								/>
								<ModifyDialog
									form={form}
									setExpenseData={setExpenseData}
									expenseData={expenseData}
									coordinator={coordinator}
									onExpenseChange={onExpenseChange}
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
