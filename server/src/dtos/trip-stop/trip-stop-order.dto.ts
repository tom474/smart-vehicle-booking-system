import { Exclude, Expose } from "class-transformer";
import { IsEnum, IsNotEmpty, IsNumber, Min } from "class-validator";
import TripStopType from "../../database/enums/TripStopType";
import CreateLocationDto from "../location/create-location.dto";
import { IsValidLocationInput } from "../../utils/validator";

@Exclude()
class TripStopOrderDto {
	@Expose()
	@IsNotEmpty({ message: "Trip stop type is required." })
	@IsEnum(TripStopType, {
		message: `Trip stop type must be one of the following: ${Object.values(TripStopType).join(", ")}.`,
	})
	type!: TripStopType;

	@Expose()
	@IsNotEmpty({ message: "Order is required." })
	@IsNumber({}, { message: "Order must be a number." })
	@Min(1, {
		message: "Order must be at least 1.",
	})
	order!: number;

	@Expose()
	@IsNotEmpty({ message: "Location is required." })
	@IsValidLocationInput()
	location!: string | CreateLocationDto;
}

export default TripStopOrderDto;
