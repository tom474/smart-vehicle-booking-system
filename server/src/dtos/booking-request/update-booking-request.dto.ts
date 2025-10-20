import { Exclude, Expose } from "class-transformer";
import {
	ArrayNotEmpty,
	IsArray,
	IsDateString,
	IsEnum,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Length,
	Min,
} from "class-validator";
import { IsAfter, IsValidLocationInput } from "../../utils/validator";
import Priority from "../../database/enums/Priority";
import CreateLocationDto from "../location/create-location.dto";

@Exclude()
class UpdateBookingRequestDto {
	@Expose()
	@IsOptional()
	@IsString({ message: "Trip purpose must be a string" })
	tripPurpose?: string | null;

	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Priority cannot be empty." })
	@IsEnum(Priority, {
		message: `Priority must be one of the following: ${Object.values(Priority).join(", ")}.`,
	})
	priority?: Priority;

	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Number of passengers cannot be empty." })
	@IsNumber({}, { message: "Number of passengers must be a number." })
	@Min(1, {
		message: "Number of passengers must be at least 1.",
	})
	numberOfPassengers?: number;

	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Passenger IDs cannot be empty." })
	@IsArray({ message: "Passenger IDs must be an array." })
	@ArrayNotEmpty({ message: "Passenger IDs array cannot be empty." })
	@IsString({ each: true, message: "Each passenger ID must be a string." })
	passengerIds?: string[];

	@Expose()
	@IsOptional()
	@IsString({ message: "Note must be a string." })
	note?: string | null;

	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Contact name cannot be empty." })
	@IsString({ message: "Contact name must be a string." })
	@Length(1, 255, {
		message: "Contact name must be between 1 and 255 characters.",
	})
	contactName?: string;

	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Contact phone number cannot be empty." })
	@IsString({ message: "Contact phone number must be a string." })
	@Length(1, 20, {
		message: "Contact phone number must be between 1 and 20 characters.",
	})
	contactPhoneNumber?: string;

	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Departure time cannot be empty." })
	@IsDateString(
		{},
		{
			message:
				"Departure time must be a date string with format YYYY-MM-DDTHH:mm:ss.sssZ.",
		},
	)
	@IsAfter("now", {
		message: "Departure time must be in the future.",
	})
	departureTime?: Date;

	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Arrival time cannot be empty." })
	@IsDateString(
		{},
		{
			message:
				"Arrival time must be a date string with format YYYY-MM-DDTHH:mm:ss.sssZ.",
		},
	)
	@IsAfter("departureTime", {
		message: "Arrival time must be after departure time.",
	})
	arrivalTime?: Date;

	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Departure location cannot be empty." })
	@IsValidLocationInput()
	departureLocation?: string | CreateLocationDto;

	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Arrival location cannot be empty." })
	@IsValidLocationInput()
	arrivalLocation?: string | CreateLocationDto;

	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Return departure time cannot be empty." })
	@IsDateString(
		{},
		{
			message:
				"Return departure time must be a date string with format YYYY-MM-DDTHH:mm:ss.sssZ.",
		},
	)
	@IsAfter("arrivalTime", {
		message: "Return departure time must be after arrival time.",
	})
	returnDepartureTime?: Date;

	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Return arrival time cannot be empty." })
	@IsDateString(
		{},
		{
			message:
				"Return arrival time must be a date string with format YYYY-MM-DDTHH:mm:ss.sssZ.",
		},
	)
	@IsAfter("returnDepartureTime", {
		message: "Return arrival time must be after return departure time.",
	})
	returnArrivalTime?: Date;

	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Return departure location cannot be empty." })
	@IsValidLocationInput()
	returnDepartureLocation?: string | CreateLocationDto;

	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Return arrival location cannot be empty." })
	@IsValidLocationInput()
	returnArrivalLocation?: string | CreateLocationDto;
}

export default UpdateBookingRequestDto;
