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
class UpdateVehicleServiceDto {
	@Expose()
	@IsOptional()
	@IsString({ message: "Reason must be a string." })
	reason?: string | null;

	@Expose()
	@IsOptional()
	@IsString({ message: "Description must be a string." })
	description?: string | null;

	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Service type cannot be empty." })
	@IsEnum(VehicleServiceType, {
		message: `Service type must be one of the following: ${Object.values(VehicleServiceType).join(", ")}.`,
	})
	serviceType?: VehicleServiceType;

	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Start time cannot be empty." })
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
	startTime?: Date;

	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "End time cannot be empty." })
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
	endTime?: Date;
}

export default UpdateVehicleServiceDto;
