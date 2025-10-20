import { Exclude, Expose } from "class-transformer";
import {
	IsOptional,
	IsString,
	Length,
	IsNumber,
	IsLatitude,
	IsLongitude,
	IsNotEmpty,
} from "class-validator";

@Exclude()
class UpdateLocationDto {
	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Name cannot be empty." })
	@IsString({ message: "Name must be a string." })
	@Length(1, 255, {
		message: "Name must be between 1 and 255 characters.",
	})
	name?: string;

	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Address cannot be empty." })
	@IsString({ message: "Address must be a string." })
	address?: string;

	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Latitude cannot be empty." })
	@IsNumber({}, { message: "Latitude must be a number." })
	@IsLatitude({
		message: "Latitude must be a valid value between -90 and 90.",
	})
	latitude?: number;

	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Longitude cannot be empty." })
	@IsNumber({}, { message: "Longitude must be a number." })
	@IsLongitude({
		message: "Longitude must be a valid value between -180 and 180.",
	})
	longitude?: number;
}

export default UpdateLocationDto;
