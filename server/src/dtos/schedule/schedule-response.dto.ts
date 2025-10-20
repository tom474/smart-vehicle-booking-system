import { Exclude, Expose, Transform } from "class-transformer";

@Exclude()
class ScheduleResponseDto {
	@Expose()
	id!: string;

	@Expose()
	title!: string;

	@Expose()
	description?: string | null;

	@Expose()
	startTime!: Date;

	@Expose()
	endTime!: Date;

	@Expose()
	@Transform(({ obj }) => (obj.driver ? obj.driver.id : null))
	driverId?: string | null;

	@Expose()
	@Transform(({ obj }) => (obj.vehicle ? obj.vehicle.id : null))
	vehicleId?: string | null;

	@Expose()
	@Transform(({ obj }) => (obj.trip ? obj.trip.id : null))
	tripId?: string | null;

	@Expose()
	@Transform(({ obj }) => (obj.leaveRequest ? obj.leaveRequest.id : null))
	leaveRequest?: string | null;

	@Expose()
	@Transform(({ obj }) => (obj.vehicleService ? obj.vehicleService.id : null))
	vehicleService?: string | null;

	@Expose()
	createdAt!: Date;

	@Expose()
	updatedAt!: Date;
}

export default ScheduleResponseDto;
