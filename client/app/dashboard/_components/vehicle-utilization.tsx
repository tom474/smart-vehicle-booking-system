"use client";

import { Bar, BarChart } from "recharts";
import type { VehicleData } from "@/apis/vehicle";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";

const chartConfig = {
	amount: {
		label: "Amount",
	},
	used: {
		label: "Used",
		color: "#2563eb",
	},
	idle: {
		label: "Idle",
		color: "#60a5fa",
	},
} satisfies ChartConfig;

interface VehicleUtilizationProps {
	vehicles: VehicleData[];
}

const VehicleUtilization = ({ vehicles }: VehicleUtilizationProps) => {
	const chartData = [
		{
			type: "Available",
			amount: vehicles.filter((v) => v.availability === "available")
				.length,
			fill: "var(--color-success)",
		},
		{
			type: "Unavailable",
			amount: vehicles.filter((v) => v.availability === "unavailable")
				.length,
			fill: "var(--color-destructive)",
		},
	];

	const totalVehicles = vehicles.length;

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
											(data.amount / totalVehicles) * 100,
										)}
										%
									</span>
									<span className="font-bold"> · </span>
									<span>{data.amount} Vehicles</span>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default VehicleUtilization;
