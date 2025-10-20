"use client"

import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { LineChart, CartesianGrid, XAxis, Line } from "recharts"

const chartData = [
    { month: "January", bookings: 312 },
    { month: "February", bookings: 278 },
    { month: "March", bookings: 325 },
    { month: "April", bookings: 163 },
    { month: "May", bookings: 287 },
    { month: "June", bookings: 204 },
    { month: "July", bookings: 359 },
    { month: "August", bookings: 190 },
    { month: "September", bookings: 227 },
    { month: "October", bookings: 340 },
    { month: "November", bookings: 149 },
    { month: "December", bookings: 381 },
]
const chartConfig = {
    bookings: {
        label: "Bookings",
        color: "var(--chart-1)",
    },
} satisfies ChartConfig

const TotalBookings = () => {
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
                        dataKey="bookings"
                        type="natural"
                        stroke="var(--color-chart-1)"
                        strokeWidth={2}
                        dot={false}
                    />
                </LineChart>
            </ChartContainer>
        </div>
    )
}

export default TotalBookings
