import {
	Exclude,
	Expose,
	plainToInstance,
	Transform,
	Type,
} from "class-transformer";
import BasicUserResponseDto from "../user/basic-user-response.dto";
import BasicVehicleResponseDto from "../vehicle/basic-vehicle-response.dto";
import ActivityStatus from "../../database/enums/ActivityStatus";
import BasicDriverResponseDto from "../driver/basic-driver-response.dto";

@Exclude()
class ExecutiveVehicleActivityDto {
	@Expose()
	id!: string;

	@Expose()
	startTime!: Date;

	@Expose()
	endTime!: Date;

	@Expose()
	notes!: string | null;

	@Expose()
	status!: ActivityStatus;

	@Expose()
	workedMinutes!: number;

	@Expose()
	@Transform(({ obj }) =>
		plainToInstance(BasicDriverResponseDto, obj.vehicle.driver, {
			excludeExtraneousValues: true,
		}),
	)
	driver!: BasicDriverResponseDto;

	@Expose()
	@Type(() => BasicVehicleResponseDto)
	vehicle!: BasicVehicleResponseDto;

	@Expose()
	@Type(() => BasicUserResponseDto)
	executive!: BasicUserResponseDto;

	@Expose()
	@Type(() => Date)
	createdAt!: Date;

	@Expose()
	@Type(() => Date)
	updatedAt!: Date;
}

export default ExecutiveVehicleActivityDto;
