import { Exclude, Expose } from "class-transformer";
import { IsNotEmpty, IsOptional, IsString, Length } from "class-validator";

@Exclude()
class UpdateUserDto {
	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Name cannot be empty." })
	@IsString({ message: "Name must be a string." })
	@Length(1, 255, { message: "Name must be between 1 and 255 characters." })
	name?: string;

	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Phone number cannot be empty." })
	@IsString({ message: "Phone number must be a string." })
	@Length(1, 20, {
		message: "Phone number must be between 1 and 20 characters.",
	})
	phoneNumber?: string;
}

export default UpdateUserDto;
