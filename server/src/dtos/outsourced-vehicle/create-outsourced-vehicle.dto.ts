import { Exclude, Expose } from "class-transformer";
import {
	IsString,
	IsNotEmpty,
	Length,
	IsNumber,
	Min,
	IsOptional,
	IsEnum,
} from "class-validator";
import Color from "../../database/enums/Color";

@Exclude()
class CreateOutsourcedVehicleDto {
	@Expose()
	@IsNotEmpty({ message: "Driver name is required." })
	@IsString({ message: "Driver name must be a string." })
	@Length(1, 255, {
		message: "Driver name must be between 1 and 255 characters.",
	})
	driverName!: string;

	@Expose()
	@IsNotEmpty({ message: "Phone number is required." })
	@IsString({ message: "Phone number must be a string." })
	@Length(1, 20, {
		message: "Phone number must be between 1 and 20 characters.",
	})
	phoneNumber!: string;

	@Expose()
	@IsNotEmpty({ message: "License plate is required." })
	@IsString({ message: "License plate must be a string." })
	@Length(1, 255, {
		message: "License plate must be between 4 and 20 characters.",
	})
	licensePlate!: string;

	@Expose()
	@IsOptional()
	@IsString({ message: "Model must be a string." })
	@Length(1, 255, {
		message: "Model must be between 1 and 255 characters.",
	})
	model?: string | null;

	@Expose()
	@IsNotEmpty({ message: "Color is required." })
	@IsString({ message: "Color must be a string." })
	@IsEnum(Color, {
		message: `Color must be one of the following: ${Object.values(Color).join(", ")}.`,
	})
	color!: Color;

	@Expose()
	@IsNotEmpty({ message: "Capacity is required." })
	@IsNumber({}, { message: "Capacity must be a number." })
	@Min(1, { message: "Capacity must be at least 1." })
	capacity!: number;

	@Expose()
	@IsOptional()
	@IsString({ message: "Vendor ID must be a string." })
	vendorId?: string | null;

	@Expose()
	@IsOptional()
	@IsNumber({}, { message: "Cost must be a number." })
	@Min(0, { message: "Cost must be at least 0." })
	cost?: number | null;
}

export default CreateOutsourcedVehicleDto;
