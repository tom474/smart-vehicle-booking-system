import { Exclude, Expose } from "class-transformer";
import {
	IsString,
	IsOptional,
	IsNotEmpty,
	Length,
	IsNumber,
	Min,
	IsEnum,
} from "class-validator";
import Color from "../../database/enums/Color";

@Exclude()
class CreateVehicleDto {
	@Expose()
	@IsNotEmpty({ message: "License plate is required." })
	@IsString({ message: "License plate must be a string." })
	@Length(1, 255, {
		message: "License plate must be between 1 and 255 characters.",
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
	@IsString({ message: "Driver ID must be a string." })
	driverId?: string | null;

	@Expose()
	@IsOptional()
	@IsString({ message: "Vendor ID must be a string." })
	vendorId?: string | null;

	@Expose()
	@IsOptional()
	@IsString({ message: "Executive ID must be a string." })
	executiveId?: string | null;

	@Expose()
	@IsString({ message: "Base location ID must be a string." })
	@IsNotEmpty({ message: "Base location ID is required." })
	baseLocationId!: string;
}

export default CreateVehicleDto;
