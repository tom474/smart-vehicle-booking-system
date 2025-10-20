import { Exclude, Expose } from "class-transformer";
import {
	IsDateString,
	IsEnum,
	IsNotEmpty,
	IsOptional,
	IsString,
} from "class-validator";
import { IsAfter } from "../../utils/validator";
import VehicleServiceType from "../../database/enums/VehicleServiceType";

@Exclude()
class CreateVehicleServiceDto {
	@Expose()
	@IsNotEmpty({ message: "Vehicle ID is required." })
	@IsString({ message: "Vehicle ID must be a string." })
	vehicleId!: string;

	@Expose()
	@IsOptional()
	@IsString({ message: "Reason must be a string." })
	reason?: string | null;

	@Expose()
	@IsOptional()
	@IsString({ message: "Description must be a string." })
	description?: string | null;

	@Expose()
	@IsNotEmpty({ message: "Service type is required." })
	@IsEnum(VehicleServiceType, {
		message: `Service type must be one of the following: ${Object.values(VehicleServiceType).join(", ")}.`,
	})
	serviceType!: VehicleServiceType;

	@Expose()
	@IsNotEmpty({ message: "Start time is required." })
	@IsDateString(
		{},
		{
			message:
				"Start time must be a date string with format YYYY-MM-DDTHH:mm:ss.sssZ.",
		},
	)
	@IsAfter("now", {
		message: "Start time must be in the future.",
	})
	startTime!: Date;

	@Expose()
	@IsNotEmpty({ message: "End time is required." })
	@IsDateString(
		{},
		{
			message:
				"End time must be a date string with format YYYY-MM-DDTHH:mm:ss.sssZ.",
		},
	)
	@IsAfter("startTime", {
		message: "End time must be after start time.",
	})
	endTime!: Date;
}

export default CreateVehicleServiceDto;
