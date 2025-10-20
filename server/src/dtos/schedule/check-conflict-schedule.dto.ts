import { Exclude, Expose } from "class-transformer";
import {
	IsDateString,
	IsNotEmpty,
	IsOptional,
	IsString,
} from "class-validator";
import { IsAfter } from "../../utils/validator";

@Exclude()
class CheckConflictScheduleDto {
	@Expose()
	@IsOptional()
	@IsString({ message: "Schedule ID must be a string." })
	id?: string | null;

	@Expose()
	@IsNotEmpty({ message: "Start time is required." })
	@IsDateString(
		{},
		{
			message:
				"Start time must be a valid date string with format YYYY-MM-DDTHH:mm:ss.sssZ.",
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
				"End time must be a valid date string with format YYYY-MM-DDTHH:mm:ss.sssZ.",
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
}

export default CheckConflictScheduleDto;
