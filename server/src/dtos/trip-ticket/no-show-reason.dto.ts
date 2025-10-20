import { Exclude, Expose } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";

@Exclude()
class NoShowReasonDto {
	@Expose()
	@IsNotEmpty({ message: "Reason is required." })
	@IsString({ message: "Reason must be a string." })
	reason!: string;
}

export default NoShowReasonDto;
