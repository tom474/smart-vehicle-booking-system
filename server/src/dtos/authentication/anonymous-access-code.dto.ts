import { IsNotEmpty, IsString, Length } from "class-validator";
import { Exclude, Expose } from "class-transformer";

@Exclude()
class AnonymousAccessCodeDto {
	@Expose()
	@IsNotEmpty({ message: "Access code is required." })
	@IsString({ message: "Access code must be a string." })
	@Length(26, 26, { message: "Access code must be exactly 26 characters." })
	code!: string;
}

export default AnonymousAccessCodeDto;
