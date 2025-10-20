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
class UpdateScheduleDto {
	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Title cannot be empty." })
	@IsString({ message: "Title must be a string." })
	@Length(1, 255, { message: "Title must be between 1 and 255 characters." })
	title?: string;

	@Expose()
	@IsOptional()
	@IsString({ message: "Description must be a string." })
	description?: string | null;

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

export default UpdateScheduleDto;
