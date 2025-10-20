import { Exclude, Expose } from "class-transformer";
import {
	IsOptional,
	IsString,
	Length,
	IsNumber,
	Min,
	IsEnum,
	IsNotEmpty,
} from "class-validator";
import Color from "../../database/enums/Color";
import VehicleAvailability from "../../database/enums/VehicleAvailability";

@Exclude()
class UpdateVehicleDto {
	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "License plate cannot be empty." })
	@IsString({ message: "License plate must be a string." })
	@Length(1, 255, {
		message: "License plate must be between 1 and 255 characters.",
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
	@IsOptional()
	@IsNotEmpty({ message: "Color cannot be empty." })
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
	@IsNotEmpty({ message: "Availability cannot be empty." })
	@IsEnum(VehicleAvailability, {
		message: `Availability must be one of the following: ${Object.values(VehicleAvailability).join(", ")}.`,
	})
	availability?: VehicleAvailability;

	@Expose()
	@IsOptional()
	@IsString({ message: "Driver ID must be a string." })
	driverId?: string | null;

	@Expose()
	@IsOptional()
	@IsString({ message: "Executive ID must be a string." })
	executiveId?: string | null;

	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Base location ID cannot be empty." })
	@IsString({ message: "Base location ID must be a string." })
	baseLocationId?: string;

	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Current location ID cannot be empty." })
	@IsString({ message: "Current location ID must be a string." })
	currentLocationId?: string;
}

export default UpdateVehicleDto;
