import { Exclude, Expose } from "class-transformer";
import {
	IsEnum,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Length,
	Min,
} from "class-validator";
import Color from "../../database/enums/Color";

@Exclude()
class UpdateOutsourcedVehicleDto {
	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Driver name cannot be empty." })
	@Length(1, 255, {
		message: "Driver name must be between 1 and 255 characters.",
	})
	driverName?: string;

	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Phone number cannot be empty." })
	@Length(1, 20, {
		message: "Phone number must be between 1 and 20 characters.",
	})
	phoneNumber?: string;

	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "License plate cannot be empty." })
	@IsString({ message: "License plate must be a string." })
	@Length(1, 255, {
		message: "License plate must be between 4 and 20 characters.",
	})
	licensePlate?: string;

	@Expose()
	@IsOptional()
	@IsString({ message: "Model must be a string." })
	@Length(1, 255, {
		message: "Model must be between 1 and 255 characters.",
	})
	model?: string | null;

	@Expose()
	@IsNotEmpty({ message: "Color cannot be empty." })
	@IsString({ message: "Color must be a string." })
	@IsEnum(Color, {
		message: `Color must be one of the following: ${Object.values(Color).join(", ")}.`,
	})
	color?: Color;

	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Capacity cannot be empty." })
	@IsNumber({}, { message: "Capacity must be a number." })
	@Min(1, { message: "Capacity must be at least 1." })
	capacity?: number;

	@Expose()
	@IsOptional()
	@IsString({ message: "Vendor ID must be a string." })
	vendorId?: string | null;
}

export default UpdateOutsourcedVehicleDto;
