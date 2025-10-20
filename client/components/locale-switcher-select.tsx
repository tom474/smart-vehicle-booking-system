"use client";

import clsx from "clsx";
import { useTransition } from "react";
import { Locale } from "@/i18n/config";
import { setUserLocale } from "@/services/locale";
import { Languages } from "lucide-react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger } from "./ui/select";

type Props = {
	defaultValue: string;
	items: Array<{ value: string; label: string }>;
	label: string;
};

export default function LocaleSwitcherSelect({ defaultValue, items, label }: Props) {
	const [isPending, startTransition] = useTransition();

	function onChange(value: string) {
		const locale = value as Locale;
		startTransition(() => {
			setUserLocale(locale);
		});
	}

	return (
		<div className="relative">
			<Select defaultValue={defaultValue} onValueChange={onChange}>
				<SelectTrigger
					aria-label={label}
					hideDropdownIcon
					className={clsx(
						"shadow-none border-none aspect-square flex justify-center items-center",
						"text-foreground bg-transparent hover:cursor-pointer hover:text-primary",
						isPending && "pointer-events-none opacity-60",
					)}
				>
					{/* <Button size="icon" variant="transparent"> */}
					<Languages className="size-6 " />
					{/* </Button> */}
				</SelectTrigger>
				<SelectContent className="z-1001">
					<SelectGroup>
						{items.map((item) => (
							<SelectItem key={item.value} className="data-[highlighted]:bg-primary" value={item.value}>
								{/* <div className="mr-2 w-[1rem]"> */}
								{/* 	{item.value === defaultValue && ( */}
								{/* 		<Check className="w-5 h-5 text-slate-600" /> */}
								{/* 	)} */}
								{/* </div> */}
								{item.label}
							</SelectItem>
						))}
					</SelectGroup>
					{/* <Select.Arrow className="text-white fill-white" /> */}
				</SelectContent>
			</Select>
		</div>
	);
}
