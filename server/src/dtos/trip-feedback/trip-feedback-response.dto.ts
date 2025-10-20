import {
	Exclude,
	Expose,
	plainToInstance,
	Transform,
	Type,
} from "class-transformer";
import BasicUserResponseDto from "../user/basic-user-response.dto";
import BasicTripResponseDto from "../trip/basic-trip-response.dto";
import BasicDriverResponseDto from "../driver/basic-driver-response.dto";

@Exclude()
class TripFeedbackResponseDto {
	@Expose()
	id!: string;

	@Expose()
	rating!: number;

	@Expose()
	comment?: string | null;

	@Expose()
	@Type(() => BasicUserResponseDto)
	user!: BasicUserResponseDto;

	@Expose()
	@Type(() => BasicTripResponseDto)
	trip!: BasicTripResponseDto;

	@Expose()
	@Type(() => BasicDriverResponseDto)
	@Transform(({ obj }) =>
		plainToInstance(BasicDriverResponseDto, obj.trip.driver, {
			excludeExtraneousValues: true,
		}),
	)
	driver!: BasicDriverResponseDto;

	@Expose()
	createdAt!: Date;

	@Expose()
	updatedAt!: Date;
}

export default TripFeedbackResponseDto;
