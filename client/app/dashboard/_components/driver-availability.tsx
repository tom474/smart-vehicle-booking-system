"use client";

import { DriverData } from "@/apis/driver";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar } from "recharts";

const chartConfig = {
	amount: {
		label: "Amount",
	},
	occupied: {
		label: "Occupied",
		color: "#2563eb",
	},
	free: {
		label: "Free",
		color: "#60a5fa",
	},
} satisfies ChartConfig;

interface DriverAvailabilityProps {
	drivers: DriverData[];
}

const DriverAvailability = ({ drivers }: DriverAvailabilityProps) => {
	const chartData = [
		{
			type: "Active",
			amount: drivers.filter((d) => d.status === "active").length,
			fill: "var(--color-success)",
		},
		{
			type: "Inactive",
			amount: drivers.filter((d) => d.status === "inactive").length,
			fill: "var(--color-destructive)",
		},
		{
			type: "Suspended",
			amount: drivers.filter((d) => d.status === "suspended").length,
			fill: "var(--color-warning)",
		},
	];

	const totalDrivers = drivers.length;

	return (
		<div className="flex items-center">
			<ChartContainer
				config={chartConfig}
				className="aspect-square min-h-[200px] max-h-[250px]"
			>
				<BarChart accessibilityLayer data={chartData}>
					<Bar dataKey="amount" radius={4} />
				</BarChart>
			</ChartContainer>
			<div className="flex flex-col gap-4 justify-center items-start">
				{chartData.map((data) => {
					return (
						<div
							key={`${data.type}-${data.amount}`}
							className="grid grid-cols-[auto_1fr] grid-rows-2 gap-2 items-start"
						>
							<div className="flex size-full justify-center items-center">
								<div
									style={{
										backgroundColor: `${data.fill}`,
										boxShadow: `0 2px 4px 0 ${data.fill}`,
									}}
									className="size-2 rounded-full"
								/>
							</div>

							<p className="text-subtitle-1">{data.type}</p>

							<div className="size-0" />

							<div className="flex flex-col gap-1">
								<div className="flex gap-2 text-body-1 text-muted-foreground">
									<span>
										{Math.round(
											(data.amount / totalDrivers) * 100,
										)}
										%
									</span>
									<span className="font-bold"> · </span>
									<span>{data.amount} Drivers</span>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default DriverAvailability;
