import { Exclude, Expose } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";

@Exclude()
class SelectTripDto {
	@Expose()
	@IsNotEmpty({ message: "Trip ID is required." })
	@IsString({ message: "Trip ID must be a string." })
	tripId!: string;
}

export default SelectTripDto;
