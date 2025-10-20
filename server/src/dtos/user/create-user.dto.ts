import { Exclude, Expose } from "class-transformer";
import {
	IsString,
	IsEmail,
	IsOptional,
	IsNotEmpty,
	Length,
} from "class-validator";

@Exclude()
class CreateUserDto {
	@Expose()
	@IsNotEmpty({ message: "Microsoft ID is required." })
	@IsString({ message: "Microsoft ID must be a string." })
	@Length(1, 255, {
		message: "Microsoft ID must be between 1 and 255 characters.",
	})
	microsoftId!: string;

	@Expose()
	@IsNotEmpty({ message: "Name is required." })
	@IsString({ message: "Name must be a string." })
	@Length(1, 255, { message: "Name must be between 1 and 255 characters." })
	name!: string;

	@Expose()
	@IsNotEmpty({ message: "Email is required." })
	@IsString({ message: "Email must be a string." })
	@IsEmail(
		{},
		{
			message:
				"Email must be a valid email address with format email@example.com.",
		},
	)
	@Length(1, 255, { message: "Email must be between 1 and 255 characters." })
	email!: string;

	@Expose()
	@IsNotEmpty({ message: "Phone number is required." })
	@IsString({ message: "Phone number must be a string." })
	@Length(1, 20, {
		message: "Phone number must be between 1 and 20 characters.",
	})
	phoneNumber!: string;

	@Expose()
	@IsNotEmpty({ message: "Role ID is required." })
	@IsString({ message: "Role ID must be a string." })
	roleId!: string;

	@Expose()
	@IsOptional()
	@IsString({ message: "Dedicated vehicle ID must be a string." })
	dedicatedVehicleId?: string | null;
}

export default CreateUserDto;
