import { Exclude, Expose, Transform } from "class-transformer";
import RequestStatus from "../../database/enums/RequestStatus";

@Exclude()
class LeaveRequestResponseDto {
	@Expose()
	id!: string;

	@Expose()
	@Transform(({ obj }) => obj.driver.id)
	driverId!: string;

	@Expose()
	reason?: string | null;

	@Expose()
	notes?: string | null;

	@Expose()
	startTime!: Date;

	@Expose()
	endTime!: Date;

	@Expose()
	status!: RequestStatus;

	@Expose()
	@Transform(({ obj }) => (obj.schedule ? obj.schedule.id : null))
	scheduleId?: string | null;

	@Expose()
	rejectReason?: string | null;

	@Expose()
	createdAt!: Date;

	@Expose()
	updatedAt?: Date;
}

export default LeaveRequestResponseDto;
