import { Exclude, Expose } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";

@Exclude()
class CancelBookingRequestDto {
	@Expose()
	@IsNotEmpty({ message: "Reason is required." })
	@IsString()
	reason!: string;
}

export default CancelBookingRequestDto;
