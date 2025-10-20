import { Exclude, Expose } from "class-transformer";
import {
	IsEmail,
	IsOptional,
	IsString,
	IsNotEmpty,
	Length,
	Matches,
} from "class-validator";

@Exclude()
class CreateDriverDto {
	@Expose()
	@IsNotEmpty({ message: "Name is required." })
	@IsString({ message: "Name must be a string." })
	@Length(1, 255, { message: "Name must be between 1 and 255 characters." })
	name!: string;

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
	@IsNotEmpty({ message: "Phone number is required." })
	@IsString({ message: "Phone number must be a string." })
	@Length(1, 20, {
		message: "Phone number must be between 1 and 20 characters.",
	})
	phoneNumber!: string;

	@Expose()
	@IsNotEmpty({ message: "Username is required." })
	@IsString({ message: "Username must be a string." })
	@Length(1, 255, {
		message: "Username must be between 1 and 255 characters.",
	})
	username!: string;

	@Expose()
	@IsNotEmpty({ message: "Password is required." })
	@IsString({ message: "Password must be a string." })
	@Length(8, 20, {
		message: "Password must be between 8 and 20 characters.",
	})
	@Matches(
		/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
		{
			message:
				"Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (@$!%*?&).",
		},
	)
	password!: string;

	@Expose()
	@IsOptional()
	@IsString({ message: "Vehicle ID must be a string." })
	vehicleId?: string | null;

	@Expose()
	@IsOptional()
	@IsString({ message: "Vendor ID must be a string." })
	vendorId?: string | null;

	@Expose()
	@IsNotEmpty({ message: "Base location ID is required." })
	@IsString({ message: "Base location ID must be a string." })
	baseLocationId!: string;
}

export default CreateDriverDto;
