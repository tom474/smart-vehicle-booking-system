/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns/format";
import { CalendarIcon, Car, Pin, Share } from "lucide-react";
import { useTranslations } from "next-intl";
import { type FC, type ReactNode, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod/v4";
import {
	generateReport,
	type ReportGenerationData,
	ReportGenerationSchema,
} from "@/apis/report";
import {
	ListItem,
	ListItemActions,
	ListItemDescription,
	ListItemHeader,
	type ListItemProps,
	ListItemTitle,
} from "@/components/list-item";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { dateFormat, dateTimeFormat } from "@/lib/date-time-format";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { PopoverTrigger } from "@radix-ui/react-popover";
import { Calendar } from "@/components/ui/calendar";
import { apiErrHandler } from "@/lib/error-handling";

const Statistics: FC = () => {
	// const [key, setKey] = useState(Math.random());
	// const reload = () => {
	// 	setKey(Math.random());
	// };

	return (
		<div className="flex flex-col gap-4">
			{/* <Button onClick={reload} size="icon" variant="transparent"> */}
			{/* 	<RotateCcw /> */}
			{/* </Button> */}
			{/* <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"> */}
			{/* 	<DashboardCard */}
			{/* 		title="16 Completed" */}
			{/* 		fetchFn={async () => { */}
			{/* 			await new Promise((resolve) => { */}
			{/* 				setTimeout(resolve, Math.random() * 3000); */}
			{/* 			}); */}
			{/* 			return { id: 1, msg: "Hello", subset: 5 }; */}
			{/* 		}} */}
			{/* 		onFetchFinished={() => <p className="text-subtitle-2 text-muted-foreground">In the last 7 days</p>} */}
			{/* 	/> */}
			{/* 	<DashboardCard */}
			{/* 		title="27 Completed" */}
			{/* 		fetchFn={async () => { */}
			{/* 			await new Promise((resolve) => { */}
			{/* 				setTimeout(resolve, Math.random() * 3000); */}
			{/* 			}); */}
			{/* 			return {}; */}
			{/* 		}} */}
			{/* 		onFetchFinished={() => <p className="text-subtitle-2 text-muted-foreground">In the last 7 days</p>} */}
			{/* 	/> */}
			{/* 	<DashboardCard */}
			{/* 		title="3 New Urgent Requests" */}
			{/* 		fetchFn={async () => { */}
			{/* 			await new Promise((resolve) => { */}
			{/* 				setTimeout(resolve, Math.random() * 3000); */}
			{/* 			}); */}
			{/* 			return {}; */}
			{/* 		}} */}
			{/* 		onFetchFinished={() => <p className="text-subtitle-2 text-muted-foreground">In the last 7 days</p>} */}
			{/* 	/> */}
			{/**/}
			{/*      <DashboardCard */}
			{/*        title="2 Requests Due Soon" */}
			{/*        fetchFn={async () => { */}
			{/*          await new Promise((resolve) => { */}
			{/*            setTimeout(resolve, Math.random() * 3000); */}
			{/*          }); */}
			{/*          return {}; */}
			{/*        }} */}
			{/*        onFetchFinished={() => ( */}
			{/*          <p className="text-subtitle-2 text-muted-foreground"> */}
			{/*            In the last 7 days */}
			{/*          </p> */}
			{/*        )} */}
			{/*      /> */}
			{/*    </div> */}
			{/*    <DashboardCard */}
			{/*      title="Total Bookings" */}
			{/*      fetchFn={async () => { */}
			{/*        await new Promise((resolve) => { */}
			{/*          setTimeout(resolve, Math.random() * 3000); */}
			{/*        }); */}
			{/*        return {}; */}
			{/*      }} */}
			{/*      onFetchFinished={() => ( */}
			{/*        <> */}
			{/*          <div className="flex gap-32"> */}
			{/*            {stats.map((stat) => ( */}
			{/*              <div */}
			{/*                key={stat.title} */}
			{/*                className="flex flex-col gap-4" */}
			{/*              > */}
			{/*                <p className="text-headline-3"> */}
			{/*                  {" "} */}
			{/*                  {stat.title} */}
			{/*                </p> */}
			{/*                <div> */}
			{/*                  <div className="font-bold text-headline-1"> */}
			{/*                    {stat.value.toLocaleString()} */}
			{/*                  </div> */}
			{/*                  {stat.comparison && ( */}
			{/*                    <p className="mt-1 text-xs text-muted-foreground"> */}
			{/*                      {stat.comparison} */}
			{/*                    </p> */}
			{/*                  )} */}
			{/*                </div> */}
			{/*              </div> */}
			{/*            ))} */}
			{/*          </div> */}
			{/*          <TotalBookings /> */}
			{/*        </> */}
			{/*      )} */}
			{/*    /> */}
			{/*    <div className="grid grid-cols-1 gap-4 md:grid-cols-2"> */}
			{/*      <DashboardCard */}
			{/*        title="Vehicle Utilization" */}
			{/*        fetchFn={async () => { */}
			{/*          return await getVehicles({}); */}
			{/*        }} */}
			{/*        onFetchFinished={(vehicles) => ( */}
			{/*          <VehicleUtilization vehicles={vehicles} /> */}
			{/*        )} */}
			{/*      /> */}
			{/**/}
			{/* 	<DashboardCard */}
			{/* 		title="Upcoming Schedules" */}
			{/* 		fetchFn={async () => { */}
			{/* 			await new Promise((resolve) => { */}
			{/* 				setTimeout(resolve, Math.random() * 3000); */}
			{/* 			}); */}
			{/* 			return {}; */}
			{/* 		}} */}
			{/* 		onFetchFinished={() => ( */}
			{/* 			<div className="flex flex-col gap-3"> */}
			{/* 				<NotificationItem */}
			{/* 					type="Destructive" */}
			{/* 					title="Header" */}
			{/* 					timeStamp="12h ago" */}
			{/* 					description="Trip is requested to be departed by 10AM tomorrow." */}
			{/* 				/> */}
			{/* 				<NotificationItem */}
			{/* 					type="Destructive" */}
			{/* 					title="Header" */}
			{/* 					timeStamp="12h ago" */}
			{/* 					description="Trip is requested to be departed by 10AM tomorrow." */}
			{/* 				/> */}
			{/* 				<NotificationItem */}
			{/* 					type="Info" */}
			{/* 					title="Header" */}
			{/* 					timeStamp="12h ago" */}
			{/* 					description="Trip is requested to be departed by 10AM tomorrow." */}
			{/* 				/> */}
			{/* 			</div> */}
			{/* 		)} */}
			{/* 	/> */}
			{/* </div> */}
			<Export />
		</div>
	);
};

const stats = [
	{
		title: "Today",
		value: 124,
		comparison: "+5% vs yesterday",
	},
	{
		title: "This Week",
		value: 932,
		comparison: "+12% vs last week",
	},
	{
		title: "This Month",
		value: 3845,
		comparison: "+8% vs last month",
	},
];

interface NotificationItemProps {
	type: ListItemProps["type"];
	title: string;
	timeStamp: string;
	description: ReactNode;
}

const NotificationItem: FC<NotificationItemProps> = ({
	type,
	title,
	timeStamp,
	description,
}) => {
	return (
		<ListItem type={type} icon={Car}>
			<ListItemHeader>
				<ListItemTitle>
					{title} <Share size={16} />
				</ListItemTitle>
				<ListItemActions>
					{timeStamp} <Pin size={16} />
				</ListItemActions>
			</ListItemHeader>
			<ListItemDescription>{description}</ListItemDescription>
		</ListItem>
	);
};

const Export = () => {
	const t = useTranslations("Coordinator.report");
	const tt = useTranslations("Coordinator.report.toast");

	const form = useForm<ReportGenerationData>({
		resolver: zodResolver(ReportGenerationSchema),
		defaultValues: {
			fileName: `svb-report`,
			date: new Date(),
			period: "3",
			type: "csv",
		},
	});

	const formatPeriod = (
		period: z.infer<typeof ReportGenerationSchema.shape.period>,
	) => {
		return `${period} month${period !== "1" ? "s" : ""}`;
	};

	const formatFileType = (
		ft: z.infer<typeof ReportGenerationSchema.shape.type>,
	): string => {
		const fileExtension = `(.${ft})`;

		switch (ft) {
			// case "pdf":
			//   return `PDF file / Document file ${fileExtension}`;
			case "csv":
				return `CSV file / Spreadsheet file ${fileExtension}`;
		}
	};

	const setValue = form.setValue;

	useEffect(() => {
		const interval = setInterval(() => {
			setValue("date", new Date());
		}, 1000); // update every second

		return () => clearInterval(interval); // cleanup on unmount
	}, [setValue]);

	const date = form.watch("date");
	const period = form.watch("period");
	const type = form.watch("type");
	const startDate = form.watch("startTime");
	const endDate = form.watch("endTime");

	const onSubmit = (data: ReportGenerationData) => {
		toast.promise(generateReport(data), {
			loading: tt("loading"),
			success: tt("success"),
			error: (e) => {
				const apiErr = apiErrHandler(e);
				if (apiErr) return apiErr;

				return tt("error");
			},
		});
	};

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="bg-white rounded-md p-6 w-full flex flex-col gap-6"
			>
				<FormField
					control={form.control}
					name="fileName"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("fileName.label")}</FormLabel>
							<Input {...field} />
							<FormDescription>
								{t("fileName.description")}
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="dateRange"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("dateRange.label")}</FormLabel>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										className="justify-start min-w-fit w-full text-left font-normal"
									>
										<CalendarIcon className="mr-2 h-4 w-4" />
										{startDate && endDate
											? `${format(startDate, dateFormat)} - ${format(endDate, dateFormat)}`
											: "Pick a date range"}
									</Button>
								</PopoverTrigger>
								<PopoverContent
									align="start"
									className="p-0 w-fit bg-white"
								>
									<Calendar
										mode="range"
										selected={{
											from: startDate,
											to: endDate,
										}}
										onSelect={(range) => {
											if (!range) return;

											if (range.from) {
												setValue(
													"startTime",
													range.from,
													{
														shouldValidate: true,
													},
												);
											}
											if (range.to) {
												setValue("endTime", range.to, {
													shouldValidate: true,
												});
											}
										}}
										numberOfMonths={2}
									/>
								</PopoverContent>
							</Popover>
							<FormDescription>
								{t("dateRange.description")}
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* <FormField */}
				{/* 	control={form.control} */}
				{/* 	name="period" */}
				{/* 	render={({ field }) => ( */}
				{/* 		<FormItem> */}
				{/* 			<FormLabel>{t("period.label")}</FormLabel> */}
				{/* 			<Select */}
				{/* 				onValueChange={field.onChange} */}
				{/* 				defaultValue={field.value} */}
				{/* 			> */}
				{/* 				<FormControl> */}
				{/* 					<SelectTrigger className="w-full"> */}
				{/* 						<SelectValue */}
				{/* 							placeholder={t( */}
				{/* 								"period.placeholder", */}
				{/* 							)} */}
				{/* 						/> */}
				{/* 					</SelectTrigger> */}
				{/* 				</FormControl> */}
				{/* 				<SelectContent> */}
				{/* 					{ReportGenerationSchema.shape.period.options.map( */}
				{/* 						(k) => ( */}
				{/* 							<SelectItem key={k} value={k}> */}
				{/* 								{formatPeriod(k)} */}
				{/* 							</SelectItem> */}
				{/* 						), */}
				{/* 					)} */}
				{/* 				</SelectContent> */}
				{/* 			</Select> */}
				{/* 			<FormDescription> */}
				{/* 				{t("period.description", { */}
				{/* 					value: field.value, */}
				{/* 				})} */}
				{/* 			</FormDescription> */}
				{/* 			<FormMessage /> */}
				{/* 		</FormItem> */}
				{/* 	)} */}
				{/* /> */}

				<FormField
					control={form.control}
					name="type"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("type.label")}</FormLabel>
							<Select
								onValueChange={field.onChange}
								defaultValue={field.value}
							>
								<FormControl>
									<SelectTrigger className="w-full">
										<SelectValue
											placeholder={t("type.placeholder")}
										/>
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{ReportGenerationSchema.shape.type.options.map(
										(k) => (
											<SelectItem key={k} value={k}>
												{formatFileType(k)}
											</SelectItem>
										),
									)}
								</SelectContent>
							</Select>
							<FormDescription>
								{t("type.description")}
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="w-full lg:w-1/2 lg:max-w-[768px] xl:w-1/3 space-y-4">
					<h2 className="text-lg font-semibold">
						{t("preview.title")}
					</h2>
					<PreviewField
						title={t("preview.exportDate")}
						value={format(date, dateTimeFormat)}
					/>
					<PreviewField
						title={t("preview.exportPeriod")}
						value={formatPeriod(period)}
					/>
					<PreviewField
						title={t("preview.fileType")}
						value={formatFileType(type)}
					/>
					<PreviewField
						title={t("preview.contactEmail")}
						value="tobeadded@gmail.com"
					/>
				</div>
				<Button type="submit">{t("button")}</Button>
			</form>
		</Form>
	);
};

interface PreviewFieldProps {
	title: string;
	value: string;
}

const PreviewField: FC<PreviewFieldProps> = ({ title: key, value }) => {
	return (
		<div className="flex flex-wrap gap-2 justify-between">
			<span className="text-gray-600">{key}:</span>
			<span className="font-medium">{value}</span>
		</div>
	);
};

export default Statistics;
