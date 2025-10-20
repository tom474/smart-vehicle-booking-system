import { Exclude, Expose } from "class-transformer";
import {
	ArrayNotEmpty,
	IsArray,
	IsBoolean,
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
import BookingRequestType from "../../database/enums/BookingRequestType";
import CreateLocationDto from "../location/create-location.dto";

@Exclude()
class CreateBookingRequestDto {
	@Expose()
	@IsOptional()
	@IsString({ message: "Trip purpose must be a string." })
	tripPurpose?: string | null;

	@Expose()
	@IsNotEmpty({ message: "Priority is required." })
	@IsEnum(Priority, {
		message: `Priority must be one of the following: ${Object.values(Priority).join(", ")}.`,
	})
	priority!: Priority;

	@Expose()
	@IsNotEmpty({ message: "Type is required." })
	@IsEnum(BookingRequestType, {
		message: `Type must be one of the following: ${Object.values(BookingRequestType).join(", ")}.`,
	})
	type!: BookingRequestType;

	@Expose()
	@IsNotEmpty({ message: "Number of passengers is required." })
	@IsNumber({}, { message: "Number of passengers must be a number." })
	@Min(1, {
		message: "Number of passengers must be at least 1.",
	})
	numberOfPassengers!: number;

	@Expose()
	@IsNotEmpty({ message: "Passenger IDs are required." })
	@IsArray({ message: "Passenger IDs must be an array." })
	@ArrayNotEmpty({ message: "Passenger IDs array cannot be empty." })
	@IsString({ each: true, message: "Each passenger ID must be a string." })
	passengerIds!: string[];

	@Expose()
	@IsOptional()
	@IsString({ message: "Note must be a string." })
	note?: string | null;

	@Expose()
	@IsNotEmpty({ message: "Contact name is required." })
	@IsString({ message: "Contact name must be a string." })
	@Length(1, 255, {
		message: "Contact name must be between 1 and 255 characters.",
	})
	contactName!: string;

	@Expose()
	@IsNotEmpty({ message: "Contact phone number is required." })
	@IsString({ message: "Contact phone number must be a string." })
	@Length(1, 20, {
		message: "Contact phone number must be between 1 and 20 characters.",
	})
	contactPhoneNumber!: string;

	@Expose()
	@IsNotEmpty({ message: "Departure time is required." })
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
	departureTime!: Date;

	@Expose()
	@IsNotEmpty({ message: "Arrival time is required." })
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
	arrivalTime!: Date;

	@Expose()
	@IsNotEmpty({ message: "Departure location is required." })
	@IsValidLocationInput()
	departureLocation!: string | CreateLocationDto;

	@Expose()
	@IsNotEmpty({ message: "Arrival location is required." })
	@IsValidLocationInput()
	arrivalLocation!: string | CreateLocationDto;

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

	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Reservation status cannot be empty." })
	@IsBoolean({ message: "Reservation status must be a boolean." })
	isReserved?: boolean;
}

export default CreateBookingRequestDto;
