import { Exclude, Expose } from "class-transformer";
import {
	IsOptional,
	IsString,
	IsEmail,
	Length,
	IsNotEmpty,
} from "class-validator";

@Exclude()
class UpdateDriverDto {
	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Name cannot be empty." })
	@IsString({ message: "Name must be a string." })
	@Length(1, 255, { message: "Name must be between 1 and 255 characters." })
	name?: string;

	@Expose()
	@IsOptional()
	@IsString({ message: "Email must be a string." })
	@IsEmail(
		{},
		{
			message:
				"Email must be a valid email address with format email@example.com.",
		},
	)
	@Length(1, 255, { message: "Email must be between 1 and 255 characters." })
	email?: string | null;

	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Phone number cannot be empty." })
	@IsString({ message: "Phone number must be a string." })
	@Length(1, 20, {
		message: "Phone number must be between 1 and 20 characters.",
	})
	phoneNumber?: string;

	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Username cannot be empty." })
	@IsString({ message: "Username must be a string." })
	username?: string;

	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Current location ID cannot be empty." })
	@IsString({ message: "Current location ID must be a string." })
	currentLocationId?: string;
}

export default UpdateDriverDto;
