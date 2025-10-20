import { Separator } from "@/components/ui/separator";

export default function SectionDivider({ title }: { title: string }) {
	return (
		<div className="flex flex-row items-center gap-2 py-4">
			<div className="flex-1">
				<Separator />
			</div>
			<p className="text-sm text-muted-foreground whitespace-nowrap">{title}</p>
			<div className="flex-1">
				<Separator />
			</div>
		</div>
	);
}
