import { Exclude, Expose } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";

@Exclude()
class RejectBookingRequestDto {
	@Expose()
	@IsNotEmpty({ message: "Reason is required." })
	@IsString()
	reason!: string;
}

export default RejectBookingRequestDto;
