"use client";

import useSWR from "swr";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
	type CreateExpenseData,
	CreateExpenseSchema,
	ExpenseData,
	createExpenseData,
	updateExpenseData,
} from "@/apis/expense";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { getSchedules } from "@/apis/schedule";
import Spinner from "@/components/spinner";
import { useState } from "react";
import { ScheduleData } from "@/apis/schedule";
import { apiErrHandler } from "@/lib/error-handling";

interface Props {
	defaultValue?: ExpenseData;
}

export const CreateExpense = ({ defaultValue }: Props) => {
	const form = useForm<CreateExpenseData>({
		resolver: zodResolver(CreateExpenseSchema),
		defaultValues: {
			...defaultValue,
			description:
				defaultValue?.description === null
					? undefined
					: defaultValue?.description,
		},
	});

	function onSubmit(values: CreateExpenseData) {
		console.log(values);
		toast.promise(createExpenseData(values), {
			loading: "Submitting expense...",
			success: "Expense submitted!",
			error: (e) => {
				const apiErr = apiErrHandler(e);
				if (apiErr) return apiErr;

				return "Failed to submit expense.";
			},
		});
	}

	function onEditSubmit(values: CreateExpenseData) {
		console.log(values);
		if (!defaultValue) return;
		toast.promise(updateExpenseData(defaultValue.id, values), {
			loading: "Editing expense...",
			success: "Expense Edited",
			error: (e) => {
				const apiErr = apiErrHandler(e);
				if (apiErr) return apiErr;

				return "Failed to edit expense, please try again later.";
			},
		});
	}

	return (
		<Form {...form}>
			<form
				onSubmit={(e) => {
					if (defaultValue) {
						form.handleSubmit(onEditSubmit)(e);
					} else {
						form.handleSubmit(onSubmit)(e);
					}
				}}
				className="flex flex-col gap-4"
			>
				{/* <FormField */}
				{/* 	control={form.control} */}
				{/* 	name="startTime" */}
				{/* 	render={({ field }) => ( */}
				{/* 		<FormItem> */}
				{/* 			<FormLabel>Start Time</FormLabel> */}
				{/* 			<FormControl> */}
				{/* 				<Input */}
				{/* 					type="datetime-local" */}
				{/* 					value={ */}
				{/* 						field.value */}
				{/* 							? format(new Date(field.value), "yyyy-MM-dd'T'HH:mm") */}
				{/* 							: "" */}
				{/* 					} */}
				{/* 					onChange={(e) => field.onChange(e.target.value)} */}
				{/* 				/> */}
				{/* 			</FormControl> */}
				{/* 			<FormMessage /> */}
				{/* 		</FormItem> */}
				{/* 	)} */}
				{/* /> */}

				{/* WARNING: PLACEHOLDER, DELETE LATER */}
				{/* <FormItem> */}
				{/*   <FormLabel>Start Time</FormLabel> */}
				{/*   <FormControl> */}
				{/*     <Input */}
				{/*       type="datetime-local" */}
				{/*     // onChange={(e) => field.onChange(e.target.value)} */}
				{/*     /> */}
				{/*   </FormControl> */}
				{/*   <FormMessage /> */}
				{/* </FormItem> */}

				<FormField
					control={form.control}
					name="type"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Type</FormLabel>
							<FormControl>
								<Input
									placeholder="e.g. fuel, repair"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Description</FormLabel>
							<FormControl>
								<Textarea
									placeholder="Describe the expense…"
									{...field}
									rows={3}
									value={field.value ?? undefined}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="amount"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Amount</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="0.01"
									placeholder="0.00"
									{...field}
									onChange={(e) =>
										field.onChange(
											parseFloat(e.target.value),
										)
									}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="receiptImageUrl"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Receipt Image URL</FormLabel>
							<FormControl>
								<Input
									placeholder="https://example.com/receipt.jpg"
									{...field}
									value={field.value ?? undefined}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="vehicleServiceId"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Driver ID</FormLabel>
							<FormControl>
								<Input
									placeholder="Vehicle Service ID"
									{...field}
									value={field.value ?? undefined}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormItem>
					<FormLabel>Schedule</FormLabel>
					<FormControl>
						<SchedulesDropDown />
					</FormControl>
					<FormMessage />
				</FormItem>

				<FormField
					control={form.control}
					name="tripId"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Trip ID (optional)</FormLabel>
							<FormControl>
								<Input
									placeholder="Trip ID"
									{...field}
									value={field.value ?? undefined}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex gap-2">
					<Button
						className=""
						type="submit"
						disabled={form.formState.isSubmitting}
					>
						Submit
					</Button>
					<Button
						type="button"
						variant="secondary"
						onClick={() => form.reset()}
						disabled={form.formState.isSubmitting}
					>
						Reset
					</Button>
				</div>
			</form>
		</Form>
	);
};

const SchedulesDropDown = () => {
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger>
				{/* <Button size="sm">Pick a shcedule</Button> */}
				<Input placeholder="Pick a schedule" />
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px] md:max-w-[1024px]">
				<DialogHeader>
					<DialogTitle>Select a request</DialogTitle>
					<DialogDescription>
						Selected request will be merged together with the
						current request
					</DialogDescription>
				</DialogHeader>
				{/* <TripList parentTrip={parentTrip} onOpenChange={setOpen} /> */}
				<ScheduleList onOpenChange={setOpen} />
			</DialogContent>
		</Dialog>
	);
};

interface TripListProps {
	onOpenChange: (v: boolean) => void;
}

const ScheduleList = ({ onOpenChange }: TripListProps) => {
	const { data, error, isLoading } = useSWR("/api/trips", () =>
		getSchedules({}),
	);

	if (isLoading)
		return (
			<div className="items-center justify-center size-full">
				<Spinner />
			</div>
		);
	if (error) return <h1>Error getting avaiable requests</h1>;
	if (!data) return <p>No available requests could be found</p>;

	const handleRowSelect = (id: string) => {
		toast.promise(new Promise((r) => setTimeout(r, 3000)), {
			loading: "Adding the request...",
			success: `Request with trip id #${id} successfully added.`,
			error: (e) => {
				const apiErr = apiErrHandler(e);
				if (apiErr) return apiErr;

				return `Could not add request #${id}, please try again later`;
			},
		});
	};

	// return (
	// 	<TableView
	// 		onRowClick={(row) => {
	// 			console.log(row.original)
	// 			handleRowSelect(row.original.id)
	// 			onOpenChange(false)
	// 		}}
	// 		columns={columns}
	// 		// TODO: Filter out request base on same date
	// 		fetcher={new Promise<TripData[]>((r) => r(data))}
	// 	/>
	// )

	return data.map((schedule: ScheduleData) => (
		<Button
			variant="transparent"
			className="justify-start hover:bg-muted"
			key={schedule.id}
			onClick={() => {
				console.log(schedule);
				handleRowSelect(schedule.id);
				onOpenChange(false);
			}}
		>
			<div>{schedule.id}</div>
		</Button>
	));
};
