import { Exclude, Expose } from "class-transformer";
import {
	IsString,
	IsNotEmpty,
	IsNumber,
	IsLatitude,
	IsLongitude,
	Length,
	IsEnum,
} from "class-validator";
import LocationType from "../../database/enums/LocationType";

@Exclude()
class CreateLocationDto {
	@Expose()
	@IsNotEmpty({ message: "Type is required." })
	@IsEnum(LocationType, {
		message: `Type must be one of the following: ${Object.values(LocationType).join(", ")}.`,
	})
	type!: LocationType;

	@Expose()
	@IsNotEmpty({ message: "Name is required." })
	@IsString({ message: "Name must be a string." })
	@Length(1, 255, {
		message: "Name must be between 1 and 255 characters.",
	})
	name!: string;

	@Expose()
	@IsNotEmpty({ message: "Address is required." })
	@IsString({ message: "Address must be a string." })
	address!: string;

	@Expose()
	@IsNotEmpty({ message: "Latitude is required." })
	@IsNumber({}, { message: "Latitude must be a number." })
	@IsLatitude({
		message: "Latitude must be a valid value between -90 and 90.",
	})
	latitude!: number;

	@Expose()
	@IsNotEmpty({ message: "Longitude is required." })
	@IsNumber({}, { message: "Longitude must be a number." })
	@IsLongitude({
		message: "Longitude must be a valid value between -180 and 180.",
	})
	longitude!: number;
}

export default CreateLocationDto;
