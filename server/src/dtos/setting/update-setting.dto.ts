import { Exclude, Expose } from "class-transformer";
import { IsNotEmpty, IsOptional, IsString, Length } from "class-validator";

@Exclude()
class UpdateSettingDto {
	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Role title cannot be empty." })
	@IsString({ message: "Role title must be a string." })
	@Length(1, 255, {
		message: "Role title must be between 1 and 255 characters.",
	})
	title?: string;

	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Value cannot be empty." })
	@IsString({ message: "Value must be a string." })
	value?: string;

	@Expose()
	@IsOptional()
	@IsString({ message: "Description must be a string." })
	description?: string | null;
}

export default UpdateSettingDto;
