import { Exclude, Expose } from "class-transformer";
import { IsString, IsNotEmpty, IsOptional, Length } from "class-validator";

@Exclude()
class CreateSettingDto {
	@Expose()
	@IsNotEmpty({ message: "Title is required." })
	@IsString({ message: "Title must be a string." })
	@Length(1, 255, { message: "Title must be between 1 and 255 characters." })
	title!: string;

	@Expose()
	@IsNotEmpty({ message: "Key is required." })
	@IsString({ message: "Key must be a string." })
	@Length(1, 255, { message: "Key must be between 1 and 255 characters." })
	key!: string;

	@Expose()
	@IsNotEmpty({ message: "Value is required." })
	@IsString({ message: "Value must be a string." })
	value!: string;

	@Expose()
	@IsOptional()
	@IsString({ message: "Description must be a string." })
	description?: string | null;
}

export default CreateSettingDto;
