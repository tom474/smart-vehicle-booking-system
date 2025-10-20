"use client";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import {
	type BookingRequestData,
	getBookingRequest,
} from "@/apis/booking-request";
import Spinner from "@/components/spinner";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { BookingDetailsSheet } from "@/app/requester/bookings/booking-details";
import { alertCancelAtom } from "./cancel-alert-dialog";

const sheetOpenAtom = atom<boolean>(false);
const isFetchingAtom = atom<boolean>(false);
const bookingRequestDataAtom = atom<BookingRequestData | undefined>(undefined);
const isEditModeAtom = atom<boolean>(false);

const fetchBookingrequestAtom = atom(
	null,
	async (_, set, id: string, editMode: boolean = false) => {
		set(sheetOpenAtom, true);
		set(isFetchingAtom, true);
		set(isEditModeAtom, editMode);

		const bookingRequests = await getBookingRequest(id);

		set(bookingRequestDataAtom, bookingRequests);
		set(isFetchingAtom, false);
	},
);

function BookingSheet({
	onBookingChange,
}: {
	onBookingChange: () => void | Promise<void>;
}) {
	const [sheetOpen, setSheetOpen] = useAtom(sheetOpenAtom);
	const alertCancelDialog = useSetAtom(alertCancelAtom);
	const bookingRequestData = useAtomValue(bookingRequestDataAtom);
	const isFetching = useAtomValue(isFetchingAtom);
	const isEditMode = useAtomValue(isEditModeAtom);

	return (
		<Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
			<SheetContent
				className="[&>button]:hidden max-w-xl sm:max-w-xl"
				onInteractOutside={(e) => e.preventDefault()}
				onEscapeKeyDown={(e) => e.preventDefault()}
			>
				<SheetHeader className="hidden">
					<SheetTitle>View request</SheetTitle>
					<SheetDescription>
						View your request here. Click save when you&apos;re
						done.
					</SheetDescription>
				</SheetHeader>
				{!isFetching ? (
					bookingRequestData ? (
						<BookingDetailsSheet
							bookingId={bookingRequestData.id}
							booking={bookingRequestData}
							mobile={false}
							onCancel={() =>
								alertCancelDialog(
									bookingRequestData.id.toString(),
								)
							}
							coordinator={true}
							onBookingChange={onBookingChange}
							modify={isEditMode}
						/>
					) : (
						<p className="italic text-destructive">
							An error occured, could not fetch the required data
						</p>
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

export default BookingSheet;
export { fetchBookingrequestAtom };
