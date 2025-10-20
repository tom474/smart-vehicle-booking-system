import { Exclude, Expose } from "class-transformer";
import {
	IsString,
	IsOptional,
	IsNumber,
	IsNotEmpty,
	IsPositive,
} from "class-validator";

@Exclude()
class UpdateExpenseDto {
	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Type must not be empty." })
	@IsString({ message: "Type must be a string." })
	type?: string;

	@Expose()
	@IsOptional()
	@IsString({ message: "Description must be a string." })
	description?: string | null;

	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Amount must not be empty." })
	@IsNumber({}, { message: "Amount must be a number." })
	@IsPositive({ message: "Amount must be a positive number." })
	amount?: number;

	@Expose()
	@IsOptional()
	@IsString({ message: "Trip ID must be a string." })
	tripId?: string | null;

	@Expose()
	@IsOptional()
	@IsString({ message: "Vehicle Service ID must be a string." })
	vehicleServiceId?: string | null;
}

export default UpdateExpenseDto;
