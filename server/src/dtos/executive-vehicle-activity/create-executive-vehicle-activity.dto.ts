import { Exclude, Expose } from "class-transformer";
import { IsDateString, IsOptional, IsString } from "class-validator";
import { IsAfter } from "../../utils/validator"; // assuming same as used in BookingRequestDto

@Exclude()
class CreateExecutiveVehicleActivityDto {
	@Expose()
	@IsDateString(
		{},
		{ message: "Start time must be a valid ISO date string." },
	)
	startTime!: Date;

	@Expose()
	@IsDateString({}, { message: "End time must be a valid ISO date string." })
	@IsAfter("startTime", {
		message: "End time must be after start time.",
	})
	endTime!: Date;

	@Expose()
	@IsOptional()
	@IsString({ message: "Notes must be text." })
	notes?: string;
}

export default CreateExecutiveVehicleActivityDto;
