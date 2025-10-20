import { Exclude, Expose } from "class-transformer";
import TripStatus from "../../database/enums/TripStatus";

@Exclude()
class BasicTripResponseDto {
	@Expose()
	id!: string;

	@Expose()
	status!: TripStatus;

	@Expose()
	totalCost!: number;

	@Expose()
	departureTime!: Date;

	@Expose()
	arrivalTime!: Date;

	@Expose()
	actualDepartureTime?: Date | null;

	@Expose()
	actualArrivalTime?: Date | null;

	@Expose()
	createdAt!: Date;

	@Expose()
	updatedAt!: Date;
}

export default BasicTripResponseDto;
