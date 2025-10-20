import { Exclude, Expose } from "class-transformer";
import {
	IsDateString,
	IsNotEmpty,
	IsOptional,
	IsString,
} from "class-validator";
import { IsAfter } from "../../utils/validator";

@Exclude()
class UpdateLeaveRequestDto {
	@Expose()
	@IsOptional()
	@IsString({ message: "Reason must be a string." })
	reason?: string;

	@Expose()
	@IsOptional()
	@IsString({ message: "Notes must be a string." })
	notes?: string;

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

export default UpdateLeaveRequestDto;
