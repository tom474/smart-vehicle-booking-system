"use client";

import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paperclip, X, Image as ImageIcon, FileText } from "lucide-react";
import Image from "next/image";
import { ExpenseData } from "@/apis/expense";
import { useTranslations } from "next-intl";

export default function AttachmentsField({
	form,
	disabled = false,
	maxAttachments = 1,
}: {
	form: UseFormReturn<ExpenseData>;
	disabled?: boolean;
	maxAttachments?: number;
}) {
	const t = useTranslations("DriverExpenses.form");

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(event.target.files || []);
		const currentAttachments = form.getValues("attachments") || [];

		// Calculate how many files can be added
		const remainingSlots = maxAttachments - currentAttachments.length;
		const filesToAdd = files.slice(0, remainingSlots);

		if (filesToAdd.length > 0) {
			form.setValue("attachments", [...currentAttachments, ...filesToAdd]);
		}

		// Reset the input value to allow re-selecting the same files
		event.target.value = "";
	};

	const removeAttachment = (index: number) => {
		const currentAttachments = form.getValues("attachments") || [];
		const newAttachments = currentAttachments.filter((_, i) => i !== index);
		form.setValue("attachments", newAttachments);
	};

	const isImageFile = (file: File) => {
		return file.type.startsWith("image/");
	};

	const getFilePreviewUrl = (file: File) => {
		return URL.createObjectURL(file);
	};

	return (
		<FormField
			control={form.control}
			name="attachments"
			render={({ field }) => {
				const currentCount = field.value?.length || 0;
				const isAtLimit = currentCount >= maxAttachments;

				return (
					<FormItem>
						<FormControl>
							<div className="flex flex-col space-y-2">
								<div className="flex justify-between p-1">
									<div className="flex flex-row items-center gap-2 text-subtitle-1">
										<ImageIcon />
										{t("attachment")} - {currentCount}/{maxAttachments}
									</div>
									<div className="flex items-center gap-2">
										<Input
											type="file"
											multiple
											onChange={handleFileUpload}
											className="hidden"
											id="file-upload"
											accept=".jpg,.jpeg,.png"
											disabled={disabled || isAtLimit}
										/>
										<Button
											type="button"
											variant="outline"
											onClick={() => document.getElementById("file-upload")?.click()}
											className="w-full underline border-none shadow-none focus-visible:ring-0 md:text-md text-muted-foreground"
											disabled={disabled || isAtLimit}
										>
											Add
											<Paperclip />
										</Button>
									</div>
								</div>
								<div className="space-y-2">
									{field.value && field.value.length > 0 && (
										<div className="space-y-1">
											{field.value.map((file: File, index: number) => (
												<div
													key={index}
													className="flex items-center justify-between p-2 rounded bg-muted"
												>
													<div className="flex items-center flex-1 min-w-0 gap-3">
														{isImageFile(file) ? (
															<div className="flex-shrink-0">
																<Image
																	src={getFilePreviewUrl(file)}
																	alt={file.name}
																	className="object-cover w-12 h-12 border rounded"
																	width={48}
																	height={48}
																/>
															</div>
														) : (
															<div className="flex-shrink-0">
																<FileText className="w-12 h-12 text-muted-foreground" />
															</div>
														)}
														<span className="text-sm">
															{file.name.length > 30
																? `${file.name.substring(0, 27)}...`
																: file.name}
														</span>
													</div>
													<Button
														type="button"
														variant="ghost"
														size="sm"
														onClick={() => removeAttachment(index)}
														disabled={disabled}
													>
														<X className="size-4" />
													</Button>
												</div>
											))}
										</div>
									)}
								</div>
							</div>
						</FormControl>
						<FormMessage className="text-end" />
					</FormItem>
				);
			}}
		/>
	);
}
