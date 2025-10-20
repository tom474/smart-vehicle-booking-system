import { Checkbox } from "@/components/ui/checkbox";
import { ReactNode } from "react";

export type EnumLabels<T extends readonly string[]> =
	| Partial<Record<T[number], ReactNode>>
	| ((value: T[number]) => ReactNode);

export interface EnumFilterMeta<T extends readonly string[] = string[]> {
	type: "enum";
	options: T;
	labels?: EnumLabels<T>;
}

interface FilterEnumProps {
	schema: EnumFilterMeta;
	value: string[];
	setValue: (val: string[] | undefined) => void;
}

export function FilterEnum({ schema, value, setValue }: FilterEnumProps) {
	const options = schema.options;

	const toggleValue = (opt: string) => {
		const newValue = value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt];
		setValue(newValue.length ? newValue : undefined);
	};

	return (
		<div className="flex flex-col gap-2">
			{options.map((opt) => (
				<label key={opt} className="flex items-center gap-2 cursor-pointer">
					<Checkbox checked={value.includes(opt)} onCheckedChange={() => toggleValue(opt)} />
					{schema.labels &&
						(typeof schema.labels === "function" ? (
							schema.labels(opt)
						) : (
							<span>{schema.labels?.[opt] ?? opt}</span>
						))}
				</label>
			))}
		</div>
	);
}
