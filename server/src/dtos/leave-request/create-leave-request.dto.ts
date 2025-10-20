import { Exclude, Expose } from "class-transformer";
import {
	IsDateString,
	IsNotEmpty,
	IsOptional,
	IsString,
} from "class-validator";
import { IsAfter } from "../../utils/validator";

@Exclude()
class CreateLeaveRequestDto {
	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Driver ID cannot be empty." })
	@IsString({ message: "Driver ID must be a string." })
	driverId?: string;

	@Expose()
	@IsOptional()
	@IsString({ message: "Reason must be a string." })
	reason?: string | null;

	@Expose()
	@IsOptional()
	@IsString({ message: "Notes must be a string." })
	notes?: string | null;

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

export default CreateLeaveRequestDto;
