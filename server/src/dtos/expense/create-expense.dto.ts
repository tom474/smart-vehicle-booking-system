import { Exclude, Expose } from "class-transformer";
import {
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsPositive,
	IsString,
} from "class-validator";

@Exclude()
class CreateExpenseDto {
	@Expose()
	@IsNotEmpty({ message: "Type is required." })
	@IsString({ message: "Type must be a string." })
	type!: string;

	@Expose()
	@IsOptional()
	@IsString({ message: "Description must be a string." })
	description?: string | null;

	@Expose()
	@IsNotEmpty({ message: "Amount is required." })
	@IsNumber({}, { message: "Amount must be a number." })
	@IsPositive({ message: "Amount must be a positive number." })
	amount!: number;

	@Expose()
	@IsOptional()
	@IsString({ message: "Trip ID must be a string." })
	tripId?: string | null;

	@Expose()
	@IsOptional()
	@IsString({ message: "Vehicle Service ID must be a string." })
	vehicleServiceId?: string | null;
}

export default CreateExpenseDto;
