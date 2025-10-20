"use client"

import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { useMemo } from "react"
import { Pie, Label, PieChart } from "recharts"

const chartData = [
    { tripStatus: "Active", amount: 275, fill: "var(--color-success)" },
    { tripStatus: "Cancelled", amount: 200, fill: "var(--color-destructive)" },
    { tripStatus: "Pending", amount: 287, fill: "var(--color-warning)" },
]

const chartConfig = {
    amount: {
        label: "Amount",
    },
    active: {
        label: "Active",
        color: "#2563eb",
    },
    cancelled: {
        label: "Cancelled",
        color: "#60a5fa",
    },
    pending: {
        label: "Pending",
        color: "#60f0ff",
    },
} satisfies ChartConfig

const TripCount = () => {
    const totalTrips = useMemo(() => {
        return chartData.reduce((acc, curr) => acc + curr.amount, 0)
    }, [])

    return (
        <div className="flex">
            <ChartContainer
                config={chartConfig}
                className="aspect-square min-h-[200px] max-h-[250px]"
            >
                <PieChart>
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie
                        data={chartData}
                        dataKey="amount"
                        nameKey="tripStatus"
                        innerRadius={60}
                        strokeWidth={5}
                    >
                        <Label
                            content={({ viewBox }) => {
                                if (
                                    viewBox &&
                                    "cx" in viewBox &&
                                    "cy" in viewBox
                                ) {
                                    return (
                                        <text
                                            x={viewBox.cx}
                                            y={viewBox.cy}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                        >
                                            <tspan
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                                className="text-3xl font-bold fill-foreground"
                                            >
                                                {totalTrips.toLocaleString()}
                                            </tspan>
                                            <tspan
                                                x={viewBox.cx}
                                                y={(viewBox.cy || 0) + 24}
                                                className="fill-muted-foreground"
                                            >
                                                Trips
                                            </tspan>
                                        </text>
                                    )
                                }
                            }}
                        />
                    </Pie>
                </PieChart>
            </ChartContainer>
            <div className="flex flex-col items-start justify-center gap-4">
                {chartData.map((data) => {
                    return (
                        <div
                            key={data.tripStatus}
                            className="grid grid-cols-[auto_1fr] grid-rows-2 gap-2 items-start"
                        >
                            {/* Dots */}
                            <div className="flex items-center justify-center size-full">
                                <div
                                    style={{
                                        backgroundColor: `${data.fill}`,
                                        boxShadow: `0 2px 4px 0 ${data.fill}`,
                                    }}
                                    className="rounded-full size-2"
                                />
                            </div>

                            <p className="flex items-center h-full text-subtitle-1">
                                {data.tripStatus}
                            </p>

                            <div className="size-0" />

                            <div className="flex flex-col gap-1">
                                <div className="flex gap-2 text-body-1 text-muted-foreground">
                                    <span>
                                        {Math.round(
                                            (data.amount / totalTrips) * 100
                                        )}
                                        %
                                    </span>
                                    <span className="font-bold"> · </span>
                                    <span>{data.amount} Trips</span>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default TripCount
