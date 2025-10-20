"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { atom, useAtom, useAtomValue } from "jotai";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v4";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cancelBookingRequest } from "@/apis/booking-request";
import { useTranslations } from "next-intl";
import RichText from "@/components/intl-rich-text";
import { useRouter } from "next/navigation";
import { apiErrHandler } from "@/lib/error-handling";

const alertDialogOpenAtom = atom(false);
const alertDialogTargetIdAtom = atom<string | undefined>(undefined);

const alertCancelAtom = atom(null, (_, set, id: string) => {
	set(alertDialogTargetIdAtom, id);
	set(alertDialogOpenAtom, true);
});

function CancelAlertDialog() {
	const tct = useTranslations("Coordinator.bookingRequest.toast.cancel");
	const tcd = useTranslations("Coordinator.bookingRequest.dialog.cancel");

	const [alertDialogOpen, setAlertDialogOpen] = useAtom(alertDialogOpenAtom);
	const id = useAtomValue(alertDialogTargetIdAtom);

	const cancellationReasonId = useId();
	const formId = useId();

	const router = useRouter();

	// ----- Form
	const cancellationFormSchema = z
		.object({
			cancellationReason: z.enum([
				"requesterCancelled",
				"changeOfPlans",
				"workConflict",
				"vehicleUnavailable",
				"illnessOrEmergency",
				"travelIssues",
				"other",
			]),
			otherReason: z
				.string()
				.min(5, { error: "Too short" })
				.max(100, { error: "Too long" })
				.optional(),
		})
		.check((ctx) => {
			if (
				ctx.value.cancellationReason === "other" &&
				!ctx.value.otherReason
			) {
				ctx.issues.push({
					code: "custom",
					path: ["otherReason"],
					message: "Cancellation reason cannot be empty",
					input: ctx.value,
				});
			}

			if (
				ctx.value.cancellationReason === "other" &&
				ctx.value.otherReason &&
				ctx.value.otherReason.length < 5
			) {
				ctx.issues.push({
					code: "too_small",
					minimum: 5,
					message: "Reason too short",
					path: ["otherReason"],
					origin: "string",
					input: ctx.value,
				});
			}
		});

	const cancellationform = useForm<z.infer<typeof cancellationFormSchema>>({
		resolver: zodResolver(cancellationFormSchema),
	});

	const cancellationReasonField =
		cancellationform.watch("cancellationReason");

	if (!id) return;

	const onRejectRequestSubmit = (
		values: z.infer<typeof cancellationFormSchema>,
	) => {
		toast.promise(
			cancelBookingRequest(
				id,
				values.otherReason ||
					tcd(`cancellationReasons.${values.cancellationReason}`),
			),
			{
				loading: tct("loading"),
				success: () => {
					router.refresh();
					return tct("success", { id });
				},
				error: (e) => {
					const apiErr = apiErrHandler(e);
					if (apiErr) return apiErr;

					return tct("error", { id });
				},
			},
		);
		setAlertDialogOpen(false);
	};

	return (
		<AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
			<AlertDialogContent>
				<AlertDialogHeader className="gap-4">
					<div>
						<AlertDialogTitle>
							<RichText>
								{(tags) => tcd.rich("title", tags)}
							</RichText>
						</AlertDialogTitle>
						<AlertDialogDescription>
							{tcd("description")}
						</AlertDialogDescription>
					</div>
					{/* Input field */}
					<Form {...cancellationform}>
						<form
							className="space-y-4"
							id={formId}
							onSubmit={cancellationform.handleSubmit(
								onRejectRequestSubmit,
							)}
						>
							<FormField
								control={cancellationform.control}
								name="cancellationReason"
								render={({ field }) => (
									<FormItem>
										<Label htmlFor={cancellationReasonId}>
											{tcd("label")}
											<span className="text-destructive">
												*
											</span>
										</Label>
										<FormControl>
											<Select
												onValueChange={field.onChange}
												{...field}
											>
												<SelectTrigger className="min-w-full">
													<SelectValue
														className="text-left"
														placeholder={tcd(
															"selectPlaceholder",
														)}
													/>
												</SelectTrigger>
												<SelectContent>
													<SelectGroup>
														<SelectLabel>
															{tcd("selectLabel")}
														</SelectLabel>
														{cancellationFormSchema.shape.cancellationReason.options.map(
															(reason) => (
																<SelectItem
																	key={reason}
																	value={
																		reason
																	}
																>
																	{tcd(
																		`cancellationReasons.${reason}`,
																	)}
																</SelectItem>
															),
														)}
													</SelectGroup>
												</SelectContent>
											</Select>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{cancellationReasonField === "other" && (
								<FormField
									control={cancellationform.control}
									name="otherReason"
									render={({ field }) => (
										<FormItem>
											<Label
												htmlFor={cancellationReasonId}
											>
												{tcd("otherReason")}
												<span className="text-destructive">
													*
												</span>
											</Label>
											<FormControl>
												<Textarea
													id={cancellationReasonId}
													placeholder={tcd(
														"placeholder",
													)}
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}
						</form>
					</Form>
					{/* <Dialog> */}
					{/* 	<DialogTrigger asChild className="max-w-fit"> */}
					{/* 		<Button variant="link" size="fit"> */}
					{/* 			View affected trips */}
					{/* 		</Button> */}
					{/* 	</DialogTrigger> */}
					{/* 	<DialogContent className="sm:max-w-[425px] lg:max-w-[50dvw]"> */}
					{/* 		<DialogHeader> */}
					{/* 			<DialogTitle>Affected trips</DialogTitle> */}
					{/* 			<DialogDescription> */}
					{/* 				View all your affected trips here */}
					{/* 			</DialogDescription> */}
					{/* 		</DialogHeader> */}
					{/* 		<ScrollArea className="size-full max-h-[100dvh] md:max-h-[50dvh]"> */}
					{/* 			{[...Array(99).keys()].map((tag) => ( */}
					{/* 				<Fragment key={tag}> */}
					{/* 					<div className="text-sm">{tag}</div> */}
					{/* 					<Separator className="my-2" /> */}
					{/* 				</Fragment> */}
					{/* 			))} */}
					{/* 		</ScrollArea> */}
					{/* 	</DialogContent> */}
					{/* </Dialog> */}
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{tcd("cancel")}</AlertDialogCancel>
					<Button type="submit" form={formId} variant="destructive">
						{tcd("confirm")}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export default CancelAlertDialog;
export { alertCancelAtom };
