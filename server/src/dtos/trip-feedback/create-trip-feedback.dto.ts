import { Exclude, Expose, Transform } from "class-transformer";
import {
	IsInt,
	IsString,
	IsOptional,
	IsNotEmpty,
	Min,
	Max,
} from "class-validator";

@Exclude()
class CreateTripFeedbackDto {
	@Expose()
	@IsNotEmpty({ message: "Rating is required." })
	@IsInt({ message: "Rating must be an integer." })
	@Min(1, { message: "Rating must be at least 1." })
	@Max(5, { message: "Rating cannot be more than 5." })
	@Transform(({ value }) => Math.round(Number(value)))
	rating!: number;

	@Expose()
	@IsOptional()
	@IsString({ message: "Comment must be a string." })
	comment?: string | null;

	@Expose()
	@IsNotEmpty({ message: "Trip ID is required." })
	@IsString({ message: "Trip ID must be a string." })
	tripId!: string;
}

export default CreateTripFeedbackDto;
