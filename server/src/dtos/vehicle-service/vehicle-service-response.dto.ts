import { Exclude, Expose, Transform } from "class-transformer";
import Expense from "../../database/entities/Expense";
import RequestStatus from "../../database/enums/RequestStatus";
import VehicleServiceType from "../../database/enums/VehicleServiceType";

@Exclude()
class VehicleServiceResponseDto {
	@Expose()
	id!: string;

	@Expose()
	@Transform(({ obj }) => obj.driver.id)
	driverId!: string;

	@Expose()
	@Transform(({ obj }) => obj.vehicle.id)
	vehicleId!: string;

	@Expose()
	reason?: string | null;

	@Expose()
	description?: string | null;

	@Expose()
	serviceType!: VehicleServiceType;

	@Expose()
	startTime!: Date;

	@Expose()
	endTime!: Date;

	@Expose()
	status!: RequestStatus;

	@Expose()
	@Transform(({ obj }) => (obj.schedule ? obj.schedule.id : null))
	scheduleId?: string;

	@Expose()
	@Transform(({ obj }) =>
		obj.expenses.length > 0
			? obj.expenses.map((expense: Expense) => expense.id)
			: [],
	)
	expenseIds?: string[];

	@Expose()
	rejectReason?: string | null;

	@Expose()
	createdAt!: Date;

	@Expose()
	updatedAt?: Date;
}

export default VehicleServiceResponseDto;
