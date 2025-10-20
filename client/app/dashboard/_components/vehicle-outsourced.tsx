"use client";

import {
	ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, CartesianGrid, XAxis, Line } from "recharts";

const chartData = [
	{ month: "January", outsources: 145 },
	{ month: "February", outsources: 210 },
	{ month: "March", outsources: 180 },
	{ month: "April", outsources: 130 },
	{ month: "May", outsources: 250 },
	{ month: "June", outsources: 170 },
	{ month: "July", outsources: 220 },
	{ month: "August", outsources: 190 },
	{ month: "September", outsources: 205 },
	{ month: "October", outsources: 235 },
	{ month: "November", outsources: 160 },
	{ month: "December", outsources: 275 },
];

const chartConfig = {
	outsources: {
		label: "Outsourced",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

const VehiclesOutsourced = () => {
	return (
		<div className="flex items-center h-fit">
			<ChartContainer
				className="min-h-[150px] max-h-[250px] w-full"
				config={chartConfig}
			>
				<LineChart
					height={250}
					accessibilityLayer
					data={chartData}
					margin={{ left: 12, right: 12 }}
				>
					<CartesianGrid vertical={false} />
					<XAxis
						dataKey="month"
						tickLine={false}
						axisLine={false}
						tickMargin={8}
						tickFormatter={(value) => value.slice(0, 3)}
					/>
					<ChartTooltip
						cursor={false}
						content={<ChartTooltipContent hideLabel />}
					/>
					<Line
						dataKey="outsources"
						type="natural"
						stroke="var(--color-chart-2)"
						strokeWidth={2}
						dot={false}
					/>
				</LineChart>
			</ChartContainer>
		</div>
	);
};

export default VehiclesOutsourced;
