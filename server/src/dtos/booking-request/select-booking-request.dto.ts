import { Exclude, Expose } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";

@Exclude()
class SelectBookingRequestDto {
	@Expose()
	@IsNotEmpty({ message: "Booking Request ID is required." })
	@IsString({ message: "Booking Request ID must be a string." })
	bookingRequestId!: string;
}

export default SelectBookingRequestDto;
