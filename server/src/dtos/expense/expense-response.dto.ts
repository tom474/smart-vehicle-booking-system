import { Exclude, Expose, Transform } from "class-transformer";
import Container from "typedi";
import BlobUploadService from "../../services/upload.service";
import RequestStatus from "../../database/enums/RequestStatus";

@Exclude()
class ExpenseResponseDto {
	@Expose()
	id!: string;

	@Expose()
	type!: string;

	@Expose()
	description?: string | null;

	@Expose()
	amount!: number;

	@Expose()
	@Transform(({ obj }) => {
		const raw = obj.receiptImageUrl as string | null;
		if (!raw) return null;

		try {
			const blob = Container.get(BlobUploadService);
			return blob.getBlobUrl(raw);
		} catch {
			return raw;
		}
	})
	receiptImageUrl?: string | null;

	@Expose()
	status!: RequestStatus;

	@Expose()
	@Transform(({ obj }) => obj.driver.id)
	driverId!: string;

	@Expose()
	@Transform(({ obj }) => (obj.trip ? obj.trip.id : null))
	tripId?: string;

	@Expose()
	@Transform(({ obj }) => (obj.vehicleService ? obj.vehicleService.id : null))
	vehicleServiceId?: string;

	@Expose()
	rejectReason?: string | null;

	@Expose()
	createdAt!: Date;

	@Expose()
	updatedAt!: Date;
}

export default ExpenseResponseDto;
