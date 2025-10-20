import { Exclude, Expose, Type } from "class-transformer";
import {
	ArrayNotEmpty,
	IsArray,
	IsDateString,
	IsNotEmpty,
	IsString,
} from "class-validator";
import { IsAfter } from "../../utils/validator";
import TripStopOrderDto from "../trip-stop/trip-stop-order.dto";

@Exclude()
class CreateCombinedTripDto {
	@Expose()
	@IsNotEmpty({ message: "Departure time is required." })
	@IsDateString(
		{},
		{
			message:
				"Departure time must be a date string with format YYYY-MM-DDTHH:mm:ss.sssZ",
		},
	)
	@IsAfter("now", {
		message: "Departure time must be in the future.",
	})
	departureTime!: Date;

	@Expose()
	@IsNotEmpty({ message: "Vehicle ID is required." })
	@IsString({ message: "Vehicle ID must be a string." })
	vehicleId!: string;

	@Expose()
	@IsNotEmpty({ message: "Booking Request IDs are required." })
	@IsArray({ message: "Booking Request IDs must be an array." })
	@ArrayNotEmpty({ message: "Booking Request IDs array cannot be empty." })
	@IsString({
		each: true,
		message: "Each booking request ID must be a string.",
	})
	bookingRequestIds!: string[];

	@Expose()
	@IsNotEmpty({ message: "Trip stop orders are required." })
	@IsArray({ message: "Trip stop orders must be an array." })
	@ArrayNotEmpty({ message: "Trip stop orders array cannot be empty." })
	@Type(() => TripStopOrderDto)
	tripStopOrders!: TripStopOrderDto[];
}

export default CreateCombinedTripDto;
