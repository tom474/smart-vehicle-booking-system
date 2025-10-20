"use client";

import { useState, useEffect, useRef } from "react";
import { TimePickerInput } from "@/components/time-picker/time-picker-input";
import { TimePeriodSelect } from "@/components/time-picker/period-select";
import { Period } from "@/components/time-picker/time-picker-utils";

interface TimePickerDemoProps {
	date: Date | undefined;
	setDate: (date: Date | undefined) => void;
}

export function TimePicker12({ date, setDate }: TimePickerDemoProps) {
	const [period, setPeriod] = useState<Period>("PM");

	useEffect(() => {
		if (date) {
			const currentPeriod = date.getHours() >= 12 ? "PM" : "AM";
			setPeriod(currentPeriod);
		}
	}, [date]);

	const minuteRef = useRef<HTMLInputElement>(null);
	const hourRef = useRef<HTMLInputElement>(null);
	const secondRef = useRef<HTMLInputElement>(null);
	const periodRef = useRef<HTMLButtonElement>(null);

	return (
		<div className="flex items-end gap-2">
			<div className="grid gap-1 text-center">
				<TimePickerInput
					picker="12hours"
					period={period}
					date={date}
					setDate={setDate}
					ref={hourRef}
					onRightFocus={() => minuteRef.current?.focus()}
				/>
			</div>
			<div className="grid gap-1 text-center">
				<TimePickerInput
					picker="minutes"
					id="minutes12"
					date={date}
					setDate={setDate}
					ref={minuteRef}
					onLeftFocus={() => hourRef.current?.focus()}
					onRightFocus={() => secondRef.current?.focus()}
				/>
			</div>
			<div className="grid gap-1 text-center">
				<TimePeriodSelect
					period={period}
					setPeriod={setPeriod}
					date={date}
					setDate={setDate}
					ref={periodRef}
					onLeftFocus={() => secondRef.current?.focus()}
				/>
			</div>
		</div>
	);
}
