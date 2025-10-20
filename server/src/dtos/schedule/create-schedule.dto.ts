import { Exclude, Expose } from "class-transformer";
import {
	IsDateString,
	IsNotEmpty,
	IsOptional,
	IsString,
	Length,
} from "class-validator";
import { IsAfter } from "../../utils/validator";

@Exclude()
class CreateScheduleDto {
	@Expose()
	@IsNotEmpty({ message: "Title is required." })
	@IsString({ message: "Title must be a string." })
	@Length(1, 255, { message: "Title must be between 1 and 255 characters." })
	title!: string;

	@Expose()
	@IsOptional()
	@IsString({ message: "Description must be a string." })
	description?: string | null;

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

	@Expose()
	@IsNotEmpty({ message: "Driver ID is required." })
	@IsString({ message: "Driver ID must be a string." })
	driverId!: string;

	@Expose()
	@IsOptional()
	@IsString({ message: "Vehicle ID must be a string." })
	vehicleId?: string | null;
}

export default CreateScheduleDto;
