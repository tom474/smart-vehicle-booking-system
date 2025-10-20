import { Exclude, Expose } from "class-transformer";
import {
	IsLatitude,
	IsLongitude,
	IsNotEmpty,
	IsNumber,
	IsString,
	Length,
} from "class-validator";

@Exclude()
class UpdateDriverCurrentLocationDto {
	@Expose()
	@IsNotEmpty({ message: "Location name is required." })
	@IsString({ message: "Location name must be a string." })
	@Length(1, 255, {
		message: "Location name must be between 1 and 255 characters.",
	})
	name!: string;

	@Expose()
	@IsNotEmpty({ message: "Address is required." })
	@IsString({ message: "Address must be a string." })
	@Length(1, 255, {
		message: "Address must be between 1 and 255 characters.",
	})
	address!: string;

	@Expose()
	@IsNumber({}, { message: "Latitude must be a number." })
	@IsLatitude({
		message: "Latitude must be a valid value between -90 and 90.",
	})
	latitude!: number;

	@Expose()
	@IsNumber({}, { message: "Longitude must be a number." })
	@IsLongitude({
		message: "Longitude must be a valid value between -180 and 180.",
	})
	longitude!: number;
}

export default UpdateDriverCurrentLocationDto;
