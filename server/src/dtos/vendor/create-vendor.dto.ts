import { Exclude, Expose } from "class-transformer";
import {
	IsString,
	IsNotEmpty,
	Length,
	IsOptional,
	IsEmail,
} from "class-validator";

@Exclude()
class CreateVendorDto {
	@Expose()
	@IsNotEmpty({ message: "Name is required." })
	@IsString({ message: "Name must be a string." })
	@Length(1, 255, {
		message: "Name must be between 1 and 255 characters.",
	})
	name!: string;

	@Expose()
	@IsNotEmpty({ message: "Address is required." })
	@IsString({ message: "Address must be a string." })
	@Length(1, 255, {
		message: "Address must be between 1 and 255 characters.",
	})
	address!: string;

	@Expose()
	@IsNotEmpty({ message: "Contact person is required." })
	@IsString({ message: "Contact person must be a string." })
	@Length(1, 255, {
		message: "Contact person name must be between 1 and 255 characters.",
	})
	contactPerson!: string;

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
	@Length(1, 255, {
		message: "Email must be between 1 and 255 characters.",
	})
	email?: string | null;

	@Expose()
	@IsNotEmpty({ message: "Phone number is required." })
	@IsString({ message: "Phone number must be a string." })
	@Length(1, 20, {
		message: "Phone number must be between 1 and 20 characters.",
	})
	phoneNumber!: string;
}

export default CreateVendorDto;
