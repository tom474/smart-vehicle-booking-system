"use client";

import { useSetAtom } from "jotai";
import {
	BookingRequestSchema,
	deleteBookingRequest,
	getBookingRequest,
	getBookingRequests,
} from "@/apis/booking-request";
import { BookingDetailsSheet } from "@/app/requester/bookings/booking-details";
import { CreateForm } from "@/app/requester/create-booking/create-form";
import TableView, { visibilityState } from "@/components/dashboard-table/table-view";
import { mapParam } from "@/lib/build-query-param";
import { bookingRequestColumns } from "./_columns/requests";
import CancelAlertDialog, { alertCancelAtom } from "./_components/cancel-alert-dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { apiErrHandler } from "@/lib/error-handling";

function Bookings() {
	const router = useRouter();
	const alertCancelDialog = useSetAtom(alertCancelAtom);

	const tToast = useTranslations("Coordinator.bookingRequest.toast");

	return (
		<>
			<CancelAlertDialog />
			<TableView
				tableConfig={{
					columnVisibility: visibilityState(BookingRequestSchema.shape, false, {
						id: true,
						status: true,
						requesterId: true,
						type: true,
						isReserved: true,
						priority: true,
						tripPurpose: true,

						departureTime: true,
						arrivalTime: true,
					}),
				}}
				columns={bookingRequestColumns}
				fetcher={mapParam(getBookingRequests)}
				preventClickOutside
				hideHeader
				renderCreate={(setIsSheetOpen) => (
					<CreateForm
						className="h-full p-0"
						mobile={false}
						coordinator={true}
						setIsSheetOpen={setIsSheetOpen}
					/>
				)}
				renderView={{
					fetcher: (id) => getBookingRequest(id),
					render: (data) => (
						<BookingDetailsSheet
							className="h-full p-0"
							bookingId={data.id}
							booking={data}
							mobile={false}
							onCancel={() => alertCancelDialog(data.id.toString())}
							coordinator={true}
							modify={false}
						/>
					),
				}}
				renderEdit={{
					fetcher: (id) => getBookingRequest(id),
					render: (data) => (
						<BookingDetailsSheet
							className="h-full p-0"
							bookingId={data.id}
							booking={data}
							mobile={false}
							onCancel={() => alertCancelDialog(data.id.toString())}
							coordinator={true}
							modify={true}
						/>
					),
				}}
				renderDestructiveAction={{
					onSubmit(id) {
						toast.promise(deleteBookingRequest(id), {
							loading: tToast("delete.loading"),
							success: () => {
								router.refresh();
								return tToast("delete.success", {
									id: id,
								});
							},
							error: (e) => {
								const apiErr = apiErrHandler(e);
								if (apiErr) return apiErr;

								return tToast("delete.error", {
									id: id,
								});
							},
						});
					},
				}}
			/>
		</>
	);
}

export default Bookings;
