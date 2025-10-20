import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import Spinner from "@/components/spinner";

export function SheetForm<T>({
	promise,
	Component,
	title,
	isOpen,
	onOpenChange,
}: {
	promise: () => Promise<T>;
	Component: React.ComponentType<{ data: NonNullable<T>; request: NonNullable<T> }>;
	title?: string;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const [internalOpen, setInternalOpen] = useState(false);
	const [error, setError] = useState<string | undefined>(undefined);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [data, setData] = useState<T>();

	useEffect(() => {
		if (isOpen) {
			setInternalOpen(true);
		}
	}, [isOpen]);

	useEffect(() => {
		if (!internalOpen) return;

		const fetch = async (promise: () => Promise<T>) => {
			setError(undefined);
			setIsLoading(true);
			try {
				const data = await promise();
				setData(data);
				setIsLoading(false);
			} catch (e: unknown) {
				setError("Error in fetching data");
				setIsLoading(false);
				console.log(e);
			}
		};

		if (promise) {
			fetch(promise);
		} else {
			setError("No promise provided");
			setIsLoading(false);
		}
	}, [internalOpen, promise]);

	const handleOpenChange = (open: boolean) => {
		setInternalOpen(open);
		if (!open) {
			// Delay calling parent's onOpenChange to allow animation
			setTimeout(() => {
				onOpenChange(false);
			}, 300);
		}
	};

	return (
		<Sheet open={internalOpen} onOpenChange={handleOpenChange}>
			<SheetContent className="max-w-xl p-4 sm:max-w-xl">
				<SheetHeader className="p-0">
					<SheetTitle>{title}</SheetTitle>
					<SheetDescription></SheetDescription>
				</SheetHeader>

				{!isLoading ? (
					!error ? (
						<div className="overflow-visible overflow-y-scroll">
							{data && <Component data={data} request={data} />}
						</div>
					) : (
						<p className="italic text-destructive">An error occured, could not fetch the required data</p>
					)
				) : (
					<div className="flex items-center justify-center h-full size-full">
						<Spinner />
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}
