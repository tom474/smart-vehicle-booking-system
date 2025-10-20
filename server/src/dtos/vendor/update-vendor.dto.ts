import { Exclude, Expose } from "class-transformer";
import {
	IsOptional,
	IsString,
	IsEmail,
	Length,
	IsEnum,
	IsNotEmpty,
} from "class-validator";
import VendorStatus from "../../database/enums/VendorStatus";

@Exclude()
class UpdateVendorDto {
	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Name cannot be empty." })
	@IsString({ message: "Name must be a string." })
	@Length(1, 255, {
		message: "Name must be between 1 and 255 characters.",
	})
	name?: string;

	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Address cannot be empty." })
	@IsString({ message: "Address must be a string." })
	@Length(1, 255, {
		message: "Address must be between 1 and 255 characters.",
	})
	address?: string;

	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Contact person cannot be empty." })
	@IsString({ message: "Contact person must be a string." })
	@Length(1, 255, {
		message: "Contact person name must be between 1 and 255 characters.",
	})
	contactPerson?: string;

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
	@IsOptional()
	@IsNotEmpty({ message: "Phone number cannot be empty." })
	@IsString({ message: "Phone number must be a string." })
	@Length(1, 20, {
		message: "Phone number must be between 1 and 20 characters.",
	})
	phoneNumber?: string;

	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Status cannot be empty." })
	@IsEnum(VendorStatus, {
		message: `Status must be one of the following: ${Object.values(VendorStatus).join(", ")}.`,
	})
	status?: VendorStatus;
}

export default UpdateVendorDto;
