import { Exclude, Expose } from "class-transformer";
import { IsDateString, IsOptional, IsString } from "class-validator";

@Exclude()
class UpdateExecutiveVehicleActivityDto {
	@Expose()
	@IsOptional()
	@IsDateString(
		{},
		{ message: "Start time must be a valid ISO date string." },
	)
	startTime!: Date;

	@Expose()
	@IsOptional()
	@IsDateString({}, { message: "End time must be a valid ISO date string." })
	endTime!: Date;

	@Expose()
	@IsOptional()
	@IsString({ message: "Notes must be text." })
	notes?: string;
}

export default UpdateExecutiveVehicleActivityDto;
